import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { businessProfileMarkdown } from '@/server/profile/export';

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });

  const profile = await prisma.businessProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const md = businessProfileMarkdown(profile);
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="business-profile.md"',
    },
  });
}
