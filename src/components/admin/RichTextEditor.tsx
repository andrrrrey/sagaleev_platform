'use client';

import { useRef } from 'react';
import { Icon } from '@/components/ui/Icon';

const TOOL =
  'grid h-8 min-w-8 place-items-center border border-line bg-surface px-2 text-xs text-t700 hover:border-accent/40 hover:text-t900';

export function RichTextEditor({
  name,
  defaultValue = '',
  label,
  hint,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  hint?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);

  function sync() {
    if (hidden.current && editor.current) hidden.current.value = editor.current.innerHTML;
  }

  function command(commandName: string, value?: string) {
    editor.current?.focus();
    document.execCommand(commandName, false, value);
    sync();
  }

  function addLink() {
    const url = window.prompt('Вставьте полный адрес ссылки, например https://example.ru');
    if (url?.trim()) command('createLink', url.trim());
  }

  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-t400">{label}</div>
      {hint ? <p className="mb-2 text-xs font-light text-t500">{hint}</p> : null}
      <div className="border border-line bg-surface focus-within:border-accent/50">
        <div
          className="flex flex-wrap gap-1 border-b border-line bg-paper-panel p-2"
          aria-label="Панель форматирования"
        >
          <button
            type="button"
            className={TOOL}
            onClick={() => command('formatBlock', 'h2')}
            title="Заголовок"
          >
            H2
          </button>
          <button
            type="button"
            className={TOOL}
            onClick={() => command('formatBlock', 'h3')}
            title="Подзаголовок"
          >
            H3
          </button>
          <button
            type="button"
            className={TOOL}
            onClick={() => command('formatBlock', 'p')}
            title="Обычный текст"
          >
            ¶
          </button>
          <button type="button" className={TOOL} onClick={() => command('bold')} title="Жирный">
            <strong>Ж</strong>
          </button>
          <button type="button" className={TOOL} onClick={() => command('italic')} title="Курсив">
            <em>К</em>
          </button>
          <button
            type="button"
            className={TOOL}
            onClick={() => command('insertUnorderedList')}
            title="Маркированный список"
          >
            •
          </button>
          <button
            type="button"
            className={TOOL}
            onClick={() => command('insertOrderedList')}
            title="Нумерованный список"
          >
            1.
          </button>
          <button type="button" className={TOOL} onClick={addLink} title="Добавить ссылку">
            <Icon name="link-linear" />
          </button>
          <button
            type="button"
            className={TOOL}
            onClick={() => command('removeFormat')}
            title="Убрать оформление"
          >
            ×
          </button>
        </div>
        <div
          ref={editor}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          className="min-h-56 px-4 py-3 text-sm font-light leading-7 text-t800 outline-none [&_a]:text-accent [&_a]:underline [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-medium [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: defaultValue }}
        />
      </div>
      <input ref={hidden} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
