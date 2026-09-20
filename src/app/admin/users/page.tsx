import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { StatusPill } from '@/components/ui/StatusPill';
import { UserCreateForm } from '@/components/admin/UserCreateForm';
import { UserRowActions } from '@/components/admin/UserRowActions';

export const metadata: Metadata = { title: 'Админ — пользователи' };

export default async function AdminUsersPage() {
  const me = await requireRole(['ADMIN']);
  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'EDITOR'] }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Пользователи и роли"
        description="Создание сотрудников, смена паролей и блокировка доступа."
      />

      <div className="mb-6">
        <Panel title="Создать пользователя // ADMIN / EDITOR / STUDENT">
          <UserCreateForm />
        </Panel>
      </div>

      <Panel title="Сотрудники // ADMIN · EDITOR">
        <div className="p-2">
          <Table>
            <THead>
              <tr>
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Статус</Th>
                <Th>Создан</Th>
                <Th>Действия</Th>
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
                  <Td>
                    <StatusPill muted={Boolean(u.blockedAt)}>
                      {u.blockedAt ? 'Заблокирован' : 'Активен'}
                    </StatusPill>
                  </Td>
                  <Td mono>{formatDate(u.createdAt)}</Td>
                  <Td>
                    <UserRowActions
                      userId={u.id}
                      name={u.name}
                      blocked={Boolean(u.blockedAt)}
                      isSelf={u.id === me.id}
                    />
                  </Td>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-t400">
        Управление студентами (тариф, блокировка, пароль) — в разделе{' '}
        <Link href="/admin/students" className="text-accent hover:underline">
          Студенты
        </Link>
        .
      </p>
    </div>
  );
}
