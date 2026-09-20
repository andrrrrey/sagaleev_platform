import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { getSetting, getSettingBool } from '@/server/settings/store';
import { runCuratorManual } from '@/server/curator/actions';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Field';

export const metadata: Metadata = { title: 'Админ — куратор' };

export default async function AdminCuratorPage() {
  await requireRole(['ADMIN']);

  const [students, notes] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT', deletedAt: null, enrollments: { some: { status: 'ACTIVE', planCode: { in: ['SUPPORT', 'VIP'] } } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.curatorNote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const [curatorFlag, apiKey] = await Promise.all([
    getSettingBool('CURATOR_ENABLED'),
    getSetting('ANTHROPIC_API_KEY'),
  ]);
  const enabled = curatorFlag && Boolean(apiKey);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Агент-куратор"
        description="ИИ-наставник, который раз в неделю анализирует прогресс студента и даёт 1–2 шага."
      />

      <div className="mb-6">
        <Panel title="Что это // Объяснение">
          <div className="flex flex-col gap-3 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              <b>Агент-куратор</b> — это встроенный в платформу ИИ-наставник (на модели Claude).
              Раз в неделю (по понедельникам) он смотрит на то, что студент <i>реально внедрил</i> в
              бизнесе: прогресс по маршруту и юзкейсам, отметки «внедрил / есть результат», движение
              по деньгам и еженедельный отчёт студента.
            </p>
            <p>
              На основе этого он формирует короткий разбор: что сделано за неделю, какой принцип
              метода (ABCDX, лестница Ханта, воронка) сейчас важен, и 1–2 конкретных шага на
              следующую неделю. Разбор появляется у студента в разделе «Куратор» и приходит
              уведомлением.
            </p>
            <p className="text-t600">
              <b>Приватность (152-ФЗ):</b> куратор читает только учебные данные и бизнес-профиль. Он
              не видит переписку, контакты (email/телефон), платежи. Доступен на тарифах SUPPORT и
              VIP. Системный промпт и API-ключ настраиваются в{' '}
              <span className="font-mono text-xs">Настройках</span>.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Статус // Фичефлаг" status={<StatusPill muted={!enabled}>{enabled ? 'Включён' : 'Выключен'}</StatusPill>}>
          <div className="flex flex-col gap-2 p-6 text-sm font-light text-t700">
            <div>CURATOR_ENABLED: <span className="font-mono text-t900">{String(curatorFlag)}</span></div>
            <div>ANTHROPIC_API_KEY: <span className="font-mono text-t900">{apiKey ? 'задан' : 'не задан'}</span></div>
            <div>Расписание: <span className="font-mono text-t900">пн 09:00 МСК</span> (джоба curator.weekly)</div>
          </div>
        </Panel>

        <Panel title="Ручной запуск // Разбор">
          <form action={runCuratorManual} className="flex flex-col gap-4 p-6">
            <Select name="userId" defaultValue="">
              <option value="" disabled>
                Выберите студента
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={!enabled} className="self-start">
              <Icon name="refresh-linear" />
              Запустить разбор
            </Button>
            {!enabled ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-t400">
                Недоступно без ключа/фичефлага
              </p>
            ) : null}
          </form>
        </Panel>
      </div>

      <Panel title="Последние разборы // Логи">
        <div className="p-2">
          {notes.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Запусков пока нет.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Студент</Th>
                  <Th>Неделя</Th>
                  <Th>Модель</Th>
                  <Th>Токены</Th>
                  <Th>Статус</Th>
                </tr>
              </THead>
              <tbody>
                {notes.map((n) => (
                  <TRow key={n.id}>
                    <Td>{n.user.name}</Td>
                    <Td mono>{formatDate(n.weekStart)}</Td>
                    <Td mono>{n.model}</Td>
                    <Td mono>{n.tokensIn ?? '—'}/{n.tokensOut ?? '—'}</Td>
                    <Td>
                      <StatusPill muted={n.status !== 'OK'}>{n.status}</StatusPill>
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
