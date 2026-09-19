import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { PlanCode } from '@prisma/client';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { planLevel } from '@/server/access/plans';
import { formatRubles } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';
import { CheckoutButton } from '@/components/pay/CheckoutButton';

export const metadata: Metadata = { title: 'Тариф и оплата' };

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  await searchParams; // upgrade-хинт учитываем визуально позже

  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sort: 'asc' },
  });

  const currentPlan = actor.plan ?? null;
  const currentLevel = planLevel(currentPlan);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Оплата"
        title={currentPlan ? 'Улучшить тариф' : 'Выберите тариф'}
        description={
          currentPlan
            ? 'При апгрейде списывается только разница в цене.'
            : 'Доступ к контенту открывается после подтверждения оплаты.'
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const level = planLevel(plan.code as PlanCode);
          const isCurrent = plan.code === currentPlan;
          const isTarget = level === 2; // SUPPORT — целевой
          const isDowngrade = currentPlan !== null && level <= currentLevel;
          const priceKopeks =
            currentPlan && level > currentLevel
              ? plan.priceKopeks - (plans.find((p) => p.code === currentPlan)?.priceKopeks ?? 0)
              : plan.priceKopeks;
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];

          return (
            <Panel
              key={plan.code}
              title={`${plan.title} // Тариф`}
              status={
                isCurrent ? (
                  <StatusPill muted>Текущий</StatusPill>
                ) : isTarget ? (
                  <StatusPill pulse>Целевой</StatusPill>
                ) : undefined
              }
              className="flex flex-col"
            >
              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="font-mono text-2xl text-zinc-900">
                  {formatRubles(plan.priceKopeks)}
                </div>

                <ul className="flex flex-1 flex-col gap-3 text-sm font-light text-zinc-700">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icon name="check-circle-linear" className="mt-0.5 text-[#d95321]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <p className="border border-[#e0dcd0] bg-white px-3 py-2 text-center font-mono text-[11px] text-zinc-500">
                    Ваш активный тариф
                  </p>
                ) : isDowngrade ? (
                  <p className="border border-[#e0dcd0] bg-white px-3 py-2 text-center font-mono text-[11px] text-zinc-400">
                    Понижение недоступно
                  </p>
                ) : (
                  <CheckoutButton
                    planCode={plan.code as PlanCode}
                    label={
                      currentPlan
                        ? `Доплата ${formatRubles(priceKopeks)}`
                        : `Оплатить ${formatRubles(priceKopeks)}`
                    }
                  />
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
