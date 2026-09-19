import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** Публичная навигация (вход/регистрация) — упрощённая версия шапки эталона. */
export function PublicNav({ brand }: { brand: string }) {
  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-line/70 px-6 py-5 md:px-10 md:py-6">
      <Link href="/login" className="group flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center border border-t300 bg-surface transition-colors group-hover:border-accent">
          <div className="h-2 w-2 bg-t800 transition-colors group-hover:bg-accent" />
        </div>
        <span className="text-base font-normal tracking-tight text-t900">{brand}</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <ThemeToggle />
        <Link
          href="/login"
          className="hidden font-mono text-xs text-t500 transition-colors hover:text-t900 sm:block"
        >
          Войти
        </Link>
        <Link href="/register" className={buttonClass('ghost')}>
          Регистрация
          <Icon name="arrow-right-linear" />
        </Link>
      </div>
    </nav>
  );
}
