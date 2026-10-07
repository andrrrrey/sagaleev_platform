import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Тег/чип (docs/02 §3.11). */
export function Tag({
  children,
  active = false,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium',
        active
          ? 'border border-accent/20 bg-accent/10 text-accent'
          : 'border border-line bg-paper text-t600',
        className,
      )}
    >
      {children}
    </span>
  );
}
