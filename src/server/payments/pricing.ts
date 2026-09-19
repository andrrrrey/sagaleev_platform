import type { PlanCode } from '@prisma/client';
import { planLevel } from '@/server/access/plans';

export type PlanPrices = Record<PlanCode, number>; // копейки

export type ChargePlan = {
  kind: 'PURCHASE' | 'UPGRADE';
  targetPlan: PlanCode;
  amountKopeks: number;
};

/**
 * Сумма к оплате: покупка = полная цена, апгрейд = разница цен (только вверх).
 * См. docs/05-api-and-gating.md §4.2.
 */
export function computeCharge(
  currentPlan: PlanCode | null,
  targetPlan: PlanCode,
  prices: PlanPrices,
): ChargePlan {
  if (!currentPlan) {
    return { kind: 'PURCHASE', targetPlan, amountKopeks: prices[targetPlan] };
  }
  if (planLevel(targetPlan) <= planLevel(currentPlan)) {
    throw new Error('Апгрейд возможен только на старший тариф.');
  }
  const diff = prices[targetPlan] - prices[currentPlan];
  return { kind: 'UPGRADE', targetPlan, amountKopeks: diff };
}
