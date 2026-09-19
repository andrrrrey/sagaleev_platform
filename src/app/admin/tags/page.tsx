import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { deleteTag } from '@/server/admin/tags';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Icon } from '@/components/ui/Icon';
import { TagCreateForm } from '@/components/admin/TagCreateForm';

export const metadata: Metadata = { title: 'Админ — теги' };

export default async function AdminTagsPage() {
  await requireRole(['ADMIN', 'EDITOR']);
  const tags = await prisma.tag.findMany({
    orderBy: { title: 'asc' },
    include: { _count: { select: { skills: true, units: true } } },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Теги" description={`Всего: ${tags.length}`} />

      <Panel title="Новый тег // Создать" className="mb-6">
        <TagCreateForm />
      </Panel>

      <Panel title="Список // Теги">
        <div className="p-2">
          {tags.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Тегов пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Название</Th>
                  <Th>Слаг</Th>
                  <Th>Скиллы</Th>
                  <Th>Юниты</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {tags.map((t) => {
                  const used = t._count.skills + t._count.units;
                  return (
                    <TRow key={t.id}>
                      <Td>{t.title}</Td>
                      <Td mono>{t.slug}</Td>
                      <Td mono>{t._count.skills}</Td>
                      <Td mono>{t._count.units}</Td>
                      <Td className="text-right">
                        <form action={deleteTag}>
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            disabled={used > 0}
                            title={used > 0 ? 'Тег используется' : 'Удалить'}
                            className="text-t400 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="trash-bin-minimalistic-linear" className="text-base" />
                          </button>
                        </form>
                      </Td>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </Panel>
    </div>
  );
}
