'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { slugify } from '@/lib/utils';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const skillSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().optional(),
  group: z.enum(['STRATEGY', 'TRAFFIC', 'CONTENT', 'RETENTION', 'AGENT_INFRA']),
  shortDesc: z.string().min(1, 'Опишите, что делает'),
  inputs: z.string().min(1, 'Опишите вход'),
  outputs: z.string().min(1, 'Опишите выход'),
  timeToMaster: z.string().min(1, 'Укажите время освоения'),
  prompt: z.string().min(1, 'Промпт обязателен'),
  demoVideoId: z.string().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  minPlan: z.enum(['SELF', 'SUPPORT', 'VIP']),
  state: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export async function saveSkill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);

  const raw = Object.fromEntries(formData);
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const d = parsed.data;
  const tagIds = formData.getAll('tags').map(String).filter(Boolean);

  const slug = d.slug?.trim() || slugify(d.title);
  const clash = await prisma.skill.findFirst({
    where: { slug, ...(d.id ? { id: { not: d.id } } : {}) },
    select: { id: true },
  });
  if (clash) return { ok: false, fieldErrors: { slug: 'Слаг занят' } };

  const data = {
    title: d.title,
    slug,
    group: d.group,
    shortDesc: d.shortDesc,
    inputs: d.inputs,
    outputs: d.outputs,
    timeToMaster: d.timeToMaster,
    prompt: d.prompt,
    demoVideoId: d.demoVideoId || null,
    fileKey: d.fileKey || null,
    fileName: d.fileName || null,
    minPlan: d.minPlan,
    state: d.state,
  };

  let skillId: string;
  if (d.id) {
    const updated = await prisma.skill.update({ where: { id: d.id }, data });
    skillId = updated.id;
    await audit(actor.id, 'UPDATE', 'Skill', skillId, { slug, minPlan: d.minPlan, state: d.state });
  } else {
    const created = await prisma.skill.create({ data });
    skillId = created.id;
    await audit(actor.id, 'CREATE', 'Skill', skillId, { slug });
  }

  // Пересобираем теги.
  await prisma.skillTag.deleteMany({ where: { skillId } });
  if (tagIds.length > 0) {
    await prisma.skillTag.createMany({
      data: tagIds.map((tagId) => ({ skillId, tagId })),
      skipDuplicates: true,
    });
  }

  revalidatePath('/admin/skills');
  revalidatePath('/skills');
  revalidatePath(`/skills/${slug}`);
  redirect('/admin/skills');
}

export async function deleteSkill(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.skill.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'Skill', id);
  revalidatePath('/admin/skills');
  revalidatePath('/skills');
}
