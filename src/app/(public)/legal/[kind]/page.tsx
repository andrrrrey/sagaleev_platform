import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const KIND_MAP: Record<string, { db: string; title: string }> = {
  privacy: { db: 'PRIVACY', title: 'Политика обработки персональных данных' },
  offer: { db: 'OFFER', title: 'Публичная оферта' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  return { title: KIND_MAP[kind]?.title ?? 'Документ' };
}

export default async function LegalPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const meta = KIND_MAP[kind];
  if (!meta) notFound();

  const doc = await prisma.legalDocument.findFirst({
    where: { kind: meta.db },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Документы" title={meta.title} />
      <div className="max-w-3xl">
        {doc ? (
          <article
            className="prose-sm text-sm font-light leading-relaxed text-zinc-700 [&_h2]:mt-6 [&_h2]:font-normal [&_h2]:text-zinc-900"
            dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
          />
        ) : (
          <EmptyState label="Документ // Draft">
            Текст документа появится после согласования с заказчиком.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
