'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { forgotAction } from '@/server/auth/register';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError } from '@/components/ui/Field';

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, initialActionState);

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="border border-line bg-surface px-4 py-3 font-mono text-xs text-t700">
          {state.message}
        </p>
        {state.meta?.resetUrl ? (
          <a href={state.meta.resetUrl} className="break-all font-mono text-[11px] text-accent underline">
            [dev] Сбросить пароль: {state.meta.resetUrl}
          </a>
        ) : null}
        <Link href="/login" className="font-mono text-xs text-t500 hover:text-t900">
          ← К входу
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.message ? <p className="font-mono text-[11px] text-accent">{state.message}</p> : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <Button type="submit" disabled={pending} fullWidthMobile>
        <Icon name="plain-linear" />
        {pending ? 'Отправляем…' : 'Отправить ссылку'}
      </Button>
    </form>
  );
}
