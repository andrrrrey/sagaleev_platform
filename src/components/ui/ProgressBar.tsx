import { cn } from '@/lib/utils';

/** Линейный прогресс-бар (docs/02 §3.13). */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('h-1.5 w-full bg-[#e0dcd0]', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full bg-[#d95321]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Сегментированный прогресс: ряд квадратов (стиль логотипа). */
export function SegmentedProgress({
  total,
  filled,
  className,
}: {
  total: number;
  filled: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`${filled} из ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn('h-2 w-2 border border-zinc-300', i < filled ? 'bg-zinc-800' : 'bg-transparent')}
        />
      ))}
    </div>
  );
}
