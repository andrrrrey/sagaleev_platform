import { describe, expect, it } from 'vitest';
import { computeEntryStats } from '@/server/progress/leaderboard';

describe('расчёт строки лидерборда (шкала 1/2/5/10)', () => {
  it('очки по максимальному статусу и корректные счётчики', () => {
    const stats = computeEntryStats(['VIEWED', 'SUBMITTED', 'IMPLEMENTED', 'RESULT', 'RESULT', 'NONE']);
    // очки: 1 + 2 + 5 + 10 + 10 + 0 = 28
    expect(stats.points).toBe(28);
    expect(stats.viewedCount).toBe(1);
    expect(stats.submittedCount).toBe(1);
    expect(stats.implementedCount).toBe(1);
    expect(stats.resultCount).toBe(2);
  });

  it('IMPLEMENTED даёт 5, а не 1+2+5', () => {
    expect(computeEntryStats(['IMPLEMENTED']).points).toBe(5);
  });

  it('пусто → нули', () => {
    const s = computeEntryStats([]);
    expect(s.points).toBe(0);
    expect(s.resultCount).toBe(0);
  });
});
