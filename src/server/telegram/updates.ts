import { prisma } from '@/server/db';
import { consumeToken } from '@/server/auth/tokens';
import { sendTelegramMessage } from '@/server/telegram/service';

export type TelegramUpdate = {
  update_id?: number;
  message?: { chat?: { id?: number }; from?: { username?: string }; text?: string };
};

/** Общая обработка обновлений: используется и webhook, и резервным polling-режимом. */
export async function processTelegramUpdate(update: TelegramUpdate | null): Promise<void> {
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text ?? '';

  if (!chatId || !text.startsWith('/start')) return;

  const token = text.split(/\s+/)[1];
  if (token) {
    const userId = await consumeToken(token, 'TELEGRAM_LINK');
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { telegramChatId: String(chatId), telegramUsername: msg?.from?.username ?? null },
      });
      await sendTelegramMessage(
        String(chatId),
        'Аккаунт привязан. Будем присылать уведомления сюда.',
      );
      return;
    }
    await sendTelegramMessage(
      String(chatId),
      'Ссылка привязки недействительна или уже использована. Откройте на платформе «Профиль → Уведомления → Подключить Telegram» и нажмите новую кнопку привязки.',
    );
    return;
  }

  await sendTelegramMessage(
    String(chatId),
    'Здравствуйте! Я бот-куратор платформы. Чтобы подключить уведомления, откройте на платформе «Профиль → Уведомления» и нажмите «Подключить Telegram». Обычная команда /start без ссылки аккаунт не привязывает.',
  );
}
