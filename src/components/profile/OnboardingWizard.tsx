'use client';

import { useActionState, useState } from 'react';
import { saveBusinessProfile } from '@/server/profile/actions';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { SegmentedProgress } from '@/components/ui/ProgressBar';
import { Label, Input, Textarea, Select, FieldError } from '@/components/ui/Field';

const STEPS = ['Кто ты', 'Продукт', 'Клиент', 'Голос бренда'] as const;

export function OnboardingWizard({
  defaults,
  redirectTo = '/',
  submitLabel = 'Завершить онбординг',
}: {
  defaults?: Partial<Record<string, string>>;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState(saveBusinessProfile, initialActionState);
  const [step, setStep] = useState(0);
  const d = defaults ?? {};

  return (
    <Panel
      title={`Онбординг // ${STEPS[step]}`}
      status={<StatusPill pulse>{`Шаг ${step + 1} / 4`}</StatusPill>}
    >
      <form action={action} className="flex flex-col gap-6 p-6 md:p-8">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <SegmentedProgress total={4} filled={step + 1} />

        {/* Шаг 1 */}
        <div className={step === 0 ? 'flex flex-col gap-5' : 'hidden'}>
          <div>
            <Label htmlFor="companyName">Компания</Label>
            <Input id="companyName" name="companyName" defaultValue={d.companyName} required />
            <FieldError>{state.fieldErrors?.companyName}</FieldError>
          </div>
          <div>
            <Label htmlFor="niche">Ниша / сфера</Label>
            <Input id="niche" name="niche" defaultValue={d.niche} required />
            <FieldError>{state.fieldErrors?.niche}</FieldError>
          </div>
          <div>
            <Label htmlFor="websiteUrl">Сайт / соцсети (необязательно)</Label>
            <Input id="websiteUrl" name="websiteUrl" type="url" mono defaultValue={d.websiteUrl} />
            <FieldError>{state.fieldErrors?.websiteUrl}</FieldError>
          </div>
          <div>
            <Label htmlFor="whoAmI">Расскажи о себе как о собственнике</Label>
            <Textarea id="whoAmI" name="whoAmI" rows={3} defaultValue={d.whoAmI} required />
            <FieldError>{state.fieldErrors?.whoAmI}</FieldError>
          </div>
        </div>

        {/* Шаг 2 */}
        <div className={step === 1 ? 'flex flex-col gap-5' : 'hidden'}>
          <div>
            <Label htmlFor="product">Что продаёшь: продукт, средний чек, ключевые услуги</Label>
            <Textarea id="product" name="product" rows={4} defaultValue={d.product} required />
            <FieldError>{state.fieldErrors?.product}</FieldError>
          </div>
        </div>

        {/* Шаг 3 */}
        <div className={step === 2 ? 'flex flex-col gap-5' : 'hidden'}>
          <div>
            <Label htmlFor="audience">Кто покупает, где ищет, какие боли</Label>
            <Textarea id="audience" name="audience" rows={4} defaultValue={d.audience} required />
            <FieldError>{state.fieldErrors?.audience}</FieldError>
          </div>
        </div>

        {/* Шаг 4 */}
        <div className={step === 3 ? 'flex flex-col gap-5' : 'hidden'}>
          <div>
            <Label htmlFor="brandVoice">Голос бренда: тон, слова-маркеры, чего избегать, примеры</Label>
            <Textarea id="brandVoice" name="brandVoice" rows={4} defaultValue={d.brandVoice} required />
            <FieldError>{state.fieldErrors?.brandVoice}</FieldError>
          </div>
          <div>
            <Label htmlFor="monthlyRevenueBand">Ориентир по выручке (необязательно)</Label>
            <Select id="monthlyRevenueBand" name="monthlyRevenueBand" defaultValue={d.monthlyRevenueBand ?? ''}>
              <option value="">Не указывать</option>
              <option value="&lt;300k">до 300 000 ₽/мес</option>
              <option value="300k-1m">300 000 – 1 000 000 ₽/мес</option>
              <option value="1m-3m">1 – 3 млн ₽/мес</option>
              <option value="&gt;3m">более 3 млн ₽/мес</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="goals">Цель курса (необязательно)</Label>
            <Textarea id="goals" name="goals" rows={2} defaultValue={d.goals} />
          </div>
        </div>

        {state.message && !state.ok ? (
          <p className="font-mono text-[11px] text-[#d95321]">{state.message}</p>
        ) : null}

        <div className="flex items-center justify-between border-t border-[#e0dcd0]/60 pt-5">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <Icon name="alt-arrow-left-linear" />
            Назад
          </Button>

          {step < 3 ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}>
              Далее
              <Icon name="alt-arrow-right-linear" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              <Icon name="check-circle-linear" />
              {pending ? 'Сохраняем…' : submitLabel}
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}
