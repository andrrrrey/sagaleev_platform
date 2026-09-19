'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { commandsSchema } from '@/lib/content-types';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const daySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Название обязательно'),
  summary: z.string().min(1, 'Описание обязательно'),
  artifact: z.string().min(1, 'Артефакт обязателен'),
});

export async function updateDay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const parsed = daySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const { id, ...data } = parsed.data;
  await prisma.routeDay.update({ where: { id }, data });
  await audit(actor.id, 'UPDATE', 'RouteDay', id);
  revalidatePath('/admin/route');
  revalidatePath('/route');
  return { ok: true, message: 'День обновлён' };
}

const stepSchema = z.object({
  id: z.string().optional(),
  dayId: z.string().min(1),
  sort: z.coerce.number().int().min(0),
  title: z.string().min(1, 'Название обязательно'),
  body: z.string().default(''),
  commandsJson: z.string().default('[]'),
  artifactRequired: z.string().optional(),
  artifactHint: z.string().optional(),
  linkedSkillId: z.string().optional(),
});

export async function saveStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const parsed = stepSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const d = parsed.data;

  let commands: unknown;
  try {
    commands = JSON.parse(d.commandsJson || '[]');
  } catch {
    return { ok: false, fieldErrors: { commandsJson: 'Некорректный JSON' } };
  }
  const cmd = commandsSchema.safeParse(commands);
  if (!cmd.success) {
    return { ok: false, fieldErrors: { commandsJson: 'Формат: [{label,text,kind:"command"|"prompt"}]' } };
  }

  const data = {
    dayId: d.dayId,
    sort: d.sort,
    title: d.title,
    body: d.body,
    commands: cmd.data,
    artifactRequired: d.artifactRequired === 'on' || d.artifactRequired === 'true',
    artifactHint: d.artifactHint || null,
    linkedSkillId: d.linkedSkillId || null,
  };

  if (d.id) {
    await prisma.routeStep.update({ where: { id: d.id }, data });
    await audit(actor.id, 'UPDATE', 'RouteStep', d.id);
  } else {
    const created = await prisma.routeStep.create({ data });
    await audit(actor.id, 'CREATE', 'RouteStep', created.id);
  }
  revalidatePath('/admin/route');
  revalidatePath('/route');
  redirect('/admin/route');
}

export async function deleteStep(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.routeStep.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'RouteStep', id);
  revalidatePath('/admin/route');
  revalidatePath('/route');
}
