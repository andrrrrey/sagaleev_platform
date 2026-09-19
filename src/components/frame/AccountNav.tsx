import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { signOutAction } from '@/server/auth/actions';

/** Минимальная шапка для оплаты/онбординга (бренд + выход). */
export function AccountNav({ brand }: { brand: string }) {
  return (
    <nav className="relative z-50 flex w-full items-center justify-between border-b border-[#e0dcd0]/70 px-6 py-5 md:px-10 md:py-6">
      <Link href="/" className="group flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center border border-zinc-300 bg-white transition-colors group-hover:border-[#d95321]">
          <div className="h-2 w-2 bg-zinc-800 transition-colors group-hover:bg-[#d95321]" />
        </div>
        <span className="text-base font-normal tracking-tight text-zinc-900">{brand}</span>
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex items-center gap-2 border border-[#e0dcd0] bg-transparent px-4 py-2 font-mono text-xs text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-[#eae7df]"
        >
          Выйти
          <Icon name="logout-2-linear" />
        </button>
      </form>
    </nav>
  );
}
