import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { grantPlanManual, revokePlan } from '@/server/admin/students';
import { formatDate, formatRubles } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Label, Select, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { UserRowActions } from '@/components/admin/UserRowActions';

export const metadata: Metadata = { title: 'Студент' };

export default async function StudentCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN']);
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      businessProfile: true,
      enrollments: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      leaderboard: true,
      moneyEntries: { orderBy: { createdAt: 'desc' }, take: 20 },
      curatorNotes: { orderBy: { weekStart: 'desc' }, take: 8 },
      progress: {
        include: { unit: { select: { title: true } }, skill: { select: { title: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      },
    },
  });
  if (!user || user.role !== 'STUDENT') notFound();

  const activePlan = user.enrollments.find((e) => e.status === 'ACTIVE')?.planCode ?? null;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Студент" title={user.name} description={user.email} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Бизнес-профиль // Чтение">
          <div className="flex flex-col gap-2 p-6 text-sm font-light text-t700">
            {user.businessProfile ? (
              <>
                <div><span className="text-t400">Компания:</span> {user.businessProfile.companyName}</div>
                <div><span className="text-t400">Ниша:</span> {user.businessProfile.niche}</div>
                <div><span className="text-t400">Продукт:</span> {user.businessProfile.product}</div>
                <div><span className="text-t400">Клиент:</span> {user.businessProfile.audience}</div>
              </>
            ) : (
              <span className="font-mono text-xs text-t400">Профиль не заполнен.</span>
            )}
          </div>
        </Panel>

        <Panel title="Тариф // Ручная выдача" status={activePlan ? <StatusPill>{activePlan}</StatusPill> : <StatusPill muted>Нет</StatusPill>}>
          <form action={grantPlanManual} className="flex flex-col gap-4 p-6">
            <input type="hidden" name="userId" value={user.id} />
            <div>
              <Label htmlFor="planCode">Тариф</Label>
              <Select id="planCode" name="planCode" defaultValue={activePlan ?? 'SELF'}>
                <option value="SELF">SELF</option>
                <option value="SUPPORT">SUPPORT</option>
                <option value="VIP">VIP</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Причина (в аудит-лог)</Label>
              <Input id="reason" name="reason" required />
            </div>
            <Button type="submit" className="self-start">
              <Icon name="wallet-money-linear" />
              {activePlan ? 'Сменить тариф' : 'Включить тариф'}
            </Button>
          </form>
          {activePlan ? (
            <form action={revokePlan} className="border-t border-line p-6">
              <input type="hidden" name="userId" value={user.id} />
              <Button type="submit" variant="secondary" className="self-start">
                <Icon name="close-circle-linear" />
                Отключить доступ
              </Button>
            </form>
          ) : null}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Доступ // Пароль и блокировка"
          status={
            <StatusPill muted={Boolean(user.blockedAt)}>
              {user.blockedAt ? 'Заблокирован' : 'Активен'}
            </StatusPill>
          }
        >
          <div className="flex flex-col gap-3 p-6">
            <p className="text-sm font-light text-t600">
              Блокировка мгновенно закрывает вход и текущие сессии. Смена пароля не уведомляет
              студента — сообщите новый пароль отдельно.
            </p>
            <UserRowActions userId={user.id} name={user.name} blocked={Boolean(user.blockedAt)} />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Прогресс // Юниты и скиллы">
          <div className="p-2">
            <Table>
              <THead>
                <tr>
                  <Th>Элемент</Th>
                  <Th>Статус</Th>
                  <Th>Обновлён</Th>
                </tr>
              </THead>
              <tbody>
                {user.progress.map((p) => (
                  <TRow key={p.id}>
                    <Td>{p.unit?.title ?? p.skill?.title ?? '—'}</Td>
                    <Td mono>{p.status}</Td>
                    <Td mono>{formatDate(p.updatedAt)}</Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>

        <Panel title="Деньги // Движение">
          <div className="p-2">
            <div className="px-4 py-2 font-mono text-lg text-t900">
              {formatRubles(Number(user.leaderboard?.moneyTotalKopeks ?? 0))}
            </div>
            <Table>
              <THead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Тип</Th>
                  <Th>Сумма</Th>
                </tr>
              </THead>
              <tbody>
                {user.moneyEntries.map((m) => (
                  <TRow key={m.id}>
                    <Td mono>{formatDate(m.createdAt)}</Td>
                    <Td mono>{m.kind}</Td>
                    <Td mono>{formatRubles(m.amountKopeks)}</Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Платежи // История">
          <div className="p-2">
            <Table>
              <THead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Тип</Th>
                  <Th>Тариф</Th>
                  <Th>Сумма</Th>
                  <Th>Статус</Th>
                </tr>
              </THead>
              <tbody>
                {user.payments.map((p) => (
                  <TRow key={p.id}>
                    <Td mono>{formatDate(p.createdAt)}</Td>
                    <Td>{p.kind}</Td>
                    <Td mono>{p.targetPlan}</Td>
                    <Td mono>{formatRubles(p.amountKopeks)}</Td>
                    <Td mono>{p.status}</Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
