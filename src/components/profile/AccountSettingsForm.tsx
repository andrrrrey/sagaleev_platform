'use client';

import { useActionState } from 'react';
import { updateAccountSettings } from '@/server/profile/settings-actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

export function AccountSettingsForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone?: string | null;
}) {
  const [state, action, pending] = useActionState(updateAccountSettings, initialActionState);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5 p-6">
      <p className="text-sm font-light text-t600">
        Здесь можно изменить данные для входа и связи. Для безопасности подтвердите изменения
        текущим паролем.
      </p>
      <div>
        <Label htmlFor="account-name">Имя</Label>
        <Input id="account-name" name="name" defaultValue={name} autoComplete="name" required />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="account-email">Email для входа</Label>
        <Input
          id="account-email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          required
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <div>
        <Label htmlFor="account-phone">Телефон</Label>
        <Input
          id="account-phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ''}
          autoComplete="tel"
          mono
        />
        <FieldError>{state.fieldErrors?.phone}</FieldError>
      </div>
      <div>
        <Label htmlFor="account-password">Текущий пароль</Label>
        <Input
          id="account-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError>{state.fieldErrors?.currentPassword}</FieldError>
      </div>
      {state.message ? (
        <p className="border border-line bg-surface px-4 py-3 font-mono text-xs text-t700">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить настройки'}
      </Button>
    </form>
  );
}
