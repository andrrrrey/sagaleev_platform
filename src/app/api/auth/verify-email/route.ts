import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db';
import { consumeToken } from '@/server/auth/tokens';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?verify=invalid', req.url));
  }
  const userId = await consumeToken(token, 'EMAIL_VERIFY');
  if (!userId) {
    return NextResponse.redirect(new URL('/login?verify=invalid', req.url));
  }
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(new URL('/login?verify=ok', req.url));
}
