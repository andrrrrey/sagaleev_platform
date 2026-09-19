import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { formatDate, formatRubles } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';

export const metadata: Metadata = { title: 'Админ — оплаты' };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
  FAILED: 'Ошибка',
  REFUNDED: 'Возврат',
};

export default async function AdminPaymentsPage() {
  await requireRole(['ADMIN']); // оплаты — только ADMIN

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Оплаты" />
      <Panel title="Платежи // Все">
        <div className="p-2">
          {payments.length === 0 ? (
            <p className="p-4 font-mono text-xs text-zinc-500">Платежей пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Студент</Th>
                  <Th>Тип</Th>
                  <Th>Тариф</Th>
                  <Th>Сумма</Th>
                  <Th>Провайдер</Th>
                  <Th>Статус</Th>
                </tr>
              </THead>
              <tbody>
                {payments.map((p) => (
                  <TRow key={p.id}>
                    <Td mono>{formatDate(p.createdAt)}</Td>
                    <Td mono>{p.user.email}</Td>
                    <Td>{p.kind === 'UPGRADE' ? 'Апгрейд' : 'Покупка'}</Td>
                    <Td mono>{p.targetPlan}</Td>
                    <Td mono>{formatRubles(p.amountKopeks)}</Td>
                    <Td mono>{p.provider}</Td>
                    <Td>{STATUS_LABEL[p.status] ?? p.status}</Td>
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
