/**
 * Техническая внутренняя рамка: 4 уголка + метки sys_* / end_frame.
 * 1:1 с эталоном (docs/reference/docuframe-hero.html).
 */
export function CornerBrackets({
  topLabel = 'sys_frame_01',
  bottomLabel = 'end_frame',
}: {
  topLabel?: string;
  bottomLabel?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-2 z-40 rounded-xl border border-line sm:inset-4 md:rounded-[1.5rem]">
      <div className="absolute -left-[1px] -top-[1px] h-4 w-4 rounded-tl-xl border-l border-t border-t400 md:rounded-tl-[1.5rem]" />
      <div className="absolute -right-[1px] -top-[1px] h-4 w-4 rounded-tr-xl border-r border-t border-t400 md:rounded-tr-[1.5rem]" />
      <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 rounded-bl-xl border-b border-l border-t400 md:rounded-bl-[1.5rem]" />
      <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 rounded-br-xl border-b border-r border-t400 md:rounded-br-[1.5rem]" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-paper px-2 font-mono text-[9px] uppercase tracking-widest text-t400">
        {topLabel}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-paper px-2 font-mono text-[9px] uppercase tracking-widest text-t400">
        {bottomLabel}
      </div>
    </div>
  );
}
