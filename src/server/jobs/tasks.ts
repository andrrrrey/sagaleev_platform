import { prisma } from '@/server/db';
import { notifyTelegram } from '@/server/telegram/service';

/**
 * Напоминания об эфирах: за ~24 ч до airedAt уведомляем SUPPORT/VIP.
 * Дедупликация — по существующему STREAM_SOON с тем же href за 2 дня.
 */
export async function sendStreamReminders(): Promise<number> {
  const now = new Date();
  const in25h = new Date(now.getTime() + 25 * 3600 * 1000);
  const streams = await prisma.contentUnit.findMany({
    where: { type: 'STREAM', state: 'PUBLISHED', airedAt: { gte: now, lte: in25h } },
    select: { slug: true, title: true },
  });
  if (streams.length === 0) return 0;

  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      deletedAt: null,
      notifyEmail: true,
      enrollments: { some: { status: 'ACTIVE', planCode: { in: ['SUPPORT', 'VIP'] } } },
    },
    select: { id: true },
  });

  let sent = 0;
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
  for (const stream of streams) {
    const href = `/streams/${stream.slug}`;
    for (const s of students) {
      const exists = await prisma.notification.findFirst({
        where: { userId: s.id, kind: 'STREAM_SOON', href, createdAt: { gte: twoDaysAgo } },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.notification.create({
        data: { userId: s.id, kind: 'STREAM_SOON', title: 'Скоро эфир', body: stream.title, href },
      });
      await notifyTelegram(s.id, `📣 Скоро эфир: ${stream.title}`);
      sent += 1;
    }
  }
  return sent;
}
