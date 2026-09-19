import { NextResponse, type NextRequest } from 'next/server';

/**
 * Лёгкая защита на edge: проверяет наличие cookie сессии Auth.js и уводит
 * неаутентифицированных на /login. Точный гейтинг по роли/тарифу выполняют
 * серверные layout'ы (getActor + assertAccess). Так middleware не тянет
 * prisma/argon2 в edge-рантайм.
 */
const PROTECTED = [/^\/admin(\/|$)/, /^\/onboarding(\/|$)/, /^\/pay(\/|$)/];
const STUDENT_ROOT_EXACT = ['/', '/profile'];

function hasSessionCookie(req: NextRequest): boolean {
  return (
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token')
  );
}

function isProtected(pathname: string): boolean {
  if (PROTECTED.some((re) => re.test(pathname))) return true;
  if (STUDENT_ROOT_EXACT.includes(pathname)) return true;
  // студенческие разделы
  return /^\/(route|skills|usecases|lessons|streams|leaderboard|profile)(\/|$)/.test(pathname);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();
  if (hasSessionCookie(req)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/',
    '/profile/:path*',
    '/route/:path*',
    '/skills/:path*',
    '/usecases/:path*',
    '/lessons/:path*',
    '/streams/:path*',
    '/leaderboard/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/pay/:path*',
  ],
};
