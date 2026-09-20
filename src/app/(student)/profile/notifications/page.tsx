import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { markAllNotificationsRead, markNotificationRead } from '@/server/notifications/actions';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Уведомления' };

const KIND_ICON: Record<string, string> = {
  CURATOR_NOTE: 'diploma-verified-linear',
  NEW_CONTENT: 'document-text-linear',
  PAYMENT: 'card-linear',
  STREAM_SOON: 'microphone-3-linear',
};

export default async function NotificationsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Кабинет"
        title="Уведомления"
        actions={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary">
                <Icon name="check-read-linear" />
                Прочитать все
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Notifications // Empty">Пока нет уведомлений.</EmptyState>
        </div>
      ) : (
        <Panel title="Лента // Уведомления">
          <ul className="divide-y divide-line/60">
            {notifications.map((n) => (
              <li key={n.id} className={cn('flex items-center gap-4 px-5 py-4', !n.readAt && 'bg-accent/5')}>
                <Icon name={KIND_ICON[n.kind] ?? 'bell-linear'} className={cn('text-lg', !n.readAt ? 'text-accent' : 'text-t400')} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.readAt ? <span className="h-1.5 w-1.5 bg-accent" /> : null}
                    <span className="text-sm font-normal text-t900">{n.title}</span>
                  </div>
                  {n.body ? <p className="text-sm font-light text-t600">{n.body}</p> : null}
                  <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-t400">
                    <span>{formatDate(n.createdAt)}</span>
                    {n.href ? (
                      <Link href={n.href} className="text-accent hover:underline">
                        Открыть
                      </Link>
                    ) : null}
                  </div>
                </div>
                {!n.readAt ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-t400 hover:text-accent" title="Прочитано">
                      <Icon name="check-circle-linear" className="text-base" />
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
