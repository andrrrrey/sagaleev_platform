import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';

/** Публичная навигация (вход/регистрация) — упрощённая версия шапки эталона. */
export function PublicNav({ brand }: { brand: string }) {
  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-[#e0dcd0]/70 px-6 py-5 md:px-10 md:py-6">
      <Link href="/login" className="group flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center border border-zinc-300 bg-white transition-colors group-hover:border-[#d95321]">
          <div className="h-2 w-2 bg-zinc-800 transition-colors group-hover:bg-[#d95321]" />
        </div>
        <span className="text-base font-normal tracking-tight text-zinc-900">{brand}</span>
      </Link>
      <div className="flex items-center gap-5">
        <Link
          href="/login"
          className="hidden font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-900 sm:block"
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
