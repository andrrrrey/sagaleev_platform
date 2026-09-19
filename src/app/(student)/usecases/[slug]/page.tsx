import type { Metadata } from 'next';
import { ContentDetailScreen } from '@/components/content/ContentDetailScreen';

export const metadata: Metadata = { title: 'Юзкейс' };

export default async function UsecasePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; t?: string }>;
}) {
  const { slug } = await params;
  const { tab, t } = await searchParams;
  return <ContentDetailScreen slug={slug} expectedType="USECASE" initialTab={tab} initialT={t ? Number(t) : undefined} />;
}
