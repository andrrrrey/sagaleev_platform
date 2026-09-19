'use client';

import { useActionState } from 'react';
import { saveStep } from '@/server/admin/route';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Label, Input, Textarea, Select, Checkbox, FieldError } from '@/components/ui/Field';

type StepDefaults = {
  id?: string;
  dayId: string;
  sort?: number;
  title?: string;
  body?: string;
  commandsJson?: string;
  artifactRequired?: boolean;
  artifactHint?: string;
  linkedSkillId?: string;
};

export function StepForm({
  defaults,
  skills,
}: {
  defaults: StepDefaults;
  skills: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(saveStep, initialActionState);
  const d = defaults;

  return (
    <form action={action} className="flex flex-col gap-6">
      {d.id ? <input type="hidden" name="id" value={d.id} /> : null}
      <input type="hidden" name="dayId" value={d.dayId} />

      <Panel title="Шаг // Маршрут">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Заголовок</Label>
            <Input id="title" name="title" defaultValue={d.title} required />
            <FieldError>{state.fieldErrors?.title}</FieldError>
          </div>
          <div>
            <Label htmlFor="sort">Порядок</Label>
            <Input id="sort" name="sort" type="number" mono defaultValue={d.sort ?? 0} required />
            <FieldError>{state.fieldErrors?.sort}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="body">Описание (HTML)</Label>
            <Textarea id="body" name="body" rows={4} defaultValue={d.body} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="commandsJson">
              Команды/промпты — JSON [{'{'}label,text,kind{'}'}]
            </Label>
            <Textarea
              id="commandsJson"
              name="commandsJson"
              mono
              rows={5}
              defaultValue={d.commandsJson ?? '[]'}
              placeholder='[{"label":"Init","text":"claude ...","kind":"command"}]'
            />
            <FieldError>{state.fieldErrors?.commandsJson}</FieldError>
          </div>
          <div>
            <Label htmlFor="artifactHint">Подсказка артефакта</Label>
            <Input id="artifactHint" name="artifactHint" defaultValue={d.artifactHint} />
          </div>
          <div>
            <Label htmlFor="linkedSkillId">Связанный скилл</Label>
            <Select id="linkedSkillId" name="linkedSkillId" defaultValue={d.linkedSkillId ?? ''}>
              <option value="">— нет —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Checkbox
              name="artifactRequired"
              defaultChecked={d.artifactRequired ?? true}
              label="Требуется фиксация артефакта"
            />
          </div>
        </div>
      </Panel>

      {state.message ? <p className="font-mono text-[11px] text-accent">{state.message}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить шаг'}
      </Button>
    </form>
  );
}
