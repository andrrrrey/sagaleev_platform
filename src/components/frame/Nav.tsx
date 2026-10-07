'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/server/auth/actions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { STUDENT_NAV } from './nav-config';

const PRIMARY = STUDENT_NAV.slice(0, 6);
const SECONDARY = STUDENT_NAV.slice(6);

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ brand }: { brand: string }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="На главную">
      <span className="text-[15px] font-extrabold tracking-[-0.025em] text-t900 sm:text-base">
        {brand}
      </span>
      <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-ink px-1.5 text-[11px] font-bold text-paper transition-transform group-hover:-rotate-3">
        AI
      </span>
    </Link>
  );
}

export function Nav({
  brand,
  userName,
  staffMode = false,
}: {
  brand: string;
  userName?: string;
  staffMode?: boolean;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper/80 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <nav className="relative mx-auto flex min-h-16 w-full items-center justify-between gap-4 rounded-[22px] border border-line/80 bg-paper/95 px-4 shadow-panel sm:px-6">
        <Brand brand={brand} />

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-paper-hover text-t900'
                    : 'text-t600 hover:bg-paper-tint hover:text-t900',
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-t600 transition-colors hover:bg-paper-tint hover:text-t900"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
            >
              Ещё
              <Icon name="alt-arrow-down-linear" className="text-xs" />
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-2xl border border-line bg-paper p-2 shadow-lift">
                {SECONDARY.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-paper-hover',
                      isActive(pathname, item.href) ? 'text-accent' : 'text-t700',
                    )}
                  >
                    <Icon name={item.icon} className="text-lg" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {staffMode ? (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white sm:flex"
            >
              <Icon name="widget-linear" />
              Админка
            </Link>
          ) : null}
          <ThemeToggle />
          <Link
            href="/profile/notifications"
            className="grid h-10 w-10 place-items-center rounded-full text-t500 transition-colors hover:bg-paper-hover hover:text-t900"
            aria-label="Уведомления"
          >
            <Icon name="bell-linear" className="text-lg" />
          </Link>
          {userName ? (
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium text-t700 transition-colors hover:bg-paper-hover hover:text-t900 md:flex"
              aria-label="Открыть личный кабинет"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-bold text-paper">
                {userName.trim().charAt(0).toUpperCase() || 'Я'}
              </span>
              <span className="max-w-24 truncate">{userName}</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full text-t700 transition-colors hover:bg-paper-hover xl:hidden"
            aria-label="Открыть меню"
            aria-expanded={mobileOpen}
          >
            <Icon
              name={mobileOpen ? 'close-circle-linear' : 'hamburger-menu-linear'}
              className="text-xl"
            />
          </button>
        </div>

        {mobileOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-[22px] border border-line bg-paper p-3 shadow-lift xl:hidden">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {STUDENT_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                    isActive(pathname, item.href)
                      ? 'bg-paper-hover text-accent'
                      : 'text-t700 hover:bg-paper-tint',
                  )}
                >
                  <Icon name={item.icon} className="text-lg" />
                  {item.label}
                </Link>
              ))}
              {staffMode ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-3 text-sm font-semibold text-accent"
                >
                  <Icon name="widget-linear" className="text-lg" />
                  Админка
                </Link>
              ) : null}
            </div>
            <form action={signOutAction} className="mt-2 border-t border-line pt-2">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-t600 transition-colors hover:bg-paper-hover hover:text-t900"
              >
                <Icon name="logout-2-linear" className="text-lg" />
                Выйти
              </button>
            </form>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
