'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';

type Status = 'PENDING' | 'SUCCEEDED' | 'CANCELED' | 'FAILED';

export function PayResult({ paymentId }: { paymentId: string }) {
  const [status, setStatus] = useState<Status>('PENDING');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/payments/${paymentId}`);
        if (res.ok) {
          const data = (await res.json()) as { status: Status };
          setStatus(data.status);
          if (data.status !== 'PENDING') clearInterval(timer);
        }
      } catch {
        /* сеть — продолжаем опрос */
      }
      if (attempts >= 30) {
        clearInterval(timer);
        setTimedOut(true);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [paymentId]);

  if (status === 'SUCCEEDED') {
    return (
      <div className="flex flex-col items-start gap-6">
        <div className="flex items-center gap-2 font-mono text-sm text-[#d95321]">
          <Icon name="check-circle-linear" className="text-lg" />
          Доступ открыт
        </div>
        <p className="text-sm font-light text-zinc-600">
          Оплата подтверждена. Заполните бизнес-профиль, чтобы собрать агента.
        </p>
        <Link href="/onboarding" className={buttonClass('primary')}>
          <Icon name="arrow-right-linear" />
          Перейти к онбордингу
        </Link>
      </div>
    );
  }

  if (status === 'CANCELED' || status === 'FAILED') {
    return (
      <div className="flex flex-col items-start gap-6">
        <div className="flex items-center gap-2 font-mono text-sm text-[#d95321]">
          <Icon name="danger-triangle-linear" className="text-lg" />
          Оплата не прошла
        </div>
        <Link href="/pay" className={buttonClass('secondary')}>
          Повторить оплату
        </Link>
      </div>
    );
  }

  return (
    <LinedBlock label="Status">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse bg-[#d95321]" />
        {timedOut ? 'Подтверждение занимает больше времени, чем обычно…' : 'Ожидаем подтверждение…'}
      </div>
    </LinedBlock>
  );
}
