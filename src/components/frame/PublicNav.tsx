import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** Публичная навигация (вход/регистрация) — упрощённая версия шапки эталона. */
export function PublicNav({ brand }: { brand: string }) {
  return (
    <header className="relative z-50 bg-paper/80 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <nav className="mx-auto flex min-h-16 w-full items-center justify-between rounded-[22px] border border-line/80 bg-paper/95 px-4 shadow-panel sm:px-6">
        <Link href="/login" className="group flex items-center gap-3">
          <span className="text-[15px] font-extrabold tracking-[-0.025em] text-t900 sm:text-base">
            {brand}
          </span>
          <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-ink px-1.5 text-[11px] font-bold text-paper">
            AI
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-t600 transition-colors hover:bg-paper-hover hover:text-t900 sm:block"
          >
            Войти
          </Link>
          <Link href="/register" className={buttonClass('ghost')}>
            Регистрация
            <Icon name="arrow-right-linear" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
