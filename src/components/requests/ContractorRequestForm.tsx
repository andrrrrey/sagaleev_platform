'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createContractorRequest } from '@/server/contractor-requests/actions';
import { CONTRACTOR_SERVICES } from '@/lib/contractor-services';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

export function ContractorRequestForm() {
  const [state, action, pending] = useActionState(createContractorRequest, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state]);

  return (
    <form ref={formRef} action={action} className="space-y-5 p-5 md:p-6">
      <div>
        <Label htmlFor="request-category">Что нужно сделать</Label>
        <select
          id="request-category"
          name="category"
          required
          defaultValue=""
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-t800 outline-none transition-colors focus:border-accent"
        >
          <option value="" disabled>
            Выберите направление
          </option>
          {CONTRACTOR_SERVICES.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
        <FieldError>{state.fieldErrors?.category}</FieldError>
      </div>

      <div>
        <Label htmlFor="request-description">Опишите задачу</Label>
        <textarea
          id="request-description"
          name="description"
          required
          minLength={20}
          rows={7}
          placeholder="Например: нужен лендинг для нового продукта. Есть тексты и фирменные цвета, запустить хотим до конца месяца…"
          className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-t800 outline-none transition-colors placeholder:text-t400 focus:border-accent"
        />
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <FieldError>{state.fieldErrors?.description}</FieldError>
          <span className="text-xs text-t400">Без оплаты на этом этапе</span>
        </div>
      </div>

      {state.message ? (
        <p className={state.ok ? 'text-sm text-accent' : 'text-sm text-red-600'}>{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        <Icon name="plain-linear" />
        {pending ? 'Отправляем…' : 'Отправить запрос'}
      </Button>
    </form>
  );
}
