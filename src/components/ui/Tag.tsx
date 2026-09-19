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
          ? 'border border-[#d95321]/30 bg-white text-[#d95321]'
          : 'border border-[#e0dcd0] bg-white text-zinc-500',
        className,
      )}
    >
      {children}
    </span>
  );
}
