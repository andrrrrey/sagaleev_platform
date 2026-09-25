import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkillForm } from '@/components/admin/SkillForm';

export const metadata: Metadata = { title: 'Редактирование скилла' };

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;

  const [skill, tags] = await Promise.all([
    prisma.skill.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } }),
    prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);
  if (!skill) notFound();

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Скиллы" title={skill.title} />
      <SkillForm
        tags={tags}
        assignedTagIds={skill.tags.map((t) => t.tagId)}
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
