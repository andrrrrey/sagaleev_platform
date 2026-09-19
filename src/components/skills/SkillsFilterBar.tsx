'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Field';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';
import { SKILL_GROUPS } from '@/lib/skill-groups';

export function SkillsFilterBar({ tags }: { tags: { slug: string; title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get('q') ?? '');
  const activeGroup = params.get('group') ?? '';
  const activeTags = (params.get('tags') ?? '').split(',').filter(Boolean);
  const availableOnly = params.get('available') === '1';
  const status = params.get('status') ?? '';

  function apply(next: URLSearchParams) {
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
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

  // Дебаунс поиска.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) setParam('q', q || null);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = activeGroup || activeTags.length || availableOnly || status || q;

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative max-w-md">
        <Icon name="magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-t400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию, описанию, тегам"
          className="pl-10"
          aria-label="Поиск скиллов"
        />
      </div>

      {/* Группы-якоря */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setParam('group', null)}
          className={cn(
            '-ml-px border border-line px-3 py-1.5 font-mono text-xs transition-colors',
            !activeGroup ? 'border-b-accent bg-surface text-t900' : 'bg-transparent text-t500 hover:bg-paper-hover',
          )}
        >
          Все
        </button>
        {SKILL_GROUPS.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => setParam('group', g.code)}
            className={cn(
              '-ml-px border border-line px-3 py-1.5 font-mono text-xs transition-colors',
              activeGroup === g.code
                ? 'border-b-accent bg-surface text-t900'
                : 'bg-transparent text-t500 hover:bg-paper-hover',
            )}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Теги */}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button key={t.slug} type="button" onClick={() => toggleTag(t.slug)}>
              <Tag active={activeTags.includes(t.slug)}>{t.title}</Tag>
            </button>
          ))}
        </div>
      ) : null}

      {/* Переключатели */}
      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-t600">
        <button
          type="button"
          onClick={() => setParam('available', availableOnly ? null : '1')}
          className={cn('flex items-center gap-2', availableOnly ? 'text-accent' : 'hover:text-t900')}
        >
          <Icon name={availableOnly ? 'check-circle-linear' : 'lock-linear'} />
          Только доступные мне
        </button>
        <button
          type="button"
          onClick={() => setParam('status', status === 'started' ? null : 'started')}
          className={cn('flex items-center gap-2', status === 'started' ? 'text-accent' : 'hover:text-t900')}
        >
          <Icon name="diploma-verified-linear" />
          Внедрено
        </button>
        <button
          type="button"
          onClick={() => setParam('status', status === 'not_started' ? null : 'not_started')}
          className={cn('flex items-center gap-2', status === 'not_started' ? 'text-accent' : 'hover:text-t900')}
        >
          <Icon name="clock-circle-linear" />
          Не начато
        </button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              apply(new URLSearchParams());
            }}
            className="flex items-center gap-2 text-t500 hover:text-accent"
          >
            <Icon name="refresh-linear" />
            Сбросить
          </button>
        ) : null}
      </div>
    </div>
  );
}
