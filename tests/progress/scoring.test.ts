import { describe, expect, it } from 'vitest';
import { pointsFor, totalPoints, canTransition } from '@/server/progress/scoring';

describe('очки по максимальному статусу', () => {
  it('IMPLEMENTED даёт 5, а не 8', () => {
    expect(pointsFor('IMPLEMENTED')).toBe(5);
  });

  it('шкала 1/2/5/10', () => {
    expect(pointsFor('VIEWED')).toBe(1);
    expect(pointsFor('SUBMITTED')).toBe(2);
    expect(pointsFor('IMPLEMENTED')).toBe(5);
    expect(pointsFor('RESULT')).toBe(10);
    expect(pointsFor('NONE')).toBe(0);
  });

  it('сумма по всем юнитам', () => {
    expect(totalPoints(['VIEWED', 'IMPLEMENTED', 'RESULT'])).toBe(1 + 5 + 10);
  });
});

describe('переходы статуса', () => {
  it('вперёд и прыжком разрешены', () => {
    expect(canTransition('NONE', 'VIEWED')).toBe(true);
    expect(canTransition('VIEWED', 'IMPLEMENTED')).toBe(true); // прыжок
  });
  it('назад запрещён для студента, разрешён админу', () => {
    expect(canTransition('IMPLEMENTED', 'VIEWED')).toBe(false);
    expect(canTransition('IMPLEMENTED', 'VIEWED', { isAdmin: true })).toBe(true);
  });
});
