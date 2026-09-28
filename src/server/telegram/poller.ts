import { env } from '@/lib/env';
import { getSettingFresh } from '@/server/settings/store';
import { processTelegramUpdate, type TelegramUpdate } from '@/server/telegram/updates';

const API = env.TELEGRAM_API_BASE_URL.replace(/\/$/, '');
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type UpdatesResponse = {
  ok?: boolean;
  description?: string;
  result?: TelegramUpdate[];
};

async function telegramCall(token: string, method: string, body: object): Promise<UpdatesResponse> {
  const response = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(35_000),
  });
  return (await response.json()) as UpdatesResponse;
}

/**
 * Получает сообщения исходящими запросами. Нужен на серверах, до которых
 * Telegram не может доставить webhook из-за сетевой маршрутизации провайдера.
 */
export async function startTelegramPolling(): Promise<void> {
  if (env.TELEGRAM_UPDATE_MODE !== 'polling') return;

  let offset: number | undefined;
  console.log('[telegram.polling] запуск');

  for (;;) {
    try {
      const token = await getSettingFresh('TELEGRAM_BOT_TOKEN');
      if (!token) {
        console.warn('[telegram.polling] токен не задан; следующая проверка через 60 секунд');
        await delay(60_000);
        continue;
      }

      // getUpdates несовместим с webhook. Повторный вызов безопасен и сохраняет очередь.
      await telegramCall(token, 'deleteWebhook', { drop_pending_updates: false });

      while (true) {
        const response = await telegramCall(token, 'getUpdates', {
          offset,
          timeout: 25,
          allowed_updates: ['message'],
        });
        if (!response.ok) throw new Error(response.description || 'Telegram getUpdates error');

        for (const update of response.result ?? []) {
          try {
            await processTelegramUpdate(update);
          } catch (error) {
            console.error('[telegram.polling] ошибка обработки обновления', error);
          } finally {
            if (typeof update.update_id === 'number') offset = update.update_id + 1;
          }
        }
      }
    } catch (error) {
      console.error('[telegram.polling]', error);
      await delay(3_000);
    }
  }
}
