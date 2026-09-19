import type { BusinessProfile } from '@prisma/client';

/**
 * Markdown-блок бизнес-профиля для загрузки агентом в память (День 1 маршрута).
 * Без контактов пользователя.
 */
export function businessProfileMarkdown(p: BusinessProfile): string {
  const lines = [
    '# Бизнес-профиль',
    '',
    `**Компания:** ${p.companyName}`,
    `**Ниша:** ${p.niche}`,
    p.websiteUrl ? `**Сайт:** ${p.websiteUrl}` : null,
    '',
    '## Кто я',
    p.whoAmI,
    '',
    '## Продукт',
    p.product,
    '',
    '## Клиент',
    p.audience,
    '',
    '## Голос бренда',
    p.brandVoice,
    p.goals ? `\n## Цель\n${p.goals}` : null,
    p.monthlyRevenueBand ? `\n**Ориентир по выручке:** ${p.monthlyRevenueBand}` : null,
  ].filter((l): l is string => l !== null);
  return lines.join('\n');
}
