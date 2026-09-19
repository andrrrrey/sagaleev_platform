import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma, UnitType } from '@prisma/client';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { deleteContent } from '@/server/admin/content';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Админ — контент' };

const TYPE_LABEL: Record<UnitType, string> = { LESSON: 'Урок', USECASE: 'Юзкейс', STREAM: 'Эфир' };
const STATE_LABEL: Record<string, string> = { DRAFT: 'Черновик', PUBLISHED: 'Опубликован', ARCHIVED: 'Архив' };
const TABS: { key: string; label: string; type?: UnitType }[] = [
  { key: 'all', label: 'Все' },
  { key: 'LESSON', label: 'Уроки', type: 'LESSON' },
  { key: 'USECASE', label: 'Юзкейсы', type: 'USECASE' },
  { key: 'STREAM', label: 'Эфиры', type: 'STREAM' },
];

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole(['ADMIN', 'EDITOR']);
  const { type } = await searchParams;
  const activeType = TABS.find((t) => t.key === type)?.type;

  const where: Prisma.ContentUnitWhereInput = activeType ? { type: activeType } : {};
  const units = await prisma.contentUnit.findMany({
    where,
    orderBy: [{ type: 'asc' }, { block: 'asc' }, { sort: 'asc' }],
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Контент-юниты"
        description="Уроки, юзкейсы и эфиры — одна форма."
        actions={
          <Link href="/admin/content/new?type=USECASE" className={buttonClass('primary')}>
            <Icon name="add-circle-linear" />
            Новый юнит
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const active = (type ?? 'all') === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === 'all' ? '/admin/content' : `/admin/content?type=${t.key}`}
              className={cn(
                '-ml-px border border-line px-3 py-1.5 font-mono text-xs transition-colors',
                active ? 'border-b-accent bg-surface text-t900' : 'bg-transparent text-t500 hover:bg-paper-hover',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <Panel title="Список // Контент">
        <div className="p-2">
          {units.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Юнитов пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Название</Th>
                  <Th>Тип</Th>
                  <Th>minPlan</Th>
                  <Th>Статус</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {units.map((u) => (
                  <TRow key={u.id}>
                    <Td>
                      <Link href={`/admin/content/${u.id}`} className="text-t800 hover:text-accent">
                        {u.title}
                      </Link>
                    </Td>
                    <Td>{TYPE_LABEL[u.type]}</Td>
                    <Td mono>{u.minPlan}</Td>
                    <Td>
                      <StatusPill muted={u.state !== 'PUBLISHED'}>{STATE_LABEL[u.state]}</StatusPill>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/content/${u.id}`} className="text-t400 hover:text-accent" title="Редактировать">
                          <Icon name="pen-linear" className="text-base" />
                        </Link>
                        <form action={deleteContent}>
                          <input type="hidden" name="id" value={u.id} />
                          <button type="submit" className="text-t400 hover:text-accent" title="Удалить">
                            <Icon name="trash-bin-minimalistic-linear" className="text-base" />
                          </button>
                        </form>
                      </div>
                    </Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Panel>
    </div>
  );
}
