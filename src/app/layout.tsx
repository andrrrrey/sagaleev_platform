import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IconRegistry } from '@/components/ui/IconRegistry';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeScript } from '@/components/theme/theme-script';
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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex h-dvh min-h-[520px] flex-col overflow-hidden bg-page p-2 font-sans text-t800 antialiased selection:bg-brand-pink/35 selection:text-brand-navy sm:p-4 md:p-6 lg:p-8">
        <IconRegistry />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
