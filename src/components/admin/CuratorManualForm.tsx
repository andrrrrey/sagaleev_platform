'use client';

import { useActionState } from 'react';
import { runCuratorManual } from '@/server/curator/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Field';

type StudentOption = { id: string; name: string };

export function CuratorManualForm({
  students,
  enabled,
}: {
  students: StudentOption[];
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(runCuratorManual, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-4 p-6">
      <Select name="userId" defaultValue="" required>
        <option value="" disabled>
          Выберите студента
        </option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={!enabled || pending} className="self-start">
        <Icon name="refresh-linear" />
        {pending ? 'Формируем разбор…' : 'Запустить разбор'}
      </Button>
      {state.message ? (
        <p className={`text-sm font-light ${state.ok ? 'text-t700' : 'text-accent'}`}>
          {state.message}
        </p>
      ) : null}
      {!enabled ? (
        <p className="font-mono text-[10px] uppercase tracking-widest text-t400">
          Недоступно без ключа/фичефлага
        </p>
      ) : null}
    </form>
  );
}
