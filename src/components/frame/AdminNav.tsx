'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@prisma/client';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { ADMIN_NAV } from './nav-config';

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Левое меню админки. EDITOR видит только контентные пункты. */
export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((i) => !i.adminOnly || role === 'ADMIN');

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Меню админки">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-paper-hover text-accent'
                : 'text-t600 hover:bg-paper-tint hover:text-t900',
            )}
          >
            <Icon name={item.icon} className="text-sm" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
