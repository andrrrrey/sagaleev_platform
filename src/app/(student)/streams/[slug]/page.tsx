import type { Metadata } from 'next';
import { ContentDetailScreen } from '@/components/content/ContentDetailScreen';

export const metadata: Metadata = { title: 'Эфир' };

export default async function StreamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; t?: string }>;
}) {
  const { slug } = await params;
  const { tab, t } = await searchParams;
  return <ContentDetailScreen slug={slug} expectedType="STREAM" initialTab={tab} initialT={t ? Number(t) : undefined} />;
}
