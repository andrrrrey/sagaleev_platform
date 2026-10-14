'use client';

import { useMemo, useState, useTransition } from 'react';
import { createTagInline } from '@/server/admin/tags';
import { Icon } from '@/components/ui/Icon';

type TagOption = { id: string; title: string };

export function TagMultiSelect({
  initialTags,
  initialSelected = [],
}: {
  initialTags: TagOption[];
  initialSelected?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(initialTags);
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [newTag, setNewTag] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedLabels = useMemo(
    () => tags.filter((tag) => selected.has(tag.id)).map((tag) => tag.title),
    [selected, tags],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addTag() {
    const title = newTag.trim();
    if (!title) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createTagInline(title);
      if (!result.ok || !result.tag) {
        setMessage(result.message ?? 'Не удалось создать тег');
        return;
      }
      setTags((current) =>
        current.some((tag) => tag.id === result.tag?.id) ? current : [...current, result.tag!],
      );
      setSelected((current) => new Set(current).add(result.tag!.id));
      setNewTag('');
    });
  }

  return (
    <div className="relative">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="tags" value={id} />
      ))}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm text-t700 transition-colors hover:border-t400"
        aria-expanded={open}
      >
        <span className={selectedLabels.length ? 'text-t800' : 'text-t400'}>
          {selectedLabels.length ? selectedLabels.join(', ') : 'Выберите теги'}
        </span>
        <Icon name={open ? 'alt-arrow-up-linear' : 'alt-arrow-down-linear'} />
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-paper p-3 shadow-panel">
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {tags.length === 0 ? (
              <p className="px-2 py-3 text-xs text-t400">Тегов пока нет.</p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-t700 hover:bg-paper-hover"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(tag.id)}
                    onChange={() => toggle(tag.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  {tag.title}
                </label>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2 border-t border-line/70 pt-3">
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Новый тег"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={pending || !newTag.trim()}
              className="rounded-lg bg-t900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
          {message ? <p className="mt-2 text-xs text-accent">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
