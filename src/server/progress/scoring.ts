import type { ProgressStatus } from '@prisma/client';

/**
 * Очки лидерборда: посмотрел=1, сдал=2, внедрил=5, результат=10.
 * Каждый юнит/скилл считается ПО МАКСИМАЛЬНОМУ статусу (не суммируем).
 * См. docs/03-data-model.md §2.
 */
export const STATUS_POINTS: Record<ProgressStatus, number> = {
  NONE: 0,
  VIEWED: 1,
  SUBMITTED: 2,
  IMPLEMENTED: 5,
  RESULT: 10,
};

const STATUS_ORDER: ProgressStatus[] = ['NONE', 'VIEWED', 'SUBMITTED', 'IMPLEMENTED', 'RESULT'];

export function statusRank(status: ProgressStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/** Разрешён ли переход статуса (вперёд/прыжком; назад — только админ). */
export function canTransition(
  from: ProgressStatus,
  to: ProgressStatus,
  opts: { isAdmin?: boolean } = {},
): boolean {
  if (opts.isAdmin) return true;
  return statusRank(to) > statusRank(from);
}

/** Очки за один юнит/скилл = вес его статуса. */
export function pointsFor(status: ProgressStatus): number {
  return STATUS_POINTS[status];
}

/** Сумма очков по всем Progress пользователя. */
export function totalPoints(statuses: ProgressStatus[]): number {
  return statuses.reduce((sum, s) => sum + STATUS_POINTS[s], 0);
}
