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

export const metadata: Metadata = { title: 'Юзкейсы' };

export default async function UsecasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const sp = await searchParams;

  const [cards, tags, clientsRaw] = await Promise.all([
    listContent(actor, {
      type: 'USECASE',
      q: sp.q,
      tags: sp.tags ? sp.tags.split(',').filter(Boolean) : undefined,
      client: sp.client,
    }),
    prisma.tag.findMany({
      where: { units: { some: { unit: { type: 'USECASE' } } } },
      orderBy: { title: 'asc' },
      select: { slug: true, title: true },
    }),
    prisma.contentUnit.findMany({
      where: { type: 'USECASE', state: 'PUBLISHED', caseClient: { not: null } },
      distinct: ['caseClient'],
      select: { caseClient: true },
    }),
  ]);
  const clients = clientsRaw.map((c) => c.caseClient).filter((c): c is string => Boolean(c));

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Юзкейсы"
        title="Реальные кейсы с цифрами"
        description="Кейсы Жаргала с измеримым результатом. Разбирай, отправляй агенту, внедряй."
      />
      <Suspense fallback={<div className="mb-8 h-24 animate-pulse bg-line/30" />}>
        <ContentFilterBar tags={tags} clients={clients} />
      </Suspense>

      {cards.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Юзкейсы // Empty">Ничего не найдено. Сбросьте фильтры.</EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ContentCardView key={c.slug} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}
