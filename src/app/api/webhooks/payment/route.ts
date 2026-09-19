import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/server/payments';
import { applyPaymentConfirmation } from '@/server/payments/service';

/**
 * Webhook провайдера. Проверка подлинности → перепроверка статуса →
 * идемпотентная активация Enrollment. Повторный webhook не создаёт дублей.
 */
export async function POST(req: Request) {
  const provider = getPaymentProvider();
  const verified = await provider.verifyWebhook(req);
  if (!verified.ok || !verified.providerPaymentId) {
    return NextResponse.json({ error: { code: 'INVALID_SIGNATURE' } }, { status: 400 });
  }

  await applyPaymentConfirmation({
    providerPaymentId: verified.providerPaymentId,
    status: verified.status ?? 'succeeded',
    raw: verified.raw ?? {},
  });

  // Всегда 200, чтобы провайдер не ретраил бесконечно после успешной обработки.
  return NextResponse.json({ ok: true });
}
