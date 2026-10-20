import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ContractorRequestStatus } from '@prisma/client';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { cancelContractorRequest } from '@/server/contractor-requests/actions';
import { contractorServiceLabel } from '@/lib/contractor-services';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClass } from '@/components/ui/Button';
import { ContractorRequestForm } from '@/components/requests/ContractorRequestForm';

export const metadata: Metadata = { title: 'Задачи и подрядчики' };

const STATUS: Record<ContractorRequestStatus, { label: string; muted?: boolean }> = {
  NEW: { label: 'Ожидает обработки', muted: true },
  IN_REVIEW: { label: 'Рассматриваем' },
  CONTACTED: { label: 'Связались с вами' },
  IN_PROGRESS: { label: 'В работе' },
  COMPLETED: { label: 'Выполнен' },
  CANCELED: { label: 'Отменён', muted: true },
};

export default async function ContractorRequestsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login?callbackUrl=/requests');
  const requests = await prisma.contractorRequest.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <PageHeader
        kicker="Помощь специалистов"
        title="Задачи и подрядчики"
        description="Опишите задачу, которую хотите передать специалистам. Мы изучим запрос и свяжемся с вами, чтобы уточнить объём, сроки и стоимость."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)] lg:items-start">
        <Panel title="Новый запрос">
          <ContractorRequestForm />
        </Panel>

        <div>
          <h2 className="mb-4 text-xl font-bold text-t900">История запросов</h2>
          {requests.length === 0 ? (
            <EmptyState label="Запросы // Empty">
              Вы ещё не отправляли задачи подрядчикам.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const status = STATUS[request.status];
                const canCancel = request.status === 'NEW' || request.status === 'IN_REVIEW';
                return (
                  <Panel
                    key={request.id}
                    title={formatDate(request.createdAt)}
                    status={<StatusPill muted={status.muted}>{status.label}</StatusPill>}
                  >
                    <div className="p-5">
                      <h3 className="font-semibold text-t900">
                        {contractorServiceLabel(request.category)}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-t600">
                        {request.description}
                      </p>
                      {request.adminNote ? (
                        <p className="mt-4 rounded-xl bg-paper-tint p-3 text-sm leading-relaxed text-t600">
                          <strong className="text-t800">Комментарий команды:</strong>{' '}
                          {request.adminNote}
                        </p>
                      ) : null}
                      {canCancel ? (
                        <form action={cancelContractorRequest} className="mt-4">
                          <input type="hidden" name="id" value={request.id} />
                          <button type="submit" className={buttonClass('ghost', 'px-0 text-t500')}>
                            Отменить запрос
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
