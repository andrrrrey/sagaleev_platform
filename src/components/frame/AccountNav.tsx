import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { signOutAction } from '@/server/auth/actions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** Минимальная шапка для оплаты/онбординга (бренд + выход). */
export function AccountNav({ brand }: { brand: string }) {
  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-line/70 px-6 py-5 md:px-10 md:py-6">
      <Link href="/" className="group flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center border border-t300 bg-surface transition-colors group-hover:border-accent">
          <div className="h-2 w-2 bg-t800 transition-colors group-hover:bg-accent" />
        </div>
        <span className="text-base font-normal tracking-tight text-t900">{brand}</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <ThemeToggle />
        <Link
          href="/profile"
          className="flex items-center gap-2 font-mono text-xs text-t500 transition-colors hover:text-accent"
        >
          <Icon name="user-linear" />
          <span className="hidden sm:inline">Личный кабинет</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 border border-line bg-transparent px-4 py-2 font-mono text-xs text-t700 shadow-sm transition-all hover:border-t300 hover:bg-paper-hover"
          >
            Выйти
            <Icon name="logout-2-linear" />
          </button>
        </form>
      </div>
    </nav>
  );
}
