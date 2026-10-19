'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { cancelSubscription } from '@/server/profile/settings-actions';

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending}
      className="border-red-500 bg-red-500 hover:border-red-600 hover:bg-red-600 hover:shadow-red-500/20"
    >
      {pending ? 'Отключаем…' : 'Да, отменить подписку'}
    </Button>
  );
}

export function SubscriptionCancelControl({ accessUntil }: { accessUntil: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Отменить подписку
        </Button>
        <p className="text-sm font-light text-t600">
          При отмене новых списаний не будет, а доступ сохранится до {accessUntil}.
        </p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Отмена подписки">
        <div className="flex flex-col gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500">
            <Icon name="danger-triangle-linear" className="text-2xl" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-t900">Отменить подписку?</h2>
            <p className="text-base font-light leading-relaxed text-t600">
              После отмены новые автоматические списания выполняться не будут.
            </p>
          </div>

          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-t700">
            Доступ к урокам, юзкейсам и скиллам сохранится до конца оплаченного периода —{' '}
            <strong className="font-semibold text-t900">до {accessUntil}</strong>. Затем подписка
            завершится автоматически.
          </div>

          <p className="text-sm font-light leading-relaxed text-t600">
            Пока оплаченный период не закончился, автопродление можно снова включить в этом разделе
            профиля.
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Оставить подписку
            </Button>
            <form action={cancelSubscription}>
              <ConfirmButton />
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
}
