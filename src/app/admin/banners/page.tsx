import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { toggleBanner, deleteBanner } from '@/server/admin/banners';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Icon } from '@/components/ui/Icon';
import { BannerCreateForm } from '@/components/admin/BannerCreateForm';

export const metadata: Metadata = { title: 'Админ — баннеры' };

export default async function AdminBannersPage() {
  await requireRole(['ADMIN', 'EDITOR']);
  const banners = await prisma.banner.findMany({ orderBy: { sort: 'asc' } });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Баннеры Главной" />

      <Panel title="Новый баннер // Создать" className="mb-6">
        <BannerCreateForm />
      </Panel>

      <Panel title="Список // Баннеры">
        <div className="p-2">
          {banners.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Баннеров пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Заголовок</Th>
                  <Th>Ссылка</Th>
                  <Th>Порядок</Th>
                  <Th>Статус</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {banners.map((b) => (
                  <TRow key={b.id}>
                    <Td>{b.title}</Td>
                    <Td mono>{b.href ?? '—'}</Td>
                    <Td mono>{b.sort}</Td>
                    <Td>
                      <form action={toggleBanner}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="active" value={String(b.active)} />
                        <button type="submit">
                          <StatusPill muted={!b.active}>{b.active ? 'Активен' : 'Скрыт'}</StatusPill>
                        </button>
                      </form>
                    </Td>
                    <Td className="text-right">
                      <form action={deleteBanner}>
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="text-t400 hover:text-accent" title="Удалить">
                          <Icon name="trash-bin-minimalistic-linear" className="text-base" />
                        </button>
                      </form>
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
