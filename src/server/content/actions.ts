'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ProgressStatus } from '@prisma/client';
import { getActor } from '@/server/auth/session';
import { type ActionState } from '@/lib/action-state';
import { setContentProgress } from './service';

const ALLOWED: ProgressStatus[] = ['SUBMITTED', 'IMPLEMENTED', 'RESULT'];

export async function updateContentStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const slug = String(formData.get('slug') ?? '');
  const status = String(formData.get('status') ?? '') as ProgressStatus;
  const proofNote = (formData.get('proofNote') as string | null)?.trim() || null;
  if (!slug || !ALLOWED.includes(status)) return { ok: false, message: 'Некорректный статус.' };

  try {
    await setContentProgress(actor, slug, status, proofNote);
  } catch (e) {
    const code = e instanceof Error ? e.message : 'ERROR';
    if (code === 'PROOF_REQUIRED') return { ok: false, fieldErrors: { proofNote: 'Опишите, что сделали' } };
    if (code === 'MONEY_REQUIRED')
      return { ok: false, message: 'Для статуса «Результат» добавьте хотя бы одну запись «Движение по деньгам».' };
    if (code === 'BAD_TRANSITION') return { ok: false, message: 'Нельзя понизить статус.' };
    return { ok: false, message: 'Не удалось обновить статус.' };
  }

  revalidatePath(`/lessons/${slug}`);
  revalidatePath(`/usecases/${slug}`);
  revalidatePath(`/streams/${slug}`);
  return { ok: true, message: 'Статус обновлён' };
}
