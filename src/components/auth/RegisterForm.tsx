'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { registerAction } from '@/server/auth/register';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError, Checkbox } from '@/components/ui/Field';
import { SegmentedProgress } from '@/components/ui/ProgressBar';

function strength(pw: string): number {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[A-ZА-Я]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-zА-Яа-я0-9]/.test(pw)) s++;
  return s;
}

export function RegisterForm({ invite }: { invite?: string }) {
  const [state, action, pending] = useActionState(registerAction, initialActionState);
  const [pw, setPw] = useState('');

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="border border-[#e0dcd0] bg-white px-4 py-3 font-mono text-xs text-zinc-700">
          {state.message}
        </p>
        {state.meta?.verifyUrl ? (
          <a
            href={state.meta.verifyUrl}
            className="break-all font-mono text-[11px] text-[#d95321] underline"
          >
            [dev] Подтвердить email: {state.meta.verifyUrl}
          </a>
        ) : null}
        <Link href="/login" className="font-mono text-xs text-zinc-500 hover:text-zinc-900">
          ← К входу
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.message ? <p className="font-mono text-[11px] text-[#d95321]">{state.message}</p> : null}
      {invite ? <input type="hidden" name="invite" value={invite} /> : null}

      <div>
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <div>
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" mono />
      </div>
      <div>
        <Label htmlFor="password">Пароль (мин. 10 символов)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <div className="mt-2">
          <SegmentedProgress total={4} filled={strength(pw)} />
        </div>
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#e0dcd0]/60 pt-4">
        <Checkbox id="consent" name="consent" required
          label={
            <>
              Согласен на обработку персональных данных (
              <Link href="/legal/privacy" className="text-[#d95321] underline">
                политика
              </Link>
              )
            </>
          }
        />
        <FieldError>{state.fieldErrors?.consent}</FieldError>
        <Checkbox id="offer" name="offer" required
          label={
            <>
              Принимаю условия{' '}
              <Link href="/legal/offer" className="text-[#d95321] underline">
                оферты
              </Link>
            </>
          }
        />
        <FieldError>{state.fieldErrors?.offer}</FieldError>
      </div>

      <Button type="submit" disabled={pending} fullWidthMobile>
        <Icon name="power-linear" />
        {pending ? 'Создаём…' : 'Создать аккаунт'}
      </Button>
    </form>
  );
}
