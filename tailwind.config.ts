import type { Config } from 'tailwindcss';

// Tokens are taken verbatim from docs/reference/docuframe-hero.html.
// Dark theme and gold accents from the commercial proposal are NOT used.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#111110',
        paper: {
          DEFAULT: '#f6f5ef',
          panel: '#fbfaf6',
          tint: '#efede6',
          hover: '#eae7df',
        },
        line: '#e0dcd0',
        ink: { DEFAULT: '#1a1a19', hover: '#000000' },
        accent: '#d95321',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        frame: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // shadow-2xl of the reference
        panel: '0 8px 30px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
} satisfies Config;
