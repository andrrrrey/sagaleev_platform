import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { getMcpTokenStatus, issueMcpToken, revokeMcpTokens } from '@/server/mcp/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  return NextResponse.json(await getMcpTokenStatus(actor.id));
}

export async function POST() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  if (!actor.enrollmentActive && actor.role === 'STUDENT') {
    return NextResponse.json({ error: { code: 'PAYMENT_REQUIRED' } }, { status: 402 });
  }
  return NextResponse.json(await issueMcpToken(actor.id));
}

export async function DELETE() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  await revokeMcpTokens(actor.id);
  return NextResponse.json({ ok: true });
}
