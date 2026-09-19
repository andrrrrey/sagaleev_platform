'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { type ActionState } from '@/lib/action-state';
import { setStepProgress } from './service';

/** Сохранить прогресс шага маршрута (отметка «сделал» + артефакт). */
export async function saveStepProgress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const stepId = String(formData.get('stepId') ?? '');
  const dayNumber = Number(formData.get('dayNumber') ?? 0);
  const done = formData.get('done') === 'on' || formData.get('done') === 'true';
  const artifactNote = (formData.get('artifactNote') as string | null)?.trim() || null;
  const artifactUrl = (formData.get('artifactUrl') as string | null)?.trim() || null;

  if (!stepId) return { ok: false, message: 'Некорректный шаг.' };

  try {
    await setStepProgress(actor, stepId, { done, artifactNote, artifactUrl });
  } catch (e) {
    const code = e instanceof Error ? e.message : 'ERROR';
    if (code === 'ARTIFACT_REQUIRED') {
      return { ok: false, fieldErrors: { artifactNote: 'Зафиксируйте артефакт, чтобы отметить шаг' } };
    }
    return { ok: false, message: 'Не удалось сохранить прогресс.' };
  }

  revalidatePath(`/route/${dayNumber}`);
  revalidatePath('/route');
  return { ok: true, message: done ? 'Шаг отмечен' : 'Отметка снята' };
}
