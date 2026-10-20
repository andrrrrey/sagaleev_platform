import type { Metadata } from 'next';
import type { ContractorRequestStatus } from '@prisma/client';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { updateContractorRequestStatus } from '@/server/contractor-requests/actions';
import { contractorServiceLabel } from '@/lib/contractor-services';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClass } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Админ — задачи и подрядчики' };

const STATUS_OPTIONS: Array<{ value: ContractorRequestStatus; label: string }> = [
  { value: 'NEW', label: 'Ожидает обработки' },
  { value: 'IN_REVIEW', label: 'Рассматриваем' },
  { value: 'CONTACTED', label: 'Связались со студентом' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Выполнен' },
  { value: 'CANCELED', label: 'Отменён' },
];

function statusLabel(value: ContractorRequestStatus) {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default async function AdminContractorRequestsPage() {
  await requireRole(['ADMIN']);
  const requests = await prisma.contractorRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Задачи и подрядчики"
        description="Входящие запросы студентов. Меняйте статус после просмотра и добавляйте короткий комментарий, который увидит студент."
      />

      {requests.length === 0 ? (
        <EmptyState label="Запросы // Empty">Новых запросов пока нет.</EmptyState>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => (
            <Panel
              key={request.id}
              title={`${formatDate(request.createdAt)} · ${request.user.name}`}
              status={
                <StatusPill muted={request.status === 'NEW' || request.status === 'CANCELED'}>
                  {statusLabel(request.status)}
                </StatusPill>
              }
            >
              <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    {contractorServiceLabel(request.category)}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-t700">
                    {request.description}
                  </p>
                  <dl className="mt-5 grid gap-2 text-sm text-t500 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-t400">Email</dt>
                      <dd className="mt-0.5 text-t700">{request.user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-t400">Телефон</dt>
                      <dd className="mt-0.5 text-t700">{request.user.phone ?? 'Не указан'}</dd>
                    </div>
                  </dl>
                </div>

                <form
                  action={updateContractorRequestStatus}
                  className="space-y-3 rounded-2xl bg-paper-tint p-4"
                >
                  <input type="hidden" name="id" value={request.id} />
                  <label
                    className="block text-xs font-semibold text-t600"
                    htmlFor={`status-${request.id}`}
                  >
                    Статус
                  </label>
                  <select
                    id={`status-${request.id}`}
                    name="status"
                    defaultValue={request.status}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-t800 outline-none focus:border-accent"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label
                    className="block text-xs font-semibold text-t600"
                    htmlFor={`note-${request.id}`}
                  >
                    Комментарий студенту
                  </label>
                  <textarea
                    id={`note-${request.id}`}
                    name="adminNote"
                    rows={3}
                    defaultValue={request.adminNote ?? ''}
                    placeholder="Например: получили запрос, свяжемся завтра"
                    className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed text-t800 outline-none focus:border-accent"
                  />
                  <button type="submit" className={buttonClass('primary', 'w-full')}>
                    Сохранить
                  </button>
                </form>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
