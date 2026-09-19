import type { SkillGroup } from '@prisma/client';

/** Порядок и русские названия 5 маркетинговых функций (docs/04 S3). */
export const SKILL_GROUPS: { code: SkillGroup; title: string; icon: string }[] = [
  { code: 'STRATEGY', title: 'Стратегия', icon: 'point-on-map-linear' },
  { code: 'TRAFFIC', title: 'Трафик', icon: 'graph-up-linear' },
  { code: 'CONTENT', title: 'Контент', icon: 'pen-new-square-linear' },
  { code: 'RETENTION', title: 'Удержание и деньги', icon: 'wallet-money-linear' },
  { code: 'AGENT_INFRA', title: 'Инфра агента', icon: 'programming-linear' },
];

export const SKILL_GROUP_TITLE: Record<SkillGroup, string> = Object.fromEntries(
  SKILL_GROUPS.map((g) => [g.code, g.title]),
) as Record<SkillGroup, string>;
