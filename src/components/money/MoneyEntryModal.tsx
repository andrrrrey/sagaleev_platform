'use client';

import { useActionState, useEffect, useState } from 'react';
import { addMoneyEntry } from '@/server/money/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Label, Input, Textarea, Select, FieldError } from '@/components/ui/Field';

/** Кнопка + модалка добавления записи «Движение по деньгам». */
export function MoneyEntryModal({ label = 'Добавить запись' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addMoneyEntry, initialActionState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="action" type="button" onClick={() => setOpen(true)}>
        <Icon name="add-circle-linear" className="text-sm text-accent" />
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Movement">
        <form action={action} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="amountRub">Сумма, ₽ (можно со знаком −)</Label>
            <Input id="amountRub" name="amountRub" type="number" mono required />
            <FieldError>{state.fieldErrors?.amountRub}</FieldError>
          </div>
          <div>
            <Label htmlFor="kind">Тип</Label>
            <Select id="kind" name="kind" defaultValue="REVENUE">
              <option value="REVENUE">Выручка</option>
              <option value="LEADS">Лиды</option>
              <option value="SAVINGS">Экономия</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Комментарий</Label>
            <Textarea id="note" name="note" rows={2} />
          </div>
          {state.message && !state.ok ? (
            <p className="font-mono text-[11px] text-accent">{state.message}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="self-start">
            <Icon name="check-circle-linear" />
            {pending ? 'Сохраняем…' : 'Добавить'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
