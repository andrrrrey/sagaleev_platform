import { prisma } from '@/server/db';
import { env } from '@/lib/env';

const API = 'https://api.telegram.org';

/**
 * Отправка сообщения студенту через Bot API. При блокировке бота (403)
 * очищаем telegramChatId (docs/05 §7). Возвращает успех.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const res = await fetch(`${API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (res.status === 403) {
      await prisma.user.updateMany({ where: { telegramChatId: chatId }, data: { telegramChatId: null } });
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
export function telegramStartLink(token: string): string | null {
  if (!env.TELEGRAM_BOT_USERNAME) return null;
  return `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}`;
}
