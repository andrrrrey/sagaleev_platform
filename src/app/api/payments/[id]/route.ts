import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { prisma } from '@/server/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  }
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, targetPlan: true, amountKopeks: true, kind: true },
  });
  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }
  const { userId: _omit, ...safe } = payment;
  return NextResponse.json(safe);
}
