import type { Config } from 'tailwindcss';

/**
 * Токены как CSS-переменные (RGB-тройки) → работают модификаторы прозрачности
 * (bg-paper/40, border-line/70, text-accent/30) и переключение темы по
 * data-theme без правки классов в компонентах.
 *
 * Светлые значения совпадают 1:1 с docs/reference/docuframe-hero.html.
 * Тёмная тема — опциональная (по умолчанию светлая), см. docs/02 §11.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: withAlpha('--c-page'),
        paper: {
          DEFAULT: withAlpha('--c-paper'),
          panel: withAlpha('--c-paper-panel'),
          tint: withAlpha('--c-paper-tint'),
          hover: withAlpha('--c-paper-hover'),
        },
        surface: withAlpha('--c-surface'),
        line: withAlpha('--c-line'),
        ink: { DEFAULT: withAlpha('--c-ink'), hover: withAlpha('--c-ink-hover') },
        accent: withAlpha('--c-accent'),
        // Текстовая шкала (в светлой теме = точные zinc из эталона).
        t900: withAlpha('--c-t900'),
        t800: withAlpha('--c-t800'),
        t700: withAlpha('--c-t700'),
        t600: withAlpha('--c-t600'),
        t500: withAlpha('--c-t500'),
        t400: withAlpha('--c-t400'),
        t300: withAlpha('--c-t300'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        frame: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        panel: '0 8px 30px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
} satisfies Config;
