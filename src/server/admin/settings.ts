'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { recomputeAllLeaderboard } from '@/server/progress/leaderboard';
import { type ActionState } from '@/lib/action-state';
import { audit } from './audit';

/** Системный промпт куратора хранится как LegalDocument(kind=CURATOR_SYSTEM). */
export async function saveCuratorPrompt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getActor();
  if (!actor || actor.role !== 'ADMIN') redirect('/');
  const body = (formData.get('prompt') as string | null)?.trim();
  if (!body) return { ok: false, message: 'Промпт не может быть пустым.' };

  const version = new Date().toISOString();
  await prisma.legalDocument.create({ data: { kind: 'CURATOR_SYSTEM', version, bodyHtml: body } });
  await audit(actor.id, 'UPDATE', 'CuratorSystemPrompt', undefined, { version });
  revalidatePath('/admin/settings');
  return { ok: true, message: 'Системный промпт куратора обновлён.' };
}

/** Ручной полный пересчёт лидерборда (страховка). */
export async function rebuildLeaderboard(): Promise<void> {
  const actor = await getActor();
  if (!actor || actor.role !== 'ADMIN') redirect('/');
  await recomputeAllLeaderboard();
  await audit(actor.id, 'REBUILD', 'Leaderboard');
  revalidatePath('/admin/settings');
  revalidatePath('/leaderboard');
}
