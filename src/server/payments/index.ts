import { env } from '@/lib/env';
import { MockProvider } from './mock';
import { YookassaProvider } from './yookassa';
import type { PaymentProvider } from './provider';

let instance: PaymentProvider | null = null;

/** Фабрика провайдера по env PAYMENT_PROVIDER (docs/05 §4.1). */
export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  if (env.PAYMENT_PROVIDER === 'yookassa') {
    instance = new YookassaProvider();
  } else {
    // Mock допустим только вне production (dev/test).
    if (env.NODE_ENV === 'production') {
      throw new Error('PAYMENT_PROVIDER=mock запрещён в production.');
    }
    instance = new MockProvider();
  }
  return instance;
}

export type { PaymentProvider } from './provider';
export { computeCharge } from './pricing';
