import { cn } from '@/lib/utils';

/** Декоративный «+» в углу крупной секции (1–2 на секцию). */
export function Crosshair({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none select-none font-mono text-xs text-t300', className)}>
      +
    </div>
  );
}
