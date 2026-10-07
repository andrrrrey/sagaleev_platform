import { cn } from '@/lib/utils';

/** Компактная техно-метка как на лендинге. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-sm bg-accent" />
      {children}
    </div>
  );
}
