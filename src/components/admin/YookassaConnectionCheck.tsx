'use client';

import { useActionState } from 'react';
import { checkYookassaConnection } from '@/server/admin/settings';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function YookassaConnectionCheck() {
  const [state, action, pending] = useActionState(checkYookassaConnection, initialActionState);

  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <Button type="submit" variant="secondary" disabled={pending}>
        <Icon name="shield-check-linear" />
        {pending ? 'Проверяем…' : 'Проверить подключение'}
      </Button>
      {state.message ? (
        <p className={`text-sm leading-relaxed ${state.ok ? 'text-t700' : 'text-accent'}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
