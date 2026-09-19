import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppFrame } from '@/components/frame/AppFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { UiShowcase } from './UiShowcase';

export const metadata: Metadata = { title: 'UI Kit' };

/** Витрина компонентов дизайн-системы. Только dev. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <AppFrame topLabel="sys_ui_kit_01">
      <div className="px-6 py-8 md:px-10 md:py-12">
        <PageHeader
          kicker="Dev // UI Kit"
          title="Витрина компонентов"
          description="Проверка соответствия эталону docuframe-hero.html на 375 / 768 / 1024 / 1440."
        />
        <UiShowcase />
      </div>
    </AppFrame>
  );
}
