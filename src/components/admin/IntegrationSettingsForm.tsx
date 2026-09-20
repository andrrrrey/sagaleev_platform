'use client';

import { useActionState } from 'react';
import { saveIntegrationSettings } from '@/server/admin/settings';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Label, Input, Checkbox } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import type { SettingView } from '@/server/settings/store';

function SourceHint({ item }: { item: SettingView }) {
  if (item.source === 'db') {
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest text-t400">
        Задано в админке{item.kind === 'secret' && item.display ? ` · ${item.display}` : ''}
      </span>
    );
  }
  if (item.source === 'env') {
    return (
      <span className="font-mono text-[10px] uppercase tracking-widest text-t400">
        Из окружения (.env){item.kind === 'secret' && item.display ? ` · ${item.display}` : ''}
      </span>
    );
  }
  return <span className="font-mono text-[10px] uppercase tracking-widest text-t400">Не задано</span>;
}

export function IntegrationSettingsForm({ settings }: { settings: SettingView[] }) {
  const [state, action, pending] = useActionState(saveIntegrationSettings, initialActionState);

  const groups = settings.reduce<Record<string, SettingView[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <form action={action} className="flex flex-col gap-6 p-6">
      <p className="text-sm font-light text-t600">
        Все ключи интеграций хранятся здесь. Значение из этой формы имеет приоритет над{' '}
        <span className="font-mono text-xs text-t700">.env</span>. Для секретов оставьте поле пустым,
        чтобы не менять текущее значение; отметьте «Очистить», чтобы вернуть значение из окружения.
      </p>

      {Object.entries(groups).map(([group, items]) => (
        <fieldset key={group} className="border border-line bg-surface">
          <legend className="mx-3 px-2 font-mono text-[10px] uppercase tracking-widest text-t500">
            {group}
          </legend>
          <div className="flex flex-col gap-5 p-5">
            {items.map((item) =>
              item.kind === 'boolean' ? (
                <div key={item.key} className="flex flex-col gap-1">
                  <Checkbox
                    id={item.key}
                    name={item.key}
                    defaultChecked={item.value === 'true' || item.value === '1'}
                    label={item.label}
                  />
                  {item.hint ? (
                    <span className="pl-7 text-xs font-light text-t500">{item.hint}</span>
                  ) : null}
                </div>
              ) : (
                <div key={item.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    {item.isSet ? (
                      <StatusPill muted={item.source === 'env'}>OK</StatusPill>
                    ) : null}
                  </div>
                  <Input
                    id={item.key}
                    name={item.key}
                    mono
                    type={item.kind === 'secret' ? 'password' : 'text'}
                    autoComplete="off"
                    placeholder={
                      item.kind === 'secret'
                        ? item.isSet
                          ? 'Оставьте пустым, чтобы не менять'
                          : (item.placeholder ?? '')
                        : (item.placeholder ?? '')
                    }
                    defaultValue={item.kind === 'secret' ? '' : item.value}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <SourceHint item={item} />
                    {item.kind === 'secret' && item.source === 'db' ? (
                      <Checkbox
                        id={`clear_${item.key}`}
                        name={`clear_${item.key}`}
                        className="scale-90"
                        label={<span className="text-xs">Очистить</span>}
                      />
                    ) : null}
                  </div>
                  {item.hint ? <span className="text-xs font-light text-t500">{item.hint}</span> : null}
                </div>
              ),
            )}
          </div>
        </fieldset>
      ))}

      {state.message ? (
        <p className={`font-mono text-[11px] ${state.ok ? 'text-t500' : 'text-accent'}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        <Icon name="check-circle-linear" />
        {pending ? 'Сохраняем…' : 'Сохранить ключи'}
      </Button>
    </form>
  );
}
