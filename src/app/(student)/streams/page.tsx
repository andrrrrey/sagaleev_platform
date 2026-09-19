import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { listContent } from '@/server/content/service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentFilterBar } from '@/components/content/ContentFilterBar';
import { ContentCardView } from '@/components/content/ContentCardView';

export const metadata: Metadata = { title: 'Эфиры' };

export default async function StreamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const sp = await searchParams;

  const [cards, tags] = await Promise.all([
    listContent(actor, {
      type: 'STREAM',
      q: sp.q,
      tags: sp.tags ? sp.tags.split(',').filter(Boolean) : undefined,
    }),
    prisma.tag.findMany({
      where: { units: { some: { unit: { type: 'STREAM' } } } },
      orderBy: { title: 'asc' },
      select: { slug: true, title: true },
    }),
  ]);
  // Архив по дате эфира (свежие сверху).
  const sorted = [...cards].sort((a, b) => (b.airedAt ?? '').localeCompare(a.airedAt ?? ''));

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Эфиры"
        title="Архив еженедельных разборов"
        description="Записи Zoom-разборов. На тарифе SELF доступны частично."
      />
      <Suspense fallback={<div className="mb-8 h-24 animate-pulse bg-line/30" />}>
        <ContentFilterBar tags={tags} />
      </Suspense>

      {sorted.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Эфиры // Empty">Пока нет записей.</EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <ContentCardView key={c.slug} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
