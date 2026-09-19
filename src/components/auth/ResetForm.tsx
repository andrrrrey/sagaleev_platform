'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { resetAction } from '@/server/auth/register';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError } from '@/components/ui/Field';

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction, initialActionState);

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="border border-[#e0dcd0] bg-white px-4 py-3 font-mono text-xs text-zinc-700">
          {state.message}
        </p>
        <Link href="/login" className="font-mono text-xs text-zinc-500 hover:text-zinc-900">
          → Войти
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      {state.message ? <p className="font-mono text-[11px] text-[#d95321]">{state.message}</p> : null}
      <div>
        <Label htmlFor="password">Новый пароль (мин. 10 символов)</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>
      <Button type="submit" disabled={pending} fullWidthMobile>
        <Icon name="shield-check-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить пароль'}
      </Button>
    </form>
  );
}
