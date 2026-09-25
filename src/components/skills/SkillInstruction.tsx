'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

function withoutFrontmatter(source: string): string {
  if (!source.trimStart().startsWith('---')) return source.trim();
  return source.replace(/^\s*---[\s\S]*?---\s*/, '').trim();
}

function InstructionBody({ source }: { source: string }) {
  const lines = withoutFrontmatter(source).split('\n');
  return (
    <div className="space-y-3 text-[15px] font-light leading-7 text-t700">
      {lines.map((line, index) => {
        const value = line.trim();
        if (!value) return <div key={index} className="h-1" />;
        if (value.startsWith('# ')) {
          return (
            <h2 key={index} className="font-display text-2xl font-medium text-t900">
              {value.slice(2)}
            </h2>
          );
        }
        if (value.startsWith('## ')) {
          return (
            <h3 key={index} className="pt-3 font-display text-lg font-medium text-t900">
              {value.slice(3)}
            </h3>
          );
        }
        const numbered = value.match(/^(\d+)\.\s+(.+)$/);
        if (numbered) {
          const number = numbered[1] ?? '';
          const text = numbered[2] ?? '';
          return (
            <div key={index} className="grid grid-cols-[28px_1fr] gap-2">
              <span className="font-mono text-xs text-accent">{number.padStart(2, '0')}</span>
              <span>{text}</span>
            </div>
          );
        }
        if (value.startsWith('- ')) {
          return (
            <div key={index} className="grid grid-cols-[12px_1fr] gap-2">
              <span className="text-accent">•</span>
              <span>{value.slice(2)}</span>
            </div>
          );
        }
        return (
          <Fragment key={index}>
            <p>{value}</p>
          </Fragment>
        );
      })}
    </div>
  );
}

export function SkillInstruction({
  source,
  slug,
  githubSource,
}: {
  source: string;
  slug: string;
  githubSource?: string;
}) {
  const { notify } = useToast();
  const [sent, setSent] = useState(false);

  async function handleCopy() {
    try {
      await copyText(source);
      notify('Полная инструкция скопирована');
      if (!sent) {
        setSent(true);
        void fetch(`/api/skills/${slug}/send-to-agent`, { method: 'POST' }).catch(() =>
          setSent(false),
        );
      }
    } catch {
      notify('Не удалось скопировать инструкцию');
    }
  }

  return (
    <section className="overflow-hidden border border-line bg-surface">
      <div className="flex flex-col gap-4 border-b border-line bg-paper-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Инструкция для агента
          </div>
          <p className="mt-1 text-sm font-light text-t600">
            Прочитайте её или скопируйте целиком в ChatGPT, Codex либо другого агента.
          </p>
        </div>
        <Button type="button" variant="action" onClick={handleCopy} className="shrink-0 self-start">
          <Icon name="copy-linear" />
          Скопировать целиком
        </Button>
      </div>
      <div className="p-5 sm:p-7">
        <InstructionBody source={source} />
      </div>
      {githubSource ? (
        <div className="border-t border-line px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-t400 sm:px-7">
          Источник:{' '}
          <a
            href={githubSource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            оригинальный SKILL.md в GitHub
          </a>
        </div>
      ) : null}
    </section>
  );
}
