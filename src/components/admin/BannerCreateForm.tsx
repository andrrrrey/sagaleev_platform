'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createBanner } from '@/server/admin/banners';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, FieldError } from '@/components/ui/Field';

export function BannerCreateForm() {
  const [state, action, pending] = useActionState(createBanner, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
      <div>
        <Label htmlFor="b-title">Заголовок</Label>
        <Input id="b-title" name="title" required />
        <FieldError>{state.fieldErrors?.title}</FieldError>
      </div>
      <div>
        <Label htmlFor="b-subtitle">Подзаголовок</Label>
        <Input id="b-subtitle" name="subtitle" />
      </div>
      <div>
        <Label htmlFor="b-href">Ссылка</Label>
        <Input id="b-href" name="href" mono placeholder="/usecases/..." />
      </div>
      <div>
        <Label htmlFor="b-image">Картинка (URL)</Label>
        <Input id="b-image" name="imageUrl" mono />
      </div>
      <div>
        <Label htmlFor="b-sort">Порядок</Label>
        <Input id="b-sort" name="sort" type="number" mono defaultValue={0} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          <Icon name="add-circle-linear" />
          {pending ? 'Создаём…' : 'Добавить баннер'}
        </Button>
      </div>
    </form>
  );
}
