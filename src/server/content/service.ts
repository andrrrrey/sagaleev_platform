import type { Prisma, PlanCode, ProgressStatus, UnitType } from '@prisma/client';
import { prisma } from '@/server/db';
import { canAccess, assertAccess, type Actor } from '@/server/access';
import { HttpError } from '@/server/access/errors';
import { canTransition } from '@/server/progress/scoring';
import { rebuildLeaderboardEntry } from '@/server/progress/leaderboard';
import {
  parseTimecodes,
  parseKpis,
  parseUsecaseSteps,
  parseRepoLinks,
  type Timecode,
  type Kpi,
  type UsecaseStep,
  type RepoLink,
} from '@/lib/content-types';

/** Просмотр ≥ 80% → VIEWED (docs/03 §2). */
export const VIEWED_THRESHOLD = 80;
export function viewedFromPercent(percent: number): boolean {
  return percent >= VIEWED_THRESHOLD;
}

function isStaff(actor: Actor): boolean {
  return actor.role === 'ADMIN' || actor.role === 'EDITOR';
}

function unitResource(u: { minPlan: PlanCode; partialFreePreview: boolean }) {
  return { kind: 'unit' as const, minPlan: u.minPlan, partialFree: u.partialFreePreview };
}

export type ContentCard = {
  slug: string;
  type: UnitType;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  timeToMaster: string | null;
  tags: { slug: string; title: string }[];
  caseClient: string | null;
  block: number | null;
  methodTag: string | null;
  airedAt: string | null;
  durationSec: number | null;
  minPlan: PlanCode;
  locked: boolean;
  requiredPlan?: PlanCode;
  status: ProgressStatus;
  kpis: Kpi[];
};

export type ContentFilters = {
  type?: UnitType;
  block?: number;
  tags?: string[];
  q?: string;
  client?: string;
};

export async function listContent(actor: Actor, filters: ContentFilters): Promise<ContentCard[]> {
  const where: Prisma.ContentUnitWhereInput = {};
  if (!isStaff(actor)) where.state = 'PUBLISHED';
  if (filters.type) where.type = filters.type;
  if (typeof filters.block === 'number') where.block = filters.block;
  if (filters.client) where.caseClient = filters.client;
  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { summary: { contains: q, mode: 'insensitive' } },
      { tags: { some: { tag: { title: { contains: q, mode: 'insensitive' } } } } },
    ];
  }
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { some: { tag: { slug: { in: filters.tags } } } };
  }

  const units = await prisma.contentUnit.findMany({
    where,
    orderBy: [{ type: 'asc' }, { block: 'asc' }, { sort: 'asc' }, { publishedAt: 'desc' }],
    include: { tags: { include: { tag: { select: { slug: true, title: true } } } } },
  });

  const progress = await prisma.progress.findMany({
    where: { userId: actor.id, unitId: { in: units.map((u) => u.id) } },
    select: { unitId: true, status: true },
  });
  const statusByUnit = new Map(progress.map((p) => [p.unitId, p.status]));

  return units.map((u) => {
    const decision = canAccess(actor, unitResource(u));
    const locked = !decision.ok;
    return {
      slug: u.slug,
      type: u.type,
      title: u.title,
      summary: u.summary,
      coverUrl: u.coverUrl,
      timeToMaster: u.timeToMaster,
      tags: u.tags.map((t) => t.tag),
      caseClient: u.caseClient,
      block: u.block,
      methodTag: u.methodTag,
      airedAt: u.airedAt?.toISOString() ?? null,
      durationSec: u.durationSec,
      minPlan: u.minPlan,
      locked,
      requiredPlan: locked && decision.code === 'PLAN_REQUIRED' ? decision.requiredPlan : undefined,
      status: statusByUnit.get(u.id ?? '') ?? 'NONE',
      kpis: locked ? [] : parseKpis(u.kpis),
    };
  });
}

export type ContentDetail = {
  id: string;
  slug: string;
  type: UnitType;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  timeToMaster: string | null;
  tags: { slug: string; title: string }[];
  minPlan: PlanCode;
  locked: boolean;
  requiredPlan?: PlanCode;
  status: ProgressStatus;
  proofNote: string | null;
  block: number | null;
  methodTag: string | null;
  caseClient: string | null;
  airedAt: string | null;
  durationSec: number | null;
  // Закрытые поля (только при доступе):
  kinescopeId?: string | null;
  timecodes?: Timecode[];
  prompt?: string | null;
  promptNote?: string | null;
  goal?: string | null;
  result?: string | null;
  kpis?: Kpi[];
  description?: unknown;
  repoLinks?: RepoLink[];
  article?: unknown;
  transcript?: string | null;
  steps?: UsecaseStep[];
  related?: { slug: string; title: string; type: UnitType }[];
};

export async function getContentBySlug(actor: Actor, slug: string): Promise<ContentDetail | null> {
  const u = await prisma.contentUnit.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: { select: { slug: true, title: true } } } },
    },
  });
  if (!u) return null;
  if (u.state !== 'PUBLISHED' && !isStaff(actor)) return null; // 404 для студента

  const decision = canAccess(actor, unitResource(u));
  const progress = await prisma.progress.findUnique({
    where: { userId_unitId: { userId: actor.id, unitId: u.id } },
    select: { status: true, proofNote: true },
  });

  const base: ContentDetail = {
    id: u.id,
    slug: u.slug,
    type: u.type,
    title: u.title,
    summary: u.summary,
    coverUrl: u.coverUrl,
    timeToMaster: u.timeToMaster,
    tags: u.tags.map((t) => t.tag),
    minPlan: u.minPlan,
    locked: !decision.ok,
    requiredPlan: !decision.ok && decision.code === 'PLAN_REQUIRED' ? decision.requiredPlan : undefined,
    status: progress?.status ?? 'NONE',
    proofNote: progress?.proofNote ?? null,
    block: u.block,
    methodTag: u.methodTag,
    caseClient: u.caseClient,
    airedAt: u.airedAt?.toISOString() ?? null,
    durationSec: u.durationSec,
  };

  if (!decision.ok) return base; // превью без закрытых полей

  // Связанные юниты по общим тегам (до 3).
  const tagIds = u.tags.map((t) => t.tagId);
  const related =
    tagIds.length > 0
      ? await prisma.contentUnit.findMany({
          where: { id: { not: u.id }, state: 'PUBLISHED', tags: { some: { tagId: { in: tagIds } } } },
          take: 3,
          select: { slug: true, title: true, type: true },
        })
      : [];

  return {
    ...base,
    kinescopeId: u.kinescopeId,
    timecodes: parseTimecodes(u.timecodes),
    prompt: u.prompt,
    promptNote: u.promptNote,
    goal: u.goal,
    result: u.result,
    kpis: parseKpis(u.kpis),
    description: u.description,
    repoLinks: parseRepoLinks(u.repoLinks),
    article: u.article,
    transcript: u.transcript,
    steps: parseUsecaseSteps(u.steps),
    related,
  };
}

async function loadUnitForWrite(actor: Actor, slug: string) {
  const u = await prisma.contentUnit.findUnique({
    where: { slug },
    select: { id: true, minPlan: true, partialFreePreview: true, state: true },
  });
  if (!u || (u.state !== 'PUBLISHED' && !isStaff(actor))) throw new HttpError('UNAUTHENTICATED');
  assertAccess(actor, unitResource(u));
  return u;
}

/** «Отправить агенту»: ставит VIEWED один раз. */
export async function sendToAgentUnit(actor: Actor, slug: string): Promise<void> {
  const u = await loadUnitForWrite(actor, slug);
  await markViewedOnce(actor.id, u.id);
}

/** Событие прогресса видео: при ≥ 80% ставит VIEWED один раз. */
export async function recordVideoProgress(actor: Actor, slug: string, percent: number): Promise<void> {
  const u = await loadUnitForWrite(actor, slug);
  if (viewedFromPercent(percent)) await markViewedOnce(actor.id, u.id);
}

async function markViewedOnce(userId: string, unitId: string): Promise<void> {
  const existing = await prisma.progress.findUnique({
    where: { userId_unitId: { userId, unitId } },
    select: { status: true },
  });
  if (existing && existing.status !== 'NONE') return;
  await prisma.progress.upsert({
    where: { userId_unitId: { userId, unitId } },
    create: { userId, unitId, status: 'VIEWED', viewedAt: new Date() },
    update: { status: 'VIEWED', viewedAt: new Date() },
  });
  await rebuildLeaderboardEntry(userId);
}

/** Смена статуса юнита студентом с proof. RESULT требует ≥ 1 MoneyEntry. */
export async function setContentProgress(
  actor: Actor,
  slug: string,
  status: ProgressStatus,
  proofNote: string | null,
): Promise<void> {
  const u = await loadUnitForWrite(actor, slug);
  const existing = await prisma.progress.findUnique({
    where: { userId_unitId: { userId: actor.id, unitId: u.id } },
  });
  const from = existing?.status ?? 'NONE';
  if (!canTransition(from, status, { isAdmin: actor.role === 'ADMIN' })) throw new Error('BAD_TRANSITION');
  if ((status === 'IMPLEMENTED' || status === 'RESULT') && !proofNote?.trim()) throw new Error('PROOF_REQUIRED');
  if (status === 'RESULT') {
    const money = await prisma.moneyEntry.count({ where: { userId: actor.id } });
    if (money === 0) throw new Error('MONEY_REQUIRED');
  }

  const now = new Date();
  const stamps: Record<string, Date> = {};
  if (status === 'VIEWED') stamps.viewedAt = now;
  if (status === 'SUBMITTED') stamps.submittedAt = now;
  if (status === 'IMPLEMENTED') stamps.implementedAt = now;
  if (status === 'RESULT') stamps.resultAt = now;

  await prisma.progress.upsert({
    where: { userId_unitId: { userId: actor.id, unitId: u.id } },
    create: { userId: actor.id, unitId: u.id, status, proofNote: proofNote ?? null, ...stamps },
    update: { status, proofNote: proofNote ?? null, ...stamps },
  });
  await rebuildLeaderboardEntry(actor.id);
}
