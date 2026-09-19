'use client';

import { useActionState, useState } from 'react';
import type { ProgressStatus } from '@prisma/client';
import { updateSkillStatus } from '@/server/skills/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Textarea, FieldError } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const STEPS: { status: ProgressStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Сдал' },
  { status: 'IMPLEMENTED', label: 'Внедрил' },
  { status: 'RESULT', label: 'Результат' },
];

const RANK: Record<ProgressStatus, number> = {
  NONE: 0,
  VIEWED: 1,
  SUBMITTED: 2,
  IMPLEMENTED: 3,
  RESULT: 4,
};

export function SkillStatusForm({
  slug,
  current,
  proofNote,
}: {
  slug: string;
  current: ProgressStatus;
  proofNote: string | null;
}) {
  const [state, action, pending] = useActionState(updateSkillStatus, initialActionState);
  const [selected, setSelected] = useState<ProgressStatus>(() => {
    const next = STEPS.find((s) => RANK[s.status] > RANK[current]);
    return next?.status ?? 'RESULT';
  });

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={selected} />

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
