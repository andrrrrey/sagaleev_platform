'use client';

import { useActionState } from 'react';
import { saveCuratorPrompt } from '@/server/admin/settings';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Textarea } from '@/components/ui/Field';

export function CuratorPromptForm({ defaultPrompt }: { defaultPrompt: string }) {
  const [state, action, pending] = useActionState(saveCuratorPrompt, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4 p-6">
      <div>
        <Label htmlFor="prompt">Системный промпт куратора (метод: ABCDX, лестница Ханта, воронка)</Label>
        <Textarea id="prompt" name="prompt" mono rows={8} defaultValue={defaultPrompt} />
      </div>
      {state.message ? (
        <p className={`font-mono text-[11px] ${state.ok ? 'text-t500' : 'text-accent'}`}>{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить промпт'}
      </Button>
    </form>
  );
}
