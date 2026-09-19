import { randomUUID } from 'node:crypto';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  GetPaymentResult,
  PaymentProvider,
  VerifyWebhookResult,
} from './provider';

/**
 * Мок-провайдер для dev/test: мгновенное подтверждение через страницу
 * /pay/mock, которая дергает webhook. Активен только вне production
 * (см. lib/env.ts). Никогда не используется в бою.
 */
export class MockProvider implements PaymentProvider {
  readonly name = 'mock';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerPaymentId = `mock_${randomUUID()}`;
    const url = new URL('/pay/mock', input.returnUrl);
    url.searchParams.set('providerPaymentId', providerPaymentId);
    url.searchParams.set('paymentId', input.metadata.paymentId);
    return { providerPaymentId, confirmationUrl: url.toString() };
  }

  async getPayment(providerPaymentId: string): Promise<GetPaymentResult> {
    return { status: 'succeeded', paid: true, raw: { providerPaymentId, mock: true } };
  }

  async verifyWebhook(req: Request): Promise<VerifyWebhookResult> {
    const body = (await req.json().catch(() => ({}))) as {
      providerPaymentId?: string;
      status?: 'pending' | 'succeeded' | 'canceled';
    };
    if (!body.providerPaymentId) return { ok: false };
    return {
      ok: true,
      providerPaymentId: body.providerPaymentId,
      status: body.status ?? 'succeeded',
      raw: body,
    };
  }
}
