import type { Prisma, PlanCode, ProgressStatus, SkillGroup } from '@prisma/client';
import { prisma } from '@/server/db';
import { canAccess, redactLocked, assertAccess, type Actor } from '@/server/access';
import { canTransition } from '@/server/progress/scoring';
import { rebuildLeaderboardEntry } from '@/server/progress/leaderboard';
import { HttpError } from '@/server/access/errors';

export type SkillCard = {
  slug: string;
  title: string;
  group: SkillGroup;
  shortDesc: string;
  tags: { slug: string; title: string }[];
  minPlan: PlanCode;
  locked: boolean;
  requiredPlan?: PlanCode;
  status: ProgressStatus;
};

export type SkillFilters = {
  q?: string;
  group?: SkillGroup;
  tags?: string[];
  availableOnly?: boolean;
  status?: 'started' | 'not_started';
};

function isStaff(actor: Actor): boolean {
  return actor.role === 'ADMIN' || actor.role === 'EDITOR';
}

/** Список скиллов с превью для закрытых. Черновики видят только ADMIN/EDITOR. */
export async function listSkills(actor: Actor, filters: SkillFilters): Promise<SkillCard[]> {
  const where: Prisma.SkillWhereInput = {};
  if (!isStaff(actor)) where.state = 'PUBLISHED';
  if (filters.group) where.group = filters.group;
  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { shortDesc: { contains: q, mode: 'insensitive' } },
      { tags: { some: { tag: { title: { contains: q, mode: 'insensitive' } } } } },
    ];
  }
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { some: { tag: { slug: { in: filters.tags } } } };
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: [{ group: 'asc' }, { sort: 'asc' }, { title: 'asc' }],
    include: { tags: { include: { tag: { select: { slug: true, title: true } } } } },
  });

  const progress = await prisma.progress.findMany({
    where: { userId: actor.id, skillId: { in: skills.map((s) => s.id) } },
    select: { skillId: true, status: true },
  });
  const statusBySkill = new Map(progress.map((p) => [p.skillId, p.status]));

  let cards: SkillCard[] = skills.map((s) => {
    const decision = canAccess(actor, { kind: 'skill', minPlan: s.minPlan });
    return {
      slug: s.slug,
      title: s.title,
      group: s.group,
      shortDesc: s.shortDesc,
      tags: s.tags.map((t) => t.tag),
      minPlan: s.minPlan,
      locked: !decision.ok,
      requiredPlan: !decision.ok && decision.code === 'PLAN_REQUIRED' ? decision.requiredPlan : undefined,
      status: statusBySkill.get(s.id) ?? 'NONE',
    };
  });

  if (filters.availableOnly) cards = cards.filter((c) => !c.locked);
  if (filters.status === 'started') cards = cards.filter((c) => c.status !== 'NONE');
  if (filters.status === 'not_started') cards = cards.filter((c) => c.status === 'NONE');

  return cards;
}

export type SkillDetail = {
  slug: string;
  title: string;
  group: SkillGroup;
  shortDesc: string;
  inputs: string;
  outputs: string;
  tags: { slug: string; title: string }[];
  minPlan: PlanCode;
  locked: boolean;
  requiredPlan?: PlanCode;
  status: ProgressStatus;
  proofNote: string | null;
  // Закрытые поля — только при доступе:
  prompt?: string;
  demoVideoId?: string;
  demoUnit?: { slug: string; title: string } | null;
  fileName?: string;
  hasFile?: boolean;
  related?: { slug: string; title: string }[];
  usedInSteps?: { dayNumber: number; title: string }[];
};

export async function getSkillBySlug(actor: Actor, slug: string): Promise<SkillDetail | null> {
  const s = await prisma.skill.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: { select: { slug: true, title: true } } } },
      demoUnit: { select: { slug: true, title: true } },
      routeSteps: { include: { day: { select: { dayNumber: true, title: true } } } },
    },
  });
  if (!s) return null;
  if (s.state !== 'PUBLISHED' && !isStaff(actor)) return null; // 404 для студента

  const decision = canAccess(actor, { kind: 'skill', minPlan: s.minPlan });
  const status =
    (await prisma.progress.findUnique({
      where: { userId_skillId: { userId: actor.id, skillId: s.id } },
      select: { status: true, proofNote: true },
    })) ?? null;

  const base = {
    slug: s.slug,
    title: s.title,
    group: s.group,
    shortDesc: s.shortDesc,
    inputs: s.inputs,
    outputs: s.outputs,
    tags: s.tags.map((t) => t.tag),
    minPlan: s.minPlan,
    status: status?.status ?? ('NONE' as ProgressStatus),
    proofNote: status?.proofNote ?? null,
  };

  if (!decision.ok) {
    // Превью: без промпта/файла/видео.
    return redactLocked(base, decision) as SkillDetail;
  }

  // Связанные скиллы по общим тегам (до 3).
  const tagIds = s.tags.map((t) => t.tagId);
  const related =
    tagIds.length > 0
      ? await prisma.skill.findMany({
          where: {
            id: { not: s.id },
            state: 'PUBLISHED',
            tags: { some: { tagId: { in: tagIds } } },
          },
          take: 3,
          select: { slug: true, title: true },
        })
      : [];

  return {
    ...base,
    locked: false,
    prompt: s.prompt,
    demoVideoId: s.demoVideoId ?? undefined,
    demoUnit: s.demoUnit,
    fileName: s.fileName ?? undefined,
    hasFile: Boolean(s.fileKey),
    related,
    usedInSteps: s.routeSteps.map((rs) => ({ dayNumber: rs.day.dayNumber, title: rs.title })),
  };
}

/** Событие «Отправить агенту»: ставит VIEWED один раз (идемпотентно). */
export async function sendToAgent(actor: Actor, slug: string): Promise<void> {
  const s = await prisma.skill.findUnique({ where: { slug }, select: { id: true, minPlan: true, state: true } });
  if (!s || (s.state !== 'PUBLISHED' && !isStaff(actor))) throw new HttpError('UNAUTHENTICATED');
  assertAccess(actor, { kind: 'skill', minPlan: s.minPlan });

  const existing = await prisma.progress.findUnique({
    where: { userId_skillId: { userId: actor.id, skillId: s.id } },
    select: { status: true },
  });
  if (existing && existing.status !== 'NONE') return; // VIEWED ставится один раз

  await prisma.progress.upsert({
    where: { userId_skillId: { userId: actor.id, skillId: s.id } },
    create: { userId: actor.id, skillId: s.id, status: 'VIEWED', viewedAt: new Date() },
    update: { status: 'VIEWED', viewedAt: new Date() },
  });
  await rebuildLeaderboardEntry(actor.id);
}

/** Смена статуса скилла студентом (SUBMITTED/IMPLEMENTED/RESULT) с proof. */
export async function setSkillProgress(
  actor: Actor,
  slug: string,
  status: ProgressStatus,
  proofNote: string | null,
): Promise<void> {
  const s = await prisma.skill.findUnique({ where: { slug }, select: { id: true, minPlan: true, state: true } });
  if (!s || s.state !== 'PUBLISHED') throw new HttpError('UNAUTHENTICATED');
  assertAccess(actor, { kind: 'skill', minPlan: s.minPlan });

  const existing = await prisma.progress.findUnique({
    where: { userId_skillId: { userId: actor.id, skillId: s.id } },
  });
  const from = existing?.status ?? 'NONE';
  if (!canTransition(from, status, { isAdmin: actor.role === 'ADMIN' })) {
    throw new Error('BAD_TRANSITION');
  }
  if ((status === 'IMPLEMENTED' || status === 'RESULT') && !proofNote?.trim()) {
    throw new Error('PROOF_REQUIRED');
  }

  const now = new Date();
  const stamps: Record<string, Date> = {};
  if (status === 'VIEWED') stamps.viewedAt = now;
  if (status === 'SUBMITTED') stamps.submittedAt = now;
  if (status === 'IMPLEMENTED') stamps.implementedAt = now;
  if (status === 'RESULT') stamps.resultAt = now;

  await prisma.progress.upsert({
    where: { userId_skillId: { userId: actor.id, skillId: s.id } },
    create: { userId: actor.id, skillId: s.id, status, proofNote: proofNote ?? null, ...stamps },
    update: { status, proofNote: proofNote ?? null, ...stamps },
  });
  await rebuildLeaderboardEntry(actor.id);
}

/** Проверка доступа к файлу скилла (для presigned URL). */
export async function assertSkillFileAccess(
  actor: Actor,
  slug: string,
): Promise<{ fileKey: string; fileName: string }> {
  const s = await prisma.skill.findUnique({
    where: { slug },
    select: { minPlan: true, state: true, fileKey: true, fileName: true },
  });
  if (!s || (s.state !== 'PUBLISHED' && !isStaff(actor))) throw new HttpError('UNAUTHENTICATED');
  assertAccess(actor, { kind: 'skill', minPlan: s.minPlan });
  if (!s.fileKey) throw new HttpError('UNAUTHENTICATED');
  return { fileKey: s.fileKey, fileName: s.fileName ?? 'skill-file' };
}
