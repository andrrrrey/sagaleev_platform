'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

/** Скачивание файла скилла: запрашивает presigned URL (TTL 5 мин) и открывает его. */
export function SkillFileButton({ slug, fileName }: { slug: string; fileName?: string }) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const res = await fetch(`/api/skills/${slug}/file`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Ошибка');
      window.open(data.url, '_blank', 'noopener');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Не удалось получить файл');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="secondary" type="button" onClick={download} disabled={pending} className="self-start">
      <Icon name="download-minimalistic-linear" />
      {pending ? 'Готовим ссылку…' : `Скачать файл${fileName ? ` · ${fileName}` : ''}`}
    </Button>
  );
}
