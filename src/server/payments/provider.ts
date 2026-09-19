export type ReceiptItem = {
  description: string;
  amountKopeks: number;
  quantity: number;
  vatCode: number; // код ставки НДС (настройка налогообложения)
};

export type CreatePaymentInput = {
  amountKopeks: number;
  description: string;
  returnUrl: string;
  idempotenceKey: string;
  metadata: { paymentId: string; userId: string };
  receipt?: { customerEmail: string; items: ReceiptItem[] };
};

export type CreatePaymentResult = {
  providerPaymentId: string;
  confirmationUrl: string;
};

export type ProviderStatus = 'pending' | 'succeeded' | 'canceled';

export type GetPaymentResult = {
  status: ProviderStatus;
  paid: boolean;
  raw: unknown;
};

export type VerifyWebhookResult = {
  ok: boolean;
  providerPaymentId?: string;
  status?: ProviderStatus;
  raw?: unknown;
};

/** Абстракция платёжного провайдера (docs/05 §4.1). */
export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPayment(providerPaymentId: string): Promise<GetPaymentResult>;
  verifyWebhook(req: Request): Promise<VerifyWebhookResult>;
}
