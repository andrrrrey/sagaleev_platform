import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/server/auth/session';
import { recordVideoProgress } from '@/server/content/service';
import { errorResponse } from '@/server/http';
import { HttpError } from '@/server/access/errors';

const schema = z.object({
  name: z.enum(['video_progress', 'timecode_click', 'sent_to_agent']),
  percent: z.number().min(0).max(100).optional(),
});

/** События юнита: video_progress (→ VIEWED при ≥80%), timecode_click. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  const { slug } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Некорректное событие' } }, { status: 400 });
  }
  try {
    if (parsed.data.name === 'video_progress' && typeof parsed.data.percent === 'number') {
      await recordVideoProgress(actor, slug, parsed.data.percent);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
