'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';

/** Переключатель видимости в лидерборде (docs/04 S12 «Приватность»). */
export async function setLeaderboardVisibility(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const show = formData.get('showInLeaderboard') === 'on';
  await prisma.user.update({ where: { id: actor.id }, data: { showInLeaderboard: show } });
  revalidatePath('/profile');
}

/** Настройки уведомлений (email/telegram). */
export async function setNotifyPrefs(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  await prisma.user.update({
    where: { id: actor.id },
    data: {
      notifyEmail: formData.get('notifyEmail') === 'on',
      notifyTelegram: formData.get('notifyTelegram') === 'on',
    },
  });
  revalidatePath('/profile');
}
