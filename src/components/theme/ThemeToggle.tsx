'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

type Theme = 'system' | 'light' | 'dark';

const ORDER: Theme[] = ['system', 'light', 'dark'];
const ICON: Record<Theme, string> = {
  system: 'monitor-smartphone-linear',
  light: 'sun-2-linear',
  dark: 'moon-linear',
};
const TITLE: Record<Theme, string> = {
  system: 'Тема: системная',
  light: 'Тема: светлая',
  dark: 'Тема: тёмная',
};

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    try {
      localStorage.removeItem('theme');
    } catch {
      /* приватный режим */
    }
  } else {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* приватный режим */
    }
  }
}

/** Переключатель темы: системная → светлая → тёмная. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    } catch {
      /* приватный режим */
    }
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system';
    setTheme(next);
    apply(next);
  }

  // До монтирования показываем нейтральную иконку, чтобы не было рассинхрона SSR.
  const current = mounted ? theme : 'system';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={TITLE[current]}
      title={TITLE[current]}
      className="flex h-8 w-8 items-center justify-center text-t400 transition-colors hover:text-t700"
    >
      <Icon name={ICON[current]} className="text-lg" />
    </button>
  );
}
