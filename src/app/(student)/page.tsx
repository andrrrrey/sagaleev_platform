import Link from 'next/link';
import type { UnitType } from '@prisma/client';
import { getActor, getCurrentUser } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { getRouteOverview } from '@/server/route/service';
import { canAccess, type Actor } from '@/server/access';
import { formatRubles, formatDate } from '@/lib/utils';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { buttonClass } from '@/components/ui/Button';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { MoneyEntryModal } from '@/components/money/MoneyEntryModal';

const BASE: Record<UnitType, string> = {
  LESSON: '/lessons',
  USECASE: '/usecases',
  STREAM: '/streams',
};

export default async function HomePage() {
  const actor = await getActor();
  const [user, banners, skillRows, unitRows, moneyAgg, latestUnits, latestSkills] =
    await Promise.all([
      getCurrentUser(),
      prisma.banner.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
      prisma.skill.findMany({ where: { state: 'PUBLISHED' }, select: { minPlan: true } }),
      prisma.contentUnit.findMany({
        where: { state: 'PUBLISHED' },
        select: { type: true, minPlan: true, partialFreePreview: true },
      }),
      actor
        ? prisma.moneyEntry.aggregate({ _sum: { amountKopeks: true }, where: { userId: actor.id } })
        : null,
      prisma.contentUnit.findMany({
        where: { state: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { slug: true, title: true, type: true, publishedAt: true, createdAt: true },
      }),
      prisma.skill.findMany({
        where: { state: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { slug: true, title: true, createdAt: true },
      }),
    ]);

  const a = actor as Actor;
  const firstName = user?.name?.split(' ')[0] ?? 'Собственник';

  const route = actor ? await getRouteOverview(a) : { days: [], totalSteps: 0, doneSteps: 0 };
  const nextDay = route.days.find((d) => d.status !== 'DONE');

  const skillsAvail = actor
    ? skillRows.filter((s) => canAccess(a, { kind: 'skill', minPlan: s.minPlan }).ok).length
    : 0;
  const countUnit = (type: UnitType) => {
    const rows = unitRows.filter((u) => u.type === type);
    const avail = actor
      ? rows.filter(
          (u) =>
            canAccess(a, { kind: 'unit', minPlan: u.minPlan, partialFree: u.partialFreePreview })
              .ok,
        ).length
      : 0;
    return { total: rows.length, avail };
  };
  const lessons = countUnit('LESSON');
  const usecases = countUnit('USECASE');
  const streams = countUnit('STREAM');
  const moneyTotal = moneyAgg?._sum.amountKopeks ?? 0;

  const feed = [
    ...latestUnits.map((u) => ({
      href: `${BASE[u.type]}/${u.slug}`,
      title: u.title,
      tag: u.type === 'LESSON' ? 'Урок' : u.type === 'STREAM' ? 'Эфир' : 'Юзкейс',
      date: u.publishedAt ?? u.createdAt,
    })),
    ...latestSkills.map((s) => ({
      href: `/skills/${s.slug}`,
      title: s.title,
      tag: 'Скилл',
      date: s.createdAt,
    })),
  ]
    .sort((x, y) => y.date.getTime() - x.date.getTime())
    .slice(0, 5);

  const learningTiles = [
    {
      href: '/lessons',
      label: 'Уроки',
      description: 'Программа обучения по направлениям',
      icon: 'videocamera-record-linear',
      count: `${lessons.avail} доступно`,
    },
    {
      href: '/usecases',
      label: 'Юзкейсы',
      description: 'Реальные задачи, решения и результаты',
      icon: 'chart-2-linear',
      count: `${usecases.avail} доступно`,
    },
    {
      href: '/streams',
      label: 'Эфиры',
      description: 'Встречи с экспертами и записи эфиров',
      icon: 'microphone-3-linear',
      count: `${streams.avail} доступно`,
    },
    {
      href: '/skills',
      label: 'Скиллы',
      description: 'База готовых инструкций для агента',
      icon: 'bolt-linear',
      count: `${skillsAvail} доступно`,
    },
  ];
  const routePct = route.totalSteps ? Math.round((route.doneSteps / route.totalSteps) * 100) : 0;

  const curatorAccess = actor
    ? canAccess(a, { kind: 'feature', feature: 'CURATOR' })
    : { ok: false as const };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <section className="brand-gradient bg-grid relative mb-8 overflow-hidden rounded-[32px] border border-line/60 px-6 py-8 shadow-panel md:px-10 md:py-11">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-paper/75 px-3 py-1.5 text-xs font-semibold text-accent backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Образовательная платформа
          </div>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-t900 md:text-5xl">
            {firstName}, продолжаем обучение
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-t600 md:text-lg">
            Пройди вводный маршрут, а затем изучай уроки, разбирай юзкейсы и смотри эфиры.
          </p>

          <div className="mt-7 max-w-2xl rounded-[24px] border border-white/70 bg-paper/85 p-5 shadow-panel backdrop-blur md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
                  Вводный маршрут · 3 дня
                </div>
                <div className="mt-1.5 text-xl font-bold tracking-tight text-t900">
                  {nextDay ? `Продолжить: день ${nextDay.dayNumber}` : 'Маршрут пройден'}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${routePct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-t600">
                    {route.doneSteps}/{route.totalSteps}
                  </span>
                </div>
              </div>
              <Link
                href={nextDay ? `/route/${nextDay.dayNumber}` : '/route'}
                className={buttonClass('primary')}
              >
                {nextDay ? 'Продолжить' : 'Открыть маршрут'}
                <Icon name="arrow-right-linear" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {banners.length > 0 ? (
        <div className="mb-8">
          <BannerCarousel
            banners={banners.map((b) => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              href: b.href,
            }))}
          />
        </div>
      ) : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Обучение
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-t900 md:text-3xl">
              Выбери раздел
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learningTiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="group">
              <Panel
                className="h-full group-hover:-translate-y-1 group-hover:border-accent/20"
                bodyClassName="p-5 gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <Icon name={tile.icon} className="text-xl" />
                  </span>
                  <Icon
                    name="arrow-right-linear"
                    className="text-t300 transition-transform group-hover:translate-x-1 group-hover:text-accent"
                  />
                </div>
                <div className="mt-2 text-lg font-bold tracking-tight text-t900">{tile.label}</div>
                <p className="min-h-10 text-sm leading-5 text-t600">{tile.description}</p>
                <div className="mt-auto pt-2 text-xs font-semibold text-t500">{tile.count}</div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Движение по деньгам" status={<MoneyEntryModal />}>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-t500">Итого</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-t900">
                {formatRubles(moneyTotal)}
              </div>
            </div>
            <LinedBlock label="Progress">
              <p>
                Маршрут: {route.doneSteps} из {route.totalSteps} шагов.
              </p>
              <p>Скиллы: {skillsAvail} доступно. Отмечай внедрения — это и есть прогресс.</p>
            </LinedBlock>
          </div>
        </Panel>

        <Panel title="Разбор куратора" status={<StatusPill muted>В подписке</StatusPill>}>
          <div className="p-6">
            {curatorAccess.ok ? (
              <LinedBlock label="Разбор">
                <p>Еженедельный разбор куратора появится после первой недели работы.</p>
              </LinedBlock>
            ) : (
              <LockedPanel requiredPlan="SUPPORT" />
            )}
          </div>
        </Panel>
      </section>

      {feed.length > 0 ? (
        <section className="mt-8">
          <Panel title="Новое на платформе">
            <ul className="divide-y divide-line/60">
              {feed.map((f, i) => (
                <li key={i}>
                  <Link
                    href={f.href}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-paper-hover/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-full border border-line bg-paper-tint px-2.5 py-1 text-[10px] font-semibold text-t500">
                        {f.tag}
                      </span>
                      <span className="text-sm font-light text-t800">{f.title}</span>
                    </span>
                    <span className="font-mono text-[10px] text-t400">{formatDate(f.date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ) : null}
    </div>
  );
}
