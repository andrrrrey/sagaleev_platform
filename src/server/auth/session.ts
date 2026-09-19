import { cache } from 'react';
import type { Actor } from '@/server/access';
import { prisma } from '@/server/db';
import { auth } from './config';

/**
 * Текущий актор для гейтинга: роль + активный тариф.
 * Кэшируется на время запроса (React cache).
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { planCode: true },
  });

  return {
    id: session.user.id,
    role: session.user.role,
    plan: enrollment?.planCode ?? null,
    enrollmentActive: Boolean(enrollment),
  };
});

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
});
