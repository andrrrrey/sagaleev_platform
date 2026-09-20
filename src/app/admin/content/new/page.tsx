import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContentForm } from '@/components/admin/ContentForm';

export const metadata: Metadata = { title: 'Новый юнит' };

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { type } = await searchParams;

  const [tags, routeDays] = await Promise.all([
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.routeDay.findMany({ orderBy: { dayNumber: 'asc' }, select: { id: true, dayNumber: true, title: true } }),
  ]);

  const t = type === 'LESSON' || type === 'STREAM' ? type : 'USECASE';

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Контент" title="Новый юнит" />
      <ContentForm tags={tags} routeDays={routeDays} defaults={{ type: t }} />
    </div>
  );
}
