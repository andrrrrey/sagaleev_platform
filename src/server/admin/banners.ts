'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const bannerSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен'),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  href: z.string().optional(),
  sort: z.coerce.number().int().min(0).default(0),
});

export async function createBanner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN']);
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const b = await prisma.banner.create({
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      imageUrl: parsed.data.imageUrl || null,
      href: parsed.data.href || null,
      sort: parsed.data.sort,
    },
  });
  await audit(actor.id, 'CREATE', 'Banner', b.id);
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { ok: true, message: 'Баннер создан' };
}

export async function toggleBanner(formData: FormData): Promise<void> {
  await requireRole(['ADMIN']);
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!id) return;
  await prisma.banner.update({ where: { id }, data: { active: !active } });
  revalidatePath('/admin/banners');
  revalidatePath('/');
}

export async function deleteBanner(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.banner.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'Banner', id);
  revalidatePath('/admin/banners');
  revalidatePath('/');
}
