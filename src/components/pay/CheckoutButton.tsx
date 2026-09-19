'use client';

import { useState } from 'react';
import type { PlanCode } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function CheckoutButton({
  planCode,
  label,
  disabled,
}: {
  planCode: PlanCode;
  label: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={checkout} disabled={disabled || pending} fullWidthMobile>
        <Icon name="card-linear" />
        {pending ? 'Переходим к оплате…' : label}
      </Button>
      {error ? <p className="font-mono text-[11px] text-accent">{error}</p> : null}
    </div>
  );
}
