'use client';

import { useActionState } from 'react';
import { saveSkill } from '@/server/admin/skills';
import { initialActionState } from '@/lib/action-state';
import { SKILL_GROUPS } from '@/lib/skill-groups';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Label, Input, Textarea, Select, Checkbox, FieldError } from '@/components/ui/Field';

type SkillDefaults = {
  id?: string;
  title?: string;
  slug?: string;
  group?: string;
  shortDesc?: string;
  inputs?: string;
  outputs?: string;
  timeToMaster?: string;
  prompt?: string;
  demoVideoId?: string;
  fileKey?: string;
  fileName?: string;
  minPlan?: string;
  state?: string;
};

export function SkillForm({
  tags,
  defaults,
  assignedTagIds,
}: {
  tags: { id: string; title: string }[];
  defaults?: SkillDefaults;
  assignedTagIds?: string[];
}) {
  const [state, action, pending] = useActionState(saveSkill, initialActionState);
  const d = defaults ?? {};
  const assigned = new Set(assignedTagIds ?? []);

  return (
    <form action={action} className="flex flex-col gap-6">
      {d.id ? <input type="hidden" name="id" value={d.id} /> : null}

      <Panel title="Основное // Скилл">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" name="title" defaultValue={d.title} required />
            <FieldError>{state.fieldErrors?.title}</FieldError>
          </div>
          <div>
            <Label htmlFor="slug">Слаг (пусто = из названия)</Label>
            <Input id="slug" name="slug" mono defaultValue={d.slug} />
            <FieldError>{state.fieldErrors?.slug}</FieldError>
          </div>
          <div>
            <Label htmlFor="group">Группа</Label>
            <Select id="group" name="group" defaultValue={d.group ?? 'STRATEGY'}>
              {SKILL_GROUPS.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shortDesc">Что делает</Label>
            <Textarea id="shortDesc" name="shortDesc" rows={2} defaultValue={d.shortDesc} required />
            <FieldError>{state.fieldErrors?.shortDesc}</FieldError>
          </div>
          <div>
            <Label htmlFor="inputs">Что на входе</Label>
            <Textarea id="inputs" name="inputs" rows={2} defaultValue={d.inputs} required />
            <FieldError>{state.fieldErrors?.inputs}</FieldError>
          </div>
          <div>
            <Label htmlFor="outputs">Что на выходе</Label>
            <Textarea id="outputs" name="outputs" rows={2} defaultValue={d.outputs} required />
            <FieldError>{state.fieldErrors?.outputs}</FieldError>
          </div>
          <div>
            <Label htmlFor="timeToMaster">Время освоения</Label>
            <Input id="timeToMaster" name="timeToMaster" defaultValue={d.timeToMaster} placeholder="30 минут" required />
            <FieldError>{state.fieldErrors?.timeToMaster}</FieldError>
          </div>
          <div>
            <Label htmlFor="demoVideoId">Kinescope ID demo (необязательно)</Label>
            <Input id="demoVideoId" name="demoVideoId" mono defaultValue={d.demoVideoId} />
          </div>
        </div>
      </Panel>

      <Panel title="Промпт // Отправить агенту">
        <div className="p-5">
          <Label htmlFor="prompt">Полный промпт</Label>
          <Textarea id="prompt" name="prompt" mono rows={8} defaultValue={d.prompt} required />
          <FieldError>{state.fieldErrors?.prompt}</FieldError>
        </div>
      </Panel>

      <Panel title="Файл // S3">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fileKey">S3-ключ файла (необязательно)</Label>
            <Input id="fileKey" name="fileKey" mono defaultValue={d.fileKey} placeholder="skills/seo-audit.md" />
          </div>
          <div>
            <Label htmlFor="fileName">Имя файла</Label>
            <Input id="fileName" name="fileName" defaultValue={d.fileName} placeholder="seo-audit.md" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-t400 sm:col-span-2">
            Загрузка через UI появится с настройкой S3. Пока — ручной ключ.
          </p>
        </div>
      </Panel>

      <Panel title="Теги // Гейтинг">
        <div className="flex flex-col gap-5 p-5">
          <div>
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-3">
              {tags.length === 0 ? (
                <span className="font-mono text-xs text-t400">Сначала создайте теги.</span>
              ) : (
                tags.map((t) => (
                  <Checkbox
                    key={t.id}
                    name="tags"
                    value={t.id}
                    defaultChecked={assigned.has(t.id)}
                    label={t.title}
                  />
                ))
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="minPlan">Гейт-уровень (minPlan)</Label>
              <Select id="minPlan" name="minPlan" defaultValue={d.minPlan ?? 'SUPPORT'}>
                <option value="SELF">SELF — базовый набор</option>
                <option value="SUPPORT">SUPPORT</option>
                <option value="VIP">VIP</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="state">Статус</Label>
              <Select id="state" name="state" defaultValue={d.state ?? 'DRAFT'}>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликован</option>
                <option value="ARCHIVED">Архив</option>
              </Select>
            </div>
          </div>
        </div>
      </Panel>

      {state.message ? <p className="font-mono text-[11px] text-accent">{state.message}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          <Icon name="check-circle-linear" />
          {pending ? 'Сохраняем…' : 'Сохранить скилл'}
        </Button>
      </div>
    </form>
  );
}
