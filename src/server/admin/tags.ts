'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { canEditContent } from '@/server/access/staff';
import { slugify } from '@/lib/utils';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const tagSchema = z.object({ title: z.string().min(1, 'Название обязательно'), slug: z.string().optional() });

export async function createTag(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  if (!canEditContent(actor.role)) return { ok: false, message: 'Нет прав' };

  const parsed = tagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.title);
  const exists = await prisma.tag.findUnique({ where: { slug } });
  if (exists) return { ok: false, fieldErrors: { title: 'Тег с таким слагом уже есть' } };

  const tag = await prisma.tag.create({ data: { slug, title: parsed.data.title } });
  await audit(actor.id, 'CREATE', 'Tag', tag.id, { slug });
  revalidatePath('/admin/tags');
  return { ok: true, message: 'Тег создан' };
}

export async function deleteTag(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.tag.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'Tag', id);
  revalidatePath('/admin/tags');
}
