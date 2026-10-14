import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { CourseForm } from '@/components/admin/CourseForm';

export const metadata: Metadata = { title: 'Новый курс' };

export default async function NewCoursePage() {
  await requireRole(['ADMIN', 'EDITOR']);
  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Курсы"
        title="Новый курс"
        description="Сначала создайте карточку курса, затем добавьте модули и распределите уроки."
        actions={
          <Link href="/admin/courses" className={buttonClass('secondary')}>
            <Icon name="alt-arrow-left-linear" />К курсам
          </Link>
        }
      />
      <CourseForm canPublish={false} />
    </div>
  );
}
