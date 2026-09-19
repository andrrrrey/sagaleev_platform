import Link from 'next/link';
import { getActor, getCurrentUser } from '@/server/auth/session';
import { STUDENT_NAV } from '@/components/frame/nav-config';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { buttonClass } from '@/components/ui/Button';
import { canAccess } from '@/server/access';

const TILES = [
  { href: '/route', label: 'Маршрут', icon: 'routing-linear', desc: 'Собери агента за 3 дня' },
  { href: '/skills', label: 'Скиллы', icon: 'bolt-linear', desc: 'Библиотека маркетинг-функций' },
  { href: '/usecases', label: 'Юзкейсы', icon: 'chart-2-linear', desc: 'Реальные кейсы с цифрами' },
  { href: '/lessons', label: 'Уроки', icon: 'videocamera-record-linear', desc: '10-недельная программа' },
  { href: '/streams', label: 'Эфиры', icon: 'microphone-3-linear', desc: 'Архив Zoom-разборов' },
  { href: '/leaderboard', label: 'Лидерборд', icon: 'cup-first-linear', desc: 'Внедрение и деньги' },
] as const;

export default async function HomePage() {
  const [actor, user] = await Promise.all([getActor(), getCurrentUser()]);
  const firstName = user?.name?.split(' ')[0] ?? 'Собственник';
  const curatorAccess = actor ? canAccess(actor, { kind: 'feature', feature: 'CURATOR' }) : { ok: false as const };

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Кабинет"
        title={`${firstName}, собираем твой отдел маркетинга`}
        description="Прогресс — это то, что ты реально внедрил в бизнесе, а не сколько видео посмотрел."
        actions={
          <Link href="/route" className={buttonClass('primary')}>
            <Icon name="power-linear" />
            Следующий шаг
          </Link>
        }
      />

      {/* Плитка разделов */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group">
            <Panel
              className="h-full transition-colors group-hover:border-accent/30"
              bodyClassName="p-6 gap-3"
            >
              <div className="flex items-center justify-between">
                <Icon name={tile.icon} className="text-2xl text-t700 transition-colors group-hover:text-accent" />
                <Icon name="arrow-right-linear" className="text-t300 transition-colors group-hover:text-accent" />
              </div>
              <div className="mt-2 text-lg font-normal tracking-tight text-t900">{tile.label}</div>
              <p className="text-sm font-light text-t600">{tile.desc}</p>
            </Panel>
          </Link>
        ))}
      </section>

      {/* Виджет прогресса + карточка куратора */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Прогресс // Движение по деньгам"
          status={<StatusPill muted>Скоро</StatusPill>}
        >
          <LinedBlock label="Progress">
            <p>Виджет прогресса по группам маркетинга появится с наполнением контента (Этап 3–4).</p>
            <p>Здесь же — «Движение по деньгам»: сумма внедрений в рублях.</p>
          </LinedBlock>
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

      {/* Плейсхолдер верхнего меню (для полноты навигации) */}
      <nav className="mt-10 flex flex-wrap gap-3 border-t border-line/60 pt-6 font-mono text-[10px] uppercase tracking-widest text-t400">
        {STUDENT_NAV.map((i) => (
          <Link key={i.href} href={i.href} className="hover:text-accent">
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
