'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { prisma } from '@/server/db';
import { getActor } from '@/server/auth/session';
import { canManageUsers } from '@/server/access/staff';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const createUserSchema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  email: z.string().email('Некорректный email'),
  role: z.enum(['ADMIN', 'EDITOR', 'STUDENT']),
  password: z.string().min(10, 'Минимум 10 символов'),
});

const passwordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(10, 'Минимум 10 символов'),
});

/** Создать пользователя (ADMIN). Сотрудники сразу активны (email подтверждён). */
export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const { name, role, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, fieldErrors: { email: 'Пользователь с таким email уже существует' } };
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash,
      // Создан администратором — доступ без письма-подтверждения.
      emailVerifiedAt: new Date(),
    },
  });
  await audit(actor.id, 'CREATE', 'User', user.id, { role });
  revalidatePath('/admin/users');
  return { ok: true, message: `Пользователь ${email} создан (${role}).` };
}

/** Сменить пароль пользователя (ADMIN). */
export async function setUserPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const { userId, password } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { ok: false, message: 'Пользователь не найден' };

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await audit(actor.id, 'RESET_PASSWORD', 'User', userId);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/students/${userId}`);
  return { ok: true, message: 'Пароль обновлён.' };
}

/** Заблокировать/разблокировать пользователя (ADMIN). Себя блокировать нельзя. */
export async function setUserBlocked(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const userId = String(formData.get('userId') ?? '');
  const blocked = formData.get('blocked') === 'true';
  if (!userId || userId === actor.id) return; // защита от самоблокировки

  await prisma.user.update({
    where: { id: userId },
    data: { blockedAt: blocked ? new Date() : null },
  });
  await audit(actor.id, blocked ? 'BLOCK' : 'UNBLOCK', 'User', userId);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/students/${userId}`);
}

/**
 * Удалить доступ и персональные данные пользователя, сохранив обязательную
 * историю платежей и аудит. Себя и последнего активного ADMIN удалить нельзя.
 */
export async function deleteUser(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const userId = String(formData.get('userId') ?? '');
  const returnTo = String(formData.get('returnTo') ?? '');
  if (!userId || userId === actor.id) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deletedAt: true },
  });
  if (!target || target.deletedAt) return;

  if (target.role === 'ADMIN') {
    const activeAdmins = await prisma.user.count({
      where: { role: 'ADMIN', deletedAt: null, blockedAt: null },
    });
    if (activeAdmins <= 1) return;
  }

  const now = new Date();
  const anonymousEmail = `deleted-${userId}-${now.getTime()}@invalid.local`;
  await prisma.$transaction(async (tx) => {
    await tx.authToken.deleteMany({ where: { userId } });
    await tx.businessProfile.deleteMany({ where: { userId } });
    await tx.routeStepProgress.deleteMany({ where: { userId } });
    await tx.progress.deleteMany({ where: { userId } });
    await tx.moneyEntry.deleteMany({ where: { userId } });
    await tx.weeklyReport.deleteMany({ where: { userId } });
    await tx.curatorNote.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.leaderboardEntry.deleteMany({ where: { userId } });
    await tx.enrollment.updateMany({
      where: { userId },
      data: { status: 'EXPIRED', autoRenew: false, canceledAt: now, paymentMethodId: null },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymousEmail,
        passwordHash: null,
        name: 'Удалённый пользователь',
        phone: null,
        avatarUrl: null,
        telegramChatId: null,
        telegramUsername: null,
        notifyEmail: false,
        notifyTelegram: false,
        showInLeaderboard: false,
        cohortId: null,
        blockedAt: now,
        deletedAt: now,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'DELETE',
        entity: 'User',
        entityId: userId,
        meta: { previousRole: target.role, mode: 'anonymize' },
      },
    });
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/students');
  if (returnTo === '/admin/students') redirect('/admin/students');
  if (returnTo === '/admin/users') redirect('/admin/users');
}
