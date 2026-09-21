import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { getRouteOverview, type RouteDayStatus } from '@/server/route/service';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Маршрут' };

const STATUS: Record<RouteDayStatus, { label: string; muted: boolean }> = {
  NOT_STARTED: { label: 'Не начат', muted: true },
  IN_PROGRESS: { label: 'В работе', muted: false },
  DONE: { label: 'Готов', muted: false },
};

export default async function RoutePage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const { days, totalSteps, doneSteps } = await getRouteOverview(actor);
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Маршрут"
        title="Твой бизнес-агент за 3 дня"
        description="Пошаговая инструкция с нуля: куда нажать, что скопировать и как проверить результат. Опыт программирования не нужен."
      />

      <div className="mb-8 max-w-3xl border border-line bg-paper-panel p-5 text-sm font-light leading-relaxed text-t700">
        <p>
          Представь, что VPS — это компьютер в интернете, а Hermes — программа-помощник
          на этом компьютере. За 18 небольших шагов ты подготовишь сервер, установишь
          помощника и подключишь его к Telegram. В каждом шаге написано, где именно
          действовать: на сайте, на своём компьютере или на сервере.
        </p>
        <p className="mt-3">
          Не спеши: выполняй по одному шагу и отмечай его только после проверки блока
          «Готово, если». Пароли и токены никогда не вставляй в поле отчёта на этой платформе.
        </p>
        <a
          href="https://github.com/andrrrrey/agent"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent hover:underline"
        >
          Исходная подробная инструкция
          <Icon name="arrow-right-linear" />
        </a>
      </div>

      {days.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Route // Empty">Маршрут ещё не наполнен. Загляните позже.</EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-8 max-w-2xl">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-t500">
              <span>Общий прогресс</span>
              <span>
                {doneSteps} / {totalSteps} шагов · {pct}%
              </span>
            </div>
            <ProgressBar value={pct} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {days.map((d) => {
              const s = STATUS[d.status];
              return (
                <Link key={d.id} href={`/route/${d.dayNumber}`} className="group">
                  <Panel
                    className="h-full transition-colors group-hover:border-accent/30"
                    title={`День ${d.dayNumber} // Маршрут`}
                    status={<StatusPill muted={s.muted}>{s.label}</StatusPill>}
                  >
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div className="text-lg font-normal tracking-tight text-t900">{d.title}</div>
                      <p className="text-sm font-light text-t600">{d.summary}</p>
                      <div className="mt-auto flex items-center gap-2 border-t border-line/60 pt-4">
                        <Icon name="diploma-verified-linear" className="text-accent" />
                        <span className="text-xs font-light text-t700">{d.artifact}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-t500">
                        <span>
                          {d.doneSteps} / {d.totalSteps} шагов
                        </span>
                        <Icon
                          name="arrow-right-linear"
                          className="text-t300 transition-colors group-hover:text-accent"
                        />
                      </div>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
