import type { PlanCode } from '@prisma/client';

export type AccessCode = 'UNAUTHENTICATED' | 'PAYMENT_REQUIRED' | 'PLAN_REQUIRED';

const STATUS_BY_CODE: Record<AccessCode, number> = {
  UNAUTHENTICATED: 401,
  PAYMENT_REQUIRED: 402,
  PLAN_REQUIRED: 403,
};

/** HTTP-ошибка с кодом доступа, бросается assertAccess. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: AccessCode;
  readonly requiredPlan?: PlanCode;

  constructor(code: AccessCode, requiredPlan?: PlanCode) {
    super(code);
    this.name = 'HttpError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.requiredPlan = requiredPlan;
  }
}
