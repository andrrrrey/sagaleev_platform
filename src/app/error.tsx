'use client';

import Link from 'next/link';
import { AppFrame } from '@/components/frame/AppFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppFrame topLabel="sys_500_01">
      <div className="px-6 py-12 md:px-10 md:py-20">
        <PageHeader kicker="Error // 500" title="Что-то пошло не так" />
        <div className="flex max-w-xl flex-col gap-4">
          <EmptyState label="500">Произошла ошибка. Попробуйте обновить страницу.</EmptyState>
          <div className="flex gap-3">
            <Button onClick={reset}>
              <Icon name="refresh-linear" />
              Повторить
            </Button>
            <Link href="/" className={buttonClass('secondary')}>
              На главную
            </Link>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
