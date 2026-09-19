import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { SkillGroup } from '@prisma/client';
import { getActor } from '@/server/auth/session';
import { listSkills, type SkillFilters } from '@/server/skills/service';
import { prisma } from '@/server/db';
import { SKILL_GROUPS } from '@/lib/skill-groups';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { SkillsFilterBar } from '@/components/skills/SkillsFilterBar';
import { SkillCardView } from '@/components/skills/SkillCardView';

export const metadata: Metadata = { title: 'Скиллы' };

const GROUP_CODES = new Set(SKILL_GROUPS.map((g) => g.code));

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const sp = await searchParams;
  const groupParam = sp.group && GROUP_CODES.has(sp.group as SkillGroup) ? (sp.group as SkillGroup) : undefined;
  const filters: SkillFilters = {
    q: sp.q,
    group: groupParam,
    tags: sp.tags ? sp.tags.split(',').filter(Boolean) : undefined,
    availableOnly: sp.available === '1',
    status: sp.status === 'started' ? 'started' : sp.status === 'not_started' ? 'not_started' : undefined,
  };

  const [cards, tags] = await Promise.all([
    listSkills(actor, filters),
    prisma.tag.findMany({
      where: { skills: { some: {} } },
      orderBy: { title: 'asc' },
      select: { slug: true, title: true },
    }),
  ]);

  const groupsToRender = groupParam ? SKILL_GROUPS.filter((g) => g.code === groupParam) : SKILL_GROUPS;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Скиллы"
        title="Библиотека маркетинг-скиллов"
        description="Каждый скилл — маркетинг-функция с бизнес-результатом. Отправляй агенту одной кнопкой."
      />

      <Suspense fallback={<div className="mb-8 h-24 animate-pulse bg-line/30" />}>
        <SkillsFilterBar tags={tags} />
      </Suspense>

      {cards.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Скиллы // Empty">Ничего не найдено. Сбросьте фильтры.</EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {groupsToRender.map((g) => {
            const groupCards = cards.filter((c) => c.group === g.code);
            if (groupCards.length === 0) return null;
            return (
              <section key={g.code}>
                <div className="mb-5 flex items-center gap-3 border-b border-line/60 pb-3 font-mono text-xs uppercase tracking-widest text-accent">
                  <Icon name={g.icon} className="text-accent" />
                  {g.title}
                  <span className="text-t400">· {groupCards.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupCards.map((c) => (
                    <SkillCardView key={c.slug} skill={c} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
