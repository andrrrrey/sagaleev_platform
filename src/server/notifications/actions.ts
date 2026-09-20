'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';

export async function markAllNotificationsRead(): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  await prisma.notification.updateMany({
    where: { userId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/profile/notifications');
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, userId: actor.id },
    data: { readAt: new Date() },
  });
  revalidatePath('/profile/notifications');
}
