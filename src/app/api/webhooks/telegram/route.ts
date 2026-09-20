import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { consumeToken } from '@/server/auth/tokens';
import { sendTelegramMessage } from '@/server/telegram/service';

/**
 * Webhook бота: обрабатывает `/start <token>` для привязки аккаунта.
 * Проверка секрета через заголовок X-Telegram-Bot-Api-Secret-Token.
 */
export async function POST(req: Request) {
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
    }
  }

  const update = (await req.json().catch(() => null)) as {
    message?: { chat?: { id?: number }; from?: { username?: string }; text?: string };
  } | null;
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text ?? '';

  if (chatId && text.startsWith('/start')) {
    const token = text.split(/\s+/)[1];
    if (token) {
      const userId = await consumeToken(token, 'TELEGRAM_LINK');
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { telegramChatId: String(chatId), telegramUsername: msg?.from?.username ?? null },
        });
        await sendTelegramMessage(String(chatId), 'Аккаунт привязан. Будем присылать уведомления сюда.');
        return NextResponse.json({ ok: true });
      }
    }
    await sendTelegramMessage(String(chatId), 'Ссылка привязки недействительна. Сгенерируйте новую в профиле.');
  }

  return NextResponse.json({ ok: true });
}
