import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { signOutAction } from '@/server/auth/actions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** Компактная шапка для служебных и административных экранов. */
export function AccountNav({
  brand,
  modeHref,
  modeLabel,
}: {
  brand: string;
  modeHref?: string;
  modeLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-50 bg-paper/80 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <nav className="mx-auto flex min-h-16 w-full items-center justify-between gap-4 rounded-[22px] border border-line/80 bg-paper/95 px-4 shadow-panel sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="text-[15px] font-extrabold tracking-[-0.025em] text-t900 sm:text-base">
            {brand}
          </span>
          <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-ink px-1.5 text-[11px] font-bold text-paper">
            AI
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {modeHref && modeLabel ? (
            <Link
              href={modeHref}
              className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white sm:px-4"
            >
              <Icon name="widget-linear" />
              <span className="hidden sm:inline">{modeLabel}</span>
            </Link>
          ) : null}
          <ThemeToggle />
          <Link
            href="/profile"
            className="grid h-10 w-10 place-items-center rounded-full text-t500 transition-colors hover:bg-paper-hover hover:text-t900"
            aria-label="Личный кабинет"
          >
            <Icon name="user-linear" className="text-lg" />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="grid h-10 w-10 place-items-center rounded-full text-t500 transition-colors hover:bg-paper-hover hover:text-t900"
              aria-label="Выйти"
            >
              <Icon name="logout-2-linear" className="text-lg" />
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
