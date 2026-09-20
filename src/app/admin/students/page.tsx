import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { quickGrantPlan, revokePlan } from '@/server/admin/students';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
      <PageHeader
        kicker="Admin"
        title="Студенты"
        description={`Всего: ${students.length}. Тариф можно включить прямо из списка или в карточке.`}
      />
      <Panel title="Список // Студенты">
        <div className="p-2">
          {students.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Студентов пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Имя</Th>
                  <Th>Email</Th>
                  <Th>Тариф</Th>
                  <Th>Очки</Th>
                  <Th>Управление тарифом</Th>
                </tr>
              </THead>
              <tbody>
                {students.map((s) => {
                  const enrollment = s.enrollments[0];
                  const activeCode = enrollment?.planCode ?? null;
                  return (
                    <TRow key={s.id}>
                      <Td>
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-t900 hover:text-accent hover:underline"
                        >
                          {s.name}
                        </Link>
                      </Td>
                      <Td mono>{s.email}</Td>
                      <Td>
                        {enrollment ? (
                          <StatusPill>{enrollment.plan.title}</StatusPill>
                        ) : (
                          <StatusPill muted>Нет доступа</StatusPill>
                        )}
                      </Td>
                      <Td mono>{s.leaderboard?.points ?? 0}</Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={quickGrantPlan} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={s.id} />
                            <div className="w-28">
                              <Select name="planCode" defaultValue={activeCode ?? 'SELF'}>
                                <option value="SELF">SELF</option>
                                <option value="SUPPORT">SUPPORT</option>
                                <option value="VIP">VIP</option>
                              </Select>
                            </div>
                            <Button type="submit" variant="ghost">
                              <Icon name="check-circle-linear" />
                              {activeCode ? 'Сменить' : 'Включить'}
                            </Button>
                          </form>
                          {activeCode ? (
                            <form action={revokePlan}>
                              <input type="hidden" name="userId" value={s.id} />
                              <Button type="submit" variant="ghost">
                                <Icon name="close-circle-linear" />
                                Отключить
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </Td>
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
