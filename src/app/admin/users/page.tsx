import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { StatusPill } from '@/components/ui/StatusPill';

export const metadata: Metadata = { title: 'Админ — пользователи' };

export default async function AdminUsersPage() {
  await requireRole(['ADMIN']);
  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'EDITOR'] }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Пользователи и роли" description="Сотрудники: ADMIN / EDITOR." />
      <Panel title="Сотрудники">
        <div className="p-2">
          <Table>
            <THead>
              <tr>
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Создан</Th>
              </tr>
            </THead>
            <tbody>
              {staff.map((u) => (
                <TRow key={u.id}>
                  <Td>{u.name}</Td>
                  <Td mono>{u.email}</Td>
                  <Td>
                    <StatusPill muted={u.role === 'EDITOR'}>{u.role}</StatusPill>
                  </Td>
                  <Td mono>{formatDate(u.createdAt)}</Td>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
