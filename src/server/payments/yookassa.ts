import { getSetting, getSettingFresh } from '@/server/settings/store';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateRecurringPaymentInput,
  CreateRecurringPaymentResult,
  GetPaymentResult,
  PaymentProvider,
  ProviderStatus,
  VerifyWebhookResult,
} from './provider';

const API = 'https://api.yookassa.ru/v3';

type YookassaPayment = {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  confirmation?: { confirmation_url?: string };
  payment_method?: { id?: string; saved?: boolean };
};

type YookassaAccount = {
  account_id?: string;
  status?: string;
  test?: boolean;
  payment_methods?: string[];
  fiscalization_enabled?: boolean;
  fiscalization?: { enabled?: boolean };
};

export type YookassaConnectionStatus = {
  enabled: boolean;
  test: boolean;
  paymentMethods: string[];
  fiscalizationEnabled: boolean;
};

/** Проверка реквизитов без создания платежа и без раскрытия данных магазина. */
export async function checkYookassaAccount(): Promise<YookassaConnectionStatus> {
  const [shopId, secret] = await Promise.all([
    getSettingFresh('YOOKASSA_SHOP_ID'),
    getSettingFresh('YOOKASSA_SECRET_KEY'),
  ]);
  if (!shopId || !secret) throw new Error('Сначала заполните Shop ID и Secret Key.');

  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'ЮKassa отклонила реквизиты. Проверьте Shop ID и Secret Key.'
        : `ЮKassa временно недоступна (HTTP ${res.status}).`,
    );
  }
  const account = (await res.json()) as YookassaAccount;
  return {
    enabled: account.status === 'enabled',
    test: account.test === true,
    paymentMethods: Array.isArray(account.payment_methods) ? account.payment_methods : [],
    fiscalizationEnabled:
      account.fiscalization?.enabled === true || account.fiscalization_enabled === true,
  };
}

function toStatus(s: YookassaPayment['status']): ProviderStatus {
  if (s === 'succeeded') return 'succeeded';
  if (s === 'canceled') return 'canceled';
  return 'pending';
}

/**
 * Адаптер ЮKassa (docs/05 §4). Подтверждение доступа — только webhook’ом,
 * с перепроверкой статуса запросом getPayment. IP-allowlist проверяется
 * на уровне инфраструктуры/прокси; здесь — перепроверка статуса у провайдера.
 */
export class YookassaProvider implements PaymentProvider {
  readonly name = 'yookassa';

  private async authHeader(): Promise<string> {
    const [shopId, secret] = await Promise.all([
      getSetting('YOOKASSA_SHOP_ID'),
      getSetting('YOOKASSA_SECRET_KEY'),
    ]);
    if (!shopId || !secret) throw new Error('ЮKassa не сконфигурирована (SHOP_ID/SECRET_KEY).');
    return `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}`;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const amount = (input.amountKopeks / 100).toFixed(2);
    const res = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: await this.authHeader(),
        'Idempotence-Key': input.idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: input.returnUrl },
        description: input.description,
        metadata: input.metadata,
        save_payment_method: input.savePaymentMethod ?? false,
        ...(input.receipt
          ? {
              receipt: {
                customer: { email: input.receipt.customerEmail },
                items: input.receipt.items.map((i) => ({
                  description: i.description,
                  quantity: i.quantity.toString(),
                  amount: { value: (i.amountKopeks / 100).toFixed(2), currency: 'RUB' },
                  vat_code: i.vatCode,
                })),
              },
            }
          : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`ЮKassa createPayment: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as YookassaPayment;
    const confirmationUrl = data.confirmation?.confirmation_url;
    if (!confirmationUrl) throw new Error('ЮKassa: отсутствует confirmation_url.');
    return { providerPaymentId: data.id, confirmationUrl };
  }

  async createRecurringPayment(
    input: CreateRecurringPaymentInput,
  ): Promise<CreateRecurringPaymentResult> {
    const amount = (input.amountKopeks / 100).toFixed(2);
    const res = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: await this.authHeader(),
        'Idempotence-Key': input.idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        capture: true,
        payment_method_id: input.paymentMethodId,
        description: input.description,
        metadata: input.metadata,
        ...(input.receipt
          ? {
              receipt: {
                customer: { email: input.receipt.customerEmail },
                items: input.receipt.items.map((i) => ({
                  description: i.description,
                  quantity: i.quantity.toString(),
                  amount: { value: (i.amountKopeks / 100).toFixed(2), currency: 'RUB' },
                  vat_code: i.vatCode,
                })),
              },
            }
          : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`ЮKassa recurringPayment: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as YookassaPayment;
    return {
      providerPaymentId: data.id,
      status: toStatus(data.status),
      paid: data.paid,
      raw: data,
      savedPaymentMethodId:
        data.payment_method?.saved && data.payment_method.id ? data.payment_method.id : undefined,
    };
  }

  async getPayment(providerPaymentId: string): Promise<GetPaymentResult> {
    const res = await fetch(`${API}/payments/${providerPaymentId}`, {
      headers: { Authorization: await this.authHeader() },
    });
    if (!res.ok) throw new Error(`ЮKassa getPayment: ${res.status}`);
    const data = (await res.json()) as YookassaPayment;
    return {
      status: toStatus(data.status),
      paid: data.paid,
      raw: data,
      savedPaymentMethodId:
        data.payment_method?.saved && data.payment_method.id ? data.payment_method.id : undefined,
    };
  }

  async verifyWebhook(req: Request): Promise<VerifyWebhookResult> {
    // Тело уведомления: { event, object: payment }. Перепроверяем статус
    // запросом к API (не доверяем телу вслепую).
    const body = (await req.json().catch(() => null)) as { object?: YookassaPayment } | null;
    const id = body?.object?.id;
    if (!id) return { ok: false };
    try {
      const fresh = await this.getPayment(id);
      return { ok: true, providerPaymentId: id, status: fresh.status, raw: fresh.raw };
    } catch {
      return { ok: false, providerPaymentId: id };
    }
  }
}
