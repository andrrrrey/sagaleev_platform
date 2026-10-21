import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/settings/store', () => ({
  getSetting: vi.fn(async (key: string) => (key === 'YOOKASSA_SHOP_ID' ? 'shop' : 'secret')),
  getSettingFresh: vi.fn(async (key: string) => (key === 'YOOKASSA_SHOP_ID' ? 'shop' : 'secret')),
}));

import { YookassaProvider } from '@/server/payments/yookassa';

const receipt = {
  customerEmail: 'student@example.com',
  items: [
    {
      description: 'Подписка',
      amountKopeks: 500_000,
      quantity: 1,
      vatCode: 1,
    },
  ],
};

describe('запросы ЮKassa', () => {
  afterEach(() => vi.restoreAllMocks());

  it('передаёт обязательные признаки расчёта для первого платежа', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'provider-payment',
          status: 'pending',
          paid: false,
          confirmation: { confirmation_url: 'https://yookassa.ru/checkout' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await new YookassaProvider().createPayment({
      amountKopeks: 500_000,
      description: 'Подписка',
      returnUrl: 'https://platform.example/pay/result',
      idempotenceKey: 'payment-key',
      metadata: { paymentId: 'payment', userId: 'user' },
      receipt,
      savePaymentMethod: true,
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.receipt.items[0]).toMatchObject({
      payment_mode: 'full_payment',
      payment_subject: 'service',
    });
  });

  it('передаёт те же признаки для автопродления', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'renewal', status: 'succeeded', paid: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    await new YookassaProvider().createRecurringPayment({
      amountKopeks: 500_000,
      description: 'Продление',
      idempotenceKey: 'renewal-key',
      metadata: { paymentId: 'payment', userId: 'user' },
      paymentMethodId: 'saved-card',
      receipt,
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.receipt.items[0]).toMatchObject({
      payment_mode: 'full_payment',
      payment_subject: 'service',
    });
  });
});
