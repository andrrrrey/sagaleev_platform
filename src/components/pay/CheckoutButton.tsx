'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PlanCode } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function CheckoutButton({
  planCode,
  label,
  disabled,
  requireRecurringConsent = false,
}: {
  planCode: PlanCode;
  label: string;
  disabled?: boolean;
  requireRecurringConsent?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurringConsent, setRecurringConsent] = useState(false);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Ошибка оплаты');
      window.location.href = data.confirmationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка оплаты');
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {requireRecurringConsent ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-t700">
          <input
            type="checkbox"
            checked={recurringConsent}
            onChange={(event) => setRecurringConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            Я разрешаю ежемесячное автосписание 5 000 ₽ до отключения подписки и принимаю{' '}
            <Link href="/legal/offer" target="_blank" className="font-medium text-accent underline">
              условия оферты
            </Link>
            . Автопродление можно отключить в профиле.
          </span>
        </label>
      ) : null}
      <Button
        type="button"
        onClick={checkout}
        disabled={disabled || pending || (requireRecurringConsent && !recurringConsent)}
        fullWidthMobile
      >
        <Icon name="card-linear" />
        {pending ? 'Переходим к оплате…' : label}
      </Button>
      {error ? <p className="font-mono text-[11px] text-accent">{error}</p> : null}
    </div>
  );
}
