import { describe, expect, it } from 'vitest';
import {
  buildCuratorUserPrompt,
  assertNoContacts,
  curatorResponseSchema,
  type CuratorContext,
} from '@/server/curator/prompt';

const ctx: CuratorContext = {
  firstName: 'Аюна',
  business: {
    companyName: 'Клиника',
    niche: 'медицина',
    whoAmI: 'владелец',
    product: 'услуги',
    audience: 'локальные клиенты',
    brandVoice: 'дружелюбный',
    goals: 'поток заявок',
    monthlyRevenueBand: '300k-1m',
  },
  weekProgress: [{ title: 'SEO-аудит', status: 'IMPLEMENTED' }],
  routeDone: 5,
  routeTotal: 9,
  moneyThisWeekKopeks: 5000000,
  weeklyReport: 'внедрил аудит',
};

describe('приватность промпта куратора (docs/05 §8)', () => {
  it('в промпт не попадают email/телефон', () => {
    const prompt = buildCuratorUserPrompt(ctx);
    expect(prompt).not.toMatch(/@/); // нет email
    expect(prompt).not.toMatch(/\+?\d[\d\s()-]{9,}/); // нет телефона
    expect(() => assertNoContacts(prompt)).not.toThrow();
    // но бизнес-данные присутствуют
    expect(prompt).toContain('Клиника');
    expect(prompt).toContain('Аюна');
  });

  it('assertNoContacts ловит утечку email/телефона', () => {
    expect(() => assertNoContacts('пиши на mail@example.ru')).toThrow('CONTACT_LEAK_EMAIL');
    expect(() => assertNoContacts('звони +7 999 123-45-67')).toThrow('CONTACT_LEAK_PHONE');
  });
});

describe('схема ответа куратора', () => {
  it('валидна для 1–2 шагов', () => {
    const ok = curatorResponseSchema.safeParse({
      summary: 'внедрён SEO-аудит',
      methodPrinciple: 'воронка',
      nextSteps: [{ title: 'Запусти контент-план', why: 'нужен поток статей' }],
    });
    expect(ok.success).toBe(true);
  });
  it('отвергает пустые/лишние шаги', () => {
    expect(curatorResponseSchema.safeParse({ summary: 'x', nextSteps: [] }).success).toBe(false);
    expect(
      curatorResponseSchema.safeParse({
        summary: 'x',
        nextSteps: [1, 2, 3].map((i) => ({ title: `t${i}`, why: 'w' })),
      }).success,
    ).toBe(false);
  });
});
