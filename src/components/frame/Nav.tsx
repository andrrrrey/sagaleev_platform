'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/server/auth/actions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { STUDENT_NAV } from './nav-config';

const PRIMARY = STUDENT_NAV.slice(0, 4); // Главная · Маршрут · Скиллы · Юзкейсы
const MORE = STUDENT_NAV.slice(4, 8); // Уроки · Эфиры · Лидерборд · Инструкция

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ brand, userName }: { brand: string; userName?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-line/70 px-6 py-5 md:px-10 md:py-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="group flex cursor-pointer items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center border border-t300 bg-surface transition-colors group-hover:border-accent">
            <div className="h-2 w-2 bg-t800 transition-colors group-hover:bg-accent" />
          </div>
          <span className="text-base font-normal tracking-tight text-t900">{brand}</span>
        </Link>

        <div className="hidden items-center gap-8 font-mono text-xs text-t500 md:flex">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-t900',
                  active && 'border-b border-accent pb-1 text-t900',
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="relative"
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 transition-colors hover:text-t900"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              Ещё
              <Icon name="alt-arrow-down-linear" className="text-[10px]" />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 flex min-w-[160px] flex-col border border-line bg-paper-panel shadow-panel">
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-paper-hover hover:text-t900',
                      isActive(pathname, item.href) && 'text-accent',
                    )}
                  >
                    <Icon name={item.icon} className="text-sm" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <ThemeToggle />
        <Link
          href="/profile/notifications"
          className="flex h-8 w-8 items-center justify-center text-t400 transition-colors hover:text-t700"
          aria-label="Уведомления"
        >
          <Icon name="bell-linear" className="text-lg" />
        </Link>
        {userName ? (
          <span className="hidden font-mono text-xs text-t500 sm:block">{userName}</span>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 border border-line bg-transparent px-4 py-2 font-mono text-xs text-t700 shadow-sm transition-all hover:border-t300 hover:bg-paper-hover"
          >
            Выйти
            <Icon name="logout-2-linear" />
          </button>
        </form>
      </div>
    </nav>
  );
}
