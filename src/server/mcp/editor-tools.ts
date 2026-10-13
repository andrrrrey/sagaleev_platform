import type { Prisma, UnitType } from '@prisma/client';
import { z } from 'zod';
import type { Actor } from '@/server/access';
import { audit } from '@/server/admin/audit';
import {
  publishReviewedContent,
  publishReviewedSkill,
  reviewContentDraft,
  reviewSkillDraft,
} from '@/server/admin/draft-review';
import { prisma } from '@/server/db';
import { sanitizeRichHtml } from '@/lib/rich';
import { slugify } from '@/lib/utils';

type ToolResult = {
  isError?: boolean;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: { data: unknown };
};

function textResult(value: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: { data: value },
  };
}

function toolError(message: string): ToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

function isStaff(actor: Actor): boolean {
  return actor.role === 'ADMIN' || actor.role === 'EDITOR';
}

const timecodeSchema = z.object({ t: z.number().int().min(0), label: z.string().min(1).max(300) });
const kpiSchema = z.object({
  label: z.string().min(1).max(300),
  value: z.string().min(1).max(300),
  hint: z.string().max(500).optional(),
});
const stepSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(10_000).optional(),
  command: z.string().max(10_000).optional(),
});
const repoLinkSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().max(2000),
});

const contentFields = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(200).optional(),
  summary: z.string().max(5000).optional(),
  timeToMaster: z.string().max(200).optional(),
  kinescopeId: z.string().max(500).optional(),
  durationSec: z.number().int().min(0).optional(),
  timecodes: z.array(timecodeSchema).max(100).optional(),
  prompt: z.string().max(100_000).optional(),
  promptNote: z.string().max(5000).optional(),
  methodTag: z.string().max(300).optional(),
  articleHtml: z.string().max(500_000).optional(),
  transcript: z.string().max(1_000_000).optional(),
  caseClient: z.string().max(500).optional(),
  goal: z.string().max(20_000).optional(),
  result: z.string().max(20_000).optional(),
  descriptionHtml: z.string().max(500_000).optional(),
  kpis: z.array(kpiSchema).max(100).optional(),
  repoLinks: z.array(repoLinkSchema).max(100).optional(),
  steps: z.array(stepSchema).max(200).optional(),
  airedAt: z.string().datetime().optional(),
  partialFreePreview: z.boolean().optional(),
  sort: z.number().int().min(0).optional(),
  moduleId: z.string().min(1).optional(),
  placementSort: z.number().int().min(0).optional(),
  tagSlugs: z.array(z.string().min(1).max(200)).max(50).optional(),
});

const createContentSchema = contentFields.extend({
  type: z.enum(['LESSON', 'USECASE', 'STREAM']),
  title: z.string().min(1).max(500),
});
const updateContentSchema = contentFields.extend({ id: z.string().min(1) });

const skillFields = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(200).optional(),
  group: z.enum(['STRATEGY', 'TRAFFIC', 'CONTENT', 'RETENTION', 'AGENT_INFRA']).optional(),
  shortDesc: z.string().max(10_000).optional(),
  inputs: z.string().max(50_000).optional(),
  outputs: z.string().max(50_000).optional(),
  prompt: z.string().max(500_000).optional(),
  demoVideoId: z.string().max(500).optional(),
  tagSlugs: z.array(z.string().min(1).max(200)).max(50).optional(),
});
const createSkillSchema = skillFields.extend({
  title: z.string().min(1).max(500),
  group: z.enum(['STRATEGY', 'TRAFFIC', 'CONTENT', 'RETENTION', 'AGENT_INFRA']),
  shortDesc: z.string().min(1).max(10_000),
  inputs: z.string().min(1).max(50_000),
  outputs: z.string().min(1).max(50_000),
  prompt: z.string().min(1).max(500_000),
});
const updateSkillSchema = skillFields.extend({ id: z.string().min(1) });

const contentProperties = {
  title: { type: 'string', description: 'Название материала' },
  slug: { type: 'string', description: 'URL-слаг; если не указан, создаётся из названия' },
  summary: { type: 'string', description: 'Краткое описание для карточки' },
  timeToMaster: { type: 'string', description: 'Например: 20 минут' },
  kinescopeId: { type: 'string', description: 'ID видео в Kinescope' },
  durationSec: { type: 'integer', minimum: 0 },
  timecodes: { type: 'array', items: { type: 'object' } },
  prompt: { type: 'string', description: 'Промпт для блока «Отправить агенту»' },
  promptNote: { type: 'string' },
  methodTag: { type: 'string' },
  articleHtml: {
    type: 'string',
    description: 'Текстовая версия или статья; допустим безопасный HTML',
  },
  transcript: { type: 'string' },
  caseClient: { type: 'string' },
  goal: { type: 'string' },
  result: { type: 'string' },
  descriptionHtml: { type: 'string' },
  kpis: { type: 'array', items: { type: 'object' } },
  repoLinks: { type: 'array', items: { type: 'object' } },
  steps: { type: 'array', items: { type: 'object' } },
  airedAt: { type: 'string', format: 'date-time' },
  partialFreePreview: { type: 'boolean' },
  sort: { type: 'integer', minimum: 0 },
  moduleId: { type: 'string', description: 'ID модуля из list_course_structure' },
  placementSort: { type: 'integer', minimum: 0, description: 'Порядок урока внутри модуля' },
  tagSlugs: { type: 'array', items: { type: 'string' } },
} as const;

export const EDITOR_MCP_TOOLS = [
  {
    name: 'list_course_structure',
    title: 'Показать курсы, модули и теги',
    description:
      'Возвращает ID курсов и модулей, а также доступные теги. Вызывай перед созданием урока.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'list_drafts',
    title: 'Показать черновики',
    description: 'Возвращает черновики уроков, юзкейсов, эфиров и скиллов.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['all', 'content', 'skill'] },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'get_draft',
    title: 'Прочитать черновик',
    description: 'Возвращает полный черновик и результаты автоматической проверки.',
    inputSchema: {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['content', 'skill'] }, id: { type: 'string' } },
      required: ['kind', 'id'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'create_content_draft',
    title: 'Создать черновик материала',
    description: 'Создаёт только черновик урока, юзкейса или эфира. Студентам он не виден.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['LESSON', 'USECASE', 'STREAM'] },
        ...contentProperties,
      },
      required: ['type', 'title'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'update_content_draft',
    title: 'Обновить черновик материала',
    description:
      'Обновляет только материал со статусом DRAFT. Пустые необязательные поля можно передать пустой строкой.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, ...contentProperties },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'create_skill_draft',
    title: 'Создать черновик скилла',
    description: 'Создаёт неопубликованный скилл с полной инструкцией для агента.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        group: {
          type: 'string',
          enum: ['STRATEGY', 'TRAFFIC', 'CONTENT', 'RETENTION', 'AGENT_INFRA'],
        },
        shortDesc: { type: 'string' },
        inputs: { type: 'string' },
        outputs: { type: 'string' },
        prompt: { type: 'string' },
        demoVideoId: { type: 'string' },
        tagSlugs: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'group', 'shortDesc', 'inputs', 'outputs', 'prompt'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  {
    name: 'update_skill_draft',
    title: 'Обновить черновик скилла',
    description: 'Обновляет только скилл со статусом DRAFT.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        slug: { type: 'string' },
        group: {
          type: 'string',
          enum: ['STRATEGY', 'TRAFFIC', 'CONTENT', 'RETENTION', 'AGENT_INFRA'],
        },
        shortDesc: { type: 'string' },
        inputs: { type: 'string' },
        outputs: { type: 'string' },
        prompt: { type: 'string' },
        demoVideoId: { type: 'string' },
        tagSlugs: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'validate_draft',
    title: 'Проверить черновик',
    description:
      'Проверяет обязательные поля и возвращает ошибки и рекомендации до передачи администратору.',
    inputSchema: {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['content', 'skill'] }, id: { type: 'string' } },
      required: ['kind', 'id'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'preview_draft',
    title: 'Подготовить предпросмотр',
    description: 'Возвращает полный черновик, проверку и ссылку предпросмотра на платформе.',
    inputSchema: {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['content', 'skill'] }, id: { type: 'string' } },
      required: ['kind', 'id'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
] as const;

export const ADMIN_MCP_TOOLS = [
  {
    name: 'publish_draft',
    title: 'Опубликовать проверенный черновик',
    description:
      'Только для администратора. Повторно проверяет материал и публикует его, если нет блокирующих ошибок.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['content', 'skill'] },
        id: { type: 'string' },
        confirmed: {
          type: 'boolean',
          description: 'true только после явного подтверждения администратора',
        },
      },
      required: ['kind', 'id', 'confirmed'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
] as const;

async function assertSlugAvailable(kind: 'content' | 'skill', slug: string, exceptId?: string) {
  const row =
    kind === 'content'
      ? await prisma.contentUnit.findFirst({
          where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
          select: { id: true },
        })
      : await prisma.skill.findFirst({
          where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
          select: { id: true },
        });
  if (row) throw new Error(`Слаг «${slug}» уже занят.`);
}

async function replaceContentTags(unitId: string, tagSlugs: string[]) {
  const tags = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { id: true, slug: true },
  });
  const found = new Set(tags.map((tag) => tag.slug));
  const missing = tagSlugs.filter((slug) => !found.has(slug));
  if (missing.length) throw new Error(`Не найдены теги: ${missing.join(', ')}.`);
  await prisma.unitTag.deleteMany({ where: { unitId } });
  if (tags.length > 0) {
    await prisma.unitTag.createMany({
      data: tags.map((tag) => ({ unitId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }
}

async function replaceSkillTags(skillId: string, tagSlugs: string[]) {
  const tags = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { id: true, slug: true },
  });
  const found = new Set(tags.map((tag) => tag.slug));
  const missing = tagSlugs.filter((slug) => !found.has(slug));
  if (missing.length) throw new Error(`Не найдены теги: ${missing.join(', ')}.`);
  await prisma.skillTag.deleteMany({ where: { skillId } });
  if (tags.length > 0) {
    await prisma.skillTag.createMany({
      data: tags.map((tag) => ({ skillId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }
}

async function validateReferences(tagSlugs?: string[], moduleId?: string) {
  if (tagSlugs?.length) {
    const tags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugs } },
      select: { slug: true },
    });
    const found = new Set(tags.map((tag) => tag.slug));
    const missing = tagSlugs.filter((slug) => !found.has(slug));
    if (missing.length) throw new Error(`Не найдены теги: ${missing.join(', ')}.`);
  }
  if (moduleId) {
    const courseModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });
    if (!courseModule)
      throw new Error('Модуль курса не найден. Сначала вызовите list_course_structure.');
  }
}

async function attachToModule(unitId: string, moduleId: string, sort: number) {
  const courseModule = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true },
  });
  if (!courseModule)
    throw new Error('Модуль курса не найден. Сначала вызовите list_course_structure.');
  await prisma.courseUnit.upsert({
    where: { moduleId_unitId: { moduleId, unitId } },
    create: { moduleId, unitId, sort },
    update: { sort },
  });
}

function createContentData(
  input: z.infer<typeof createContentSchema>,
): Prisma.ContentUnitUncheckedCreateInput {
  return {
    type: input.type,
    title: input.title.trim(),
    slug: input.slug?.trim() || slugify(input.title),
    summary: input.summary?.trim() || null,
    timeToMaster: input.timeToMaster?.trim() || null,
    minPlan: 'SUPPORT',
    state: 'DRAFT',
    partialFreePreview: input.type === 'STREAM' ? (input.partialFreePreview ?? false) : false,
    sort: input.sort ?? 0,
    kinescopeId: input.kinescopeId?.trim() || null,
    durationSec: input.durationSec ?? null,
    timecodes: input.timecodes ?? [],
    prompt: input.prompt?.trim() || null,
    promptNote: input.promptNote?.trim() || null,
    methodTag: input.methodTag?.trim() || null,
    article: input.articleHtml ? { html: sanitizeRichHtml(input.articleHtml) } : undefined,
    transcript: input.transcript?.trim() || null,
    caseClient: input.type === 'USECASE' ? input.caseClient?.trim() || null : null,
    goal: input.type === 'USECASE' ? input.goal?.trim() || null : null,
    result: input.type === 'USECASE' ? input.result?.trim() || null : null,
    description:
      input.type === 'USECASE' && input.descriptionHtml
        ? { html: sanitizeRichHtml(input.descriptionHtml) }
        : undefined,
    kpis: input.type === 'USECASE' ? (input.kpis ?? []) : [],
    repoLinks: input.type === 'USECASE' ? (input.repoLinks ?? []) : [],
    steps: input.type === 'USECASE' ? (input.steps ?? []) : [],
    airedAt: input.type === 'STREAM' && input.airedAt ? new Date(input.airedAt) : null,
  };
}

function updateContentData(
  input: z.infer<typeof updateContentSchema>,
): Prisma.ContentUnitUncheckedUpdateInput {
  const data: Prisma.ContentUnitUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.slug !== undefined) data.slug = input.slug.trim();
  if (input.summary !== undefined) data.summary = input.summary.trim() || null;
  if (input.timeToMaster !== undefined) data.timeToMaster = input.timeToMaster.trim() || null;
  if (input.kinescopeId !== undefined) data.kinescopeId = input.kinescopeId.trim() || null;
  if (input.durationSec !== undefined) data.durationSec = input.durationSec;
  if (input.timecodes !== undefined) data.timecodes = input.timecodes;
  if (input.prompt !== undefined) data.prompt = input.prompt.trim() || null;
  if (input.promptNote !== undefined) data.promptNote = input.promptNote.trim() || null;
  if (input.methodTag !== undefined) data.methodTag = input.methodTag.trim() || null;
  if (input.articleHtml !== undefined)
    data.article = input.articleHtml ? { html: sanitizeRichHtml(input.articleHtml) } : {};
  if (input.transcript !== undefined) data.transcript = input.transcript.trim() || null;
  if (input.caseClient !== undefined) data.caseClient = input.caseClient.trim() || null;
  if (input.goal !== undefined) data.goal = input.goal.trim() || null;
  if (input.result !== undefined) data.result = input.result.trim() || null;
  if (input.descriptionHtml !== undefined)
    data.description = input.descriptionHtml
      ? { html: sanitizeRichHtml(input.descriptionHtml) }
      : {};
  if (input.kpis !== undefined) data.kpis = input.kpis;
  if (input.repoLinks !== undefined) data.repoLinks = input.repoLinks;
  if (input.steps !== undefined) data.steps = input.steps;
  if (input.airedAt !== undefined) data.airedAt = input.airedAt ? new Date(input.airedAt) : null;
  if (input.partialFreePreview !== undefined) data.partialFreePreview = input.partialFreePreview;
  if (input.sort !== undefined) data.sort = input.sort;
  return data;
}

async function getDraft(kind: 'content' | 'skill', id: string) {
  if (kind === 'content') {
    const item = await prisma.contentUnit.findFirst({
      where: { id, state: 'DRAFT' },
      include: {
        tags: { include: { tag: { select: { slug: true, title: true } } } },
        courses: {
          include: { module: { include: { course: { select: { slug: true, title: true } } } } },
        },
      },
    });
    return item ? { kind, item, review: await reviewContentDraft(id) } : null;
  }
  const item = await prisma.skill.findFirst({
    where: { id, state: 'DRAFT' },
    include: { tags: { include: { tag: { select: { slug: true, title: true } } } } },
  });
  return item ? { kind, item, review: await reviewSkillDraft(id) } : null;
}

export async function callEditorTool(
  actor: Actor,
  name: string,
  rawArgs: unknown,
): Promise<ToolResult> {
  if (!isStaff(actor)) return toolError('Инструмент доступен только администратору или эксперту.');
  const args =
    rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs)
      ? (rawArgs as Record<string, unknown>)
      : {};

  try {
    if (name === 'list_course_structure') {
      const [courses, tags] = await Promise.all([
        prisma.course.findMany({
          orderBy: [{ sort: 'asc' }, { title: 'asc' }],
          select: {
            id: true,
            slug: true,
            title: true,
            state: true,
            modules: {
              orderBy: { sort: 'asc' },
              select: { id: true, title: true, summary: true, sort: true },
            },
          },
        }),
        prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { slug: true, title: true } }),
      ]);
      return textResult({ courses, tags });
    }

    if (name === 'list_drafts') {
      const kind = args.kind === 'content' || args.kind === 'skill' ? args.kind : 'all';
      const limit = Number.isInteger(args.limit)
        ? Math.min(Math.max(Number(args.limit), 1), 100)
        : 50;
      const [content, skills] = await Promise.all([
        kind === 'skill'
          ? []
          : prisma.contentUnit.findMany({
              where: { state: 'DRAFT' },
              orderBy: { updatedAt: 'desc' },
              take: limit,
              select: {
                id: true,
                type: true,
                slug: true,
                title: true,
                summary: true,
                updatedAt: true,
              },
            }),
        kind === 'content'
          ? []
          : prisma.skill.findMany({
              where: { state: 'DRAFT' },
              orderBy: { updatedAt: 'desc' },
              take: limit,
              select: {
                id: true,
                slug: true,
                title: true,
                group: true,
                shortDesc: true,
                updatedAt: true,
              },
            }),
      ]);
      return textResult({ content, skills });
    }

    if (name === 'get_draft' || name === 'validate_draft' || name === 'preview_draft') {
      const kind = args.kind === 'content' || args.kind === 'skill' ? args.kind : null;
      const id = typeof args.id === 'string' ? args.id : '';
      if (!kind || !id) return toolError('Укажите kind и id.');
      const draft = await getDraft(kind, id);
      if (!draft) return toolError('Черновик не найден.');
      if (name === 'validate_draft') return textResult(draft.review);
      if (name === 'preview_draft') {
        const item = draft.item as { slug: string; type?: UnitType };
        const base =
          kind === 'skill'
            ? '/skills'
            : item.type === 'LESSON'
              ? '/lessons'
              : item.type === 'STREAM'
                ? '/streams'
                : '/usecases';
        return textResult({
          ...draft,
          previewUrl: `https://platform.sagaleev.ru${base}/${item.slug}`,
        });
      }
      return textResult(draft);
    }

    if (name === 'create_content_draft') {
      const parsed = createContentSchema.safeParse(args);
      if (!parsed.success)
        return toolError(
          parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
        );
      const input = parsed.data;
      const data = createContentData(input);
      await assertSlugAvailable('content', String(data.slug));
      await validateReferences(
        input.tagSlugs,
        input.type === 'LESSON' ? input.moduleId : undefined,
      );
      const unit = await prisma.contentUnit.create({
        data,
        select: { id: true, slug: true, type: true, title: true },
      });
      if (input.tagSlugs) await replaceContentTags(unit.id, input.tagSlugs);
      if (input.type === 'LESSON' && input.moduleId)
        await attachToModule(unit.id, input.moduleId, input.placementSort ?? input.sort ?? 0);
      await audit(actor.id, 'MCP_CREATE_DRAFT', 'ContentUnit', unit.id, {
        slug: unit.slug,
        type: unit.type,
      });
      return textResult({
        created: true,
        state: 'DRAFT',
        ...unit,
        review: await reviewContentDraft(unit.id),
      });
    }

    if (name === 'update_content_draft') {
      const parsed = updateContentSchema.safeParse(args);
      if (!parsed.success)
        return toolError(
          parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
        );
      const input = parsed.data;
      const existing = await prisma.contentUnit.findFirst({
        where: { id: input.id, state: 'DRAFT' },
        select: { id: true },
      });
      if (!existing) return toolError('Можно обновлять только существующие черновики.');
      if (input.slug) await assertSlugAvailable('content', input.slug.trim(), input.id);
      await validateReferences(input.tagSlugs, input.moduleId);
      const unit = await prisma.contentUnit.update({
        where: { id: input.id },
        data: updateContentData(input),
        select: { id: true, slug: true, type: true, title: true },
      });
      if (input.tagSlugs) await replaceContentTags(unit.id, input.tagSlugs);
      if (unit.type === 'LESSON' && input.moduleId)
        await attachToModule(unit.id, input.moduleId, input.placementSort ?? input.sort ?? 0);
      await audit(actor.id, 'MCP_UPDATE_DRAFT', 'ContentUnit', unit.id, {
        slug: unit.slug,
        type: unit.type,
      });
      return textResult({
        updated: true,
        state: 'DRAFT',
        ...unit,
        review: await reviewContentDraft(unit.id),
      });
    }

    if (name === 'create_skill_draft') {
      const parsed = createSkillSchema.safeParse(args);
      if (!parsed.success)
        return toolError(
          parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
        );
      const input = parsed.data;
      const slug = input.slug?.trim() || slugify(input.title);
      await assertSlugAvailable('skill', slug);
      await validateReferences(input.tagSlugs);
      const skill = await prisma.skill.create({
        data: {
          title: input.title.trim(),
          slug,
          group: input.group,
          shortDesc: input.shortDesc.trim(),
          inputs: input.inputs.trim(),
          outputs: input.outputs.trim(),
          prompt: input.prompt.trim(),
          demoVideoId: input.demoVideoId?.trim() || null,
          timeToMaster: '—',
          minPlan: 'SUPPORT',
          state: 'DRAFT',
        },
        select: { id: true, slug: true, title: true, group: true },
      });
      if (input.tagSlugs) await replaceSkillTags(skill.id, input.tagSlugs);
      await audit(actor.id, 'MCP_CREATE_DRAFT', 'Skill', skill.id, { slug: skill.slug });
      return textResult({
        created: true,
        state: 'DRAFT',
        ...skill,
        review: await reviewSkillDraft(skill.id),
      });
    }

    if (name === 'update_skill_draft') {
      const parsed = updateSkillSchema.safeParse(args);
      if (!parsed.success)
        return toolError(
          parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
        );
      const input = parsed.data;
      const existing = await prisma.skill.findFirst({
        where: { id: input.id, state: 'DRAFT' },
        select: { id: true },
      });
      if (!existing) return toolError('Можно обновлять только существующие черновики.');
      if (input.slug) await assertSlugAvailable('skill', input.slug.trim(), input.id);
      await validateReferences(input.tagSlugs);
      const data: Prisma.SkillUncheckedUpdateInput = {};
      if (input.title !== undefined) data.title = input.title.trim();
      if (input.slug !== undefined) data.slug = input.slug.trim();
      if (input.group !== undefined) data.group = input.group;
      if (input.shortDesc !== undefined) data.shortDesc = input.shortDesc.trim();
      if (input.inputs !== undefined) data.inputs = input.inputs.trim();
      if (input.outputs !== undefined) data.outputs = input.outputs.trim();
      if (input.prompt !== undefined) data.prompt = input.prompt.trim();
      if (input.demoVideoId !== undefined) data.demoVideoId = input.demoVideoId.trim() || null;
      const skill = await prisma.skill.update({
        where: { id: input.id },
        data,
        select: { id: true, slug: true, title: true, group: true },
      });
      if (input.tagSlugs) await replaceSkillTags(skill.id, input.tagSlugs);
      await audit(actor.id, 'MCP_UPDATE_DRAFT', 'Skill', skill.id, { slug: skill.slug });
      return textResult({
        updated: true,
        state: 'DRAFT',
        ...skill,
        review: await reviewSkillDraft(skill.id),
      });
    }

    if (name === 'publish_draft') {
      if (actor.role !== 'ADMIN') return toolError('Публикация доступна только администратору.');
      if (args.confirmed !== true) {
        return toolError(
          'Покажите администратору проверку и предпросмотр, получите явное подтверждение и передайте confirmed: true.',
        );
      }
      const kind = args.kind === 'content' || args.kind === 'skill' ? args.kind : null;
      const id = typeof args.id === 'string' ? args.id : '';
      if (!kind || !id) return toolError('Укажите kind и id.');
      const review =
        kind === 'content'
          ? await publishReviewedContent(actor, id)
          : await publishReviewedSkill(actor, id);
      return review.ready
        ? textResult({ published: true, kind, id, review })
        : toolError(
            `Публикация остановлена: ${review.issues
              .filter((issue) => issue.level === 'error')
              .map((issue) => issue.message)
              .join(' ')}`,
          );
    }

    return toolError(`Неизвестный редакторский инструмент: ${name}`);
  } catch (cause) {
    return toolError(cause instanceof Error ? cause.message : 'Не удалось выполнить инструмент.');
  }
}
