import type { PlanCode } from '@prisma/client';

/** Уровень тарифа: SELF=1, SUPPORT=2, VIP=3. Порядок = уровень доступа. */
export const PLAN_LEVEL: Record<PlanCode, number> = {
  SELF: 1,
  SUPPORT: 2,
  VIP: 3,
};

export function planLevel(plan: PlanCode | null | undefined): number {
  return plan ? PLAN_LEVEL[plan] : 0;
}

/** Тариф >= требуемого уровня. */
export function planMeets(actual: PlanCode | null | undefined, required: PlanCode): boolean {
  return planLevel(actual) >= planLevel(required);
}
