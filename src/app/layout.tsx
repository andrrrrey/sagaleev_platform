import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, jetbrainsMono } from '@/lib/fonts';
import { IconRegistry } from '@/components/ui/IconRegistry';
import { ToastProvider } from '@/components/ui/Toast';
import { env } from '@/lib/env';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_BRAND_NAME,
    template: `%s — ${env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: 'Закрытый портал: обучающий курс и рабочая среда для сборки маркетингового ИИ-агента.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-page p-2 font-sans text-zinc-800 antialiased selection:bg-[#d95321]/20 selection:text-[#d95321] sm:p-4 md:p-6 lg:p-8">
        <IconRegistry />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
