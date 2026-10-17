import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { publishContent } from '@/server/admin/content';
import { reviewContentDraft } from '@/server/admin/draft-review';
import { richToHtml } from '@/lib/rich';
import { parseTimecodes, parseKpis, parseUsecaseSteps, parseRepoLinks } from '@/lib/content-types';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContentForm } from '@/components/admin/ContentForm';
import { DraftReviewPanel } from '@/components/admin/DraftReviewPanel';

export const metadata: Metadata = { title: 'Редактирование юнита' };

const BASE: Record<string, string> = {
  LESSON: '/lessons',
  USECASE: '/usecases',
  STREAM: '/streams',
};

function toLocalInput(d: Date | null): string | undefined {
  if (!d) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;
  const { review: reviewResult } = await searchParams;

  const [unit, tags, routeDays, courseModules, review] = await Promise.all([
    prisma.contentUnit.findUnique({
      where: { id },
      include: {
        tags: { select: { tagId: true } },
        courses: { orderBy: { createdAt: 'asc' }, take: 1, select: { moduleId: true, sort: true } },
      },
    }),
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.routeDay.findMany({
      orderBy: { dayNumber: 'asc' },
      select: { id: true, dayNumber: true, title: true },
    }),
    prisma.courseModule.findMany({
      orderBy: [{ course: { sort: 'asc' } }, { sort: 'asc' }],
      select: { id: true, title: true, course: { select: { title: true } } },
    }),
    reviewContentDraft(id),
  ]);
  if (!unit || !review) notFound();
  if (actor.role === 'EDITOR' && unit.state !== 'DRAFT') redirect('/admin/content');

  const previewHref = `${BASE[unit.type]}/${unit.slug}`;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Контент" title={unit.title} />
      <DraftReviewPanel
        review={review}
        entityId={unit.id}
        previewHref={previewHref}
        canPublish={actor.role === 'ADMIN'}
        published={unit.state === 'PUBLISHED'}
        publishAction={publishContent}
        result={reviewResult}
      />
      <ContentForm
        tags={tags}
        routeDays={routeDays}
        courseModules={courseModules.map((module) => ({
          id: module.id,
          title: module.title,
          courseTitle: module.course.title,
        }))}
        assignedTagIds={unit.tags.map((t) => t.tagId)}
        previewHref={previewHref}
        canPublish={actor.role === 'ADMIN'}
        defaults={{
          id: unit.id,
          type: unit.type,
          title: unit.title,
          slug: unit.slug,
          summary: unit.summary ?? undefined,
          coverUrl: unit.coverUrl ?? undefined,
          timeToMaster: unit.timeToMaster ?? undefined,
          minPlan: unit.minPlan,
          state: unit.state,
          partialFreePreview: unit.partialFreePreview,
          sort: unit.sort,
          kinescopeId: unit.kinescopeId ?? undefined,
          durationSec: unit.durationSec ?? undefined,
          timecodes: parseTimecodes(unit.timecodes),
          prompt: unit.prompt ?? undefined,
          promptNote: unit.promptNote ?? undefined,
          block: unit.block ?? undefined,
          orderInBlock: unit.orderInBlock ?? undefined,
          routeDayId: unit.routeDayId ?? undefined,
          moduleId: unit.courses[0]?.moduleId,
          placementKind: unit.courses[0]?.moduleId ? 'COURSE' : unit.routeDayId ? 'ROUTE' : 'NONE',
          caseClient: unit.caseClient ?? undefined,
          goal: unit.goal ?? undefined,
          result: unit.result ?? undefined,
          kpis: parseKpis(unit.kpis),
          descriptionHtml: richToHtml(unit.description) ?? undefined,
          repoLinks: parseRepoLinks(unit.repoLinks),
          articleHtml: richToHtml(unit.article) ?? undefined,
          transcript: unit.transcript ?? undefined,
          steps: parseUsecaseSteps(unit.steps),
          airedAt: toLocalInput(unit.airedAt),
        }}
      />
    </div>
  );
}
