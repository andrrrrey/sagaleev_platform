'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { MOBILE_NAV } from './nav-config';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Нижняя навигация внутри рамы на <md (5 табов, тап-таргеты ≥ 40px). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="relative z-30 flex h-14 w-full border-t border-[#e0dcd0] bg-[#f6f5ef] md:hidden"
      aria-label="Основная навигация"
    >
      {MOBILE_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
              active ? 'text-[#d95321]' : 'text-zinc-400 hover:text-zinc-600',
            )}
          >
            <Icon name={item.icon} className="text-lg" />
            <span className="font-mono text-[9px] uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
