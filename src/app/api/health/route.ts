import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/** Проверка живости: БД (очередь pg-boss добавляется на Этапе 4). */
export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = { db: 'fail' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'fail';
  }
  const healthy = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
