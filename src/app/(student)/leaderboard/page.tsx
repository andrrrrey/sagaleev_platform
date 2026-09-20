import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { getLeaderboard, type LeaderboardRow } from '@/server/progress/leaderboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Лидерборд' };
export const revalidate = 60;

const SCALE = [
  { label: 'Посмотрел', value: '1' },
  { label: 'Сдал', value: '2' },
  { label: 'Внедрил', value: '5' },
  { label: 'Результат в деньгах', value: '10' },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span className="flex h-7 w-7 items-center justify-center border border-t300 bg-surface font-mono text-[10px] text-t600">
      {initials}
    </span>
  );
}

function Row({ r }: { r: LeaderboardRow }) {
  return (
    <TRow className={cn(r.isMe && 'bg-accent/5')}>
      <Td mono className={cn(r.isMe && 'text-accent')}>
        {String(r.rank).padStart(2, '0')}
      </Td>
      <Td>
        <span className="flex items-center gap-3">
          <Avatar name={r.name} />
          <span className={cn('font-light', r.isMe ? 'text-t900' : 'text-t800')}>
            {r.name}
            {r.isMe ? <span className="ml-2 font-mono text-[10px] uppercase text-accent">вы</span> : null}
          </span>
        </span>
      </Td>
      <Td mono className="text-t900">{r.points}</Td>
      <Td mono className="text-t500">
        {r.viewedCount}/{r.submittedCount}/{r.implementedCount}/{r.resultCount}
      </Td>
      <Td mono className="text-t400">·····</Td>
    </TRow>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === 'all' ? 'all' : 'cohort';

  const { top, me } = await getLeaderboard(actor, scope);
  const meInTop = top.some((r) => r.isMe);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Лидерборд"
        title="Внедрение и результат в деньгах"
        description="Очки за то, что реально сделано, а не за просмотры. Мотиватор, не позор."
      />

      {/* Легенда-шкала */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SCALE.map((s) => (
          <div key={s.label} className="border border-line bg-paper-panel p-4">
            <div className="font-mono text-2xl text-t900">{s.value}</div>
            <div className="mt-1 text-xs font-light text-t600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Фильтр охвата */}
      <div className="mb-6 flex gap-1">
        {(['cohort', 'all'] as const).map((sc) => (
          <Link
            key={sc}
            href={sc === 'cohort' ? '/leaderboard' : '/leaderboard?scope=all'}
            className={cn(
              '-ml-px border border-line px-3 py-1.5 font-mono text-xs transition-colors',
              scope === sc ? 'border-b-accent bg-surface text-t900' : 'bg-transparent text-t500 hover:bg-paper-hover',
            )}
          >
            {sc === 'cohort' ? 'Мой поток' : 'Все'}
          </Link>
        ))}
      </div>

      {top.length === 0 ? (
        <div className="max-w-xl">
          <EmptyState label="Leaderboard // Empty">Пока нет данных. Начни маршрут и отмечай внедрения.</EmptyState>
        </div>
      ) : (
        <Panel title="Топ потока // Очки">
          <div className="p-2">
            <Table>
              <THead>
                <tr>
                  <Th>Место</Th>
                  <Th>Студент</Th>
                  <Th>Очки</Th>
                  <Th>V/S/I/R</Th>
                  <Th>Деньги</Th>
                </tr>
              </THead>
              <tbody>
                {top.map((r) => (
                  <Row key={r.userId} r={r} />
                ))}
                {!meInTop && me ? (
                  <>
                    <TRow>
                      <Td colSpan={5} className="py-2 text-center font-mono text-[10px] text-t400">
                        · · ·
                      </Td>
                    </TRow>
                    <Row r={me} />
                  </>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Panel>
      )}

      {!meInTop && me ? (
        <p className="mt-4 font-mono text-xs text-t500">
          Ты на {me.rank} месте. Отмечай внедрения и добавляй «движение по деньгам», чтобы подняться.
        </p>
      ) : null}
    </div>
  );
}
