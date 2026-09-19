'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { prisma } from '@/server/db';
import { rateLimit } from '@/server/rate-limit';
import { loginSchema } from '@/lib/schemas';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { signIn } from './config';

/** Куда вести после входа (docs/04 P1). */
async function postLoginPath(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, businessProfile: { select: { id: true } } },
  });
  if (!user) return '/';
  if (user.role === 'ADMIN' || user.role === 'EDITOR') return '/admin';

  const activeEnrollment = await prisma.enrollment.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!activeEnrollment) return '/pay';
  if (!user.businessProfile) return '/onboarding';
  return '/';
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const email = parsed.data.email.toLowerCase();

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!rateLimit(`login:${ip}:${email}`, 5, 60_000)) {
    return { ok: false, message: 'Слишком много попыток входа. Подождите минуту.' };
  }

  try {
    await signIn('credentials', { email, password: parsed.data.password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      // Единый текст без раскрытия существования email/статуса верификации.
      return { ok: false, message: 'Неверный email или пароль (или email не подтверждён).' };
    }
    throw e;
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  redirect(user ? await postLoginPath(user.id) : '/');
}
