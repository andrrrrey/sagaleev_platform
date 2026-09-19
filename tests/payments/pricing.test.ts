import { describe, expect, it } from 'vitest';
import { computeCharge, type PlanPrices } from '@/server/payments/pricing';

const prices: PlanPrices = {
  SELF: 10_000_000, // 100 000 ₽
  SUPPORT: 20_000_000, // 200 000 ₽
  VIP: 40_000_000, // 400 000 ₽
};

describe('расчёт суммы платежа', () => {
  it('покупка без текущего тарифа = полная цена', () => {
    expect(computeCharge(null, 'SELF', prices)).toEqual({
      kind: 'PURCHASE',
      targetPlan: 'SELF',
      amountKopeks: 10_000_000,
    });
  });

  it('апгрейд SELF→SUPPORT списывает разницу 100 000 ₽', () => {
    expect(computeCharge('SELF', 'SUPPORT', prices)).toEqual({
      kind: 'UPGRADE',
      targetPlan: 'SUPPORT',
      amountKopeks: 10_000_000,
    });
  });

  it('апгрейд SUPPORT→VIP = 200 000 ₽', () => {
    expect(computeCharge('SUPPORT', 'VIP', prices).amountKopeks).toBe(20_000_000);
  });

  it('апгрейд SELF→VIP = 300 000 ₽', () => {
    expect(computeCharge('SELF', 'VIP', prices).amountKopeks).toBe(30_000_000);
  });

  it('даунгрейд или тот же тариф запрещён', () => {
    expect(() => computeCharge('SUPPORT', 'SELF', prices)).toThrow();
    expect(() => computeCharge('SUPPORT', 'SUPPORT', prices)).toThrow();
  });
});
