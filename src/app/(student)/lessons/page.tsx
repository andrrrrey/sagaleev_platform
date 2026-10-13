import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { listCourses } from '@/server/courses/service';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Курсы' };

export default async function LessonsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const courses = await listCourses(actor);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <PageHeader
        kicker="Обучение"
        title="Каталог курсов"
        description="Выберите курс, откройте его программу и проходите уроки последовательно — от первого модуля к следующему."
      />

      {courses.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Курсы // Empty">Опубликованных курсов пока нет.</EmptyState>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => {
            const progress = course.lessonCount
              ? Math.round((course.viewedCount / course.lessonCount) * 100)
              : 0;
            return (
              <Link key={course.slug} href={`/lessons/course/${course.slug}`} className="group">
                <Panel
                  className="h-full group-hover:-translate-y-1 group-hover:border-accent/30"
                  title={`Курс ${String(index + 1).padStart(2, '0')}`}
                  status={
                    <StatusPill muted={progress === 0}>
                      {progress === 100 ? 'Пройден' : `${progress}%`}
                    </StatusPill>
                  }
                >
                  <div className="flex h-full flex-col p-5 md:p-6">
                    <div className="mb-6 flex h-28 items-end overflow-hidden rounded-[18px] border border-accent/15 bg-accent/10 p-5">
                      <div className="flex w-full items-end justify-between">
                        <Icon name="notebook-linear" className="text-4xl text-accent" />
                        <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent/70">
                          {course.moduleCount} мод.
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold leading-tight tracking-tight text-t900">
                      {course.title}
                    </h2>
                    {course.summary ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-t600">
                        {course.summary}
                      </p>
                    ) : null}

                    <div className="mt-6 grid grid-cols-2 gap-3 border-y border-line/60 py-4 text-sm">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-t400">
                          Модули
                        </div>
                        <div className="mt-1 font-semibold text-t800">{course.moduleCount}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-t400">
                          Уроки
                        </div>
                        <div className="mt-1 font-semibold text-t800">{course.lessonCount}</div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-t500">
                        <span>Ваш прогресс</span>
                        <span>
                          {course.viewedCount} из {course.lessonCount}
                        </span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>

                    <div className="mt-auto pt-6">
                      <span
                        className={buttonClass(
                          'secondary',
                          'w-full group-hover:border-accent/30 group-hover:text-accent',
                        )}
                      >
                        {course.viewedCount > 0 ? 'Продолжить курс' : 'Открыть курс'}
                        <Icon name="arrow-right-linear" />
                      </span>
                    </div>
                  </div>
                </Panel>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
