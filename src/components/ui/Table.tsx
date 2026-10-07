import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Таблица админки/лидерборда (docs/02 §3.10). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-line bg-paper">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-paper-tint text-[11px] font-semibold uppercase tracking-wider text-t500">
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left font-normal', className)}>{children}</th>;
}

export function TRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn('border-b border-line/60 last:border-b-0 hover:bg-paper-hover/50', className)}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  mono = false,
  className,
  colSpan,
}: {
  children?: ReactNode;
  mono?: boolean;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3 font-light', mono && 'font-mono', className)}>
      {children}
    </td>
  );
}
