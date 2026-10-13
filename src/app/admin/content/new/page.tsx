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
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const { type } = await searchParams;

  const [tags, routeDays, courseModules] = await Promise.all([
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.routeDay.findMany({
      orderBy: { dayNumber: 'asc' },
      select: { id: true, dayNumber: true, title: true },
    }),
    prisma.courseModule.findMany({
      orderBy: [{ course: { sort: 'asc' } }, { sort: 'asc' }],
      select: { id: true, title: true, course: { select: { title: true } } },
    }),
  ]);

  const t = type === 'LESSON' || type === 'STREAM' ? type : 'USECASE';

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Контент" title="Новый юнит" />
      <ContentForm
        tags={tags}
        routeDays={routeDays}
        courseModules={courseModules.map((module) => ({
          id: module.id,
          title: module.title,
          courseTitle: module.course.title,
        }))}
        defaults={{ type: t, state: 'DRAFT' }}
        canPublish={actor.role === 'ADMIN'}
      />
    </div>
  );
}
