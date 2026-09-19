'use client';

import { useActionState, useRef, useEffect } from 'react';
import { createTag } from '@/server/admin/tags';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError } from '@/components/ui/Field';

export function TagCreateForm() {
  const [state, action, pending] = useActionState(createTag, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="tag-title">Название тега</Label>
        <Input id="tag-title" name="title" placeholder="Например: Директ" required />
        <FieldError>{state.fieldErrors?.title}</FieldError>
      </div>
      <div className="flex-1">
        <Label htmlFor="tag-slug">Слаг (необязательно)</Label>
        <Input id="tag-slug" name="slug" mono placeholder="direct" />
      </div>
      <Button type="submit" disabled={pending}>
        <Icon name="add-circle-linear" />
        {pending ? 'Создаём…' : 'Добавить'}
      </Button>
    </form>
  );
}
