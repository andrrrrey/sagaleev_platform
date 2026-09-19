import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Таблица админки/лидерборда (docs/02 §3.10). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-widest text-t500">
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left font-normal', className)}>{children}</th>;
}

export function TRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn('border-b border-line/60 hover:bg-paper-hover/40', className)}>
      {children}
    </tr>
  );
}

export function Td({
  children,
  mono = false,
  className,
}: {
  children?: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return <td className={cn('px-4 py-3 font-light', mono && 'font-mono', className)}>{children}</td>;
}
