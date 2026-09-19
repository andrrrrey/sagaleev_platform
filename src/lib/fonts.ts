import { Inter, JetBrains_Mono } from 'next/font/google';

// Как в эталоне: Inter 300/400, JetBrains Mono 400 (self-host при сборке).
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400'],
  variable: '--font-inter',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  variable: '--font-jetbrains',
  display: 'swap',
});
