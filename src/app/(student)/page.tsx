import Link from 'next/link';
import type { UnitType } from '@prisma/client';
import { getActor, getCurrentUser } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { getRouteOverview } from '@/server/route/service';
import { canAccess, type Actor } from '@/server/access';
import { formatRubles, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { buttonClass } from '@/components/ui/Button';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { MoneyEntryModal } from '@/components/money/MoneyEntryModal';

const BASE: Record<UnitType, string> = { LESSON: '/lessons', USECASE: '/usecases', STREAM: '/streams' };

export default async function HomePage() {
  const actor = await getActor();
  const [user, banners, skillRows, unitRows, moneyAgg, latestUnits, latestSkills] = await Promise.all([
    getCurrentUser(),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
    prisma.skill.findMany({ where: { state: 'PUBLISHED' }, select: { minPlan: true } }),
    prisma.contentUnit.findMany({
      where: { state: 'PUBLISHED' },
      select: { type: true, minPlan: true, partialFreePreview: true },
    }),
    actor ? prisma.moneyEntry.aggregate({ _sum: { amountKopeks: true }, where: { userId: actor.id } }) : null,
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

  const skillsAvail = actor ? skillRows.filter((s) => canAccess(a, { kind: 'skill', minPlan: s.minPlan }).ok).length : 0;
  const countUnit = (type: UnitType) => {
    const rows = unitRows.filter((u) => u.type === type);
    const avail = actor
      ? rows.filter((u) => canAccess(a, { kind: 'unit', minPlan: u.minPlan, partialFree: u.partialFreePreview }).ok).length
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
    ...latestSkills.map((s) => ({ href: `/skills/${s.slug}`, title: s.title, tag: 'Скилл', date: s.createdAt })),
  ]
    .sort((x, y) => y.date.getTime() - x.date.getTime())
    .slice(0, 5);

  const tiles = [
    { href: '/route', label: 'Маршрут', icon: 'routing-linear', count: `${route.doneSteps} / ${route.totalSteps} шагов` },
    { href: '/skills', label: 'Скиллы', icon: 'bolt-linear', count: `${skillsAvail} / ${skillRows.length}` },
    { href: '/usecases', label: 'Юзкейсы', icon: 'chart-2-linear', count: `${usecases.avail} / ${usecases.total}` },
    { href: '/lessons', label: 'Уроки', icon: 'videocamera-record-linear', count: `${lessons.avail} / ${lessons.total}` },
    { href: '/streams', label: 'Эфиры', icon: 'microphone-3-linear', count: `${streams.avail} / ${streams.total}` },
    { href: '/leaderboard', label: 'Лидерборд', icon: 'cup-first-linear', count: 'Этап 4' },
  ];

  const curatorAccess = actor ? canAccess(a, { kind: 'feature', feature: 'CURATOR' }) : { ok: false as const };

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Кабинет"
        title={`${firstName}, собираем твой отдел маркетинга`}
        description="Прогресс — это то, что ты реально внедрил в бизнесе, а не сколько видео посмотрел."
        actions={
          <Link href={nextDay ? `/route/${nextDay.dayNumber}` : '/route'} className={buttonClass('primary')}>
            <Icon name="power-linear" />
            Следующий шаг
          </Link>
        }
      />

      {banners.length > 0 ? (
        <div className="mb-8">
          <BannerCarousel banners={banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, href: b.href }))} />
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group">
            <Panel className="h-full transition-colors group-hover:border-accent/30" bodyClassName="p-6 gap-3">
              <div className="flex items-center justify-between">
                <Icon name={tile.icon} className="text-2xl text-t700 transition-colors group-hover:text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-t500">{tile.count}</span>
              </div>
              <div className="mt-2 text-lg font-normal tracking-tight text-t900">{tile.label}</div>
            </Panel>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Прогресс // Движение по деньгам"
          status={<MoneyEntryModal />}
        >
          <div className="flex flex-col gap-4 p-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-t400">Итого движение по деньгам</div>
              <div className="font-mono text-3xl text-t900">{formatRubles(moneyTotal)}</div>
            </div>
            <LinedBlock label="Progress">
              <p>Маршрут: {route.doneSteps} из {route.totalSteps} шагов.</p>
              <p>Скиллы: {skillsAvail} доступно. Отмечай внедрения — это и есть прогресс.</p>
            </LinedBlock>
          </div>
        </Panel>

        <Panel title="Curator // Weekly" status={<StatusPill muted>SUPPORT+</StatusPill>}>
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
          <Panel title="Новое // Лента">
            <ul className="divide-y divide-line/60">
              {feed.map((f, i) => (
                <li key={i}>
                  <Link
                    href={f.href}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-paper-hover/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="border border-line bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-t500">
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
