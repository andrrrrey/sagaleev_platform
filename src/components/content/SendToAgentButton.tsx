'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { useToast } from '@/components/ui/Toast';

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

/**
 * «Отправить агенту»: раскрывает промпт, копирует в буфер и (для скиллов/юнитов)
 * шлёт событие sent_to_agent → ставит VIEWED один раз. docs/04 §5.
 */
export function SendToAgentButton({
  prompt,
  sendUrl,
  label = 'Отправить агенту',
}: {
  prompt: string;
  /** POST-эндпоинт для события sent_to_agent (ставит VIEWED). */
  sendUrl?: string;
  label?: string;
}) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  async function handle() {
    setOpen(true);
    try {
      await copyText(prompt);
      notify('Промпт скопирован');
    } catch {
      notify('Не удалось скопировать');
    }
    if (sendUrl && !sent) {
      setSent(true);
      // Событие идемпотентно на сервере (VIEWED ставится один раз).
      void fetch(sendUrl, { method: 'POST' }).catch(() => setSent(false));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="action" type="button" onClick={handle} className="self-start">
        <Icon
          name="play-circle-linear"
          className="text-sm text-accent transition-transform group-hover:scale-110"
        />
        {label}
      </Button>
      {open ? (
        <LinedBlock label="Prompt">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-[28px]">
            {prompt}
          </pre>
        </LinedBlock>
      ) : null}
    </div>
  );
}
