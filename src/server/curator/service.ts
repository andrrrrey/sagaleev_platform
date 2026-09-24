import Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { getSetting, getSettingBool } from '@/server/settings/store';
import { planLevel } from '@/server/access/plans';
import {
  CURATOR_SYSTEM_DEFAULT,
  buildCuratorUserPrompt,
  curatorResponseSchema,
  assertNoContacts,
  type CuratorContext,
  type CuratorResponse,
} from './prompt';

const CURATOR_MODEL = 'claude-sonnet-5'; // docs/01 §1: разовый вызов, дешёвая модель

/** Понедельник текущей недели (UTC, 00:00). */
export function weekStartOf(date = new Date()): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // 0 = понедельник
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}

/** Сбор учебного контекста БЕЗ контактов (docs/05 §8 п.5). */
export async function collectCuratorContext(userId: string): Promise<CuratorContext | null> {
  const weekStart = weekStartOf();
  const [user, profile, weekProgress, routeSteps, moneyAgg, report] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.businessProfile.findUnique({ where: { userId } }),
    prisma.progress.findMany({
      where: { userId, updatedAt: { gte: weekStart } },
      select: {
        status: true,
        unit: { select: { title: true } },
        skill: { select: { title: true } },
      },
      take: 40,
    }),
    prisma.routeStepProgress.findMany({ where: { userId }, select: { done: true } }),
    prisma.moneyEntry.aggregate({ _sum: { amountKopeks: true }, where: { userId, createdAt: { gte: weekStart } } }),
    prisma.weeklyReport.findUnique({ where: { userId_weekStart: { userId, weekStart } }, select: { text: true } }),
  ]);
  if (!user || !profile) return null;

  return {
    firstName: user.name.split(' ')[0] ?? user.name,
    business: {
      companyName: profile.companyName,
      niche: profile.niche,
      whoAmI: profile.whoAmI,
      product: profile.product,
      audience: profile.audience,
      brandVoice: profile.brandVoice,
      goals: profile.goals,
      monthlyRevenueBand: profile.monthlyRevenueBand,
    },
    weekProgress: weekProgress.map((p) => ({
      title: p.unit?.title ?? p.skill?.title ?? 'элемент',
      status: p.status,
    })),
    routeDone: routeSteps.filter((s) => s.done).length,
    routeTotal: routeSteps.length,
    moneyThisWeekKopeks: moneyAgg._sum.amountKopeks ?? 0,
    weeklyReport: report?.text ?? null,
  };
}

async function callCurator(system: string, user: string): Promise<CuratorResponse> {
  const apiKey = await getSetting('ANTHROPIC_API_KEY');
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: CURATOR_MODEL,
    max_tokens: 1500,
    output_config: { effort: 'low' },
    system,
    messages: [
      {
        role: 'user',
        content: `${user}\n\nВерни ТОЛЬКО JSON вида {"summary": "...", "methodPrinciple": "...", "nextSteps": [{"title": "...", "why": "...", "refType": null, "refId": null}]}. 1–2 шага.`,
      },
    ],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return curatorResponseSchema.parse(JSON.parse(text));
}

/**
 * Еженедельный разбор одного студента. Возвращает статус.
 * Гейт: CURATOR_ENABLED + ключ + активный тариф уровня ≥ 2 (SUPPORT).
 */
export async function runCuratorForUser(userId: string): Promise<'OK' | 'SKIPPED' | 'FAILED'> {
  const [curatorEnabled, apiKey] = await Promise.all([
    getSettingBool('CURATOR_ENABLED'),
    getSetting('ANTHROPIC_API_KEY'),
  ]);
  if (!curatorEnabled || !apiKey) return 'SKIPPED';

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { planCode: true },
  });
  if (!enrollment || planLevel(enrollment.planCode) < 2) return 'SKIPPED';

  const ctx = await collectCuratorContext(userId);
  if (!ctx) return 'SKIPPED';

  const settings = await prisma.legalDocument.findFirst({ where: { kind: 'CURATOR_SYSTEM' }, orderBy: { publishedAt: 'desc' } });
  const system = settings?.bodyHtml ?? CURATOR_SYSTEM_DEFAULT;
  const userPrompt = buildCuratorUserPrompt(ctx);
  assertNoContacts(`${system}\n${userPrompt}`); // страховка приватности

  const weekStart = weekStartOf();
  let parsed: CuratorResponse | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      parsed = await callCurator(system, userPrompt);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    await prisma.curatorNote.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart, summary: 'Не удалось сформировать разбор.', nextSteps: [], model: CURATOR_MODEL, status: 'FAILED' },
      update: { status: 'FAILED' },
    });
    return 'FAILED';
  }

  await prisma.$transaction(async (tx) => {
    await tx.curatorNote.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: {
        userId,
        weekStart,
        summary: parsed.summary,
        methodPrinciple: parsed.methodPrinciple ?? null,
        nextSteps: parsed.nextSteps as unknown as Prisma.InputJsonValue,
        model: CURATOR_MODEL,
        status: 'OK',
      },
      update: {
        summary: parsed.summary,
        methodPrinciple: parsed.methodPrinciple ?? null,
        nextSteps: parsed.nextSteps as unknown as Prisma.InputJsonValue,
        status: 'OK',
      },
    });
    await tx.notification.create({
      data: { userId, kind: 'CURATOR_NOTE', title: 'Разбор куратора готов', body: parsed.summary.slice(0, 120), href: '/profile/curator' },
    });
  });

  return 'OK';
}

/** Джоба недели: разбор всех студентов с активной единой подпиской. */
export async function runCuratorWeekly(): Promise<{ ok: number; failed: number; skipped: number }> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      planCode: 'SUPPORT',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  const result = { ok: 0, failed: 0, skipped: 0 };
  for (const e of enrollments) {
    const r = await runCuratorForUser(e.userId);
    if (r === 'OK') result.ok += 1;
    else if (r === 'FAILED') result.failed += 1;
    else result.skipped += 1;
  }
  return result;
}
