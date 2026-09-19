import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { StatusPill } from '@/components/ui/StatusPill';

export const metadata: Metadata = { title: 'Админ — студенты' };

export default async function AdminStudentsPage() {
  await requireRole(['ADMIN']); // ПДн студентов — только ADMIN

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      enrollments: { where: { status: 'ACTIVE' }, take: 1, include: { plan: true } },
      leaderboard: { select: { points: true } },
    },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Студенты" description={`Всего: ${students.length}`} />
      <Panel title="Список // Студенты">
        <div className="p-2">
          {students.length === 0 ? (
            <p className="p-4 font-mono text-xs text-zinc-500">Студентов пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Имя</Th>
                  <Th>Email</Th>
                  <Th>Тариф</Th>
                  <Th>Очки</Th>
                  <Th>Регистрация</Th>
                </tr>
              </THead>
              <tbody>
                {students.map((s) => {
                  const plan = s.enrollments[0]?.plan;
                  return (
                    <TRow key={s.id}>
                      <Td>{s.name}</Td>
                      <Td mono>{s.email}</Td>
                      <Td>
                        {plan ? (
                          <StatusPill>{plan.title}</StatusPill>
                        ) : (
                          <StatusPill muted>Нет доступа</StatusPill>
                        )}
                      </Td>
                      <Td mono>{s.leaderboard?.points ?? 0}</Td>
                      <Td mono>{formatDate(s.createdAt)}</Td>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </Panel>
    </div>
  );
}
