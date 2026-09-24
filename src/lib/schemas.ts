import { z } from 'zod';

export const CONSENT_VERSION = '2026-09-19';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Укажите имя'),
    email: z.string().email('Некорректный email'),
    phone: z.string().optional(),
    password: z.string().min(10, 'Минимум 10 символов'),
    consent: z.literal(true, { errorMap: () => ({ message: 'Требуется согласие' }) }),
    offer: z.literal(true, { errorMap: () => ({ message: 'Требуется принятие оферты' }) }),
    invite: z.string().optional(),
  })
  .strip();

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const forgotSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(10, 'Минимум 10 символов'),
});

export const businessProfileSchema = z.object({
  companyName: z.string().min(1, 'Укажите компанию'),
  niche: z.string().min(1, 'Укажите нишу'),
  whoAmI: z.string().min(1, 'Расскажите о себе'),
  product: z.string().min(1, 'Опишите продукт'),
  audience: z.string().min(1, 'Опишите клиента'),
  brandVoice: z.string().min(1, 'Опишите голос бренда'),
  goals: z.string().optional(),
  monthlyRevenueBand: z.string().optional(),
  websiteUrl: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
});

export const accountSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(100, 'Слишком длинное имя'),
  email: z.string().trim().email('Некорректный email').transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30, 'Слишком длинный номер').optional(),
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
