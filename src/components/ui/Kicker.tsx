import { cn } from '@/lib/utils';

/** Моно-кикер с акцентной линией слева (docs/02 §3.5). */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#d95321]',
        className,
      )}
    >
      <span className="h-px w-6 bg-[#d95321]" />
      {children}
    </div>
  );
}
