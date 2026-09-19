'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { RouteStepView } from '@/server/route/service';
import { saveStepProgress } from '@/server/route/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { CopyButton } from '@/components/ui/CopyButton';
import { Label, Input, Textarea, Checkbox, FieldError } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

export function RouteStepItem({
  step,
  dayNumber,
  index,
}: {
  step: RouteStepView;
  dayNumber: number;
  index: number;
}) {
  const [open, setOpen] = useState(!step.done);
  const [state, action, pending] = useActionState(saveStepProgress, initialActionState);

  return (
    <div className="border border-line bg-paper-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-paper-hover/40"
        aria-expanded={open}
      >
        <Icon
          name={step.done ? 'check-circle-linear' : 'clock-circle-linear'}
          className={cn('text-lg', step.done ? 'text-accent' : 'text-t400')}
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-t400">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={cn('flex-1 text-sm', step.done ? 'text-t500 line-through' : 'text-t800')}>
          {step.title}
        </span>
        <Icon
          name={open ? 'alt-arrow-down-linear' : 'alt-arrow-right-linear'}
          className="text-t400"
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-5 border-t border-line/60 p-4 md:p-6">
          {step.body ? (
            <div
              className="text-sm font-light leading-relaxed text-t700 [&_a]:text-accent [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: step.body }}
            />
          ) : null}

          {step.commands.map((c, i) => (
            <div key={i} className="flex flex-col gap-2">
              <LinedBlock label={c.kind === 'prompt' ? `Промпт · ${c.label}` : `Команда · ${c.label}`}>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-[28px]">
                  {c.text}
                </pre>
              </LinedBlock>
              <CopyButton text={c.text} label="Скопировать" />
            </div>
          ))}

          {step.linkedSkill ? (
            <Link
              href={`/skills/${step.linkedSkill.slug}`}
              className="flex items-center justify-between border border-line bg-surface px-4 py-3 transition-colors hover:border-accent/30"
            >
              <span className="flex items-center gap-2 text-sm font-light text-t700">
                <Icon name="bolt-linear" className="text-accent" />
                Подключить скилл: {step.linkedSkill.title}
              </span>
              <Icon name="arrow-right-linear" className="text-t400" />
            </Link>
          ) : null}

          {/* Фиксация артефакта */}
          <form action={action} className="flex flex-col gap-4 border-t border-line/60 pt-4">
            <input type="hidden" name="stepId" value={step.id} />
            <input type="hidden" name="dayNumber" value={dayNumber} />
            <Checkbox
              name="done"
              defaultChecked={step.done}
              label={step.artifactRequired ? 'Сделал (зафиксируй артефакт)' : 'Сделал'}
            />
            <div>
              <Label htmlFor={`note-${step.id}`}>
                Что получилось{step.artifactHint ? ` — ${step.artifactHint}` : ''}
              </Label>
              <Textarea
                id={`note-${step.id}`}
                name="artifactNote"
                rows={2}
                defaultValue={step.artifactNote ?? ''}
                placeholder="Опиши результат или вставь текст"
              />
              <FieldError>{state.fieldErrors?.artifactNote}</FieldError>
            </div>
            <div>
              <Label htmlFor={`url-${step.id}`}>Ссылка (необязательно)</Label>
              <Input
                id={`url-${step.id}`}
                name="artifactUrl"
                type="url"
                mono
                defaultValue={step.artifactUrl ?? ''}
                placeholder="https://…"
              />
            </div>
            {state.message ? (
              <p className={cn('font-mono text-[11px]', state.ok ? 'text-t500' : 'text-accent')}>
                {state.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="self-start">
              <Icon name="check-circle-linear" />
              {pending ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
