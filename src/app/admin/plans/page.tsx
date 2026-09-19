import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatRubles } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Админ — тарифы' };

export default async function AdminPlansPage() {
  await requireRole(['ADMIN']);
  const plans = await prisma.plan.findMany({ orderBy: { sort: 'asc' } });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Тарифы"
        description="Цены и матрица хранятся в БД. Изменение цен не влияет на прошедшие платежи."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
          return (
            <Panel
              key={plan.code}
              title={`${plan.code} // Тариф`}
              status={plan.active ? <StatusPill>Активен</StatusPill> : <StatusPill muted>Скрыт</StatusPill>}
            >
              <div className="flex flex-col gap-4 p-6">
                <div className="text-lg font-normal tracking-tight text-zinc-900">{plan.title}</div>
                <div className="font-mono text-2xl text-zinc-900">{formatRubles(plan.priceKopeks)}</div>
                <ul className="flex flex-col gap-2 text-sm font-light text-zinc-700">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon name="check-circle-linear" className="mt-0.5 text-[#d95321]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  Редактирование цен — на форме (Этап 1+)
                </p>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
