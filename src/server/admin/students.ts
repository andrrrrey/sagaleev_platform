'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { PlanCode } from '@prisma/client';
import { prisma } from '@/server/db';
import { getActor } from '@/server/auth/session';
import { canManageUsers } from '@/server/access/staff';
import { rebuildLeaderboardEntry } from '@/server/progress/leaderboard';
import { audit } from './audit';

const planCodeSchema = z.enum(['SELF', 'SUPPORT', 'VIP']);

const grantSchema = z.object({
  userId: z.string().min(1),
  planCode: planCodeSchema,
  reason: z.string().min(3, 'Укажите причину'),
});

const quickGrantSchema = z.object({
  userId: z.string().min(1),
  planCode: planCodeSchema,
});

const revokeSchema = z.object({
  userId: z.string().min(1),
});

/**
 * Включить/сменить тариф студента вручную. Инвариант «один ACTIVE на
 * пользователя» соблюдается: если активный enrollment есть — обновляем его,
 * иначе создаём новый. Все изменения пишутся в AuditLog.
 */
async function applyPlan(
  actorId: string,
  userId: string,
  planCode: PlanCode,
  reason: string,
): Promise<void> {
  const active = await prisma.enrollment.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (active) {
    await prisma.enrollment.update({
      where: { id: active.id },
      data: { planCode, grantedByAdmin: true },
    });
  } else {
    await prisma.enrollment.create({
      data: { userId, planCode, status: 'ACTIVE', activatedAt: new Date(), grantedByAdmin: true },
    });
  }
  await rebuildLeaderboardEntry(userId);
  await audit(actorId, 'GRANT_PLAN', 'Enrollment', userId, { planCode, reason });
  revalidatePath(`/admin/students/${userId}`);
  revalidatePath('/admin/students');
}

/** Отключить доступ студента: активный enrollment → EXPIRED. */
async function deactivatePlan(actorId: string, userId: string, reason: string): Promise<void> {
  const active = await prisma.enrollment.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (!active) return;
  await prisma.enrollment.update({ where: { id: active.id }, data: { status: 'EXPIRED' } });
  await rebuildLeaderboardEntry(userId);
  await audit(actorId, 'REVOKE_PLAN', 'Enrollment', userId, { planCode: active.planCode, reason });
  revalidatePath(`/admin/students/${userId}`);
  revalidatePath('/admin/students');
}

/** Ручная выдача/смена тарифа с причиной (карточка студента). docs/04 A2. */
export async function grantPlanManual(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await applyPlan(actor.id, parsed.data.userId, parsed.data.planCode, parsed.data.reason);
}

/** Быстрое включение тарифа из списка студентов (причина по умолчанию). */
export async function quickGrantPlan(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = quickGrantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await applyPlan(actor.id, parsed.data.userId, parsed.data.planCode, 'Быстрая выдача из админки');
}

/** Отключить доступ студента (карточка/список). */
export async function revokePlan(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = revokeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await deactivatePlan(actor.id, parsed.data.userId, 'Отключение доступа из админки');
}
