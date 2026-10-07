'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

type Banner = { id: string; title: string; subtitle: string | null; href: string | null };

/** Карусель-баннеры: автопрокрутка 6с, пауза при hover, стрелки + счётчик. */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (n === 0) return null;
  const b = banners[i]!;
  const inner = (
    <div className="brand-gradient flex items-center justify-between gap-4 p-6 md:p-8">
      <div>
        <div className="text-xl font-bold tracking-tight text-t900">{b.title}</div>
        {b.subtitle ? <p className="mt-1 text-sm text-t600">{b.subtitle}</p> : null}
      </div>
      {b.href ? <Icon name="arrow-right-linear" className="shrink-0 text-t400" /> : null}
    </div>
  );

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Panel
        title="Анонсы"
        status={
          <div className="flex items-center gap-2 text-[11px] font-semibold text-t500">
            {n > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Назад"
                  onClick={() => setI((v) => (v - 1 + n) % n)}
                >
                  <Icon name="alt-arrow-left-linear" className="hover:text-accent" />
                </button>
                <span className="tabular-nums">
                  {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                </span>
                <button type="button" aria-label="Вперёд" onClick={() => setI((v) => (v + 1) % n)}>
                  <Icon name="alt-arrow-right-linear" className="hover:text-accent" />
                </button>
              </>
            ) : null}
          </div>
        }
      >
        {b.href ? (
          <Link href={b.href} className="block transition-colors hover:bg-paper-hover/40">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </Panel>
    </div>
  );
}
