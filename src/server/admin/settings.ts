'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { recomputeAllLeaderboard } from '@/server/progress/leaderboard';
import { SETTING_DEFS, saveSettings } from '@/server/settings/store';
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

/**
 * Сохранение интеграций / API-ключей (только ADMIN). Значения не пишутся в
 * аудит — фиксируем лишь список изменённых ключей. Пустой секрет = «не менять»,
 * пустое обычное поле = вернуть к значению из окружения (см. store.saveSettings).
 */
export async function saveIntegrationSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor || actor.role !== 'ADMIN') redirect('/');

  const entries: Record<string, string> = {};
  for (const def of SETTING_DEFS) {
    if (def.kind === 'boolean') {
      const v = formData.get(def.key);
      entries[def.key] = v === 'on' || v === 'true' ? 'true' : 'false';
      continue;
    }
    const clear = formData.get(`clear_${def.key}`);
    if (clear === 'on' || clear === 'true') {
      entries[def.key] = '__CLEAR__';
      continue;
    }
    const v = formData.get(def.key);
    if (typeof v === 'string') entries[def.key] = v;
  }

  const changed = await saveSettings(entries, actor.id);
  await audit(actor.id, 'UPDATE', 'AppSetting', undefined, { keys: changed });
  revalidatePath('/admin/settings');
  revalidatePath('/admin/curator');
  return { ok: true, message: `Сохранено. Обновлено ключей: ${changed.length}.` };
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
