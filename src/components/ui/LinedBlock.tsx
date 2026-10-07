import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * «Линованная бумага» — для промптов, команд, транскриптов, пустых состояний.
 * Текст ложится на линии при leading-[28px] (docs/02 §3.4).
 */
export function LinedBlock({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-paper-tint p-5 md:p-7', className)}>
      {label ? (
        <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          {label}
        </span>
      ) : null}
      <div className="font-mono text-sm leading-7 text-t800">{children}</div>
    </div>
  );
}
