/**
 * Worker-процесс на pg-boss (очередь на Postgres, без Redis). docs/05 §9.
 * Запуск: pnpm worker (в проде — отдельный контейнер `worker`).
 *
 * Расписания (UTC): МСК = UTC+3.
 *  - leaderboard.rebuild — ежедневно 00:00 UTC (03:00 МСК)
 *  - curator.weekly      — пн 06:00 UTC (09:00 МСК)
 *  - notify.stream-reminder — каждый час
 *  - payments.reconcile  — каждые 10 минут
 *  - auth.cleanup        — ежедневно 01:00 UTC
 */
import { PgBoss } from 'pg-boss';
import { env } from '@/lib/env';
import { recomputeAllLeaderboard } from '@/server/progress/leaderboard';
import { runCuratorWeekly } from '@/server/curator/service';
import { reconcilePendingPayments } from '@/server/payments/service';
import { sendStreamReminders } from './tasks';
import { prisma } from '@/server/db';

async function cleanupTokens(): Promise<number> {
  const res = await prisma.authToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return res.count;
}

const QUEUES = {
  leaderboard: 'leaderboard.rebuild',
  curator: 'curator.weekly',
  streams: 'notify.stream-reminder',
  payments: 'payments.reconcile',
  cleanup: 'auth.cleanup',
} as const;

async function main() {
  const boss = new PgBoss(env.DATABASE_URL);
  boss.on('error', (e: unknown) => console.error('[pg-boss]', e));
  await boss.start();

  for (const name of Object.values(QUEUES)) {
    await boss.createQueue(name);
  }

  await boss.work(QUEUES.leaderboard, async () => {
    const n = await recomputeAllLeaderboard();
    console.log(`[leaderboard.rebuild] пересчитано: ${n}`);
  });
  await boss.work(QUEUES.curator, async () => {
    const r = await runCuratorWeekly();
    console.log('[curator.weekly]', r);
  });
  await boss.work(QUEUES.streams, async () => {
    const n = await sendStreamReminders();
    console.log(`[notify.stream-reminder] отправлено: ${n}`);
  });
  await boss.work(QUEUES.payments, async () => {
    const n = await reconcilePendingPayments();
    console.log(`[payments.reconcile] обработано: ${n}`);
  });
  await boss.work(QUEUES.cleanup, async () => {
    const n = await cleanupTokens();
    console.log(`[auth.cleanup] удалено токенов: ${n}`);
  });

  await boss.schedule(QUEUES.leaderboard, '0 0 * * *');
  await boss.schedule(QUEUES.curator, '0 6 * * 1');
  await boss.schedule(QUEUES.streams, '0 * * * *');
  await boss.schedule(QUEUES.payments, '*/10 * * * *');
  await boss.schedule(QUEUES.cleanup, '0 1 * * *');

  console.log('Worker запущен: очереди и расписания зарегистрированы.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
