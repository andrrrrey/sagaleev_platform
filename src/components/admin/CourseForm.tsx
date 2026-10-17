'use client';

import { useActionState } from 'react';
import { saveCourse } from '@/server/admin/courses';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Label, Input, Textarea, Select, FieldError } from '@/components/ui/Field';

type Defaults = {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string;
  state?: string;
};

export function CourseForm({ defaults, canPublish }: { defaults?: Defaults; canPublish: boolean }) {
  const [state, action, pending] = useActionState(saveCourse, initialActionState);
  const d = defaults ?? {};

  return (
    <form action={action} className="space-y-6">
      {d.id ? <input type="hidden" name="id" value={d.id} /> : null}
      <Panel title="Основное // Курс">
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="course-title">Название</Label>
            <Input id="course-title" name="title" defaultValue={d.title} required />
            <FieldError>{state.fieldErrors?.title}</FieldError>
          </div>
          <div>
            <Label htmlFor="course-slug">Адрес курса</Label>
            <Input id="course-slug" name="slug" mono defaultValue={d.slug} />
            <FieldError>{state.fieldErrors?.slug}</FieldError>
          </div>
          <div>
            <Label htmlFor="course-state">Статус</Label>
            <Select id="course-state" name="state" defaultValue={d.state ?? 'DRAFT'}>
              <option value="DRAFT">Черновик — скрыт от учеников</option>
              {canPublish ? <option value="PUBLISHED">Опубликован — виден ученикам</option> : null}
              {canPublish ? <option value="ARCHIVED">Архив — скрыт от учеников</option> : null}
            </Select>
            <p className="mt-1 text-xs text-t500">
              Если скрыть курс, ученики не смогут открыть его уроки даже по сохранённым ссылкам.
              Прогресс не удаляется.
            </p>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="course-summary">Краткое описание</Label>
            <Textarea id="course-summary" name="summary" rows={3} defaultValue={d.summary} />
          </div>
        </div>
      </Panel>
      {state.message ? <p className="text-sm text-accent">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : d.id ? 'Сохранить курс' : 'Создать курс'}
      </Button>
    </form>
  );
}
