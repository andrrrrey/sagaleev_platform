import { randomUUID } from 'node:crypto';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateRecurringPaymentInput,
  CreateRecurringPaymentResult,
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

  async createRecurringPayment(
    input: CreateRecurringPaymentInput,
  ): Promise<CreateRecurringPaymentResult> {
    const providerPaymentId = `mock_${randomUUID()}`;
    return {
      providerPaymentId,
      status: 'succeeded',
      paid: true,
      savedPaymentMethodId: input.paymentMethodId,
      raw: {
        id: providerPaymentId,
        status: 'succeeded',
        paid: true,
        payment_method: { id: input.paymentMethodId, saved: true },
      },
    };
  }

  async getPayment(providerPaymentId: string): Promise<GetPaymentResult> {
    return {
      status: 'succeeded',
      paid: true,
      raw: {
        providerPaymentId,
        mock: true,
        payment_method: { id: `saved_${providerPaymentId}`, saved: true },
      },
      savedPaymentMethodId: `saved_${providerPaymentId}`,
    };
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
