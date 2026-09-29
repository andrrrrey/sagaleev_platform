'use server';

import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { businessProfileSchema } from '@/lib/schemas';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { upsertBusinessProfile } from './service';

/** Сохранить/обновить бизнес-профиль (онбординг и вкладка профиля). */
export async function saveBusinessProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const parsed = businessProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Не удалось завершить онбординг. Проверьте поле с ошибкой.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }
  await upsertBusinessProfile(actor.id, parsed.data);

  const redirectTo = (formData.get('redirectTo') as string) || null;
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: 'Бизнес-профиль сохранён.' };
}
