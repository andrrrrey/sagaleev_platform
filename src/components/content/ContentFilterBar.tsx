'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Field';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';

export function ContentFilterBar({
  tags = [],
  clients = [],
}: {
  tags?: { slug: string; title: string }[];
  clients?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get('q') ?? '');
  const activeTags = (params.get('tags') ?? '').split(',').filter(Boolean);
  const activeClient = params.get('client') ?? '';

  function apply(next: URLSearchParams) {
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }
  function toggleTag(slug: string) {
    const set = new Set(activeTags);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    setParam('tags', [...set].join(',') || null);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) setParam('q', q || null);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = q || activeTags.length || activeClient;

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative max-w-md">
        <Icon name="magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-t400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию, описанию, тегам"
          className="pl-10"
          aria-label="Поиск"
        />
      </div>

      {clients.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {clients.map((c) => (
            <button key={c} type="button" onClick={() => setParam('client', activeClient === c ? null : c)}>
              <Tag active={activeClient === c}>{c}</Tag>
            </button>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button key={t.slug} type="button" onClick={() => toggleTag(t.slug)}>
              <Tag active={activeTags.includes(t.slug)}>{t.title}</Tag>
            </button>
          ))}
        </div>
      ) : null}

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setQ('');
            apply(new URLSearchParams());
          }}
          className={cn('flex items-center gap-2 self-start font-mono text-xs text-t500 hover:text-accent')}
        >
          <Icon name="refresh-linear" />
          Сбросить
        </button>
      ) : null}
    </div>
  );
}
