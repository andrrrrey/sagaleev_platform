import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/server/db';

export type TokenKind = 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'TELEGRAM_LINK';

const TTL_MINUTES: Record<TokenKind, number> = {
  EMAIL_VERIFY: 60 * 24, // 24 ч
  PASSWORD_RESET: 60, // 1 ч
  TELEGRAM_LINK: 15, // 15 мин
};

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Создаёт одноразовый токен, хранит только хеш. Возвращает открытый токен. */
export async function issueToken(userId: string, kind: TokenKind): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MINUTES[kind] * 60_000);
  await prisma.authToken.create({ data: { userId, kind, tokenHash: hash(token), expiresAt } });
  return token;
}

/** Проверяет и «сжигает» токен. Возвращает userId или null. */
export async function consumeToken(token: string, kind: TokenKind): Promise<string | null> {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record || record.kind !== kind) return null;
  if (record.usedAt || record.expiresAt < new Date()) return null;
  await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
