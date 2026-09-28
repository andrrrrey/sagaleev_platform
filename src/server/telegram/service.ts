import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { getSetting, getSettingFresh } from '@/server/settings/store';

const API = env.TELEGRAM_API_BASE_URL.replace(/\/$/, '');
const TELEGRAM_REQUEST_TIMEOUT_MS = 8_000;

export type TelegramWebhookResult =
  { registered: true; url: string } | { registered: false; reason: string };

/** Регистрирует production webhook у Telegram по текущим настройкам админки. */
export async function registerTelegramWebhook(): Promise<TelegramWebhookResult> {
  const [token, secret] = await Promise.all([
    getSettingFresh('TELEGRAM_BOT_TOKEN'),
    getSettingFresh('TELEGRAM_WEBHOOK_SECRET'),
  ]);
  if (!token) return { registered: false, reason: 'не задан токен Telegram-бота' };
  if (!secret) return { registered: false, reason: 'не задан секрет webhook' };

  const url = new URL('/api/webhooks/telegram', env.APP_URL).toString();
  const response = await fetch(`${API}/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message'],
      drop_pending_updates: false,
    }),
    signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
  });
  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
  } | null;
  if (!response.ok || !result?.ok) {
    throw new Error(result?.description || `Telegram API: HTTP ${response.status}`);
  }
  return { registered: true, url };
}

/**
 * Отправка сообщения студенту через Bot API. При блокировке бота (403)
 * очищаем telegramChatId (docs/05 §7). Возвращает успех.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = await getSetting('TELEGRAM_BOT_TOKEN');
  if (!token) return false;
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
    });
    if (res.status === 403) {
      await prisma.user.updateMany({
        where: { telegramChatId: chatId },
        data: { telegramChatId: null },
      });
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

/** Отправить уведомление студенту в Telegram по его настройкам. */
export async function notifyTelegram(userId: string, text: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true, notifyTelegram: true },
  });
  if (!user?.telegramChatId || !user.notifyTelegram) return;
  await sendTelegramMessage(user.telegramChatId, text);
}

/** Deeplink привязки: t.me/<bot>?start=<token>. */
export async function telegramStartLink(token: string): Promise<string | null> {
  const username = await getSetting('TELEGRAM_BOT_USERNAME');
  if (!username) return null;
  return `https://t.me/${username}?start=${token}`;
}
