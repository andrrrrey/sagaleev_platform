'use client';

import { useMemo, type MouseEvent } from 'react';
import { addCopyControlsToCodeBlocks } from '@/lib/rich-code-blocks';
import { useToast } from '@/components/ui/Toast';

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function RichContent({ html }: { html: string }) {
  const { notify } = useToast();
  const enhancedHtml = useMemo(() => addCopyControlsToCodeBlocks(html), [html]);

  async function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;
    const block = button.closest<HTMLElement>('[data-rich-code-block]');
    const text = block?.querySelector('pre')?.textContent ?? '';
    if (!text) return;
    try {
      await writeClipboard(text);
      notify('Скопировано');
    } catch {
      notify('Не удалось скопировать');
    }
  }

  return (
    <div
      onClick={handleClick}
      className="text-[15px] leading-relaxed text-t700 [&_[data-copy-code]]:absolute [&_[data-copy-code]]:right-3 [&_[data-copy-code]]:top-3 [&_[data-copy-code]]:z-10 [&_[data-copy-code]]:inline-flex [&_[data-copy-code]]:items-center [&_[data-copy-code]]:gap-2 [&_[data-copy-code]]:rounded-xl [&_[data-copy-code]]:border [&_[data-copy-code]]:border-line [&_[data-copy-code]]:bg-paper [&_[data-copy-code]]:px-3 [&_[data-copy-code]]:py-2 [&_[data-copy-code]]:text-xs [&_[data-copy-code]]:font-medium [&_[data-copy-code]]:text-t700 [&_[data-copy-code]]:shadow-sm [&_[data-copy-code]]:transition-colors [&_[data-copy-code]]:hover:border-accent/30 [&_[data-copy-code]]:hover:text-accent [&_[data-rich-code-block]]:relative [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:text-t800 [&_code]:rounded-md [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-t900 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-t800 [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-semibold [&_h4]:text-t800 [&_li]:mb-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-surface [&_pre]:px-4 [&_pre]:pb-4 [&_pre]:pt-14 [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: enhancedHtml }}
    />
  );
}
