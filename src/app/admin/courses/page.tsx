import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { CourseCatalogEditor } from '@/components/admin/CourseCatalogEditor';

export const metadata: Metadata = { title: 'Админ — курсы' };

export default async function AdminCoursesPage() {
  const actor = await requireRole(['ADMIN', 'EDITOR']);
  const courses = await prisma.course.findMany({
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    include: {
      modules: {
        select: { id: true, _count: { select: { units: true } } },
      },
    },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Курсы"
        description="Создавайте курсы и модули, затем собирайте программу перетаскиванием уроков."
        actions={
          <Link href="/admin/courses/new" className={buttonClass('primary')}>
            <Icon name="add-circle-linear" />
            Новый курс
          </Link>
        }
      />

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
          <p className="text-sm text-t500">Курсов пока нет.</p>
          <Link href="/admin/courses/new" className={`${buttonClass('primary')} mt-4`}>
            Создать первый курс
          </Link>
        </div>
      ) : (
        <CourseCatalogEditor
          canArrange={actor.role === 'ADMIN'}
          initialCourses={courses.map((course) => ({
            id: course.id,
            title: course.title,
            summary: course.summary,
            state: course.state,
            moduleCount: course.modules.length,
            lessonCount: course.modules.reduce(
              (sum, moduleItem) => sum + moduleItem._count.units,
              0,
            ),
          }))}
        />
      )}
    </div>
  );
}
