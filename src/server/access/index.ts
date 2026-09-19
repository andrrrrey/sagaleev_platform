import type { PlanCode, Role } from '@prisma/client';
import { HttpError, type AccessCode } from './errors';
import { FEATURE_MIN_PLAN, type FeatureKey } from './matrix';
import { planMeets } from './plans';

export type Actor = {
  id: string;
  role: Role;
  plan?: PlanCode | null;
  enrollmentActive: boolean;
};

export type Resource =
  | { kind: 'skill' | 'unit'; minPlan: PlanCode; partialFree?: boolean }
  | { kind: 'feature'; feature: FeatureKey };

export type Decision =
  | { ok: true }
  | { ok: false; code: AccessCode; requiredPlan?: PlanCode };

const ALLOW: Decision = { ok: true };

/** Роль читает контент в обход гейтинга по тарифу. */
function isStaff(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

/** Чистое решение о доступе. UI отражает его, но не заменяет. */
export function canAccess(actor: Actor | null, res: Resource): Decision {
  if (!actor) return { ok: false, code: 'UNAUTHENTICATED' };

  // ADMIN и EDITOR обходят гейтинг для чтения контента.
  if (isStaff(actor.role)) return ALLOW;

  // Требуемый уровень ресурса.
  const requiredPlan: PlanCode =
    res.kind === 'feature' ? FEATURE_MIN_PLAN[res.feature] : res.minPlan;

  // Частичный бесплатный доступ (эфиры для SELF): открыт активному аккаунту
  // любого тарифа.
  const partiallyFree = res.kind !== 'feature' && res.partialFree === true;

  // Без активного оплаченного Enrollment — 402 (кроме профиля/оплаты,
  // которые не проходят через этот сервис).
  if (!actor.enrollmentActive) return { ok: false, code: 'PAYMENT_REQUIRED' };

  if (partiallyFree) return ALLOW;

  if (!planMeets(actor.plan, requiredPlan)) {
    return { ok: false, code: 'PLAN_REQUIRED', requiredPlan };
  }

  return ALLOW;
}

/** Бросает HttpError 401/402/403, если доступа нет. */
export function assertAccess(actor: Actor | null, res: Resource): asserts actor is Actor {
  const decision = canAccess(actor, res);
  if (!decision.ok) {
    throw new HttpError(decision.code, decision.requiredPlan);
  }
}

/**
 * Поля, которые никогда не должны уходить пользователю без доступа.
 * См. docs/05-api-and-gating.md §2.
 */
const LOCKED_FIELDS = [
  'kinescopeId',
  'demoVideoId',
  'prompt',
  'promptNote',
  'steps',
  'article',
  'transcript',
  'description',
  'kpis',
  'goal',
  'result',
  'repoLinks',
  'timecodes',
  'commands',
  'fileKey',
  'fileUrl',
  'fileName',
] as const;

/**
 * Вырезает закрытые поля и помечает сущность `locked: true`, если решение
 * не `ok`. Возвращает превью (title, summary, tags, timeToMaster, group…).
 */
export function redactLocked<T extends Record<string, unknown>>(
  entity: T,
  decision: Decision,
): T & { locked: boolean; requiredPlan?: PlanCode } {
  if (decision.ok) {
    return { ...entity, locked: false };
  }
  const redacted: Record<string, unknown> = { ...entity };
  for (const field of LOCKED_FIELDS) {
    if (field in redacted) delete redacted[field];
  }
  return {
    ...(redacted as T),
    locked: true,
    ...(decision.code === 'PLAN_REQUIRED' && decision.requiredPlan
      ? { requiredPlan: decision.requiredPlan }
      : {}),
  };
}

export { HttpError } from './errors';
export type { AccessCode } from './errors';
export { planLevel, planMeets, PLAN_LEVEL } from './plans';
export { FEATURE_MIN_PLAN, DEFAULT_MIN_PLAN } from './matrix';
