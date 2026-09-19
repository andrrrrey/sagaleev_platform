import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { env } from '@/lib/env';
import { getPaymentProvider } from '@/server/payments';
import { applyPaymentConfirmation } from '@/server/payments/service';

/**
 * Dev-страница мгновенного подтверждения мок-оплаты: имитирует webhook и
 * ведёт на /pay/result. Доступна только при PAYMENT_PROVIDER=mock.
 */
export default async function MockPayPage({
  searchParams,
}: {
  searchParams: Promise<{ providerPaymentId?: string; paymentId?: string }>;
}) {
  if (getPaymentProvider().name !== 'mock' || env.NODE_ENV === 'production') notFound();

  const { providerPaymentId, paymentId } = await searchParams;
  if (!providerPaymentId || !paymentId) notFound();

  await applyPaymentConfirmation({
    providerPaymentId,
    status: 'succeeded',
    raw: { mock: true, providerPaymentId },
  });

  redirect(`/pay/result?paymentId=${paymentId}`);
}
