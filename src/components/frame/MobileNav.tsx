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

/** Нижняя навигация по главным учебным разделам. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 flex h-16 rounded-[20px] border border-line bg-paper/95 p-1 shadow-lift backdrop-blur-xl md:hidden"
      aria-label="Основная навигация"
    >
      {MOBILE_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors',
              active ? 'bg-paper-hover text-accent' : 'text-t500 hover:text-t800',
            )}
          >
            <Icon name={item.icon} className="text-lg" />
            <span className="max-w-full truncate text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
