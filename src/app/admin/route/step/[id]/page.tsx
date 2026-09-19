import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { parseCommands } from '@/lib/content-types';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepForm } from '@/components/admin/StepForm';

export const metadata: Metadata = { title: 'Редактирование шага' };

export default async function EditStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;

  const [step, skills] = await Promise.all([
    prisma.routeStep.findUnique({ where: { id }, include: { day: { select: { dayNumber: true } } } }),
    prisma.skill.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);
  if (!step) notFound();

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker={`Admin · Маршрут · День ${step.day.dayNumber}`} title={step.title} />
      <StepForm
        skills={skills}
        defaults={{
          id: step.id,
          dayId: step.dayId,
          sort: step.sort,
          title: step.title,
          body: step.body,
          commandsJson: JSON.stringify(parseCommands(step.commands), null, 2),
          artifactRequired: step.artifactRequired,
          artifactHint: step.artifactHint ?? undefined,
          linkedSkillId: step.linkedSkillId ?? undefined,
        }}
      />
    </div>
  );
}
