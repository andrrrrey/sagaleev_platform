import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { richToHtml } from '@/lib/rich';
import { parseTimecodes, parseKpis, parseUsecaseSteps, parseRepoLinks } from '@/lib/content-types';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContentForm } from '@/components/admin/ContentForm';

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

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;

  const [unit, tags, routeDays] = await Promise.all([
    prisma.contentUnit.findUnique({
      where: { id },
      include: { tags: { select: { tagId: true } } },
    }),
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.routeDay.findMany({
      orderBy: { dayNumber: 'asc' },
      select: { id: true, dayNumber: true, title: true },
    }),
  ]);
  if (!unit) notFound();

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Контент" title={unit.title} />
      <ContentForm
        tags={tags}
        routeDays={routeDays}
        assignedTagIds={unit.tags.map((t) => t.tagId)}
        previewHref={`${BASE[unit.type]}/${unit.slug}`}
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
          methodTag: unit.methodTag ?? undefined,
          routeDayId: unit.routeDayId ?? undefined,
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
