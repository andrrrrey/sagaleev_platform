'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { loginAction } from '@/server/auth/login';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError } from '@/components/ui/Field';

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5">
      {notice ? (
        <p className="border border-[#e0dcd0] bg-white px-4 py-3 font-mono text-xs text-zinc-600">
          {notice}
        </p>
      ) : null}
      {state.message ? (
        <p className="font-mono text-[11px] text-[#d95321]">{state.message}</p>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            <Icon name={showPassword ? 'eye-closed-linear' : 'eye-linear'} />
          </button>
        </div>
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-zinc-500">
        <Link href="/forgot" className="hover:text-zinc-900">
          Забыли пароль?
        </Link>
        <Link href="/register" className="hover:text-zinc-900">
          Регистрация
        </Link>
      </div>

      <Button type="submit" disabled={pending} fullWidthMobile>
        <Icon name="power-linear" />
        {pending ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  );
}
