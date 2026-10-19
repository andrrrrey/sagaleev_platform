import { describe, expect, it } from 'vitest';
import { addCopyControlsToCodeBlocks } from '@/lib/rich-code-blocks';

describe('специальные текстовые блоки урока', () => {
  it('добавляет кнопку копирования к каждому pre-блоку', () => {
    const html = addCopyControlsToCodeBlocks(
      '<p>До</p><pre><code>Первая команда</code></pre><pre>Второй текст</pre>',
    );
    expect(html).toContain('data-copy-code="0"');
    expect(html).toContain('data-copy-code="1"');
    expect(html).toContain('solar:copy-linear');
    expect(html).toContain('<pre><code>Первая команда</code></pre>');
    expect(html).toContain('<pre>Второй текст</pre>');
  });

  it('не изменяет обычный текст без специальных блоков', () => {
    const html = '<p>Обычный текст урока</p>';
    expect(addCopyControlsToCodeBlocks(html)).toBe(html);
  });
});
