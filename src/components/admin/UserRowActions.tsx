'use client';

import { useActionState, useEffect, useState } from 'react';
import { setUserPassword, setUserBlocked } from '@/server/admin/users';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Label, Input, FieldError } from '@/components/ui/Field';

/**
 * Действия над пользователем в админке: смена пароля (модалка) и
 * блокировка/разблокировка. Себя блокировать нельзя (isSelf).
 */
export function UserRowActions({
  userId,
  name,
  blocked,
  isSelf = false,
}: {
  userId: string;
  name: string;
  blocked: boolean;
  isSelf?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setUserPassword, initialActionState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <Icon name="lock-keyhole-linear" />
        Пароль
      </Button>

      {isSelf ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-t400">Это вы</span>
      ) : (
        <form action={setUserBlocked}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="blocked" value={blocked ? 'false' : 'true'} />
          <Button type="submit" variant="ghost">
            <Icon name={blocked ? 'shield-check-linear' : 'power-linear'} />
            {blocked ? 'Разблокировать' : 'Заблокировать'}
          </Button>
        </form>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Пароль · ${name}`}>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <Label htmlFor={`pw-${userId}`}>Новый пароль (мин. 10 символов)</Label>
            <Input id={`pw-${userId}`} name="password" type="password" mono autoComplete="new-password" required />
            <FieldError>{state.fieldErrors?.password}</FieldError>
          </div>
          {state.message && !state.ok ? (
            <p className="font-mono text-[11px] text-accent">{state.message}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="self-start">
            <Icon name="check-circle-linear" />
            {pending ? 'Сохраняем…' : 'Сменить пароль'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
