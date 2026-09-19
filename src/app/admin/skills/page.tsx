import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { deleteSkill } from '@/server/admin/skills';
import { SKILL_GROUP_TITLE } from '@/lib/skill-groups';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Админ — скиллы' };

const STATE_LABEL: Record<string, string> = { DRAFT: 'Черновик', PUBLISHED: 'Опубликован', ARCHIVED: 'Архив' };

export default async function AdminSkillsPage() {
  await requireRole(['ADMIN', 'EDITOR']);
  const skills = await prisma.skill.findMany({
    orderBy: [{ group: 'asc' }, { sort: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { tags: true } } },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Скиллы"
        description={`Всего: ${skills.length}`}
        actions={
          <Link href="/admin/skills/new" className={buttonClass('primary')}>
            <Icon name="add-circle-linear" />
            Новый скилл
          </Link>
        }
      />

      <Panel title="Список // Скиллы">
        <div className="p-2">
          {skills.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Скиллов пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Название</Th>
                  <Th>Группа</Th>
                  <Th>minPlan</Th>
                  <Th>Статус</Th>
                  <Th>Теги</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {skills.map((s) => (
                  <TRow key={s.id}>
                    <Td>
                      <Link href={`/admin/skills/${s.id}`} className="text-t800 hover:text-accent">
                        {s.title}
                      </Link>
                    </Td>
                    <Td>{SKILL_GROUP_TITLE[s.group]}</Td>
                    <Td mono>{s.minPlan}</Td>
                    <Td>
                      <StatusPill muted={s.state !== 'PUBLISHED'}>{STATE_LABEL[s.state]}</StatusPill>
                    </Td>
                    <Td mono>{s._count.tags}</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/skills/${s.id}`} className="text-t400 hover:text-accent" title="Редактировать">
                          <Icon name="pen-linear" className="text-base" />
                        </Link>
                        <form action={deleteSkill}>
                          <input type="hidden" name="id" value={s.id} />
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
