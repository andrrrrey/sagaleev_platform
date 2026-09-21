import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { getRouteDay } from '@/server/route/service';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { RouteStepItem } from '@/components/route/RouteStepItem';

export const metadata: Metadata = { title: 'День маршрута' };

export default async function RouteDayPage({ params }: { params: Promise<{ day: string }> }) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const { day } = await params;
  const dayNumber = Number(day);
  if (!Number.isInteger(dayNumber)) notFound();

  const view = await getRouteDay(actor, dayNumber);
  if (!view) notFound();

  const doneCount = view.steps.filter((s) => s.done).length;
  const pct = view.steps.length ? Math.round((doneCount / view.steps.length) * 100) : 0;
  const allDone = view.steps.length > 0 && doneCount === view.steps.length;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <nav className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-t400">
        <Link href="/" className="hover:text-accent">
          Кабинет
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <Link href="/route" className="hover:text-accent">
          Маршрут
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <span className="text-t600">День {view.dayNumber}</span>
      </nav>

      <PageHeader kicker={`Маршрут · День ${view.dayNumber}`} title={view.title} description={view.summary} />

      <div className="mb-8 flex flex-col gap-3 border border-line bg-paper-panel p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-light text-t700">
            <Icon name="diploma-verified-linear" className="text-accent" />
            Артефакт дня: {view.artifact}
          </span>
          <StatusPill muted={!allDone}>{allDone ? 'Готов' : `${doneCount} / ${view.steps.length}`}</StatusPill>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="mb-6 grid gap-3 text-xs font-light leading-relaxed text-t700 md:grid-cols-3">
        <div className="border border-line bg-paper-panel p-4">
          <strong className="font-medium text-t900">Текст для ИИ</strong>
          <p className="mt-1">Нажми «Скопировать», открой ChatGPT или Codex, вставь в новое сообщение и отправь.</p>
        </div>
        <div className="border border-line bg-paper-panel p-4">
          <strong className="font-medium text-t900">Команда для терминала</strong>
          <p className="mt-1">Вставляй только в указанное окно: свой Terminal/PowerShell или окно SSH с сервером.</p>
        </div>
        <div className="border border-line bg-paper-panel p-4">
          <strong className="font-medium text-t900">Что сохранить после шага</strong>
          <p className="mt-1">Сюда внеси безопасный итог. Никогда не сохраняй пароль, токен бота или API-ключ.</p>
        </div>
      </div>

      <div className="mb-6 border border-accent/30 bg-accent/[0.04] p-4 text-sm font-light leading-relaxed text-t700">
        <strong className="font-medium text-t900">Если стало непонятно — не оставайся один.</strong>{' '}
        Скопируй название шага и безопасный текст ошибки в ChatGPT/Codex и попроси: «Объясни только одно следующее действие и назови окно, куда это вводить». Пароли, токены, API-ключи, IP и данные клиентов не копируй. Можно также{' '}
        <Link href="/profile?tab=codex" className="text-accent underline">подключить Codex к маршруту через MCP</Link>{' '}
        или <Link href="/help" className="text-accent underline">написать в поддержку</Link>.
      </div>

      <div className="flex flex-col gap-3">
        {view.steps.map((step, i) => (
          <RouteStepItem key={step.id} step={step} dayNumber={view.dayNumber} index={i} />
        ))}
      </div>

      {allDone ? (
        <Panel className="mt-8" title="День пройден // Маршрут" status={<StatusPill>Готов</StatusPill>}>
          <div className="flex flex-col items-start gap-4 p-6">
            <p className="text-sm font-light text-t700">
              Отлично! Артефакт «{view.artifact}» собран.
            </p>
            {view.nextDay ? (
              <Link href={`/route/${view.nextDay}`} className={buttonClass('primary')}>
                <Icon name="arrow-right-linear" />
                Следующий день
              </Link>
            ) : (
              <Link href="/skills" className={buttonClass('primary')}>
                <Icon name="bolt-linear" />
                К библиотеке скиллов
              </Link>
            )}
          </div>
        </Panel>
      ) : null}

      <div className="mt-8 flex items-center justify-between border-t border-line/60 pt-6">
        {view.prevDay ? (
          <Link href={`/route/${view.prevDay}`} className={buttonClass('secondary')}>
            <Icon name="alt-arrow-left-linear" />
            Предыдущий день
          </Link>
        ) : (
          <span />
        )}
        {view.nextDay ? (
          <Link href={`/route/${view.nextDay}`} className={buttonClass('secondary')}>
            Следующий день
            <Icon name="alt-arrow-right-linear" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
