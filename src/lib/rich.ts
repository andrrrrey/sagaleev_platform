/**
 * Извлекает HTML из rich-text поля (description/article). В Ф1 храним как
 * { html: string } или строку. TipTap-JSON рендер добавим при подключении TipTap.
 */
export function richToHtml(json: unknown): string | null {
  if (!json) return null;
  if (typeof json === 'string') return json;
  if (typeof json === 'object' && json !== null && 'html' in json) {
    const html = (json as { html?: unknown }).html;
    return typeof html === 'string' ? html : null;
  }
  return null;
}
