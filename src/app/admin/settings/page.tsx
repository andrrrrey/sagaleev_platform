import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { CURATOR_SYSTEM_DEFAULT } from '@/server/curator/prompt';
import { rebuildLeaderboard } from '@/server/admin/settings';
import { describeSettings } from '@/server/settings/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CuratorPromptForm } from '@/components/admin/CuratorPromptForm';
import { IntegrationSettingsForm } from '@/components/admin/IntegrationSettingsForm';
import { YookassaConnectionCheck } from '@/components/admin/YookassaConnectionCheck';

export const metadata: Metadata = { title: 'Админ — настройки' };

export default async function AdminSettingsPage() {
  await requireRole(['ADMIN']);
  const [curatorDoc, settings] = await Promise.all([
    prisma.legalDocument.findFirst({
      where: { kind: 'CURATOR_SYSTEM' },
      orderBy: { publishedAt: 'desc' },
    }),
    describeSettings(),
  ]);

  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));
  const isSet = (key: string) => Boolean(byKey[key]?.isSet);
  const curatorEnabled = byKey['CURATOR_ENABLED']?.value === 'true';
  const curatorProvider = byKey['CURATOR_LLM_PROVIDER']?.value || 'anthropic';
  const curatorKey = curatorProvider === 'routerai' ? 'ROUTERAI_API_KEY' : 'ANTHROPIC_API_KEY';

  const statuses: { label: string; ok: boolean; note: string }[] = [
    {
      label: 'Провайдер оплаты',
      ok:
        env.PAYMENT_PROVIDER === 'yookassa' &&
        isSet('YOOKASSA_SHOP_ID') &&
        isSet('YOOKASSA_SECRET_KEY'),
      note:
        env.PAYMENT_PROVIDER !== 'yookassa'
          ? env.PAYMENT_PROVIDER
          : isSet('YOOKASSA_SHOP_ID') && isSet('YOOKASSA_SECRET_KEY')
            ? 'yookassa · реквизиты заданы'
            : 'yookassa · нет реквизитов',
    },
    {
      label: 'Telegram-бот',
      ok: isSet('TELEGRAM_BOT_TOKEN'),
      note: isSet('TELEGRAM_BOT_TOKEN') ? 'токен задан' : 'не настроен',
    },
    {
      label: 'Куратор (LLM)',
      ok: curatorEnabled && isSet(curatorKey),
      note: curatorEnabled
        ? `${curatorProvider}: ${isSet(curatorKey) ? 'ключ задан' : 'нет ключа'}`
        : 'выключен',
    },
  ];

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Admin"
        title="Настройки"
        description={`Бренд: ${env.NEXT_PUBLIC_BRAND_NAME}`}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statuses.map((s) => (
          <Panel key={s.label} bodyClassName="p-4 gap-2">
            <StatusPill muted={!s.ok}>{s.ok ? 'OK' : 'Нет'}</StatusPill>
            <div className="font-mono text-[10px] uppercase tracking-widest text-t500">
              {s.label}
            </div>
            <div className="text-xs font-light text-t600">{s.note}</div>
          </Panel>
        ))}
      </section>

      <div className="mb-6">
        <Panel title="Интеграции // API-ключи">
          <IntegrationSettingsForm settings={settings} />
        </Panel>
      </div>

      <div className="mb-6">
        <Panel title="ЮKassa // Диагностика">
          <div className="flex flex-col gap-4 p-6">
            <p className="text-sm leading-relaxed text-t600">
              Проверка обращается к ЮKassa без создания платежа. Для уведомлений укажите в личном
              кабинете ЮKassa события <span className="font-mono">payment.succeeded</span> и{' '}
              <span className="font-mono">payment.canceled</span>.
            </p>
            <div className="rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-t400">
                URL HTTP-уведомлений
              </div>
              <code className="break-all text-sm text-t800">
                {env.APP_URL}/api/webhooks/payment
              </code>
            </div>
            <p className="text-xs leading-relaxed text-t500">
              Для ежемесячных списаний ЮKassa должна отдельно включить магазину автоплатежи. После
              подключения первый платёж сохраняет способ оплаты, а следующие списания выполняются
              платформой автоматически.
            </p>
            <YookassaConnectionCheck />
          </div>
        </Panel>
      </div>

      <div className="mb-6">
        <Panel title="Куратор // Системный промпт">
          <CuratorPromptForm defaultPrompt={curatorDoc?.bodyHtml ?? CURATOR_SYSTEM_DEFAULT} />
        </Panel>
      </div>

      <Panel title="Обслуживание // Лидерборд">
        <form action={rebuildLeaderboard} className="flex flex-col gap-3 p-6">
          <p className="text-sm font-light text-t600">
            Полный пересчёт очков лидерборда (обычно выполняется ночной джобой).
          </p>
          <Button type="submit" variant="secondary" className="self-start">
            <Icon name="refresh-linear" />
            Пересчитать лидерборд
          </Button>
        </form>
      </Panel>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-t400">
        Инструкция по работе с платформой →{' '}
        <Link href="/admin/help" className="text-accent hover:underline">
          /admin/help
        </Link>
      </p>
    </div>
  );
}
