import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { deleteCourse } from '@/server/admin/courses';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { CourseForm } from '@/components/admin/CourseForm';
import { CourseStructureEditor } from '@/components/admin/CourseStructureEditor';

export const metadata: Metadata = { title: 'Редактор курса' };

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const { id } = await params;
  const [course, unplaced] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
          include: {
            units: {
              orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
              include: { unit: { select: { id: true, title: true, state: true } } },
            },
          },
        },
      },
    }),
    prisma.contentUnit.findMany({
      where: { type: 'LESSON', routeDayId: null, courses: { none: {} } },
      orderBy: [{ createdAt: 'desc' }],
      select: { id: true, title: true, state: true },
    }),
  ]);
  if (!course) notFound();

  const canArrange = actor.role === 'ADMIN' || course.state === 'DRAFT';

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Курсы"
        title={course.title}
        description="Настройки карточки и визуальная структура модулей и уроков."
        actions={
          <Link href="/admin/courses" className={buttonClass('secondary')}>
            <Icon name="alt-arrow-left-linear" />К курсам
          </Link>
        }
      />

      <div className="space-y-8">
        {canArrange ? (
          <CourseForm
            canPublish={actor.role === 'ADMIN'}
            defaults={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              summary: course.summary ?? undefined,
              state: course.state,
            }}
          />
        ) : (
          <Panel title="Карточка // Только чтение">
            <div className="p-5 text-sm leading-relaxed text-t600">
              Опубликованный курс может редактировать администратор. Эксперт может открыть уроки и
              подготовить новые черновики.
            </div>
          </Panel>
        )}

        <CourseStructureEditor
          courseId={course.id}
          canArrange={canArrange}
          initialModules={course.modules.map((moduleItem) => ({
            id: moduleItem.id,
            title: moduleItem.title,
            summary: moduleItem.summary,
            sort: moduleItem.sort,
            units: moduleItem.units.map((placement) => placement.unit),
          }))}
          initialUnplaced={unplaced}
        />

        {actor.role === 'ADMIN' ? (
          <Panel title="Опасная зона">
            <form action={deleteCourse} className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="font-medium text-t900">Удалить курс</div>
                <p className="mt-1 text-sm text-t500">
                  Уроки сохранятся, но перестанут входить в этот курс.
                </p>
              </div>
              <input type="hidden" name="id" value={course.id} />
              <button type="submit" className={buttonClass('secondary')}>
                <Icon name="trash-bin-minimalistic-linear" />
                Удалить курс
              </button>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
