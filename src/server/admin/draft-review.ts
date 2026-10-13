import type { Actor } from '@/server/access';
import { prisma } from '@/server/db';
import { audit } from './audit';

export type DraftReviewIssue = {
  level: 'error' | 'warning' | 'ok';
  field: string;
  message: string;
};

export type DraftReview = {
  ready: boolean;
  issues: DraftReviewIssue[];
};

function hasJsonContent(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

export async function reviewContentDraft(id: string): Promise<DraftReview | null> {
  const unit = await prisma.contentUnit.findUnique({
    where: { id },
    include: { _count: { select: { tags: true, courses: true } } },
  });
  if (!unit) return null;

  const issues: DraftReviewIssue[] = [];
  const error = (field: string, message: string) => issues.push({ level: 'error', field, message });
  const warning = (field: string, message: string) =>
    issues.push({ level: 'warning', field, message });
  const ok = (field: string, message: string) => issues.push({ level: 'ok', field, message });

  if (unit.title.trim()) ok('title', 'Название заполнено.');
  else error('title', 'Добавьте название.');
  if (unit.summary?.trim()) ok('summary', 'Краткое описание заполнено.');
  else warning('summary', 'Добавьте краткое описание для карточки материала.');
  if (unit._count.tags > 0) ok('tags', 'Теги добавлены.');
  else warning('tags', 'Добавьте хотя бы один тег для поиска и рекомендаций.');

  if (unit.type === 'LESSON') {
    if (unit._count.courses > 0) ok('module', 'Урок добавлен в модуль курса.');
    else error('module', 'Добавьте урок хотя бы в один модуль курса.');
    if (!unit.kinescopeId && !hasJsonContent(unit.article) && !unit.transcript?.trim()) {
      error('lessonContent', 'Добавьте видео Kinescope, текстовую версию или транскрипт урока.');
    } else {
      ok('lessonContent', 'Основной материал урока добавлен.');
    }
  }

  if (unit.type === 'STREAM') {
    if (unit.airedAt) ok('airedAt', 'Дата эфира указана.');
    else error('airedAt', 'Укажите дату эфира.');
    if (!unit.kinescopeId && !hasJsonContent(unit.article) && !unit.transcript?.trim()) {
      error('streamContent', 'Добавьте запись Kinescope, конспект или транскрипт эфира.');
    } else {
      ok('streamContent', 'Материал эфира добавлен.');
    }
  }

  if (unit.type === 'USECASE') {
    if (unit.goal?.trim()) ok('goal', 'Цель заполнена.');
    else error('goal', 'Заполните цель юзкейса.');
    if (unit.result?.trim()) ok('result', 'Результат заполнен.');
    else error('result', 'Заполните результат юзкейса.');
    if (hasJsonContent(unit.description) || hasJsonContent(unit.article)) {
      ok('description', 'Описание или статья добавлены.');
    } else {
      error('description', 'Добавьте описание или статью-разбор юзкейса.');
    }
    if (Array.isArray(unit.steps) && unit.steps.length > 0) {
      ok('steps', 'Пошаговые действия заполнены.');
    } else {
      warning('steps', 'Добавьте пошаговые действия, чтобы юзкейс было проще повторить.');
    }
  }

  return { ready: !issues.some((issue) => issue.level === 'error'), issues };
}

export async function reviewSkillDraft(id: string): Promise<DraftReview | null> {
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: { _count: { select: { tags: true } } },
  });
  if (!skill) return null;

  const issues: DraftReviewIssue[] = [];
  const required: Array<[string, string, string]> = [
    ['title', skill.title, 'Название'],
    ['shortDesc', skill.shortDesc, 'Описание результата'],
    ['inputs', skill.inputs, 'Входные данные'],
    ['outputs', skill.outputs, 'Результат работы'],
    ['prompt', skill.prompt, 'Полная инструкция для агента'],
  ];
  for (const [field, value, label] of required) {
    issues.push(
      value.trim()
        ? { level: 'ok', field, message: `${label}: заполнено.` }
        : { level: 'error', field, message: `${label}: заполните перед публикацией.` },
    );
  }
  if (skill.prompt.trim().length < 200) {
    issues.push({
      level: 'warning',
      field: 'prompt',
      message: 'Инструкция короче 200 символов. Проверьте, достаточно ли она подробная для агента.',
    });
  }
  issues.push(
    skill._count.tags > 0
      ? { level: 'ok', field: 'tags', message: 'Теги добавлены.' }
      : { level: 'warning', field: 'tags', message: 'Добавьте теги для поиска скилла.' },
  );

  return { ready: !issues.some((issue) => issue.level === 'error'), issues };
}

type PublishingActor = Pick<Actor, 'id' | 'role'>;

function assertAdmin(actor: PublishingActor): void {
  if (actor.role !== 'ADMIN') throw new Error('Публикация доступна только администратору.');
}

export async function publishReviewedContent(
  actor: PublishingActor,
  id: string,
): Promise<DraftReview> {
  assertAdmin(actor);
  const target = await prisma.contentUnit.findUnique({ where: { id }, select: { state: true } });
  if (!target || target.state !== 'DRAFT') throw new Error('Публиковать можно только черновики.');
  const review = await reviewContentDraft(id);
  if (!review) throw new Error('Материал не найден.');
  if (!review.ready) return review;
  const unit = await prisma.contentUnit.update({
    where: { id },
    data: { state: 'PUBLISHED', publishedAt: new Date() },
    select: { slug: true, type: true },
  });
  await audit(actor.id, 'PUBLISH', 'ContentUnit', id, { slug: unit.slug, type: unit.type });
  return review;
}

export async function publishReviewedSkill(
  actor: PublishingActor,
  id: string,
): Promise<DraftReview> {
  assertAdmin(actor);
  const target = await prisma.skill.findUnique({ where: { id }, select: { state: true } });
  if (!target || target.state !== 'DRAFT') throw new Error('Публиковать можно только черновики.');
  const review = await reviewSkillDraft(id);
  if (!review) throw new Error('Скилл не найден.');
  if (!review.ready) return review;
  const skill = await prisma.skill.update({
    where: { id },
    data: { state: 'PUBLISHED' },
    select: { slug: true },
  });
  await audit(actor.id, 'PUBLISH', 'Skill', id, { slug: skill.slug });
  return review;
}
