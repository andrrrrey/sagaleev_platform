import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { issueToken } from '@/server/auth/tokens';
import { telegramStartLink } from '@/server/telegram/service';
import { prisma } from '@/server/db';
import { HttpError } from '@/server/access/errors';
import { errorResponse } from '@/server/http';

/** Сгенерировать одноразовый токен привязки Telegram (TTL 15 мин). */
export async function POST() {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  const token = await issueToken(actor.id, 'TELEGRAM_LINK');
  return NextResponse.json({ token, link: telegramStartLink(token) });
}

/** Отвязать Telegram. */
export async function DELETE() {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  await prisma.user.update({
    where: { id: actor.id },
    data: { telegramChatId: null, telegramUsername: null },
  });
  return NextResponse.json({ ok: true });
}
