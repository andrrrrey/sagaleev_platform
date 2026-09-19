import type { PlanCode } from '@prisma/client';
import { prisma } from '@/server/db';
import { type Actor, HttpError } from '@/server/access';
import { parseCommands, type Command } from '@/lib/content-types';

export type RouteDayStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export type RouteDayOverview = {
  id: string;
  dayNumber: number;
  title: string;
  summary: string;
  artifact: string;
  totalSteps: number;
  doneSteps: number;
  status: RouteDayStatus;
};

export type RouteStepView = {
  id: string;
  sort: number;
  title: string;
  body: string;
  commands: Command[];
  artifactRequired: boolean;
  artifactHint: string | null;
  linkedSkill: { slug: string; title: string; minPlan: PlanCode } | null;
  done: boolean;
  artifactNote: string | null;
  artifactUrl: string | null;
};

export type RouteDayView = {
  id: string;
  dayNumber: number;
  title: string;
  summary: string;
  artifact: string;
  steps: RouteStepView[];
  prevDay: number | null;
  nextDay: number | null;
};

/** Маршрут доступен всем активным тарифам; закрытый доступ — read-only. */
function assertActive(actor: Actor): void {
  if (actor.role === 'ADMIN' || actor.role === 'EDITOR') return;
  if (!actor.enrollmentActive) throw new HttpError('PAYMENT_REQUIRED');
}

function statusOf(total: number, done: number): RouteDayStatus {
  if (done === 0) return 'NOT_STARTED';
  if (done >= total && total > 0) return 'DONE';
  return 'IN_PROGRESS';
}

export async function getRouteOverview(actor: Actor): Promise<{
  days: RouteDayOverview[];
  totalSteps: number;
  doneSteps: number;
}> {
  assertActive(actor);
  const days = await prisma.routeDay.findMany({
    orderBy: { dayNumber: 'asc' },
    include: {
      steps: { select: { id: true } },
    },
  });
  const stepIds = days.flatMap((d) => d.steps.map((s) => s.id));
  const doneRows = await prisma.routeStepProgress.findMany({
    where: { userId: actor.id, stepId: { in: stepIds }, done: true },
    select: { stepId: true },
  });
  const doneSet = new Set(doneRows.map((r) => r.stepId));

  let totalSteps = 0;
  let doneSteps = 0;
  const overview = days.map((d) => {
    const total = d.steps.length;
    const done = d.steps.filter((s) => doneSet.has(s.id)).length;
    totalSteps += total;
    doneSteps += done;
    return {
      id: d.id,
      dayNumber: d.dayNumber,
      title: d.title,
      summary: d.summary,
      artifact: d.artifact,
      totalSteps: total,
      doneSteps: done,
      status: statusOf(total, done),
    };
  });
  return { days: overview, totalSteps, doneSteps };
}

export async function getRouteDay(actor: Actor, dayNumber: number): Promise<RouteDayView | null> {
  assertActive(actor);
  const day = await prisma.routeDay.findUnique({
    where: { dayNumber },
    include: {
      steps: {
        orderBy: { sort: 'asc' },
        include: { linkedSkill: { select: { slug: true, title: true, minPlan: true } } },
      },
    },
  });
  if (!day) return null;

  const progress = await prisma.routeStepProgress.findMany({
    where: { userId: actor.id, stepId: { in: day.steps.map((s) => s.id) } },
  });
  const byStep = new Map(progress.map((p) => [p.stepId, p]));

  const bounds = await prisma.routeDay.aggregate({
    _min: { dayNumber: true },
    _max: { dayNumber: true },
  });

  return {
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    summary: day.summary,
    artifact: day.artifact,
    prevDay: day.dayNumber > (bounds._min.dayNumber ?? 1) ? day.dayNumber - 1 : null,
    nextDay: day.dayNumber < (bounds._max.dayNumber ?? 1) ? day.dayNumber + 1 : null,
    steps: day.steps.map((s) => {
      const p = byStep.get(s.id);
      return {
        id: s.id,
        sort: s.sort,
        title: s.title,
        body: s.body,
        commands: parseCommands(s.commands),
        artifactRequired: s.artifactRequired,
        artifactHint: s.artifactHint,
        linkedSkill: s.linkedSkill,
        done: p?.done ?? false,
        artifactNote: p?.artifactNote ?? null,
        artifactUrl: p?.artifactUrl ?? null,
      };
    }),
  };
}

export async function setStepProgress(
  actor: Actor,
  stepId: string,
  input: { done: boolean; artifactNote?: string | null; artifactUrl?: string | null },
): Promise<void> {
  assertActive(actor);
  if (!actor.enrollmentActive && actor.role === 'STUDENT') {
    throw new HttpError('PAYMENT_REQUIRED');
  }

  const step = await prisma.routeStep.findUnique({ where: { id: stepId } });
  if (!step) throw new Error('STEP_NOT_FOUND');

  // Обязательная фиксация артефакта при отметке «сделал».
  if (input.done && step.artifactRequired) {
    const hasArtifact = Boolean(input.artifactNote?.trim() || input.artifactUrl?.trim());
    if (!hasArtifact) throw new Error('ARTIFACT_REQUIRED');
  }

  await prisma.routeStepProgress.upsert({
    where: { userId_stepId: { userId: actor.id, stepId } },
    create: {
      userId: actor.id,
      stepId,
      done: input.done,
      doneAt: input.done ? new Date() : null,
      artifactNote: input.artifactNote ?? null,
      artifactUrl: input.artifactUrl ?? null,
    },
    update: {
      done: input.done,
      doneAt: input.done ? new Date() : null,
      artifactNote: input.artifactNote ?? null,
      artifactUrl: input.artifactUrl ?? null,
    },
  });
}
