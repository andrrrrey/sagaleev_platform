import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { listContent, type ContentCard } from '@/server/content/service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { ContentFilterBar } from '@/components/content/ContentFilterBar';

export const metadata: Metadata = { title: 'Уроки' };

const STATUS_LABEL: Record<string, string> = {
  VIEWED: 'Просмотрен',
  SUBMITTED: 'Сдан',
  IMPLEMENTED: 'Внедрён',
  RESULT: 'Результат',
};

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const sp = await searchParams;

  const [cards, tags] = await Promise.all([
    listContent(actor, {
      type: 'LESSON',
      q: sp.q,
      tags: sp.tags ? sp.tags.split(',').filter(Boolean) : undefined,
    }),
    prisma.tag.findMany({
      where: { units: { some: { unit: { type: 'LESSON' } } } },
      orderBy: { title: 'asc' },
      select: { slug: true, title: true },
    }),
  ]);

  // Группировка по блокам (1..10).
  const byBlock = new Map<number, ContentCard[]>();
  for (const c of cards) {
    const b = c.block ?? 0;
    if (!byBlock.has(b)) byBlock.set(b, []);
    byBlock.get(b)!.push(c);
  }
  const blocks = [...byBlock.keys()].sort((a, b) => a - b);

  const viewed = cards.filter((c) => c.status !== 'NONE').length;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Уроки"
        title="10-недельная программа"
        description={`Просмотрено ${viewed} из ${cards.length} уроков.`}
      />
      {cards.length > 0 ? (
        <div className="mb-8 max-w-2xl">
          <ProgressBar value={cards.length ? Math.round((viewed / cards.length) * 100) : 0} />
        </div>
      ) : null}

      <Suspense fallback={<div className="mb-8 h-24 animate-pulse bg-line/30" />}>
        <ContentFilterBar tags={tags} />
      </Suspense>

      {cards.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Уроки // Empty">Ничего не найдено.</EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {blocks.map((b) => {
            const lessons = byBlock.get(b)!;
            const blockViewed = lessons.filter((l) => l.status !== 'NONE').length;
            return (
              <Panel
                key={b}
                title={b > 0 ? `Блок ${b} // Программа` : 'Без блока'}
                status={
                  <StatusPill muted={blockViewed === 0}>
                    {blockViewed} / {lessons.length}
                  </StatusPill>
                }
              >
                <ul className="divide-y divide-line/60">
                  {lessons.map((l) => (
                    <li key={l.slug}>
                      <Link
                        href={`/lessons/${l.slug}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-paper-hover/40"
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            name={l.status !== 'NONE' ? 'check-circle-linear' : 'videocamera-record-linear'}
                            className={l.status !== 'NONE' ? 'text-accent' : 'text-t400'}
                          />
                          <span className="text-sm font-light text-t800">{l.title}</span>
                          {l.methodTag ? (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                              · {l.methodTag}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-t500">
                          {l.status !== 'NONE' ? STATUS_LABEL[l.status] : null}
                          {l.timeToMaster ? <span>{l.timeToMaster}</span> : null}
                          {l.locked ? <Icon name="lock-linear" className="text-t400" /> : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
