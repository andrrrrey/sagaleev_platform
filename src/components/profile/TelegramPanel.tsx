'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';

export function TelegramPanel({ linked, username }: { linked: boolean; username: string | null }) {
  const router = useRouter();
  const { notify } = useToast();
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    try {
      const res = await fetch('/api/me/telegram/link', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setLink(data.link);
      setToken(data.token);
    } catch {
      notify('Не удалось создать ссылку');
    } finally {
      setPending(false);
    }
  }

  async function unlink() {
    setPending(true);
    try {
      await fetch('/api/me/telegram/link', { method: 'DELETE' });
      notify('Telegram отвязан');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (linked) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <StatusPill>Привязан{username ? ` · @${username}` : ''}</StatusPill>
        <Button type="button" variant="secondary" onClick={unlink} disabled={pending} className="self-start">
          <Icon name="close-circle-linear" />
          Отвязать
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm font-light text-t600">
        Привяжите Telegram, чтобы получать уведомления о разборах, новом контенте и эфирах.
      </p>
      <Button type="button" onClick={generate} disabled={pending} className="self-start">
        <Icon name="plain-linear" />
        {pending ? 'Готовим…' : 'Привязать Telegram'}
      </Button>
      {token ? (
        <div className="flex flex-col gap-2 border border-line bg-surface p-4">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-accent underline">
              Открыть бота и подтвердить →
            </a>
          ) : (
            <p className="font-mono text-xs text-t600">
              Отправьте боту: <span className="text-accent">/start {token}</span> (ссылка появится после настройки бота)
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-widest text-t400">Код действует 15 минут</p>
        </div>
      ) : null}
    </div>
  );
}
