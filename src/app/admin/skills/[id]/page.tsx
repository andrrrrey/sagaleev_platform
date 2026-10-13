import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { publishSkill } from '@/server/admin/skills';
import { reviewSkillDraft } from '@/server/admin/draft-review';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkillForm } from '@/components/admin/SkillForm';
import { DraftReviewPanel } from '@/components/admin/DraftReviewPanel';

export const metadata: Metadata = { title: 'Редактирование скилла' };

export default async function EditSkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;
  const { review: reviewResult } = await searchParams;

  const [skill, tags, review] = await Promise.all([
    prisma.skill.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } }),
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    reviewSkillDraft(id),
  ]);
  if (!skill || !review) notFound();
  if (actor.role === 'EDITOR' && skill.state !== 'DRAFT') redirect('/admin/skills');

  const previewHref = `/skills/${skill.slug}`;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Скиллы" title={skill.title} />
      <DraftReviewPanel
        review={review}
        entityId={skill.id}
        previewHref={previewHref}
        canPublish={actor.role === 'ADMIN'}
        published={skill.state === 'PUBLISHED'}
        publishAction={publishSkill}
        result={reviewResult}
      />
      <SkillForm
        tags={tags}
        assignedTagIds={skill.tags.map((t) => t.tagId)}
        canPublish={actor.role === 'ADMIN'}
        previewHref={previewHref}
        defaults={{
          id: skill.id,
          title: skill.title,
          slug: skill.slug,
          group: skill.group,
          shortDesc: skill.shortDesc,
          inputs: skill.inputs,
          outputs: skill.outputs,
          prompt: skill.prompt,
          demoVideoId: skill.demoVideoId ?? undefined,
          minPlan: skill.minPlan,
          state: skill.state,
        }}
      />
    </div>
  );
}
