'use client';

import { useActionState } from 'react';
import { updateDay } from '@/server/admin/route';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, Textarea, FieldError } from '@/components/ui/Field';

export function DayEditForm({
  day,
}: {
  day: { id: string; title: string; summary: string; artifact: string };
}) {
  const [state, action, pending] = useActionState(updateDay, initialActionState);
  return (
    <form action={action} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={day.id} />
      <div>
        <Label htmlFor={`title-${day.id}`}>Название</Label>
        <Input id={`title-${day.id}`} name="title" defaultValue={day.title} required />
        <FieldError>{state.fieldErrors?.title}</FieldError>
      </div>
      <div>
        <Label htmlFor={`artifact-${day.id}`}>Артефакт дня</Label>
        <Input id={`artifact-${day.id}`} name="artifact" defaultValue={day.artifact} required />
        <FieldError>{state.fieldErrors?.artifact}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`summary-${day.id}`}>Описание</Label>
        <Textarea id={`summary-${day.id}`} name="summary" rows={2} defaultValue={day.summary} required />
        <FieldError>{state.fieldErrors?.summary}</FieldError>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          <Icon name="check-circle-linear" />
          {pending ? 'Сохраняем…' : 'Сохранить день'}
        </Button>
        {state.message ? <span className="font-mono text-[11px] text-t500">{state.message}</span> : null}
      </div>
    </form>
  );
}
