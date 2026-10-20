'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/access/guard';
import { slugify } from '@/lib/utils';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';
import { audit } from './audit';

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Название обязательно'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  state: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

async function assertCourseEditable(courseId: string, role: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, state: true },
  });
  if (!course) throw new Error('Курс не найден');
  if (role !== 'ADMIN' && course.state !== 'DRAFT') {
    throw new Error('Эксперт может менять структуру только чернового курса');
  }
  return course;
}

export async function saveCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  const d = parsed.data;

  if (d.id) {
    try {
      await assertCourseEditable(d.id, actor.role);
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Нет прав' };
    }
  }

  const slug = d.slug?.trim() || slugify(d.title);
  const clash = await prisma.course.findFirst({
    where: { slug, ...(d.id ? { id: { not: d.id } } : {}) },
    select: { id: true },
  });
  if (clash) return { ok: false, fieldErrors: { slug: 'Такой адрес уже занят' } };

  const state = actor.role === 'ADMIN' && d.id ? d.state : 'DRAFT';
  let courseId = d.id;
  if (courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: d.title,
        slug,
        summary: d.summary || null,
        state,
      },
    });
    await audit(actor.id, 'UPDATE', 'Course', courseId, { slug, state });
  } else {
    const last = await prisma.course.aggregate({ _max: { sort: true } });
    const course = await prisma.course.create({
      data: {
        title: d.title,
        slug,
        summary: d.summary || null,
        state,
        sort: (last._max.sort ?? -1) + 1,
      },
    });
    courseId = course.id;
    await audit(actor.id, 'CREATE', 'Course', course.id, { slug, state });
  }

  revalidatePath('/admin/courses');
  revalidatePath('/lessons');
  redirect(`/admin/courses/${courseId}`);
}

export async function deleteCourse(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN']);
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.course.delete({ where: { id } });
  await audit(actor.id, 'DELETE', 'Course', id);
  revalidatePath('/admin/courses');
  revalidatePath('/lessons');
  redirect('/admin/courses');
}

export async function createCourseModule(courseId: string, title: string) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  await assertCourseEditable(courseId, actor.role);
  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, message: 'Введите название модуля' };
  const last = await prisma.courseModule.aggregate({
    where: { courseId },
    _max: { sort: true },
  });
  const moduleItem = await prisma.courseModule.create({
    data: { courseId, title: cleanTitle, sort: (last._max.sort ?? -1) + 1 },
    select: { id: true, title: true, summary: true, isVisible: true, sort: true },
  });
  await audit(actor.id, 'CREATE', 'CourseModule', moduleItem.id, { courseId });
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/lessons');
  return { ok: true, module: { ...moduleItem, units: [] } };
}

export async function renameCourseModule(moduleId: string, title: string) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const moduleItem = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!moduleItem) return { ok: false, message: 'Модуль не найден' };
  await assertCourseEditable(moduleItem.courseId, actor.role);
  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, message: 'Введите название модуля' };
  await prisma.courseModule.update({ where: { id: moduleId }, data: { title: cleanTitle } });
  await audit(actor.id, 'UPDATE', 'CourseModule', moduleId, { title: cleanTitle });
  revalidatePath(`/admin/courses/${moduleItem.courseId}`);
  revalidatePath('/lessons');
  return { ok: true };
}

export async function setCourseModuleVisibility(moduleId: string, isVisible: boolean) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const moduleItem = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!moduleItem) return { ok: false, message: 'Модуль не найден' };
  await assertCourseEditable(moduleItem.courseId, actor.role);
  await prisma.courseModule.update({ where: { id: moduleId }, data: { isVisible } });
  await audit(actor.id, 'UPDATE', 'CourseModule', moduleId, { isVisible });
  revalidatePath(`/admin/courses/${moduleItem.courseId}`);
  revalidatePath('/lessons');
  return { ok: true };
}

export async function setCourseLessonVisibility(
  moduleId: string,
  unitId: string,
  isVisible: boolean,
) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const placement = await prisma.courseUnit.findUnique({
    where: { moduleId_unitId: { moduleId, unitId } },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });
  if (!placement) return { ok: false, message: 'Урок не включён в курс' };
  await assertCourseEditable(placement.module.courseId, actor.role);
  await prisma.courseUnit.update({
    where: { moduleId_unitId: { moduleId, unitId } },
    data: { isVisible },
  });
  await audit(actor.id, 'UPDATE', 'CourseUnit', `${placement.moduleId}:${unitId}`, { isVisible });
  revalidatePath(`/admin/courses/${placement.module.courseId}`);
  revalidatePath('/lessons');
  return { ok: true };
}

export async function deleteCourseModule(moduleId: string) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const moduleItem = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!moduleItem) return { ok: false, message: 'Модуль не найден' };
  await assertCourseEditable(moduleItem.courseId, actor.role);
  await prisma.courseModule.delete({ where: { id: moduleId } });
  await audit(actor.id, 'DELETE', 'CourseModule', moduleId, { courseId: moduleItem.courseId });
  revalidatePath(`/admin/courses/${moduleItem.courseId}`);
  revalidatePath('/lessons');
  return { ok: true };
}

const structureSchema = z.object({
  courseId: z.string(),
  modules: z.array(z.object({ id: z.string(), sort: z.number().int().min(0) })),
  lessons: z.array(
    z.object({
      unitId: z.string(),
      moduleId: z.string().nullable(),
      isVisible: z.boolean(),
      sort: z.number().int().min(0),
    }),
  ),
});

export async function saveCourseStructure(input: z.infer<typeof structureSchema>) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Некорректная структура курса' };
  const d = parsed.data;
  await assertCourseEditable(d.courseId, actor.role);

  const moduleRows = await prisma.courseModule.findMany({
    where: { courseId: d.courseId },
    select: { id: true },
  });
  const actualModuleIds = new Set(moduleRows.map((item) => item.id));
  if (
    actualModuleIds.size !== d.modules.length ||
    d.modules.some((item) => !actualModuleIds.has(item.id)) ||
    d.lessons.some((item) => item.moduleId && !actualModuleIds.has(item.moduleId))
  ) {
    return { ok: false, message: 'Состав модулей изменился. Обновите страницу.' };
  }

  const unitIds = [...new Set(d.lessons.map((item) => item.unitId))];
  const lessonRows = await prisma.contentUnit.findMany({
    where: { id: { in: unitIds }, type: 'LESSON' },
    select: {
      id: true,
      courses: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (lessonRows.length !== unitIds.length)
    return { ok: false, message: 'Один из уроков не найден' };
  if (
    lessonRows.some((lesson) => lesson.courses.some((item) => item.module.courseId !== d.courseId))
  ) {
    return { ok: false, message: 'Урок уже размещён в другом курсе' };
  }

  const placed = d.lessons.filter(
    (item): item is { unitId: string; moduleId: string; isVisible: boolean; sort: number } =>
      Boolean(item.moduleId),
  );
  await prisma.$transaction([
    ...d.modules.map((item) =>
      prisma.courseModule.update({ where: { id: item.id }, data: { sort: item.sort } }),
    ),
    prisma.courseUnit.deleteMany({ where: { unitId: { in: unitIds } } }),
    ...(placed.length > 0
      ? [
          prisma.courseUnit.createMany({
            data: placed.map((item) => ({
              moduleId: item.moduleId,
              unitId: item.unitId,
              isVisible: item.isVisible,
              sort: item.sort,
            })),
          }),
          prisma.contentUnit.updateMany({
            where: { id: { in: placed.map((item) => item.unitId) } },
            data: { routeDayId: null, minPlan: 'SUPPORT' },
          }),
        ]
      : []),
  ]);
  await audit(actor.id, 'REORDER', 'Course', d.courseId, {
    modules: d.modules.length,
    lessons: placed.length,
  });
  revalidatePath(`/admin/courses/${d.courseId}`);
  revalidatePath('/lessons');
  return { ok: true, message: 'Структура сохранена' };
}

export async function saveCourseOrder(courseIds: string[]) {
  const actor = await requireRole(['ADMIN']);
  const ids = z.array(z.string()).safeParse(courseIds);
  if (!ids.success) return { ok: false, message: 'Некорректный порядок курсов' };
  const rows = await prisma.course.findMany({ select: { id: true } });
  const actual = new Set(rows.map((row) => row.id));
  if (actual.size !== ids.data.length || ids.data.some((id) => !actual.has(id))) {
    return { ok: false, message: 'Список курсов изменился. Обновите страницу.' };
  }
  await prisma.$transaction(
    ids.data.map((id, sort) => prisma.course.update({ where: { id }, data: { sort } })),
  );
  await audit(actor.id, 'REORDER', 'CourseCatalog', 'all', { courses: ids.data.length });
  revalidatePath('/admin/courses');
  revalidatePath('/lessons');
  return { ok: true, message: 'Порядок курсов сохранён' };
}
