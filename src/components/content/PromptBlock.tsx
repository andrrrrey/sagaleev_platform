import { SendToAgentButton } from './SendToAgentButton';

/**
 * Блок ПРОМПТ + «Отправить агенту» (docs/04 S8). Стопы согласования владельца
 * подсвечиваются маркером ⏸ СТОП внутри промпта (текст промпта уже их содержит).
 */
export function PromptBlock({
  prompt,
  slug,
  note,
}: {
  prompt: string;
  slug: string;
  note?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-accent">
        <span className="h-px w-6 bg-accent" />
        Промпт
      </div>
      {note ? <p className="text-sm font-light text-t600">{note}</p> : null}
      <SendToAgentButton prompt={prompt} sendUrl={`/api/content/${slug}/send-to-agent`} />
    </div>
  );
}
