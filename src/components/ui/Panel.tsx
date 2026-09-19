import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Hardware-brackets по 4 углам (docs/02 §3.2). */
function HardwareBrackets() {
  return (
    <>
      <div className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-t300" />
      <div className="absolute -right-px -top-px h-2 w-2 border-r-2 border-t-2 border-t300" />
      <div className="absolute -bottom-px -left-px h-2 w-2 border-b-2 border-l-2 border-t300" />
      <div className="absolute -bottom-px -right-px h-2 w-2 border-b-2 border-r-2 border-t300" />
    </>
  );
}

/**
 * Базовая карточка «Chat Interface Mockup» из эталона.
 * На ней строятся все карточки контента (docs/02 §3.2).
 */
export function Panel({
  title,
  status,
  footer,
  brackets = true,
  className,
  bodyClassName,
  children,
}: {
  /** Моно-заголовок шапки «Label // Status». Если не задан — шапки нет. */
  title?: ReactNode;
  /** Правый элемент шапки (обычно StatusPill). */
  status?: ReactNode;
  footer?: ReactNode;
  brackets?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col border border-line bg-paper-panel shadow-panel ring-1 ring-white/50',
        className,
      )}
    >
      {brackets && <HardwareBrackets />}
      {(title || status) && (
        <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-t500">
            {title}
          </span>
          {status}
        </div>
      )}
      <div className={cn('flex flex-1 flex-col', bodyClassName)}>{children}</div>
      {footer && (
        <div className="flex items-center justify-between border-t border-line bg-paper p-3">
          {footer}
        </div>
      )}
    </div>
  );
}
