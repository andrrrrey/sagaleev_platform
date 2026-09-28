import { NextResponse } from 'next/server';
import { getSetting } from '@/server/settings/store';
import { processTelegramUpdate, type TelegramUpdate } from '@/server/telegram/updates';

/**
 * Webhook бота: обрабатывает `/start <token>` для привязки аккаунта.
 * Проверка секрета через заголовок X-Telegram-Bot-Api-Secret-Token.
 */
export async function POST(req: Request) {
  const webhookSecret = await getSetting('TELEGRAM_WEBHOOK_SECRET');
  if (webhookSecret) {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== webhookSecret) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
    }
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  await processTelegramUpdate(update);

  return NextResponse.json({ ok: true });
}
