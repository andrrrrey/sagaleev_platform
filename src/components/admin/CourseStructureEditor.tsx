'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  createCourseModule,
  deleteCourseModule,
  renameCourseModule,
  saveCourseStructure,
} from '@/server/admin/courses';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Lesson = { id: string; title: string; state: string; isVisible: boolean };
type CourseModuleItem = {
  id: string;
  title: string;
  summary: string | null;
  isVisible: boolean;
  sort: number;
  units: Lesson[];
};

type DragItem = { kind: 'module'; id: string } | { kind: 'lesson'; id: string };

const STATE_LABEL: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  ARCHIVED: 'Архив',
};

export function CourseStructureEditor({
  courseId,
  initialModules,
  initialUnplaced,
  canArrange,
}: {
  courseId: string;
  initialModules: CourseModuleItem[];
  initialUnplaced: Lesson[];
  canArrange: boolean;
}) {
  const [modules, setModules] = useState(initialModules);
  const [unplaced, setUnplaced] = useState(initialUnplaced);
  const [newModule, setNewModule] = useState('');
  const [dragged, setDragged] = useState<DragItem | null>(null);
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Set<string>>(() => new Set());
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function findLesson(id: string): Lesson | undefined {
    return (
      unplaced.find((lesson) => lesson.id === id) ??
      modules.flatMap((item) => item.units).find((lesson) => lesson.id === id)
    );
  }

  function markStructureChanged(message = 'Есть несохранённые изменения.') {
    setDirty(true);
    setMessage(message);
  }

  function toggleModule(moduleId: string) {
    setCollapsedModuleIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function removeLesson(id: string) {
    setUnplaced((current) => current.filter((lesson) => lesson.id !== id));
    setModules((current) =>
      current.map((item) => ({ ...item, units: item.units.filter((lesson) => lesson.id !== id) })),
    );
  }

  function dropLesson(moduleId: string | null, beforeId?: string) {
    if (!canArrange || dragged?.kind !== 'lesson') return;
    const lesson = findLesson(dragged.id);
    if (!lesson) return;
    removeLesson(lesson.id);
    if (!moduleId) {
      setUnplaced((current) => [...current.filter((item) => item.id !== lesson.id), lesson]);
    } else {
      setModules((current) =>
        current.map((item) => {
          if (item.id !== moduleId) return item;
          const units = item.units.filter((unit) => unit.id !== lesson.id);
          const index = beforeId ? units.findIndex((unit) => unit.id === beforeId) : -1;
          if (index >= 0) units.splice(index, 0, lesson);
          else units.push(lesson);
          return { ...item, units };
        }),
      );
    }
    markStructureChanged();
    setDragged(null);
  }

  function dropModule(beforeId: string) {
    if (!canArrange || dragged?.kind !== 'module' || dragged.id === beforeId) return;
    setModules((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.id === dragged.id);
      const to = next.findIndex((item) => item.id === beforeId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
    markStructureChanged();
    setDragged(null);
  }

  function dropModuleAtEnd() {
    if (!canArrange || dragged?.kind !== 'module') return;
    setModules((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.id === dragged.id);
      if (from < 0 || from === next.length - 1) return current;
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.push(item);
      return next;
    });
    markStructureChanged();
    setDragged(null);
  }

  function addModule() {
    const title = newModule.trim();
    if (!title) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await createCourseModule(courseId, title);
        if (!result.ok || !result.module) {
          setMessage(result.message ?? 'Не удалось создать модуль');
          return;
        }
        setModules((current) => [...current, result.module!]);
        setNewModule('');
        setMessage('Модуль создан');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось создать модуль');
      }
    });
  }

  function renameModule(item: CourseModuleItem) {
    const title = window.prompt('Новое название модуля', item.title)?.trim();
    if (!title || title === item.title) return;
    startTransition(async () => {
      try {
        const result = await renameCourseModule(item.id, title);
        if (!result.ok) return setMessage(result.message ?? 'Не удалось переименовать модуль');
        setModules((current) =>
          current.map((moduleItem) =>
            moduleItem.id === item.id ? { ...moduleItem, title } : moduleItem,
          ),
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось переименовать модуль');
      }
    });
  }

  function removeModule(item: CourseModuleItem) {
    if (
      !window.confirm(
        `Удалить модуль «${item.title}»? Уроки останутся на платформе и попадут в блок «Без модуля».`,
      )
    )
      return;
    startTransition(async () => {
      try {
        const result = await deleteCourseModule(item.id);
        if (!result.ok) return setMessage(result.message ?? 'Не удалось удалить модуль');
        setModules((current) => current.filter((moduleItem) => moduleItem.id !== item.id));
        setUnplaced((current) => [...current, ...item.units]);
        setMessage('Модуль удалён, уроки сохранены');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось удалить модуль');
      }
    });
  }

  function toggleModuleVisibility(item: CourseModuleItem) {
    const isVisible = !item.isVisible;
    setModules((current) =>
      current.map((moduleItem) =>
        moduleItem.id === item.id ? { ...moduleItem, isVisible } : moduleItem,
      ),
    );
    markStructureChanged(
      isVisible
        ? 'Модуль будет показан после сохранения изменений.'
        : 'Модуль и его уроки будут скрыты после сохранения изменений.',
    );
  }

  function toggleLessonVisibility(moduleId: string, lesson: Lesson) {
    const isVisible = !lesson.isVisible;
    setModules((current) =>
      current.map((moduleItem) =>
        moduleItem.id === moduleId
          ? {
              ...moduleItem,
              units: moduleItem.units.map((unit) =>
                unit.id === lesson.id ? { ...unit, isVisible } : unit,
              ),
            }
          : moduleItem,
      ),
    );
    markStructureChanged(
      isVisible
        ? 'Урок будет показан после сохранения изменений.'
        : 'Урок будет скрыт после сохранения изменений.',
    );
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveCourseStructure({
          courseId,
          modules: modules.map((item, index) => ({
            id: item.id,
            isVisible: item.isVisible,
            sort: index,
          })),
          lessons: [
            ...modules.flatMap((item) =>
              item.units.map((lesson, index) => ({
                unitId: lesson.id,
                moduleId: item.id,
                isVisible: lesson.isVisible,
                sort: index,
              })),
            ),
            ...unplaced.map((lesson, index) => ({
              unitId: lesson.id,
              moduleId: null,
              isVisible: lesson.isVisible,
              sort: index,
            })),
          ],
        });
        setMessage(result.message ?? (result.ok ? 'Структура сохранена' : 'Не удалось сохранить'));
        if (result.ok) setDirty(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось сохранить структуру');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-t900">Структура курса</h2>
            <p className="mt-1 text-sm text-t500">
              Перетаскивайте модули и уроки. Цифры порядка рассчитываются автоматически.
            </p>
          </div>
          {canArrange ? (
            <button
              type="button"
              onClick={save}
              disabled={pending || !dirty}
              className={buttonClass('primary')}
            >
              <Icon name="diskette-linear" />
              {pending ? 'Сохраняем…' : dirty ? 'Сохранить изменения' : 'Всё сохранено'}
            </button>
          ) : null}
        </div>
        {!canArrange ? (
          <p className="mt-4 rounded-xl bg-paper-tint p-3 text-sm text-t600">
            Опубликованный курс эксперт видит в режиме чтения. Изменить его структуру может
            администратор.
          </p>
        ) : (
          <div className="mt-5 flex gap-2">
            <input
              value={newModule}
              onChange={(event) => setNewModule(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addModule();
                }
              }}
              placeholder="Название нового модуля"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addModule}
              disabled={pending || !newModule.trim()}
              className={buttonClass('secondary')}
            >
              <Icon name="add-circle-linear" />
              Добавить модуль
            </button>
          </div>
        )}
        {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      </div>

      <div className="space-y-4">
        {modules.map((item, moduleIndex) => (
          <section
            key={item.id}
            draggable={canArrange}
            onDragStart={(event) => {
              if ((event.target as HTMLElement).closest('[data-lesson-card]')) return;
              setDragged({ kind: 'module', id: item.id });
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged?.kind === 'module') dropModule(item.id);
              else dropLesson(item.id);
            }}
            className={cn(
              'rounded-2xl border border-line bg-paper shadow-sm',
              canArrange && 'cursor-grab active:cursor-grabbing',
            )}
          >
            <header
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-5 py-4',
                !collapsedModuleIds.has(item.id) && 'border-b border-line/70',
              )}
            >
              <div className="flex items-center gap-3">
                {canArrange ? <Icon name="hamburger-menu-linear" className="text-t400" /> : null}
                <span className="rounded-full bg-paper-tint px-2.5 py-1 font-mono text-[10px] text-t500">
                  Модуль {moduleIndex + 1}
                </span>
                <h3 className="font-semibold text-t900">{item.title}</h3>
                <span className="text-xs text-t400">{item.units.length} ур.</span>
                {!item.isVisible ? (
                  <span className="rounded-full bg-paper-tint px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-t500">
                    Скрыт
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleModule(item.id)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-t500 hover:bg-paper-hover hover:text-t900"
                  aria-expanded={!collapsedModuleIds.has(item.id)}
                  aria-controls={`course-module-${item.id}`}
                >
                  <Icon
                    name="alt-arrow-down-linear"
                    className={cn(
                      'transition-transform',
                      collapsedModuleIds.has(item.id) && '-rotate-90',
                    )}
                  />
                  {collapsedModuleIds.has(item.id) ? 'Развернуть' : 'Свернуть'}
                </button>
                <Link
                  href={`/admin/content/new?type=LESSON&moduleId=${item.id}`}
                  className={buttonClass('ghost')}
                >
                  <Icon name="add-circle-linear" />
                  Новый урок
                </Link>
                {canArrange ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleModuleVisibility(item)}
                      disabled={pending}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-t500 hover:bg-paper-hover hover:text-t900"
                      title={
                        item.isVisible
                          ? 'Скрыть модуль и его уроки от учеников'
                          : 'Показать модуль ученикам'
                      }
                    >
                      {item.isVisible ? 'Скрыть' : 'Показать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => renameModule(item)}
                      className="rounded-lg p-2 text-t400 hover:bg-paper-hover hover:text-t900"
                      title="Переименовать"
                    >
                      <Icon name="pen-linear" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeModule(item)}
                      className="rounded-lg p-2 text-t400 hover:bg-paper-hover hover:text-accent"
                      title="Удалить модуль"
                    >
                      <Icon name="trash-bin-minimalistic-linear" />
                    </button>
                  </>
                ) : null}
              </div>
            </header>
            {!collapsedModuleIds.has(item.id) ? (
              <div id={`course-module-${item.id}`} className="min-h-20 space-y-2 p-3">
                {item.units.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-t400">
                    Перетащите сюда урок или создайте новый.
                  </div>
                ) : (
                  item.units.map((lesson, lessonIndex) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={lessonIndex}
                      draggable={canArrange}
                      onDragStart={() => setDragged({ kind: 'lesson', id: lesson.id })}
                      onDrop={() => dropLesson(item.id, lesson.id)}
                      onToggleVisibility={() => toggleLessonVisibility(item.id, lesson)}
                    />
                  ))
                )}
              </div>
            ) : null}
          </section>
        ))}
        {canArrange && modules.length > 1 ? (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              dropModuleAtEnd();
            }}
            className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs font-medium text-t400"
          >
            Перетащите модуль сюда, чтобы поставить его последним
          </div>
        ) : null}
      </div>

      <section
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          dropLesson(null);
        }}
        className="rounded-2xl border border-dashed border-line bg-paper-tint p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-t900">Без модуля</h3>
            <p className="text-xs text-t500">
              Черновики уроков, которые ещё не включены в курс или маршрут.
            </p>
          </div>
          <Link href="/admin/content/new?type=LESSON" className={buttonClass('ghost')}>
            <Icon name="add-circle-linear" />
            Новый урок
          </Link>
        </div>
        <div className="space-y-2">
          {unplaced.length === 0 ? (
            <p className="rounded-xl bg-paper p-4 text-sm text-t400">
              Все свободные уроки распределены.
            </p>
          ) : (
            unplaced.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={index}
                draggable={canArrange}
                onDragStart={() => setDragged({ kind: 'lesson', id: lesson.id })}
                onDrop={() => dropLesson(null, lesson.id)}
                onToggleVisibility={undefined}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  draggable,
  onDragStart,
  onDrop,
  onToggleVisibility,
}: {
  lesson: Lesson;
  index: number;
  draggable: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onToggleVisibility?: () => void;
}) {
  return (
    <div
      data-lesson-card
      draggable={draggable}
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop();
      }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {draggable ? <Icon name="hamburger-menu-linear" className="shrink-0 text-t400" /> : null}
      <span className="w-6 shrink-0 text-center font-mono text-[10px] text-t400">{index + 1}</span>
      <Link
        href={`/admin/content/${lesson.id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-t800 hover:text-accent"
      >
        {lesson.title}
      </Link>
      <span className="shrink-0 rounded-full bg-paper-tint px-2 py-1 text-[10px] uppercase tracking-wide text-t500">
        {STATE_LABEL[lesson.state] ?? lesson.state}
      </span>
      {onToggleVisibility ? (
        <button
          type="button"
          onClick={onToggleVisibility}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
            lesson.isVisible
              ? 'border-line text-t500 hover:border-accent/30 hover:text-accent'
              : 'border-accent/20 bg-accent/10 text-accent',
          )}
          title={lesson.isVisible ? 'Скрыть урок от учеников' : 'Показать урок ученикам'}
        >
          {lesson.isVisible ? 'Скрыть' : 'Скрыт · Показать'}
        </button>
      ) : null}
    </div>
  );
}
