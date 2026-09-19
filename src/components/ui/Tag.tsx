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
        'inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
        active
          ? 'border border-accent/30 bg-surface text-accent'
          : 'border border-line bg-surface text-t500',
        className,
      )}
    >
      {children}
    </span>
  );
}
