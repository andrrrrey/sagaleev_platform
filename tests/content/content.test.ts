import { describe, expect, it } from 'vitest';
import {
  isPublishedForStudent,
  viewedFromPercent,
  VIEWED_THRESHOLD,
} from '@/server/content/service';
import { redactLocked, canAccess, type Actor } from '@/server/access';
import { sanitizeRichHtml } from '@/lib/rich';

describe('видео → VIEWED при ≥ 80%', () => {
  it('порог 80', () => {
    expect(VIEWED_THRESHOLD).toBe(80);
    expect(viewedFromPercent(79.9)).toBe(false);
    expect(viewedFromPercent(80)).toBe(true);
    expect(viewedFromPercent(100)).toBe(true);
  });
});

describe('видимость уроков скрытого курса', () => {
  it('скрывает опубликованный урок чернового или архивного курса', () => {
    expect(
      isPublishedForStudent({
        state: 'PUBLISHED',
        type: 'LESSON',
        coursePlacements: [{ courseState: 'DRAFT', moduleVisible: true, placementVisible: true }],
      }),
    ).toBe(false);
    expect(
      isPublishedForStudent({
        state: 'PUBLISHED',
        type: 'LESSON',
        coursePlacements: [
          { courseState: 'ARCHIVED', moduleVisible: true, placementVisible: true },
        ],
      }),
    ).toBe(false);
  });

  it('показывает урок опубликованного курса', () => {
    expect(
      isPublishedForStudent({
        state: 'PUBLISHED',
        type: 'LESSON',
        coursePlacements: [
          { courseState: 'PUBLISHED', moduleVisible: true, placementVisible: true },
        ],
      }),
    ).toBe(true);
  });

  it('скрывает урок внутри скрытого модуля и отдельно скрытый урок', () => {
    expect(
      isPublishedForStudent({
        state: 'PUBLISHED',
        type: 'LESSON',
        coursePlacements: [
          { courseState: 'PUBLISHED', moduleVisible: false, placementVisible: true },
        ],
      }),
    ).toBe(false);
    expect(
      isPublishedForStudent({
        state: 'PUBLISHED',
        type: 'LESSON',
        coursePlacements: [
          { courseState: 'PUBLISHED', moduleVisible: true, placementVisible: false },
        ],
      }),
    ).toBe(false);
  });

  it('не затрагивает опубликованные уроки вне курсов', () => {
    expect(
      isPublishedForStudent({ state: 'PUBLISHED', type: 'LESSON', coursePlacements: [] }),
    ).toBe(true);
  });

  it('собственный статус материала остаётся обязательным', () => {
    expect(
      isPublishedForStudent({
        state: 'DRAFT',
        type: 'LESSON',
        coursePlacements: [
          { courseState: 'PUBLISHED', moduleVisible: true, placementVisible: true },
        ],
      }),
    ).toBe(false);
  });
});

describe('безопасный текстовый редактор', () => {
  it('оставляет оформление и удаляет исполняемый HTML', () => {
    const html = sanitizeRichHtml(
      '<h2 onclick="alert(1)">Заголовок</h2><script>alert(1)</script><a href="javascript:alert(1)">ссылка</a><ul><li>пункт</li></ul>',
    );
    expect(html).toBe('<h2>Заголовок</h2><a>ссылка</a><ul><li>пункт</li></ul>');
  });

  it('нормализует безопасную ссылку', () => {
    expect(sanitizeRichHtml('<a href="https://example.ru" onclick="x()">Сайт</a>')).toBe(
      '<a href="https://example.ru" target="_blank" rel="noopener noreferrer">Сайт</a>',
    );
  });
});

describe('редакция закрытого юнита', () => {
  const self: Actor = { id: 'u1', role: 'STUDENT', plan: 'SELF', enrollmentActive: true };
  const closedUnit = {
    slug: 'seo',
    title: 'SEO-движок',
    summary: 'Обзор',
    timeToMaster: '1 час',
    kinescopeId: 'kine1',
    prompt: 'СЕКРЕТ',
    timecodes: [{ t: 1, label: 'x' }],
    kpis: [{ label: 'a', value: 'b' }],
    goal: 'цель',
    result: 'результат',
    steps: [{ title: 's' }],
    article: { html: '<p>a</p>' },
    transcript: 'текст',
  };

  it('SUPPORT-эфир закрыт для SELF без partialFree', () => {
    const d = canAccess(self, { kind: 'unit', minPlan: 'SUPPORT' });
    expect(d.ok).toBe(false);
    const preview = redactLocked(closedUnit, d);
    expect(preview.locked).toBe(true);
    for (const f of [
      'kinescopeId',
      'prompt',
      'timecodes',
      'kpis',
      'goal',
      'result',
      'steps',
      'article',
      'transcript',
    ]) {
      expect(preview).not.toHaveProperty(f);
    }
    // Превью-поля сохранены
    expect(preview.title).toBe('SEO-движок');
    expect(preview.summary).toBe('Обзор');
    expect(preview.timeToMaster).toBe('1 час');
  });

  it('partialFree открывает эфир для SELF', () => {
    const d = canAccess(self, { kind: 'unit', minPlan: 'SUPPORT', partialFree: true });
    expect(d).toEqual({ ok: true });
  });
});
