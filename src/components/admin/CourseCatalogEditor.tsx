'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { saveCourseOrder } from '@/server/admin/courses';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type CourseItem = {
  id: string;
  title: string;
  summary: string | null;
  state: string;
  moduleCount: number;
  lessonCount: number;
};

const STATE_LABEL: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  ARCHIVED: 'Архив',
};

export function CourseCatalogEditor({
  initialCourses,
  canArrange,
}: {
  initialCourses: CourseItem[];
  canArrange: boolean;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function drop(beforeId: string) {
    if (!canArrange || !draggedId || draggedId === beforeId) return;
    setCourses((current) => {
      const next = [...current];
      const from = next.findIndex((course) => course.id === draggedId);
      const to = next.findIndex((course) => course.id === beforeId);
      if (from < 0 || to < 0) return current;
      const [course] = next.splice(from, 1);
      if (!course) return current;
      next.splice(to, 0, course);
      return next;
    });
    setDirty(true);
    setDraggedId(null);
  }

  function save() {
    startTransition(async () => {
      try {
        const result = await saveCourseOrder(courses.map((course) => course.id));
        setMessage(result.message ?? null);
        if (result.ok) setDirty(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось сохранить порядок');
      }
    });
  }

  return (
    <div className="space-y-4">
      {canArrange ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4">
          <p className="text-sm text-t500">
            Перетащите карточки, чтобы изменить порядок курсов у студентов.
          </p>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className={buttonClass('secondary')}
          >
            <Icon name="diskette-linear" />
            {dirty ? 'Сохранить порядок' : 'Порядок сохранён'}
          </button>
        </div>
      ) : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <div className="grid gap-5 xl:grid-cols-2">
        {courses.map((course) => (
          <article
            key={course.id}
            draggable={canArrange}
            onDragStart={() => setDraggedId(course.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              drop(course.id);
            }}
            className={cn(
              'group overflow-hidden rounded-2xl border border-line bg-paper shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30',
              canArrange && 'cursor-grab active:cursor-grabbing',
            )}
          >
            <Link href={`/admin/courses/${course.id}`} className="flex min-h-48 flex-col p-5">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {canArrange ? (
                      <Icon name="hamburger-menu-linear" className="text-t400" />
                    ) : null}
                    <StatusPill muted={course.state !== 'PUBLISHED'}>
                      {STATE_LABEL[course.state]}
                    </StatusPill>
                  </div>
                  <Icon
                    name="alt-arrow-right-linear"
                    className="text-t300 group-hover:text-accent"
                  />
                </div>
                <h2 className="mt-4 text-xl font-bold leading-tight text-t900 group-hover:text-accent">
                  {course.title}
                </h2>
                {course.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-t600">
                    {course.summary}
                  </p>
                ) : null}
                <div className="mt-auto flex gap-4 pt-5 text-xs text-t500">
                  <span>{course.moduleCount} модулей</span>
                  <span>{course.lessonCount} уроков</span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
