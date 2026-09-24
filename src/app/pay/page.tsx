import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
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

  const plan = await prisma.plan.findUnique({ where: { code: 'SUPPORT' } });

  const currentPlan = actor.plan ?? null;
  if (!plan || !plan.active) {
    throw new Error('Единая подписка временно недоступна.');
  }
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Оплата"
        title={currentPlan ? 'Ваша подписка' : 'Единая подписка'}
        description={
          currentPlan
            ? 'Весь контент и агент-куратор уже включены.'
            : 'Один понятный тариф без уровней и скрытых доплат.'
        }
      />

      <div className="max-w-2xl">
        <Panel
          title={`${plan.title} // Ежемесячно`}
          status={currentPlan ? <StatusPill>Активна</StatusPill> : <StatusPill pulse>Всё включено</StatusPill>}
          className="flex flex-col"
        >
          <div className="flex flex-1 flex-col gap-5 p-6 md:p-8">
            <div>
              <span className="font-mono text-3xl text-t900">{formatRubles(plan.priceKopeks)}</span>
              <span className="ml-2 text-sm font-light text-t500">в месяц</span>
            </div>
            <ul className="flex flex-col gap-3 text-sm font-light text-t700">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Icon name="check-circle-linear" className="mt-0.5 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            {currentPlan ? (
              <p className="border border-line bg-surface px-4 py-3 text-center font-mono text-xs text-t600">
                Подписка уже активна
              </p>
            ) : (
              <>
                <CheckoutButton
                  planCode="SUPPORT"
                  label={`Подписаться за ${formatRubles(plan.priceKopeks)}`}
                />
                <p className="text-xs font-light leading-relaxed text-t500">
                  Нажимая кнопку, вы соглашаетесь на ежемесячное автопродление. Отключить его
                  можно в любой момент в профиле; оплаченный период сохранится.
                </p>
              </>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
