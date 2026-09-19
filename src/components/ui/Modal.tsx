'use client';

import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';
import { Panel } from './Panel';

/** Модальное окно (docs/02 §3.15): оверлей + Panel с уголками, крестик в шапке. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111110]/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Panel
          title={`${title} // Modal`}
          status={
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-zinc-700"
            >
              <Icon name="close-circle-linear" className="text-lg" />
            </button>
          }
          footer={footer}
        >
          <div className="p-6">{children}</div>
        </Panel>
      </div>
    </div>
  );
}
