'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { accountSettingsSchema } from '@/lib/schemas';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';

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

/** Основные данные аккаунта. Пароль защищает смену адреса и личных данных. */
export async function updateAccountSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const parsed = accountSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, parsed.data.currentPassword))) {
    return {
      ok: false,
      fieldErrors: { currentPassword: 'Текущий пароль указан неверно' },
    };
  }

  try {
    await prisma.user.update({
      where: { id: actor.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, fieldErrors: { email: 'Этот email уже используется' } };
    }
    throw error;
  }

  revalidatePath('/profile');
  return { ok: true, message: 'Настройки аккаунта сохранены.' };
}

/** Отключает будущие списания; оплаченный период остаётся доступен. */
export async function cancelSubscription(): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  await prisma.enrollment.updateMany({
    where: { userId: actor.id, status: 'ACTIVE' },
    data: { autoRenew: false, canceledAt: new Date() },
  });
  revalidatePath('/profile');
}

/** Повторно включает списания с уже сохранённого в ЮKassa способа оплаты. */
export async function resumeSubscription(): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  await prisma.enrollment.updateMany({
    where: {
      userId: actor.id,
      status: 'ACTIVE',
      paymentMethodId: { not: null },
      expiresAt: { gt: new Date() },
    },
    data: { autoRenew: true, canceledAt: null },
  });
  revalidatePath('/profile');
}
