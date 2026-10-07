import type { ReactNode } from 'react';

/** Светлая продуктовая оболочка, единая с визуальным языком лендинга. */
export function AppFrame({
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
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] flex-1 flex-col bg-paper">
      {nav}
      <main className="relative z-10 flex min-h-0 w-full flex-1 flex-col">{children}</main>
      {mobileNav}
    </div>
  );
}
