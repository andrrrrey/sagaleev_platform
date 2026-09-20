'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createUser } from '@/server/admin/users';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, Select, FieldError } from '@/components/ui/Field';

export function UserCreateForm() {
  const [state, action, pending] = useActionState(createUser, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="u-name">Имя</Label>
          <Input id="u-name" name="name" placeholder="Иван Иванов" required />
          <FieldError>{state.fieldErrors?.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="u-email">Email</Label>
          <Input id="u-email" name="email" type="email" mono placeholder="user@example.ru" required />
          <FieldError>{state.fieldErrors?.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="u-role">Роль</Label>
          <Select id="u-role" name="role" defaultValue="EDITOR">
            <option value="ADMIN">ADMIN — полный доступ</option>
            <option value="EDITOR">EDITOR — контент</option>
            <option value="STUDENT">STUDENT — ученик</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="u-password">Пароль (мин. 10 символов)</Label>
          <Input id="u-password" name="password" type="password" mono autoComplete="new-password" required />
          <FieldError>{state.fieldErrors?.password}</FieldError>
        </div>
      </div>

      {state.message ? (
        <p className={`font-mono text-[11px] ${state.ok ? 'text-t500' : 'text-accent'}`}>{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        <Icon name="add-circle-linear" />
        {pending ? 'Создаём…' : 'Создать пользователя'}
      </Button>
    </form>
  );
}
