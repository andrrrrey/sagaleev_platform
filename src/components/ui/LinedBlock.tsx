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
    <div className={cn('bg-lined relative overflow-hidden p-6 md:p-8', className)}>
      {label ? (
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-t400">
          {label}
        </span>
      ) : null}
      <div className="font-mono text-sm leading-[28px] text-t800">{children}</div>
    </div>
  );
}
