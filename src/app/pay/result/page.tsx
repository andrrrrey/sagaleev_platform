import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { PayResult } from '@/components/pay/PayResult';

export const metadata: Metadata = { title: 'Результат оплаты' };

export default async function PayResultPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  if (!paymentId) redirect('/pay');

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Оплата" title="Результат оплаты" />
      <div className="max-w-xl">
        <Panel title="Payment // Status" status={<StatusPill pulse>Проверка</StatusPill>}>
          <div className="p-6">
            <PayResult paymentId={paymentId} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
