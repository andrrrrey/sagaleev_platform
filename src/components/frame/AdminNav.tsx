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

/** Левое моно-меню админки. EDITOR видит только контентные пункты. */
export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((i) => !i.adminOnly || role === 'ADMIN');

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Меню админки">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 border-l-2 px-3 py-2 font-mono text-xs transition-colors',
              active
                ? 'border-[#d95321] bg-white text-zinc-900'
                : 'border-transparent text-zinc-500 hover:bg-[#eae7df] hover:text-zinc-900',
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
