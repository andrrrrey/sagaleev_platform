import type { PlanCode } from '@prisma/client';

/**
 * Матрица доступа (тариф × раздел) — источник истины в коде.
 * См. docs/05-api-and-gating.md §1. Конкретные ресурсы несут свой `minPlan`
 * в БД; здесь фиксируем поведение по умолчанию и требования фич.
 */

export type FeatureKey = 'CURATOR' | 'ZOOM';

/** CURATOR бесплатен; значение используется как справочное. ZOOM требует SUPPORT. */
export const FEATURE_MIN_PLAN: Record<FeatureKey, PlanCode> = {
  CURATOR: 'SELF',
  ZOOM: 'SUPPORT',
};

/** Значения `minPlan` по умолчанию для сидов/контента (справочно). */
export const DEFAULT_MIN_PLAN = {
  ROUTE: 'SELF', // справочно: сам маршрут доступен и без подписки
  SKILL_BASIC: 'SELF',
  SKILL_FULL: 'SUPPORT',
  LESSON: 'SELF',
  USECASE: 'SELF',
  STREAM: 'SUPPORT', // кроме partialFreePreview=true (SELF)
} satisfies Record<string, PlanCode>;
