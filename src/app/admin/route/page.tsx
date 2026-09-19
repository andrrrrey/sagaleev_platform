import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { deleteStep } from '@/server/admin/route';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { DayEditForm } from '@/components/admin/DayEditForm';

export const metadata: Metadata = { title: 'Админ — маршрут' };

export default async function AdminRoutePage() {
  await requireRole(['ADMIN', 'EDITOR']);
  const days = await prisma.routeDay.findMany({
    orderBy: { dayNumber: 'asc' },
    include: {
      steps: {
        orderBy: { sort: 'asc' },
        include: { linkedSkill: { select: { title: true } } },
      },
    },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Маршрут «3 дня»" description="Редактирование дней и шагов." />

      {days.length === 0 ? (
        <p className="font-mono text-xs text-t500">Дни маршрута ещё не созданы (запустите сид).</p>
      ) : (
        <div className="flex flex-col gap-8">
          {days.map((day) => (
            <Panel key={day.id} title={`День ${day.dayNumber} // Редактор`}>
              <DayEditForm day={{ id: day.id, title: day.title, summary: day.summary, artifact: day.artifact }} />

              <div className="border-t border-line/60 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-t500">
                    Шаги · {day.steps.length}
                  </span>
                  <Link
                    href={`/admin/route/step/new?dayId=${day.id}&sort=${day.steps.length}`}
                    className={buttonClass('ghost')}
                  >
                    <Icon name="add-circle-linear" />
                    Добавить шаг
                  </Link>
                </div>

                {day.steps.length === 0 ? (
                  <p className="font-mono text-xs text-t400">Шагов пока нет.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {day.steps.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between border border-line bg-surface px-4 py-2.5"
                      >
                        <span className="flex items-center gap-3 text-sm font-light text-t700">
                          <span className="font-mono text-[10px] text-t400">
                            {String(s.sort).padStart(2, '0')}
                          </span>
                          {s.title}
                          {s.linkedSkill ? (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                              · {s.linkedSkill.title}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-3">
                          <Link
                            href={`/admin/route/step/${s.id}`}
                            className="text-t400 hover:text-accent"
                            title="Редактировать"
                          >
                            <Icon name="pen-linear" className="text-base" />
                          </Link>
                          <form action={deleteStep}>
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" className="text-t400 hover:text-accent" title="Удалить">
                              <Icon name="trash-bin-minimalistic-linear" className="text-base" />
                            </button>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
