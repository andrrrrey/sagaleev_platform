'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { slugify } from '@/lib/utils';
import { sanitizeRichHtml } from '@/lib/rich';
import {
  timecodesSchema,
  kpisSchema,
  usecaseStepsSchema,
  repoLinksSchema,
} from '@/lib/content-types';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const baseSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['LESSON', 'USECASE', 'STREAM']),
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  coverUrl: z.string().optional(),
  timeToMaster: z.string().optional(),
  minPlan: z.enum(['SELF', 'SUPPORT', 'VIP']),
  state: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  partialFreePreview: z.string().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  kinescopeId: z.string().optional(),
  durationSec: z.coerce.number().int().min(0).optional(),
  timecodesJson: z.string().optional(),
  prompt: z.string().optional(),
  promptNote: z.string().optional(),
  // LESSON
  block: z.coerce.number().int().min(1).max(10).optional(),
  orderInBlock: z.coerce.number().int().min(0).optional(),
  methodTag: z.string().optional(),
  routeDayId: z.string().optional(),
  // USECASE
  caseClient: z.string().optional(),
  goal: z.string().optional(),
  result: z.string().optional(),
  kpisJson: z.string().optional(),
  descriptionHtml: z.string().optional(),
  repoLinksJson: z.string().optional(),
  articleHtml: z.string().optional(),
  transcript: z.string().optional(),
  stepsJson: z.string().optional(),
  // STREAM
  airedAt: z.string().optional(),
});

function parseJsonField<T>(raw: string | undefined, schema: z.ZodType<T>, fallback: T): T | null {
  if (!raw || !raw.trim()) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const parsed = baseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const d = parsed.data;
  const tagIds = formData.getAll('tags').map(String).filter(Boolean);

  const slug = d.slug?.trim() || slugify(d.title);
  const clash = await prisma.contentUnit.findFirst({
    where: { slug, ...(d.id ? { id: { not: d.id } } : {}) },
    select: { id: true },
  });
  if (clash) return { ok: false, fieldErrors: { slug: 'Слаг занят' } };

  const timecodes = parseJsonField(d.timecodesJson, timecodesSchema, []);
  if (timecodes === null)
    return { ok: false, fieldErrors: { timecodesJson: 'Формат: [{t:сек,label}]' } };
  const kpis = parseJsonField(d.kpisJson, kpisSchema, []);
  if (kpis === null)
    return { ok: false, fieldErrors: { kpisJson: 'Формат: [{label,value,hint?}]' } };
  const steps = parseJsonField(d.stepsJson, usecaseStepsSchema, []);
  if (steps === null)
    return { ok: false, fieldErrors: { stepsJson: 'Формат: [{title,body?,command?}]' } };
  const repoLinks = parseJsonField(d.repoLinksJson, repoLinksSchema, []);
  if (repoLinks === null)
    return { ok: false, fieldErrors: { repoLinksJson: 'Формат: [{title,url}]' } };

  const data: Prisma.ContentUnitUncheckedCreateInput = {
    type: d.type,
    title: d.title,
    slug,
    summary: d.summary || null,
    coverUrl: d.coverUrl || null,
    timeToMaster: d.timeToMaster || null,
    minPlan: d.minPlan,
    state: d.state,
    partialFreePreview: d.partialFreePreview === 'on' || d.partialFreePreview === 'true',
    sort: d.sort,
    publishedAt: d.state === 'PUBLISHED' ? new Date() : null,
    kinescopeId: d.kinescopeId || null,
    durationSec: d.durationSec ?? null,
    timecodes,
    prompt: d.prompt || null,
    promptNote: d.promptNote || null,
    block: d.type === 'LESSON' ? (d.block ?? null) : null,
    orderInBlock: d.type === 'LESSON' ? (d.orderInBlock ?? null) : null,
    methodTag: d.methodTag || null,
    routeDayId: d.routeDayId || null,
    caseClient: d.type === 'USECASE' ? d.caseClient || null : null,
    goal: d.type !== 'LESSON' ? d.goal || null : null,
    result: d.type !== 'LESSON' ? d.result || null : null,
    kpis,
    description: d.descriptionHtml ? { html: sanitizeRichHtml(d.descriptionHtml) } : undefined,
    repoLinks,
    article: d.articleHtml ? { html: sanitizeRichHtml(d.articleHtml) } : undefined,
    transcript: d.transcript || null,
    steps,
    airedAt: d.type === 'STREAM' && d.airedAt ? new Date(d.airedAt) : null,
  };

  let unitId: string;
  if (d.id) {
    const updated = await prisma.contentUnit.update({ where: { id: d.id }, data });
    unitId = updated.id;
    await audit(actor.id, 'UPDATE', 'ContentUnit', unitId, { slug, type: d.type, state: d.state });
  } else {
    const created = await prisma.contentUnit.create({ data });
    unitId = created.id;
    await audit(actor.id, 'CREATE', 'ContentUnit', unitId, { slug, type: d.type });
  }

  await prisma.unitTag.deleteMany({ where: { unitId } });
  if (tagIds.length > 0) {
    await prisma.unitTag.createMany({
      data: tagIds.map((tagId) => ({ unitId, tagId })),
      skipDuplicates: true,
    });
  }

  // Уведомление о новом контенте (опция).
  if (d.state === 'PUBLISHED' && formData.get('notify') === 'on') {
    const base = d.type === 'LESSON' ? '/lessons' : d.type === 'STREAM' ? '/streams' : '/usecases';
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', deletedAt: null },
      select: { id: true },
    });
    if (students.length > 0) {
      await prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          kind: 'NEW_CONTENT',
          title: 'Новый материал',
          body: d.title,
          href: `${base}/${slug}`,
        })),
      });
    }
  }

  revalidatePath('/admin/content');
  revalidatePath('/lessons');
  revalidatePath('/usecases');
  revalidatePath('/streams');
  redirect('/admin/content');
}

export async function deleteContent(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.contentUnit.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'ContentUnit', id);
  revalidatePath('/admin/content');
}
