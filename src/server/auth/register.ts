'use server';

import { headers } from 'next/headers';
import * as argon2 from 'argon2';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { sendMail } from '@/server/mail';
import { rateLimit } from '@/server/rate-limit';
import {
  registerSchema,
  forgotSchema,
  resetSchema,
  CONSENT_VERSION,
} from '@/lib/schemas';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { issueToken, consumeToken } from './tokens';

async function clientKey(salt: string): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return `${salt}:${ip}`;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  // Чекбоксы приходят строкой 'on' → приводим к boolean.
  raw.consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
  raw.offer = formData.get('offer') === 'on' || formData.get('offer') === 'true';

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const data = parsed.data;

  if (!rateLimit(await clientKey(`register:${data.email}`), 5, 60_000)) {
    return { ok: false, message: 'Слишком много попыток. Попробуйте через минуту.' };
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Не раскрываем существование email отдельным текстом.
    return {
      ok: true,
      message: 'Если email свободен, мы отправили письмо для подтверждения.',
    };
  }

  const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      phone: data.phone || null,
      passwordHash,
      role: 'STUDENT',
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
    },
  });

  const token = await issueToken(user.id, 'EMAIL_VERIFY');
  const url = `${env.APP_URL}/api/auth/verify-email?token=${token}`;
  await sendMail({
    to: email,
    subject: 'Подтвердите email',
    text: `Подтвердите адрес, перейдя по ссылке (действует 24 часа):\n${url}`,
  });

  return {
    ok: true,
    message: 'Мы отправили письмо для подтверждения email.',
    // В dev показываем ссылку прямо в UI (SMTP не настроен).
    ...(env.NODE_ENV !== 'production' ? { meta: { verifyUrl: url } } : {}),
  };
}

export async function forgotAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const email = parsed.data.email.toLowerCase();

  if (!rateLimit(await clientKey(`forgot:${email}`), 5, 60_000)) {
    return { ok: false, message: 'Слишком много попыток. Попробуйте позже.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Одинаковый ответ для существующих и несуществующих email.
  const generic: ActionState = {
    ok: true,
    message: 'Если такой email есть, мы отправили ссылку для восстановления.',
  };
  if (!user || user.deletedAt) return generic;

  const token = await issueToken(user.id, 'PASSWORD_RESET');
  const url = `${env.APP_URL}/reset/${token}`;
  await sendMail({
    to: email,
    subject: 'Восстановление пароля',
    text: `Сбросьте пароль по ссылке (действует 1 час):\n${url}`,
  });
  return env.NODE_ENV !== 'production' ? { ...generic, meta: { resetUrl: url } } : generic;
}

export async function resetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const userId = await consumeToken(parsed.data.token, 'PASSWORD_RESET');
  if (!userId) {
    return { ok: false, message: 'Ссылка недействительна или истекла.' };
  }
  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true, message: 'Пароль обновлён. Теперь можно войти.' };
}
