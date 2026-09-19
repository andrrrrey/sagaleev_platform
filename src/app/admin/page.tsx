import type { Metadata } from 'next';
import Link from 'next/link';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { canReadPayments } from '@/server/access/staff';
import { formatRubles, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Админ — обзор' };

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Panel bodyClassName="p-5 gap-2">
      <div className="font-mono text-2xl text-zinc-900">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
    </Panel>
  );
}

export default async function AdminOverviewPage() {
  const actor = await getActor();
  const showMoney = actor ? canReadPayments(actor.role) : false;
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [students, activeEnrollments, drafts, recentUsers] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.contentUnit.count({ where: { state: 'DRAFT' } }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  let paymentsCount = 0;
  let revenue = 0;
  let pending = 0;
  if (showMoney) {
    const [pc, agg, pend] = await Promise.all([
      prisma.payment.count({ where: { status: 'SUCCEEDED', paidAt: { gte: monthAgo } } }),
      prisma.payment.aggregate({
        _sum: { amountKopeks: true },
        where: { status: 'SUCCEEDED', paidAt: { gte: monthAgo } },
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
    ]);
    paymentsCount = pc;
    revenue = agg._sum.amountKopeks ?? 0;
    pending = pend;
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Обзор"
        actions={
          <>
            <Link href="/admin/skills" className={buttonClass('ghost')}>
              <Icon name="add-circle-linear" />
              Новый скилл
            </Link>
            <Link href="/admin/content" className={buttonClass('ghost')}>
              <Icon name="add-circle-linear" />
              Новый юнит
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Студентов" value={students} />
        <Metric label="Активных доступов" value={activeEnrollments} />
        <Metric label="Черновиков контента" value={drafts} />
        {showMoney ? (
          <>
            <Metric label="Оплат за 30 дней" value={paymentsCount} />
            <Metric label="Выручка 30 дней" value={formatRubles(revenue)} />
            <Metric label="Платежей в ожидании" value={pending} />
          </>
        ) : null}
      </section>

      <section className="mt-8">
        <Panel title="Последние регистрации">
          <div className="p-2">
            {recentUsers.length === 0 ? (
              <p className="p-4 font-mono text-xs text-zinc-500">Пока пусто.</p>
            ) : (
              <ul className="divide-y divide-[#e0dcd0]/60">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-light text-zinc-800">{u.name}</span>
                    <span className="font-mono text-xs text-zinc-500">
                      {showMoney ? u.email : '•••'} · {formatDate(u.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
