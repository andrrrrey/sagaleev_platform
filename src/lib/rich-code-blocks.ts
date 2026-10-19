/** Добавляет безопасные кнопки копирования к уже очищенным блокам <pre>. */
export function addCopyControlsToCodeBlocks(html: string): string {
  let index = 0;
  return html.replace(/<pre>([\s\S]*?)<\/pre>/gi, (_match, content: string) => {
    const current = index++;
    return `<div data-rich-code-block><button type="button" data-copy-code="${current}" aria-label="Скопировать текст блока"><iconify-icon icon="solar:copy-linear" aria-hidden="true"></iconify-icon><span>Скопировать</span></button><pre>${content}</pre></div>`;
  });
}
