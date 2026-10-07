import Link from 'next/link';
import type { PlanCode } from '@prisma/client';
import { Icon } from './Icon';
import { buttonClass } from './Button';

/** Замок закрытого контента (docs/02 §3.12) — без размытия и градиентов. */
export function LockedPanel({ requiredPlan }: { requiredPlan: PlanCode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[24px] border border-line bg-paper-tint p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-paper text-accent shadow-sm">
        <Icon name="lock-linear" className="text-xl" />
      </span>
      <p className="max-w-xs text-sm leading-relaxed text-t600">
        Материал входит в единую подписку. Оформите её, чтобы открыть промпт, файлы и видео.
      </p>
      <Link
        href={{ pathname: '/pay', query: { upgrade: requiredPlan } }}
        className={buttonClass('action')}
      >
        <Icon name="lock-keyhole-linear" className="text-sm text-accent" />
        Оформить единую подписку
      </Link>
    </div>
  );
}
