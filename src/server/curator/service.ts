import Anthropic from '@anthropic-ai/sdk';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { getSetting, getSettingBool } from '@/server/settings/store';
import { planLevel } from '@/server/access/plans';
import { notifyTelegram } from '@/server/telegram/service';
import {
  CURATOR_SYSTEM_DEFAULT,
  buildCuratorUserPrompt,
  curatorResponseSchema,
  assertNoContacts,
  type CuratorContext,
  type CuratorResponse,
} from './prompt';

const ANTHROPIC_MODEL = 'claude-sonnet-5';
const ROUTERAI_BASE_URL = 'https://routerai.ru/api/v1';

type CuratorLlmConfig = {
  provider: 'anthropic' | 'routerai';
  apiKey: string;
  model: string;
};

export async function getCuratorLlmConfig(): Promise<CuratorLlmConfig | null> {
  const provider =
    (await getSetting('CURATOR_LLM_PROVIDER')) === 'routerai' ? 'routerai' : 'anthropic';
  const apiKey = await getSetting(
    provider === 'routerai' ? 'ROUTERAI_API_KEY' : 'ANTHROPIC_API_KEY',
  );
  if (!apiKey) return null;
  const model =
    provider === 'routerai'
      ? (await getSetting('ROUTERAI_MODEL'))?.trim() || 'openai/gpt-4o'
      : ANTHROPIC_MODEL;
  return { provider, apiKey, model };
}

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
    prisma.moneyEntry.aggregate({
      _sum: { amountKopeks: true },
      where: { userId, createdAt: { gte: weekStart } },
    }),
    prisma.weeklyReport.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: { text: true },
    }),
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

const JSON_INSTRUCTION =
  'Верни ТОЛЬКО JSON вида {"summary": "...", "methodPrinciple": "...", "nextSteps": [{"title": "...", "why": "...", "refType": null, "refId": null}]}. 1–2 шага.';

function parseCuratorResponse(text: string): CuratorResponse {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return curatorResponseSchema.parse(JSON.parse(cleaned));
}

async function callCurator(
  config: CuratorLlmConfig,
  system: string,
  user: string,
): Promise<CuratorResponse> {
  if (config.provider === 'routerai') {
    const response = await fetch(`${ROUTERAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1500,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${user}\n\n${JSON_INSTRUCTION}` },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`RouterAI request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('RouterAI returned an empty response');
    return parseCuratorResponse(text);
  }

  const client = new Anthropic({ apiKey: config.apiKey });
  const response = await client.messages.create({
    model: config.model,
    max_tokens: 1500,
    output_config: { effort: 'low' },
    system,
    messages: [{ role: 'user', content: `${user}\n\n${JSON_INSTRUCTION}` }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return parseCuratorResponse(text);
}

/**
 * Еженедельный разбор одного студента. Возвращает статус.
 * Гейт: CURATOR_ENABLED + ключ + активный тариф уровня ≥ 2 (SUPPORT).
 */
export async function runCuratorForUser(userId: string): Promise<'OK' | 'SKIPPED' | 'FAILED'> {
  const [curatorEnabled, llmConfig] = await Promise.all([
    getSettingBool('CURATOR_ENABLED'),
    getCuratorLlmConfig(),
  ]);
  if (!curatorEnabled || !llmConfig) return 'SKIPPED';

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { planCode: true },
  });
  if (!enrollment || planLevel(enrollment.planCode) < 2) return 'SKIPPED';

  const ctx = await collectCuratorContext(userId);
  if (!ctx) return 'SKIPPED';

  const settings = await prisma.legalDocument.findFirst({
    where: { kind: 'CURATOR_SYSTEM' },
    orderBy: { publishedAt: 'desc' },
  });
  const system = settings?.bodyHtml ?? CURATOR_SYSTEM_DEFAULT;
  const userPrompt = buildCuratorUserPrompt(ctx);
  assertNoContacts(`${system}\n${userPrompt}`); // страховка приватности

  const weekStart = weekStartOf();
  let parsed: CuratorResponse | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      parsed = await callCurator(llmConfig, system, userPrompt);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    await prisma.curatorNote.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: {
        userId,
        weekStart,
        summary: 'Не удалось сформировать разбор.',
        nextSteps: [],
        model: `${llmConfig.provider}:${llmConfig.model}`,
        status: 'FAILED',
      },
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
        model: `${llmConfig.provider}:${llmConfig.model}`,
        status: 'OK',
      },
      update: {
        summary: parsed.summary,
        methodPrinciple: parsed.methodPrinciple ?? null,
        nextSteps: parsed.nextSteps as unknown as Prisma.InputJsonValue,
        model: `${llmConfig.provider}:${llmConfig.model}`,
        status: 'OK',
      },
    });
    await tx.notification.create({
      data: {
        userId,
        kind: 'CURATOR_NOTE',
        title: 'Разбор куратора готов',
        body: parsed.summary.slice(0, 120),
        href: '/profile/curator',
      },
    });
  });

  await notifyTelegram(
    userId,
    '🧭 Еженедельный разбор агента-куратора готов. Откройте платформу: https://platform.sagaleev.ru/profile/curator',
  );

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
