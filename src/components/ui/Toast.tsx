'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

type Toast = { id: number; message: string };
type ToastCtx = { notify: (message: string) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast должен использоваться внутри <ToastProvider>');
  return ctx;
}

/** Тосты по docs/02 §3.14: мини-панель, позиция справа снизу, aria-live. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 border border-line bg-paper-panel px-3 py-2 font-mono text-xs text-t700 shadow-sm"
          >
            <span className="h-1.5 w-1.5 bg-accent" />
            <Icon name="check-circle-linear" className="text-sm text-accent" />
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
