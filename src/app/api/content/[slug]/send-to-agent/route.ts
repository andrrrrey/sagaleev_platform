import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { sendToAgentUnit } from '@/server/content/service';
import { errorResponse } from '@/server/http';
import { HttpError } from '@/server/access/errors';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  const { slug } = await params;
  try {
    await sendToAgentUnit(actor, slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
