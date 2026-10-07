'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem = { key: string; label: string; content: ReactNode };

/** Моно-табы (docs/02 §3.9). Прямоугольные, активный с акцентной нижней границей. */
export function Tabs({
  items,
  initialKey,
  className,
}: {
  items: TabItem[];
  initialKey?: string;
  className?: string;
}) {
  const [active, setActive] = useState(initialKey ?? items[0]?.key);
  const activeItem = items.find((i) => i.key === active) ?? items[0];

  return (
    <div className={className}>
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-2xl bg-paper-tint p-1">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActive(item.key)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-paper text-t900 shadow-sm'
                  : 'text-t500 hover:bg-paper-hover hover:text-t800',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-7">
        {activeItem?.content}
      </div>
    </div>
  );
}
