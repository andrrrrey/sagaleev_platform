'use client';

import { useActionState } from 'react';
import { saveWeeklyReport } from '@/server/curator/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Textarea } from '@/components/ui/Field';

export function WeeklyReportForm({ defaultText }: { defaultText?: string | null }) {
  const [state, action, pending] = useActionState(saveWeeklyReport, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4 p-6">
      <div>
        <Label htmlFor="report">Что сделал за неделю (куратор учтёт)</Label>
        <Textarea id="report" name="text" rows={3} defaultValue={defaultText ?? ''} />
      </div>
      {state.message ? <p className="font-mono text-[11px] text-t500">{state.message}</p> : null}
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  );
}
