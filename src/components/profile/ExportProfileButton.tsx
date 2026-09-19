'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

/** Копирует markdown бизнес-профиля для загрузки агентом. */
export function ExportProfileButton() {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);

  async function copy() {
    setPending(true);
    try {
      const res = await fetch('/api/me/business-profile/export');
      if (!res.ok) throw new Error();
      const md = await res.text();
      await navigator.clipboard.writeText(md);
      notify('Бизнес-профиль скопирован');
    } catch {
      notify('Не удалось скопировать');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="action" type="button" onClick={copy} disabled={pending}>
      <Icon name="copy-linear" className="text-sm text-[#d95321] group-hover:scale-110" />
      Скопировать для агента
    </Button>
  );
}
