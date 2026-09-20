import type { Metadata } from 'next';
import Link from 'next/link';
import type { PlanCode, Prisma } from '@prisma/client';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatRubles, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Админ — поток' };

const PLAN_TABS: { key: string; label: string; plan?: PlanCode }[] = [
  { key: 'all', label: 'Все' },
  { key: 'SELF', label: 'SELF', plan: 'SELF' },
  { key: 'SUPPORT', label: 'SUPPORT', plan: 'SUPPORT' },
  { key: 'VIP', label: 'VIP', plan: 'VIP' },
];

export default async function AdminCohortPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireRole(['ADMIN']);
  const { plan } = await searchParams;
  const planFilter = PLAN_TABS.find((t) => t.key === plan)?.plan;

  const where: Prisma.UserWhereInput = {
    role: 'STUDENT',
    deletedAt: null,
    ...(planFilter ? { enrollments: { some: { status: 'ACTIVE', planCode: planFilter } } } : {}),
  };

  const students = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      enrollments: { where: { status: 'ACTIVE' }, take: 1, select: { planCode: true } },
      leaderboard: true,
      progress: { orderBy: { updatedAt: 'desc' }, take: 1, select: { updatedAt: true } },
      routeProgress: { select: { done: true } },
    },
  });

  // Воронка потока.
  const funnel = { viewed: 0, submitted: 0, implemented: 0, result: 0 };
  for (const s of students) {
    const lb = s.leaderboard;
    if (!lb) continue;
    if (lb.viewedCount + lb.submittedCount + lb.implementedCount + lb.resultCount > 0) funnel.viewed += 1;
    if (lb.submittedCount + lb.implementedCount + lb.resultCount > 0) funnel.submitted += 1;
    if (lb.implementedCount + lb.resultCount > 0) funnel.implemented += 1;
    if (lb.resultCount > 0) funnel.result += 1;
  }
  const stuck = students.filter((s) => {
    const last = s.progress[0]?.updatedAt;
    return !last || Date.now() - last.getTime() > 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Дашборд потока"
        description={`Студентов: ${students.length}`}
        actions={
          <Link href="/api/admin/export/students.csv" className={buttonClass('ghost')} prefetch={false}>
            <Icon name="export-linear" />
            Экспорт CSV
          </Link>
        }
      />

      {/* Воронка */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Посмотрел', value: funnel.viewed },
          { label: 'Сдал', value: funnel.submitted },
          { label: 'Внедрил', value: funnel.implemented },
          { label: 'Результат', value: funnel.result },
          { label: 'Застряли > 7 дней', value: stuck },
        ].map((m) => (
          <Panel key={m.label} bodyClassName="p-4 gap-1">
            <div className="font-mono text-2xl text-t900">{m.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-t500">{m.label}</div>
          </Panel>
        ))}
      </section>

      <div className="mb-6 flex flex-wrap gap-1">
        {PLAN_TABS.map((t) => {
          const active = (plan ?? 'all') === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === 'all' ? '/admin/cohort' : `/admin/cohort?plan=${t.key}`}
              className={cn(
                '-ml-px border border-line px-3 py-1.5 font-mono text-xs transition-colors',
                active ? 'border-b-accent bg-surface text-t900' : 'bg-transparent text-t500 hover:bg-paper-hover',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <Panel title="Прогресс // По студентам">
        <div className="p-2">
          <Table>
            <THead>
              <tr>
                <Th>Студент</Th>
                <Th>Тариф</Th>
                <Th>Очки</Th>
                <Th>V/S/I/R</Th>
                <Th>Деньги</Th>
                <Th>Маршрут</Th>
                <Th>Активность</Th>
              </tr>
            </THead>
            <tbody>
              {students.map((s) => {
                const lb = s.leaderboard;
                const routeDone = s.routeProgress.filter((r) => r.done).length;
                return (
                  <TRow key={s.id}>
                    <Td>
                      <Link href={`/admin/students/${s.id}`} className="text-t800 hover:text-accent">
                        {s.name}
                      </Link>
                    </Td>
                    <Td mono>{s.enrollments[0]?.planCode ?? '—'}</Td>
                    <Td mono>{lb?.points ?? 0}</Td>
                    <Td mono className="text-t500">
                      {lb ? `${lb.viewedCount}/${lb.submittedCount}/${lb.implementedCount}/${lb.resultCount}` : '0/0/0/0'}
                    </Td>
                    <Td mono>{formatRubles(Number(lb?.moneyTotalKopeks ?? 0))}</Td>
                    <Td mono>{routeDone}</Td>
                    <Td mono>{s.progress[0]?.updatedAt ? formatDate(s.progress[0].updatedAt) : '—'}</Td>
                  </TRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
