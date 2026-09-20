'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getActor } from '@/server/auth/session';
import { canManageUsers } from '@/server/access/staff';
import { rebuildLeaderboardEntry } from '@/server/progress/leaderboard';
import { audit } from './audit';

const grantSchema = z.object({
  userId: z.string().min(1),
  planCode: z.enum(['SELF', 'SUPPORT', 'VIP']),
  reason: z.string().min(3, 'Укажите причину'),
});

/** Ручная выдача/смена тарифа (ADMIN, с причиной → AuditLog). docs/04 A2. */
export async function grantPlanManual(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageUsers(actor.role)) redirect('/');

  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { userId, planCode, reason } = parsed.data;

  const active = await prisma.enrollment.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (active) {
    await prisma.enrollment.update({ where: { id: active.id }, data: { planCode, grantedByAdmin: true } });
  } else {
    await prisma.enrollment.create({
      data: { userId, planCode, status: 'ACTIVE', activatedAt: new Date(), grantedByAdmin: true },
    });
  }
  await rebuildLeaderboardEntry(userId);
  await audit(actor.id, 'GRANT_PLAN', 'Enrollment', userId, { planCode, reason });
  revalidatePath(`/admin/students/${userId}`);
}
