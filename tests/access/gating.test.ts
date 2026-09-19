import { describe, expect, it } from 'vitest';
import {
  canAccess,
  assertAccess,
  redactLocked,
  HttpError,
  type Actor,
  type Resource,
} from '@/server/access';
import {
  canReadPayments,
  canReadStudentPII,
  canEditContent,
} from '@/server/access/staff';

const selfActor: Actor = { id: 'u1', role: 'STUDENT', plan: 'SELF', enrollmentActive: true };
const supportActor: Actor = { id: 'u2', role: 'STUDENT', plan: 'SUPPORT', enrollmentActive: true };
const noEnrollActor: Actor = { id: 'u3', role: 'STUDENT', plan: null, enrollmentActive: false };
const editorActor: Actor = { id: 'e1', role: 'EDITOR', enrollmentActive: false };
const adminActor: Actor = { id: 'a1', role: 'ADMIN', enrollmentActive: false };

const supportSkill: Resource = { kind: 'skill', minPlan: 'SUPPORT' };
const selfSkill: Resource = { kind: 'skill', minPlan: 'SELF' };

const lockedSkillEntity = {
  slug: 'seo-audit',
  title: 'SEO-аудит',
  summary: 'Что делает',
  timeToMaster: '30 минут',
  group: 'TRAFFIC',
  prompt: 'СЕКРЕТНЫЙ ПРОМПТ',
  fileKey: 's3/secret.md',
  fileName: 'secret.md',
  demoVideoId: 'kine123',
};

describe('05 §2.1 — SELF запрашивает SUPPORT-скилл', () => {
  it('решение PLAN_REQUIRED с requiredPlan=SUPPORT', () => {
    const d = canAccess(selfActor, supportSkill);
    expect(d).toEqual({ ok: false, code: 'PLAN_REQUIRED', requiredPlan: 'SUPPORT' });
  });

  it('в превью нет prompt/fileKey, locked=true', () => {
    const d = canAccess(selfActor, supportSkill);
    const preview = redactLocked(lockedSkillEntity, d);
    expect(preview.locked).toBe(true);
    expect(preview.requiredPlan).toBe('SUPPORT');
    expect(preview).not.toHaveProperty('prompt');
    expect(preview).not.toHaveProperty('fileKey');
    expect(preview).not.toHaveProperty('fileName');
    expect(preview).not.toHaveProperty('demoVideoId');
    // Превью-поля сохраняются
    expect(preview.title).toBe('SEO-аудит');
    expect(preview.summary).toBe('Что делает');
    expect(preview.timeToMaster).toBe('30 минут');
  });
});

describe('05 §2.2 — SELF запрашивает файл SUPPORT-скилла напрямую', () => {
  it('assertAccess бросает 403', () => {
    try {
      assertAccess(selfActor, supportSkill);
      expect.unreachable('должно было бросить');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      const err = e as HttpError;
      expect(err.status).toBe(403);
      expect(err.code).toBe('PLAN_REQUIRED');
      expect(err.requiredPlan).toBe('SUPPORT');
    }
  });
});

describe('05 §2.3 — пользователь без Enrollment', () => {
  it('402 на любой контент', () => {
    expect(canAccess(noEnrollActor, selfSkill)).toEqual({ ok: false, code: 'PAYMENT_REQUIRED' });
    expect(canAccess(noEnrollActor, supportSkill)).toEqual({
      ok: false,
      code: 'PAYMENT_REQUIRED',
    });
    expect(() => assertAccess(noEnrollActor, selfSkill)).toThrow(HttpError);
  });

  it('нет сессии → 401', () => {
    expect(canAccess(null, selfSkill)).toEqual({ ok: false, code: 'UNAUTHENTICATED' });
  });
});

describe('05 §2.4 — апгрейд до SUPPORT открывает доступ', () => {
  it('SUPPORT-актор получает доступ к SUPPORT-скиллу', () => {
    expect(canAccess(selfActor, supportSkill).ok).toBe(false);
    // после webhook actor.plan становится SUPPORT
    expect(canAccess(supportActor, supportSkill)).toEqual({ ok: true });
    const full = redactLocked(lockedSkillEntity, canAccess(supportActor, supportSkill));
    expect(full.locked).toBe(false);
    expect(full.prompt).toBe('СЕКРЕТНЫЙ ПРОМПТ');
  });
});

describe('партиальный доступ (эфиры для SELF)', () => {
  it('partialFree открывает STREAM для SELF', () => {
    const stream: Resource = { kind: 'unit', minPlan: 'SUPPORT', partialFree: true };
    expect(canAccess(selfActor, stream)).toEqual({ ok: true });
  });
  it('без partialFree STREAM закрыт для SELF', () => {
    const stream: Resource = { kind: 'unit', minPlan: 'SUPPORT' };
    expect(canAccess(selfActor, stream).ok).toBe(false);
  });
});

describe('фичи CURATOR/ZOOM', () => {
  it('SELF не имеет доступа к куратору', () => {
    expect(canAccess(selfActor, { kind: 'feature', feature: 'CURATOR' }).ok).toBe(false);
  });
  it('SUPPORT имеет доступ к куратору и Zoom', () => {
    expect(canAccess(supportActor, { kind: 'feature', feature: 'CURATOR' })).toEqual({ ok: true });
    expect(canAccess(supportActor, { kind: 'feature', feature: 'ZOOM' })).toEqual({ ok: true });
  });
});

describe('сотрудники обходят гейтинг контента', () => {
  it('ADMIN и EDITOR читают закрытый скилл', () => {
    expect(canAccess(adminActor, supportSkill)).toEqual({ ok: true });
    expect(canAccess(editorActor, supportSkill)).toEqual({ ok: true });
  });
});

describe('05 §2.6 — EDITOR не видит оплат и ПДн', () => {
  it('EDITOR: нет доступа к оплатам и ПДн, есть к контенту', () => {
    expect(canReadPayments('EDITOR')).toBe(false);
    expect(canReadStudentPII('EDITOR')).toBe(false);
    expect(canEditContent('EDITOR')).toBe(true);
  });
  it('ADMIN: полный доступ', () => {
    expect(canReadPayments('ADMIN')).toBe(true);
    expect(canReadStudentPII('ADMIN')).toBe(true);
    expect(canEditContent('ADMIN')).toBe(true);
  });
});
