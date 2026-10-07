import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Базовая скруглённая карточка продукта. */
export function Panel({
  title,
  status,
  footer,
  brackets: _brackets = true,
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
        'relative flex flex-col overflow-hidden rounded-[24px] border border-line/80 bg-paper-panel shadow-panel transition-shadow hover:shadow-lift',
        className,
      )}
    >
      {(title || status) && (
        <div className="flex items-center justify-between gap-3 border-b border-line/70 bg-paper px-5 py-4">
          <span className="text-xs font-semibold text-t600">{title}</span>
          {status}
        </div>
      )}
      <div className={cn('flex flex-1 flex-col', bodyClassName)}>{children}</div>
      {footer && (
        <div className="flex items-center justify-between border-t border-line/70 bg-paper px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}
