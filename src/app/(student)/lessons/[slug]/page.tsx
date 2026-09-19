import type { Metadata } from 'next';
import { ContentDetailScreen } from '@/components/content/ContentDetailScreen';

export const metadata: Metadata = { title: 'Урок' };

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; t?: string }>;
}) {
  const { slug } = await params;
  const { tab, t } = await searchParams;
  return <ContentDetailScreen slug={slug} expectedType="LESSON" initialTab={tab} initialT={t ? Number(t) : undefined} />;
}
