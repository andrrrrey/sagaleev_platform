import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { canAccess } from '@/server/access';
import { prisma } from '@/server/db';
import { weekStartOf } from '@/server/curator/service';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { WeeklyReportForm } from '@/components/curator/WeeklyReportForm';

export const metadata: Metadata = { title: 'Разбор куратора' };

type NextStep = { title: string; why: string; refType?: string | null; refId?: string | null };

export default async function CuratorPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const access = canAccess(actor, { kind: 'feature', feature: 'CURATOR' });
  if (!access.ok) {
    return (
      <div className="px-6 py-8 md:px-10 md:py-12">
        <PageHeader kicker="Куратор" title="Еженедельный разбор" />
        <div className="max-w-xl">
          <LockedPanel requiredPlan="SUPPORT" />
        </div>
      </div>
    );
  }

  const weekStart = weekStartOf();
  const [notes, report] = await Promise.all([
    prisma.curatorNote.findMany({ where: { userId: actor.id }, orderBy: { weekStart: 'desc' }, take: 12 }),
    prisma.weeklyReport.findUnique({ where: { userId_weekStart: { userId: actor.id, weekStart } } }),
  ]);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Куратор"
        title="Еженедельный разбор"
        description="ИИ-куратор смотрит на внедрения и подсказывает 1–2 шага на неделю."
      />

      <div className="mb-6 max-w-2xl">
        <Panel title="Кто такой Агент-куратор // Как это работает">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              Агент-куратор — это ИИ-наставник платформы. Раз в неделю он смотрит, что вы{' '}
              <b>внедрили</b> в своём бизнесе (маршрут, юзкейсы, движение по деньгам, ваш отчёт), и
              присылает короткий разбор: что получилось и 1–2 конкретных шага на следующую неделю.
            </p>
            <p className="text-t600">
              Он опирается только на учебные данные и ваш бизнес-профиль — не читает переписку и
              контакты. Чтобы разбор был точнее, заполняйте отчёт ниже.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mb-8 max-w-2xl">
        <Panel title="Отчёт // Что сделал за неделю">
          <WeeklyReportForm defaultText={report?.text} />
        </Panel>
      </div>

      {notes.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Curator // Empty">
            Первый разбор появится после недели работы (джоба запускается по понедельникам).
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((n, idx) => {
            const steps = Array.isArray(n.nextSteps) ? (n.nextSteps as NextStep[]) : [];
            return (
              <Panel
                key={n.id}
                title={`Curator // Weekly · ${formatDate(n.weekStart)}`}
                status={
                  n.status === 'OK' ? (
                    <StatusPill muted={idx !== 0}>{idx === 0 ? 'Новый' : 'Разбор'}</StatusPill>
                  ) : (
                    <StatusPill muted>{n.status}</StatusPill>
                  )
                }
              >
                <div className="flex flex-col gap-5 p-6">
                  <LinedBlock label="Что внедрено на неделе">{n.summary}</LinedBlock>
                  {n.methodPrinciple ? (
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                      <Icon name="diploma-verified-linear" className="text-sm" />
                      Принцип метода: {n.methodPrinciple}
                    </div>
                  ) : null}
                  {steps.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="font-mono text-xs uppercase tracking-widest text-t500">Следующие шаги</div>
                      {steps.map((s, i) => {
                        const href =
                          s.refType === 'skill' && s.refId
                            ? `/skills/${s.refId}`
                            : s.refType === 'unit' && s.refId
                              ? `/usecases/${s.refId}`
                              : s.refType === 'routeStep'
                                ? '/route'
                                : null;
                        return (
                          <div key={i} className="border border-line bg-surface p-4">
                            <div className="text-sm font-normal text-t900">{s.title}</div>
                            <p className="mt-1 text-sm font-light text-t600">{s.why}</p>
                            {href ? (
                              <Link
                                href={href}
                                className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] text-accent hover:underline"
                              >
                                Перейти <Icon name="arrow-right-linear" />
                              </Link>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
