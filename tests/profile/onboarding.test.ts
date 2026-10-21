import { describe, expect, it } from 'vitest';
import { businessProfileSchema } from '@/lib/schemas';

const validProfile = {
  phone: '+7 999 123-45-67',
  telegramUsername: '@student_name',
  companyName: 'Компания',
  niche: 'Маркетинг',
  whoAmI: 'Собственник',
  product: 'Услуги',
  audience: 'Малый бизнес',
  goals: '',
  monthlyRevenueBand: '',
  websiteUrl: '',
};

describe('контакты в онбординге', () => {
  it('принимает анкету без поля «Голос бренда»', () => {
    expect(businessProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('требует телефон и Telegram', () => {
    const withoutPhone = businessProfileSchema.safeParse({ ...validProfile, phone: '' });
    const withoutTelegram = businessProfileSchema.safeParse({
      ...validProfile,
      telegramUsername: '',
    });
    expect(withoutPhone.success).toBe(false);
    expect(withoutTelegram.success).toBe(false);
  });

  it('отклоняет текст вместо телефона и некорректное имя Telegram', () => {
    expect(businessProfileSchema.safeParse({ ...validProfile, phone: 'телефон' }).success).toBe(
      false,
    );
    expect(
      businessProfileSchema.safeParse({ ...validProfile, telegramUsername: '@a' }).success,
    ).toBe(false);
  });
});
