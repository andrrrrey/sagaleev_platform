import type { ReactNode } from 'react';
import { CornerBrackets } from './CornerBrackets';
import { TickBorder } from './TickBorder';

/**
 * Мастер-контейнер (рама) — каркас каждой страницы студента/админки/публичной.
 * 1:1 с эталоном: скруглённый бежевый контейнер со штриховкой, тенью, ring,
 * внутренней технической рамкой, нижней мерной лентой. См. docs/02 §2.
 */
export function AppFrame({
  topLabel = 'sys_frame_01',
  bottomLabel = 'end_frame',
  nav,
  mobileNav,
  children,
}: {
  topLabel?: string;
  bottomLabel?: string;
  nav?: ReactNode;
  mobileNav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-hatch relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col overflow-hidden rounded-2xl bg-[#f6f5ef] shadow-2xl ring-1 ring-white/10 md:rounded-[2rem]">
      <CornerBrackets topLabel={topLabel} bottomLabel={bottomLabel} />
      {nav}
      <main className="relative z-10 flex w-full flex-1 flex-col">{children}</main>
      {mobileNav}
      <TickBorder />
    </div>
  );
}
