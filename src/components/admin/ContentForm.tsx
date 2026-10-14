'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { saveContent } from '@/server/admin/content';
import { initialActionState } from '@/lib/action-state';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Label, Input, Textarea, Select, Checkbox, FieldError } from '@/components/ui/Field';
import { RichTextEditor } from './RichTextEditor';
import {
  KpisEditor,
  RepoLinksEditor,
  StepsEditor,
  TimecodesEditor,
} from './StructuredFieldEditors';
import type { Kpi, RepoLink, Timecode, UsecaseStep } from '@/lib/content-types';
import { CoverImageInput } from './CoverImageInput';
import { TagMultiSelect } from './TagMultiSelect';

type Defaults = Record<string, unknown> & { id?: string };

export function ContentForm({
  tags,
  routeDays,
  defaults,
  assignedTagIds,
  previewHref,
  canPublish = false,
  courseModules = [],
}: {
  tags: { id: string; title: string }[];
  routeDays: { id: string; dayNumber: number; title: string }[];
  defaults?: Defaults;
  assignedTagIds?: string[];
  previewHref?: string;
  canPublish?: boolean;
  courseModules?: Array<{ id: string; title: string; courseTitle: string }>;
}) {
  const [state, action, pending] = useActionState(saveContent, initialActionState);
  const d = defaults ?? {};
  const [type, setType] = useState<string>((d.type as string) ?? 'USECASE');
  const [placementKind, setPlacementKind] = useState<string>(
    (d.placementKind as string) ?? (d.moduleId ? 'COURSE' : d.routeDayId ? 'ROUTE' : 'NONE'),
  );

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
          <div className="sm:col-span-2">
            <Label>Обложка</Label>
            <CoverImageInput defaultValue={(d.coverUrl as string) ?? ''} />
          </div>
          <div>
            <Label htmlFor="timeToMaster">Примерное время материала</Label>
            <Input id="timeToMaster" name="timeToMaster" defaultValue={d.timeToMaster as string} />
            <p className="mt-1 text-xs font-light text-t500">
              Например: «20 минут видео + 30 минут практики».
            </p>
          </div>
          <div>
            <Label htmlFor="minPlan">Доступ</Label>
            <Select id="minPlan" name="minPlan" defaultValue="SUPPORT">
              <option value="SUPPORT">Включён в единую подписку</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="state">Статус</Label>
            <Select id="state" name="state" defaultValue={(d.state as string) ?? 'DRAFT'}>
              <option value="DRAFT">Черновик</option>
              {d.state === 'PUBLISHED' ? <option value="PUBLISHED">Опубликован</option> : null}
              {canPublish ? <option value="ARCHIVED">Архив</option> : null}
            </Select>
          </div>
          {type !== 'LESSON' ? (
            <div>
              <Label htmlFor="sort">Порядок в общем списке</Label>
              <Input
                id="sort"
                name="sort"
                type="number"
                mono
                defaultValue={(d.sort as number) ?? 0}
              />
            </div>
          ) : (
            <input type="hidden" name="sort" value={String((d.sort as number) ?? 0)} />
          )}
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
            <TagMultiSelect initialTags={tags} initialSelected={assignedTagIds} />
          </div>
          {d.state === 'PUBLISHED' && canPublish ? (
            <div className="sm:col-span-2">
              <Checkbox name="notify" label="Уведомить студентов после сохранения" />
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Видео // Kinescope">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="kinescopeId">Kinescope ID</Label>
            <Input
              id="kinescopeId"
              name="kinescopeId"
              mono
              defaultValue={d.kinescopeId as string}
            />
          </div>
          <div>
            <Label htmlFor="durationSec">Длительность (сек)</Label>
            <Input
              id="durationSec"
              name="durationSec"
              type="number"
              mono
              defaultValue={d.durationSec as number}
            />
          </div>
          <div className="sm:col-span-2">
            <TimecodesEditor defaults={(d.timecodes as Timecode[] | undefined) ?? []} />
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
        <Panel title="Урок // Программа и текстовая версия">
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="placementKind">Где будет находиться урок</Label>
              <Select
                id="placementKind"
                name="placementKind"
                value={placementKind}
                onChange={(event) => setPlacementKind(event.target.value)}
              >
                <option value="COURSE">В курсе и модуле</option>
                <option value="ROUTE">В маршруте «3 дня»</option>
                <option value="NONE">Пока не размещать</option>
              </Select>
              <p className="mt-1 text-xs font-light text-t500">
                Урок может находиться либо в курсе, либо в маршруте. Порядок уроков настраивается
                перетаскиванием в визуальном редакторе.
              </p>
            </div>
            {placementKind === 'COURSE' ? (
              <div className="sm:col-span-2">
                <Label htmlFor="moduleId">Курс и модуль</Label>
                <Select id="moduleId" name="moduleId" defaultValue={(d.moduleId as string) ?? ''}>
                  <option value="">— выберите модуль —</option>
                  {courseModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.courseTitle} · {module.title}
                    </option>
                  ))}
                </Select>
                {err('moduleId')}
                <p className="mt-1 text-xs font-light text-t500">
                  Создавать модули и менять порядок можно в разделе «Курсы».
                </p>
              </div>
            ) : null}
            {placementKind === 'ROUTE' ? (
              <div className="sm:col-span-2">
                <Label htmlFor="routeDayId">День маршрута</Label>
                <Select
                  id="routeDayId"
                  name="routeDayId"
                  defaultValue={(d.routeDayId as string) ?? ''}
                >
                  <option value="">— выберите день —</option>
                  {routeDays.map((r) => (
                    <option key={r.id} value={r.id}>
                      День {r.dayNumber}: {r.title}
                    </option>
                  ))}
                </Select>
                {err('routeDayId')}
              </div>
            ) : null}
            <div>
              <Label htmlFor="methodTag">Принцип метода</Label>
              <Input
                id="methodTag"
                name="methodTag"
                defaultValue={d.methodTag as string}
                placeholder="сегментация ABCDX"
              />
            </div>
            <div className="sm:col-span-2">
              <RichTextEditor
                name="articleHtml"
                label="Текстовая версия урока"
                hint="Полный материал для студента, который предпочитает читать. Используйте заголовки, списки и ссылки — HTML писать не нужно."
                defaultValue={(d.articleHtml as string) ?? ''}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="lesson-transcript">Транскрипт видео — необязательно</Label>
              <Textarea
                id="lesson-transcript"
                name="transcript"
                rows={8}
                defaultValue={d.transcript as string}
              />
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
              <KpisEditor defaults={(d.kpis as Kpi[] | undefined) ?? []} />
              {err('kpisJson')}
            </div>
            <div>
              <RichTextEditor
                name="descriptionHtml"
                label="Описание юзкейса"
                hint="Контекст, исходная ситуация и важные детали. HTML писать не нужно."
                defaultValue={(d.descriptionHtml as string) ?? ''}
              />
            </div>
            <div>
              <RepoLinksEditor defaults={(d.repoLinks as RepoLink[] | undefined) ?? []} />
              {err('repoLinksJson')}
            </div>
            <div>
              <StepsEditor defaults={(d.steps as UsecaseStep[] | undefined) ?? []} />
              {err('stepsJson')}
            </div>
            <div>
              <RichTextEditor
                name="articleHtml"
                label="Статья-разбор"
                hint="Подробный материал для студента: заголовки, абзацы, списки и ссылки."
                defaultValue={(d.articleHtml as string) ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="transcript">Транскрипт</Label>
              <Textarea
                id="transcript"
                name="transcript"
                rows={8}
                defaultValue={d.transcript as string}
              />
            </div>
          </div>
        </Panel>
      ) : null}

      {type === 'STREAM' ? (
        <Panel title="Эфир // Запись">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="airedAt">Дата эфира</Label>
              <Input
                id="airedAt"
                name="airedAt"
                type="datetime-local"
                mono
                defaultValue={d.airedAt as string}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="transcript-s">Транскрипт</Label>
              <Textarea
                id="transcript-s"
                name="transcript"
                mono
                rows={4}
                defaultValue={d.transcript as string}
              />
            </div>
            <div className="sm:col-span-2">
              <RichTextEditor
                name="articleHtml"
                label="Статья или конспект эфира"
                hint="Оформите текст заголовками и списками. HTML писать не нужно."
                defaultValue={(d.articleHtml as string) ?? ''}
              />
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
