'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/server/auth/actions';
import { STUDENT_NAV } from './nav-config';

const PRIMARY = STUDENT_NAV.slice(0, 4); // Главная · Маршрут · Скиллы · Юзкейсы
const MORE = STUDENT_NAV.slice(4, 7); // Уроки · Эфиры · Лидерборд

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ brand, userName }: { brand: string; userName?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-[#e0dcd0]/70 px-6 py-5 md:px-10 md:py-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="group flex cursor-pointer items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center border border-zinc-300 bg-white transition-colors group-hover:border-[#d95321]">
            <div className="h-2 w-2 bg-zinc-800 transition-colors group-hover:bg-[#d95321]" />
          </div>
          <span className="text-base font-normal tracking-tight text-zinc-900">{brand}</span>
        </Link>

        <div className="hidden items-center gap-8 font-mono text-xs text-zinc-500 md:flex">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-zinc-900',
                  active && 'border-b border-[#d95321] pb-1 text-zinc-900',
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
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-900"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              Ещё
              <Icon name="alt-arrow-down-linear" className="text-[10px]" />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 flex min-w-[160px] flex-col border border-[#e0dcd0] bg-[#fbfaf6] shadow-panel">
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#eae7df] hover:text-zinc-900',
                      isActive(pathname, item.href) && 'text-[#d95321]',
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

      <div className="flex items-center gap-5">
        <Link
          href="/profile/notifications"
          className="flex h-8 w-8 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-700"
          aria-label="Уведомления"
        >
          <Icon name="bell-linear" className="text-lg" />
        </Link>
        {userName ? (
          <span className="hidden font-mono text-xs text-zinc-500 sm:block">{userName}</span>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 border border-[#e0dcd0] bg-transparent px-4 py-2 font-mono text-xs text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-[#eae7df]"
          >
            Выйти
            <Icon name="logout-2-linear" />
          </button>
        </form>
      </div>
    </nav>
  );
}
