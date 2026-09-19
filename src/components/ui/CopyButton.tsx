'use client';

import { Button, type ButtonVariant } from './Button';
import { Icon } from './Icon';
import { useToast } from './Toast';

/** Копирование текста (Clipboard API + fallback), тост «Скопировано». docs/04 §5. */
export function CopyButton({
  text,
  label = 'Скопировать',
  variant = 'action',
}: {
  text: string;
  label?: string;
  variant?: ButtonVariant;
}) {
  const { notify } = useToast();

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      notify('Скопировано');
    } catch {
      notify('Не удалось скопировать');
    }
  }

  return (
    <Button variant={variant} onClick={copy} type="button">
      <Icon name="copy-linear" className="text-sm text-accent transition-transform group-hover:scale-110" />
      {label}
    </Button>
  );
}
