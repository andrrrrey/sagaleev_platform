import { describe, expect, it } from 'vitest';
import { maskSecret } from '@/server/settings/mask';

describe('maskSecret — секреты не утекают в UI', () => {
  it('показывает только последние 4 символа', () => {
    expect(maskSecret('sk-ant-1234567890')).toBe('••••7890');
  });

  it('короткие значения полностью маскируются', () => {
    expect(maskSecret('abcd')).toBe('••••');
    expect(maskSecret('ab')).toBe('••••');
  });

  it('пустое значение остаётся пустым', () => {
    expect(maskSecret('')).toBe('');
    expect(maskSecret('   ')).toBe('');
  });
});
