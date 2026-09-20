import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { CURATOR_SYSTEM_DEFAULT } from '@/server/curator/prompt';
import { rebuildLeaderboard } from '@/server/admin/settings';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CuratorPromptForm } from '@/components/admin/CuratorPromptForm';

export const metadata: Metadata = { title: 'Админ — настройки' };

export default async function AdminSettingsPage() {
  await requireRole(['ADMIN']);
  const curatorDoc = await prisma.legalDocument.findFirst({
    where: { kind: 'CURATOR_SYSTEM' },
    orderBy: { publishedAt: 'desc' },
  });

  const statuses: { label: string; ok: boolean; note: string }[] = [
    { label: 'Провайдер оплаты', ok: env.PAYMENT_PROVIDER === 'yookassa', note: env.PAYMENT_PROVIDER },
    { label: 'Telegram-бот', ok: Boolean(env.TELEGRAM_BOT_TOKEN), note: env.TELEGRAM_BOT_TOKEN ? 'токен задан' : 'не настроен' },
    { label: 'Куратор (LLM)', ok: env.CURATOR_ENABLED && Boolean(env.ANTHROPIC_API_KEY), note: env.CURATOR_ENABLED ? 'включён' : 'выключен' },
    { label: 'Хранилище S3', ok: Boolean(env.S3_BUCKET), note: env.S3_BUCKET ? 'настроено' : 'не настроено' },
  ];

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin" title="Настройки" description={`Бренд: ${env.NEXT_PUBLIC_BRAND_NAME}`} />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statuses.map((s) => (
          <Panel key={s.label} bodyClassName="p-4 gap-2">
            <StatusPill muted={!s.ok}>{s.ok ? 'OK' : 'Нет'}</StatusPill>
            <div className="font-mono text-[10px] uppercase tracking-widest text-t500">{s.label}</div>
            <div className="text-xs font-light text-t600">{s.note}</div>
          </Panel>
        ))}
      </section>

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
    </div>
  );
}
