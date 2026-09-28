'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { assertAccess } from '@/server/access';
import { prisma } from '@/server/db';
import { type ActionState } from '@/lib/action-state';
import { weekStartOf, runCuratorForUser } from './service';

/** «Что сделал за неделю» (WeeklyReport). SUPPORT+. */
export async function saveWeeklyReport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  assertAccess(actor, { kind: 'feature', feature: 'CURATOR' });

  const text = (formData.get('text') as string | null)?.trim() || null;
  const weekStart = weekStartOf();
  await prisma.weeklyReport.upsert({
    where: { userId_weekStart: { userId: actor.id, weekStart } },
    create: { userId: actor.id, weekStart, text },
    update: { text },
  });
  revalidatePath('/profile/curator');
  return { ok: true, message: 'Сохранено' };
}

/** Ручной запуск разбора для студента (A10, ADMIN). */
export async function runCuratorManual(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor || actor.role !== 'ADMIN') redirect('/');
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { ok: false, message: 'Выберите студента.' };

  const result = await runCuratorForUser(userId);
  revalidatePath('/admin/curator');
  revalidatePath('/profile/curator');

  if (result === 'OK') {
    return { ok: true, message: 'Разбор готов. Текст появился ниже в журнале запусков.' };
  }
  if (result === 'SKIPPED') {
    return {
      ok: false,
      message:
        'Разбор не создан. Проверьте активную подписку студента, заполненный бизнес-профиль, включённого куратора и API-ключ.',
    };
  }
  return {
    ok: false,
    message:
      'Модель не смогла сформировать корректный разбор. Попробуйте ещё раз или проверьте ключ и модель RouterAI.',
  };
}
