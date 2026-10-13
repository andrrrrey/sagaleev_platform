import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { getCourse } from '@/server/courses/service';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';

export const metadata: Metadata = { title: 'Программа курса' };

const STATUS_LABEL: Record<string, string> = {
  VIEWED: 'Просмотрен',
  SUBMITTED: 'Сдан',
  IMPLEMENTED: 'Внедрён',
  RESULT: 'Результат',
};

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const { slug } = await params;
  const course = await getCourse(actor, slug);
  if (!course) notFound();

  const progress = course.lessonCount
    ? Math.round((course.viewedCount / course.lessonCount) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <Link
        href="/lessons"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-t500 transition-colors hover:text-accent"
      >
        <Icon name="arrow-left-linear" />
        Все курсы
      </Link>

      <PageHeader
        kicker="Программа курса"
        title={course.title}
        description={course.summary ?? 'Проходите модули и уроки последовательно.'}
        actions={
          course.resumeLessonSlug ? (
            <Link href={`/lessons/${course.resumeLessonSlug}`} className={buttonClass('primary')}>
              {course.viewedCount > 0 ? 'Продолжить обучение' : 'Начать обучение'}
              <Icon name="play-circle-linear" />
            </Link>
          ) : null
        }
      />

      <Panel className="mb-8" bodyClassName="p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-t800">Прогресс курса</span>
              <span className="text-t500">
                {course.viewedCount} из {course.lessonCount} уроков
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>
          <div className="flex gap-6 border-t border-line/60 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-t400">
                Модули
              </div>
              <div className="mt-1 text-xl font-bold text-t900">{course.moduleCount}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-t400">
                Готово
              </div>
              <div className="mt-1 text-xl font-bold text-accent">{progress}%</div>
            </div>
          </div>
        </div>
      </Panel>

      {course.modules.length === 0 ? (
        <EmptyState label="Модули // Empty">В этом курсе пока нет модулей.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {course.modules.map((module, moduleIndex) => {
            const viewed = module.lessons.filter((lesson) => lesson.status !== 'NONE').length;
            const complete = module.lessons.length > 0 && viewed === module.lessons.length;
            return (
              <Panel
                key={module.id}
                title={`Модуль ${String(moduleIndex + 1).padStart(2, '0')}`}
                status={
                  <StatusPill muted={viewed === 0}>
                    {complete ? 'Пройден' : `${viewed} / ${module.lessons.length}`}
                  </StatusPill>
                }
              >
                <div className="border-b border-line/60 px-5 py-5 md:px-6">
                  <h2 className="text-xl font-bold tracking-tight text-t900">{module.title}</h2>
                  {module.summary ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-t600">
                      {module.summary}
                    </p>
                  ) : null}
                </div>

                {module.lessons.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-t500">
                    В модуле пока нет опубликованных уроков.
                  </div>
                ) : (
                  <ol className="divide-y divide-line/60">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const lessonDone = lesson.status !== 'NONE';
                      return (
                        <li key={lesson.slug}>
                          <Link
                            href={`/lessons/${lesson.slug}`}
                            className="group/lesson grid gap-3 px-5 py-5 transition-colors hover:bg-paper-hover/60 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center md:px-6"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper font-mono text-xs text-t500 group-hover/lesson:border-accent/30 group-hover/lesson:text-accent">
                              {String(lessonIndex + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <Icon
                                  name={
                                    lessonDone ? 'check-circle-linear' : 'videocamera-record-linear'
                                  }
                                  className={lessonDone ? 'text-accent' : 'text-t400'}
                                />
                                <span className="font-semibold text-t800 group-hover/lesson:text-t900">
                                  {lesson.title}
                                </span>
                              </span>
                              {lesson.summary ? (
                                <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-t500">
                                  {lesson.summary}
                                </span>
                              ) : null}
                            </span>
                            <span className="flex items-center gap-3 pl-[3.25rem] text-xs text-t500 sm:pl-0">
                              {lessonDone ? <span>{STATUS_LABEL[lesson.status]}</span> : null}
                              {lesson.timeToMaster ? (
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Icon name="clock-circle-linear" />
                                  {lesson.timeToMaster}
                                </span>
                              ) : null}
                              {lesson.locked ? (
                                <Icon name="lock-linear" className="text-t400" />
                              ) : null}
                              <Icon name="alt-arrow-right-linear" className="text-t400" />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
