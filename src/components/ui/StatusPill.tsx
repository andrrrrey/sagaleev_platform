import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Мини-плашка статуса (docs/02 §3.3). */
export function StatusPill({
  children,
  pulse = false,
  muted = false,
  trailing,
  className,
}: {
  children: ReactNode;
  /** Пульсирующий акцентный индикатор (только для «живых» статусов). */
  pulse?: boolean;
  /** Неактивный статус: серый индикатор. */
  muted?: boolean;
  /** Иконки справа за разделителем. */
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border border-[#e0dcd0] bg-white px-2.5 py-1 font-mono text-[10px] text-zinc-500 shadow-sm',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-none',
          muted ? 'bg-zinc-300' : 'bg-[#d95321]',
          pulse && !muted && 'animate-pulse',
        )}
      />
      {children}
      {trailing ? (
        <div className="ml-2 flex items-center gap-1 border-l border-[#e0dcd0] pl-2">{trailing}</div>
      ) : null}
    </div>
  );
}
