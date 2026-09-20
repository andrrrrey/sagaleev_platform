import type { ProgressStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { STATUS_POINTS } from './scoring';

export type EntryStats = {
  points: number;
  viewedCount: number;
  submittedCount: number;
  implementedCount: number;
  resultCount: number;
};

/**
 * Чистый расчёт очков и разбивки по максимальному статусу каждого юнита/скилла.
 * Очки = сумма весов статусов (1/2/5/10). docs/03 §2.
 */
export function computeEntryStats(statuses: ProgressStatus[]): EntryStats {
  const stats: EntryStats = {
    points: 0,
    viewedCount: 0,
    submittedCount: 0,
    implementedCount: 0,
    resultCount: 0,
  };
  for (const s of statuses) {
    stats.points += STATUS_POINTS[s];
    if (s === 'VIEWED') stats.viewedCount += 1;
    else if (s === 'SUBMITTED') stats.submittedCount += 1;
    else if (s === 'IMPLEMENTED') stats.implementedCount += 1;
    else if (s === 'RESULT') stats.resultCount += 1;
  }
  return stats;
}

/** Пересчёт строки лидерборда пользователя (транзакционно). */
export async function rebuildLeaderboardEntry(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [progress, moneyAgg] = await Promise.all([
      tx.progress.findMany({ where: { userId }, select: { status: true } }),
      tx.moneyEntry.aggregate({ _sum: { amountKopeks: true }, where: { userId } }),
    ]);
    const stats = computeEntryStats(progress.map((p) => p.status));
    const moneyTotalKopeks = BigInt(moneyAgg._sum.amountKopeks ?? 0);

    await tx.leaderboardEntry.upsert({
      where: { userId },
      create: { userId, ...stats, moneyTotalKopeks },
      update: { ...stats, moneyTotalKopeks },
    });
  });
}

/** Ночной полный пересчёт (страховка). */
export async function recomputeAllLeaderboard(): Promise<number> {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', deletedAt: null },
    select: { id: true },
  });
  for (const s of students) await rebuildLeaderboardEntry(s.id);
  return students.length;
}

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  viewedCount: number;
  submittedCount: number;
  implementedCount: number;
  resultCount: number;
  moneyTotalKopeks: bigint | null; // null = скрыто согласием
  isMe: boolean;
};

/**
 * Топ потока + позиция пользователя. «Мотиватор, не позор»: показываем топ-10
 * и себя; скрытые из лидерборда не видны другим (себя видит). docs/04 S11.
 */
export async function getLeaderboard(
  actor: { id: string; cohortId?: string | null },
  scope: 'cohort' | 'all',
): Promise<{ top: LeaderboardRow[]; me: LeaderboardRow | null }> {
  const me = await prisma.user.findUnique({ where: { id: actor.id }, select: { cohortId: true } });
  const cohortId = me?.cohortId ?? null;

  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      user: {
        role: 'STUDENT',
        deletedAt: null,
        showInLeaderboard: true,
        ...(scope === 'cohort' && cohortId ? { cohortId } : {}),
      },
    },
    orderBy: [{ points: 'desc' }, { updatedAt: 'asc' }],
    include: { user: { select: { id: true, name: true, avatarUrl: true, showInLeaderboard: true } } },
  });

  const ranked: LeaderboardRow[] = entries.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    name: e.user.name,
    avatarUrl: e.user.avatarUrl,
    points: e.points,
    viewedCount: e.viewedCount,
    submittedCount: e.submittedCount,
    implementedCount: e.implementedCount,
    resultCount: e.resultCount,
    moneyTotalKopeks: null, // деньги публикуются отдельно по согласию (по умолчанию скрыто)
    isMe: e.userId === actor.id,
  }));

  const top = ranked.slice(0, 10);
  let meRow = ranked.find((r) => r.isMe) ?? null;

  // Если пользователь вне топ-10 и виден — добавим его позицию отдельной строкой.
  if (!meRow) {
    const myEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: actor.id },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
    if (myEntry) {
      // Позиция среди видимых (грубая оценка): считаем сколько выше по очкам.
      const higher = await prisma.leaderboardEntry.count({
        where: {
          points: { gt: myEntry.points },
          user: { role: 'STUDENT', deletedAt: null, showInLeaderboard: true },
        },
      });
      meRow = {
        rank: higher + 1,
        userId: actor.id,
        name: myEntry.user.name,
        avatarUrl: myEntry.user.avatarUrl,
        points: myEntry.points,
        viewedCount: myEntry.viewedCount,
        submittedCount: myEntry.submittedCount,
        implementedCount: myEntry.implementedCount,
        resultCount: myEntry.resultCount,
        moneyTotalKopeks: null,
        isMe: true,
      };
    }
  }

  return { top, me: meRow };
}
