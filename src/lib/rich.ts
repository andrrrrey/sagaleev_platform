/**
 * Извлекает HTML из rich-text поля (description/article). В Ф1 храним как
 * { html: string } или строку. TipTap-JSON рендер добавим при подключении TipTap.
 */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'code',
  'pre',
]);

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function safeHref(value: string): string | null {
  const href = value.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) return href;
  return null;
}

/** Консервативная очистка HTML из встроенного редактора перед хранением/показом. */
export function sanitizeRichHtml(input: string): string {
  const withoutDangerousBlocks = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, '');

  return withoutDangerousBlocks.replace(
    /<\/?([a-z][\w-]*)(?:\s[^>]*)?>/gi,
    (tag, rawName: string) => {
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return '';
      if (tag.startsWith('</')) return name === 'br' ? '' : `</${name}>`;
      if (name === 'br') return '<br>';
      if (name !== 'a') return `<${name}>`;
      const hrefMatch = tag.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = safeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '');
      return href
        ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
        : '<a>';
    },
  );
}

export function richToHtml(json: unknown): string | null {
  if (!json) return null;
  if (typeof json === 'string') return sanitizeRichHtml(json);
  if (typeof json === 'object' && json !== null && 'html' in json) {
    const html = (json as { html?: unknown }).html;
    return typeof html === 'string' ? sanitizeRichHtml(html) : null;
  }
  return null;
}
