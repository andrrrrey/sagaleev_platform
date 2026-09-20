'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { saveContent } from '@/server/admin/content';
import { initialActionState } from '@/lib/action-state';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Label, Input, Textarea, Select, Checkbox, FieldError } from '@/components/ui/Field';

type Defaults = Record<string, string | number | boolean | undefined> & { id?: string };

export function ContentForm({
  tags,
  routeDays,
  defaults,
  assignedTagIds,
  previewHref,
}: {
  tags: { id: string; title: string }[];
  routeDays: { id: string; dayNumber: number; title: string }[];
  defaults?: Defaults;
  assignedTagIds?: string[];
  previewHref?: string;
}) {
  const [state, action, pending] = useActionState(saveContent, initialActionState);
  const d = defaults ?? {};
  const assigned = new Set(assignedTagIds ?? []);
  const [type, setType] = useState<string>((d.type as string) ?? 'USECASE');

  const err = (k: string) => <FieldError>{state.fieldErrors?.[k]}</FieldError>;

  return (
    <form action={action} className="flex flex-col gap-6">
      {d.id ? <input type="hidden" name="id" value={String(d.id)} /> : null}

      <Panel title="Общее // Юнит">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="type">Тип</Label>
            <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="LESSON">Урок</option>
              <option value="USECASE">Юзкейс</option>
              <option value="STREAM">Эфир</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="slug">Слаг (пусто = из названия)</Label>
            <Input id="slug" name="slug" mono defaultValue={d.slug as string} />
            {err('slug')}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" name="title" defaultValue={d.title as string} required />
            {err('title')}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="summary">Краткое описание</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={d.summary as string} />
          </div>
          <div>
            <Label htmlFor="coverUrl">Обложка (URL)</Label>
            <Input id="coverUrl" name="coverUrl" mono defaultValue={d.coverUrl as string} />
          </div>
          <div>
            <Label htmlFor="timeToMaster">Время освоения</Label>
            <Input id="timeToMaster" name="timeToMaster" defaultValue={d.timeToMaster as string} />
          </div>
          <div>
            <Label htmlFor="minPlan">minPlan</Label>
            <Select id="minPlan" name="minPlan" defaultValue={(d.minPlan as string) ?? 'SELF'}>
              <option value="SELF">SELF</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="VIP">VIP</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="state">Статус</Label>
            <Select id="state" name="state" defaultValue={(d.state as string) ?? 'DRAFT'}>
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликован</option>
              <option value="ARCHIVED">Архив</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sort">Порядок</Label>
            <Input id="sort" name="sort" type="number" mono defaultValue={(d.sort as number) ?? 0} />
          </div>
          {type === 'STREAM' ? (
            <div className="flex items-end">
              <Checkbox
                name="partialFreePreview"
                defaultChecked={Boolean(d.partialFreePreview)}
                label="Частичный доступ для SELF"
              />
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-3">
              {tags.length === 0 ? (
                <span className="font-mono text-xs text-t400">Сначала создайте теги.</span>
              ) : (
                tags.map((t) => (
                  <Checkbox key={t.id} name="tags" value={t.id} defaultChecked={assigned.has(t.id)} label={t.title} />
                ))
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Checkbox name="notify" label="Уведомить студентов о публикации" />
          </div>
        </div>
      </Panel>

      <Panel title="Видео // Kinescope">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="kinescopeId">Kinescope ID</Label>
            <Input id="kinescopeId" name="kinescopeId" mono defaultValue={d.kinescopeId as string} />
          </div>
          <div>
            <Label htmlFor="durationSec">Длительность (сек)</Label>
            <Input id="durationSec" name="durationSec" type="number" mono defaultValue={d.durationSec as number} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="timecodesJson">Таймкоды — JSON [{'{'}t,label{'}'}]</Label>
            <Textarea id="timecodesJson" name="timecodesJson" mono rows={4} defaultValue={d.timecodesJson as string} placeholder='[{"t":125,"label":"Аудит выдачи"}]' />
            {err('timecodesJson')}
          </div>
        </div>
      </Panel>

      <Panel title="Промпт // Отправить агенту">
        <div className="grid grid-cols-1 gap-4 p-5">
          <div>
            <Label htmlFor="prompt">Промпт</Label>
            <Textarea id="prompt" name="prompt" mono rows={5} defaultValue={d.prompt as string} />
          </div>
          <div>
            <Label htmlFor="promptNote">Заметка к промпту</Label>
            <Input id="promptNote" name="promptNote" defaultValue={d.promptNote as string} />
          </div>
        </div>
      </Panel>

      {type === 'LESSON' ? (
        <Panel title="Урок // Программа">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="block">Блок 1–10</Label>
              <Input id="block" name="block" type="number" mono defaultValue={d.block as number} />
            </div>
            <div>
              <Label htmlFor="orderInBlock">Порядок в блоке</Label>
              <Input id="orderInBlock" name="orderInBlock" type="number" mono defaultValue={d.orderInBlock as number} />
            </div>
            <div>
              <Label htmlFor="methodTag">Принцип метода</Label>
              <Input id="methodTag" name="methodTag" defaultValue={d.methodTag as string} placeholder="сегментация ABCDX" />
            </div>
            <div>
              <Label htmlFor="routeDayId">День маршрута</Label>
              <Select id="routeDayId" name="routeDayId" defaultValue={(d.routeDayId as string) ?? ''}>
                <option value="">— нет —</option>
                {routeDays.map((r) => (
                  <option key={r.id} value={r.id}>
                    День {r.dayNumber}: {r.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Panel>
      ) : null}

      {type === 'USECASE' ? (
        <Panel title="Юзкейс // Анатомия">
          <div className="grid grid-cols-1 gap-4 p-5">
            <div>
              <Label htmlFor="caseClient">Клиент-кейс</Label>
              <Input id="caseClient" name="caseClient" defaultValue={d.caseClient as string} />
            </div>
            <div>
              <Label htmlFor="goal">Цель</Label>
              <Textarea id="goal" name="goal" rows={2} defaultValue={d.goal as string} />
            </div>
            <div>
              <Label htmlFor="result">Результат</Label>
              <Textarea id="result" name="result" rows={2} defaultValue={d.result as string} />
            </div>
            <div>
              <Label htmlFor="kpisJson">KPI — JSON [{'{'}label,value,hint{'}'}]</Label>
              <Textarea id="kpisJson" name="kpisJson" mono rows={4} defaultValue={d.kpisJson as string} placeholder='[{"label":"Оценка статьи","value":"≥ 82/100"}]' />
              {err('kpisJson')}
            </div>
            <div>
              <Label htmlFor="descriptionHtml">Описание (HTML)</Label>
              <Textarea id="descriptionHtml" name="descriptionHtml" rows={4} defaultValue={d.descriptionHtml as string} />
            </div>
            <div>
              <Label htmlFor="repoLinksJson">Ссылки на репо — JSON [{'{'}title,url{'}'}]</Label>
              <Textarea id="repoLinksJson" name="repoLinksJson" mono rows={3} defaultValue={d.repoLinksJson as string} placeholder='[{"title":"GitHub","url":"https://..."}]' />
              {err('repoLinksJson')}
            </div>
            <div>
              <Label htmlFor="stepsJson">Пошаговые действия — JSON [{'{'}title,body,command{'}'}]</Label>
              <Textarea id="stepsJson" name="stepsJson" mono rows={4} defaultValue={d.stepsJson as string} />
              {err('stepsJson')}
            </div>
            <div>
              <Label htmlFor="articleHtml">Статья (HTML)</Label>
              <Textarea id="articleHtml" name="articleHtml" rows={4} defaultValue={d.articleHtml as string} />
            </div>
            <div>
              <Label htmlFor="transcript">Транскрипт</Label>
              <Textarea id="transcript" name="transcript" mono rows={4} defaultValue={d.transcript as string} />
            </div>
          </div>
        </Panel>
      ) : null}

      {type === 'STREAM' ? (
        <Panel title="Эфир // Запись">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="airedAt">Дата эфира</Label>
              <Input id="airedAt" name="airedAt" type="datetime-local" mono defaultValue={d.airedAt as string} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="transcript-s">Транскрипт</Label>
              <Textarea id="transcript-s" name="transcript" mono rows={4} defaultValue={d.transcript as string} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="article-s">Статья/конспект (HTML)</Label>
              <Textarea id="article-s" name="articleHtml" rows={3} defaultValue={d.articleHtml as string} />
            </div>
          </div>
        </Panel>
      ) : null}

      {state.message ? <p className="font-mono text-[11px] text-accent">{state.message}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          <Icon name="check-circle-linear" />
          {pending ? 'Сохраняем…' : 'Сохранить юнит'}
        </Button>
        {previewHref ? (
          <Link href={previewHref} target="_blank" className={buttonClass('secondary')}>
            <Icon name="eye-linear" />
            Предпросмотр
          </Link>
        ) : null}
      </div>
    </form>
  );
}
