import type { PublishState } from '@prisma/client';
import type { Actor } from '@/server/access';
import { listContent, type ContentCard } from '@/server/content/service';
import { prisma } from '@/server/db';

export type CourseCatalogItem = {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  state: PublishState;
  moduleCount: number;
  lessonCount: number;
  viewedCount: number;
  resumeLessonSlug: string | null;
};

export type CourseModuleView = {
  id: string;
  title: string;
  summary: string | null;
  sort: number;
  lessons: ContentCard[];
};

export type CourseView = CourseCatalogItem & {
  modules: CourseModuleView[];
};

function isStaff(actor: Actor): boolean {
  return actor.role === 'ADMIN' || actor.role === 'EDITOR';
}

function summarizeCourse(
  course: {
    slug: string;
    title: string;
    summary: string | null;
    coverUrl: string | null;
    state: PublishState;
    modules: Array<{
      id: string;
      title: string;
      summary: string | null;
      sort: number;
      units: Array<{ unit: { slug: string } }>;
    }>;
  },
  cardsBySlug: Map<string, ContentCard>,
): CourseView {
  const modules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    summary: module.summary,
    sort: module.sort,
    lessons: module.units.flatMap(({ unit }) => {
      const card = cardsBySlug.get(unit.slug);
      return card ? [card] : [];
    }),
  }));
  const lessons = modules.flatMap((module) => module.lessons);

  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    coverUrl: course.coverUrl,
    state: course.state,
    moduleCount: modules.length,
    lessonCount: lessons.length,
    viewedCount: lessons.filter((lesson) => lesson.status !== 'NONE').length,
    resumeLessonSlug:
      lessons.find((lesson) => lesson.status === 'NONE')?.slug ?? lessons[0]?.slug ?? null,
    modules,
  };
}

const courseInclude = {
  modules: {
    orderBy: [{ sort: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      units: {
        where: { unit: { type: 'LESSON' as const } },
        orderBy: [{ sort: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { unit: { select: { slug: true } } },
      },
    },
  },
};

export async function listCourses(actor: Actor): Promise<CourseCatalogItem[]> {
  const [courses, cards] = await Promise.all([
    prisma.course.findMany({
      where: isStaff(actor) ? undefined : { state: 'PUBLISHED' },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      include: courseInclude,
    }),
    listContent(actor, { type: 'LESSON' }),
  ]);
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  return courses.map((course) => summarizeCourse(course, cardsBySlug));
}

export async function getCourse(actor: Actor, slug: string): Promise<CourseView | null> {
  const [course, cards] = await Promise.all([
    prisma.course.findFirst({
      where: {
        slug,
        ...(isStaff(actor) ? {} : { state: 'PUBLISHED' as const }),
      },
      include: courseInclude,
    }),
    listContent(actor, { type: 'LESSON' }),
  ]);
  if (!course) return null;
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  return summarizeCourse(course, cardsBySlug);
}
