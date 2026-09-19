import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepForm } from '@/components/admin/StepForm';

export const metadata: Metadata = { title: 'Новый шаг маршрута' };

export default async function NewStepPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string; sort?: string }>;
}) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { dayId, sort } = await searchParams;
  if (!dayId) notFound();

  const [day, skills] = await Promise.all([
    prisma.routeDay.findUnique({ where: { id: dayId }, select: { dayNumber: true } }),
    prisma.skill.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);
  if (!day) notFound();

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker={`Admin · Маршрут · День ${day.dayNumber}`} title="Новый шаг" />
      <StepForm defaults={{ dayId, sort: Number(sort ?? 0) }} skills={skills} />
    </div>
  );
}
