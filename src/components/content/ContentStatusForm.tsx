'use client';

import { useActionState, useState } from 'react';
import type { ProgressStatus } from '@prisma/client';
import { updateContentStatus } from '@/server/content/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Textarea, FieldError } from '@/components/ui/Field';
import { MoneyEntryModal } from '@/components/money/MoneyEntryModal';
import { cn } from '@/lib/utils';

const STEPS: { status: ProgressStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Сдал' },
  { status: 'IMPLEMENTED', label: 'Внедрил' },
  { status: 'RESULT', label: 'Результат' },
];
const RANK: Record<ProgressStatus, number> = { NONE: 0, VIEWED: 1, SUBMITTED: 2, IMPLEMENTED: 3, RESULT: 4 };

/** Панель статуса юнита: Просмотрел/Сдал/Внедрил/Результат + proof + деньги. */
export function ContentStatusForm({
  slug,
  current,
  proofNote,
}: {
  slug: string;
  current: ProgressStatus;
  proofNote: string | null;
}) {
  const [state, action, pending] = useActionState(updateContentStatus, initialActionState);
  const [selected, setSelected] = useState<ProgressStatus>(() => {
    const next = STEPS.find((s) => RANK[s.status] > RANK[current]);
    return next?.status ?? 'RESULT';
  });

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={selected} />

      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-t400">
        <Icon
          name={RANK[current] >= 1 ? 'check-circle-linear' : 'clock-circle-linear'}
          className={cn('text-sm', RANK[current] >= 1 ? 'text-accent' : 'text-t400')}
        />
        Просмотрел {RANK[current] >= 1 ? '· готово' : '· автоматически при 80%'}
      </div>

      <div className="flex flex-wrap gap-1">
        {STEPS.map((s) => {
          const done = RANK[current] >= RANK[s.status];
          const isSel = selected === s.status;
          return (
            <button
              key={s.status}
              type="button"
              onClick={() => setSelected(s.status)}
              className={cn(
                '-ml-px flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-xs transition-colors',
                isSel
                  ? 'border-b-accent bg-surface text-t900'
                  : done
                    ? 'bg-surface text-accent'
                    : 'bg-transparent text-t500 hover:bg-paper-hover',
              )}
            >
              {done ? <Icon name="check-circle-linear" className="text-xs text-accent" /> : null}
              {s.label}
            </button>
          );
        })}
      </div>

      <div>
        <Label htmlFor="proofNote">Что сделал (обязательно для «Внедрил»/«Результат»)</Label>
        <Textarea id="proofNote" name="proofNote" rows={2} defaultValue={proofNote ?? ''} />
        <FieldError>{state.fieldErrors?.proofNote}</FieldError>
      </div>

      {selected === 'RESULT' ? (
        <div className="flex items-center gap-3">
          <span className="text-xs font-light text-t600">Для «Результата» нужна запись о деньгах:</span>
          <MoneyEntryModal label="Движение по деньгам" />
        </div>
      ) : null}

      {state.message ? (
        <p className={cn('font-mono text-[11px]', state.ok ? 'text-t500' : 'text-accent')}>{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        <Icon name="diploma-verified-linear" />
        {pending ? 'Сохраняем…' : 'Обновить статус'}
      </Button>
    </form>
  );
}
