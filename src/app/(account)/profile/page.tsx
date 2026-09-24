import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor, getCurrentUser } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { formatDate, formatRubles } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tabs } from '@/components/ui/Tabs';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Field';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';
import { ExportProfileButton } from '@/components/profile/ExportProfileButton';
import { TelegramPanel } from '@/components/profile/TelegramPanel';
import { CodexMcpPanel } from '@/components/profile/CodexMcpPanel';
import { AccountSettingsForm } from '@/components/profile/AccountSettingsForm';
import { getMcpTokenStatus } from '@/server/mcp/auth';
import {
  cancelSubscription,
  resumeSubscription,
  setLeaderboardVisibility,
  setNotifyPrefs,
} from '@/server/profile/settings-actions';

export const metadata: Metadata = { title: 'Профиль' };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
  FAILED: 'Ошибка',
  REFUNDED: 'Возврат',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const actor = await getActor();
  if (!actor) redirect('/login');
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, enrollment, payments, mcpToken] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId: user.id } }),
    prisma.enrollment.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    getMcpTokenStatus(user.id),
  ]);

  const profileTab = (
    <div className="flex flex-col gap-4">
      <Panel title="Аккаунт // Профиль">
        <div className="flex flex-col gap-4 p-6">
          <p className="text-sm font-light text-t600">
            Это ваш личный кабинет. Здесь собраны настройки аккаунта, оплаты, уведомлений и
            подключений.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/forgot" className={buttonClass('secondary', 'self-start')}>
              <Icon name="shield-check-linear" />
              Сменить пароль
            </Link>
            <Link href="/help" className={buttonClass('secondary', 'self-start')}>
              <Icon name="notebook-linear" />
              Инструкция
            </Link>
          </div>
        </div>
      </Panel>
      <Panel title="Личные данные // Редактирование">
        <AccountSettingsForm
          name={user.name}
          email={user.email}
          phone={user.phone}
        />
      </Panel>
    </div>
  );

  const businessTab = (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ExportProfileButton />
      </div>
      <OnboardingWizard
        redirectTo="/profile"
        submitLabel="Сохранить бизнес-профиль"
        defaults={
          profile
            ? {
                companyName: profile.companyName,
                niche: profile.niche,
                whoAmI: profile.whoAmI,
                product: profile.product,
                audience: profile.audience,
                brandVoice: profile.brandVoice,
                goals: profile.goals ?? undefined,
                monthlyRevenueBand: profile.monthlyRevenueBand ?? undefined,
                websiteUrl: profile.websiteUrl ?? undefined,
              }
            : undefined
        }
      />
    </div>
  );

  const billingTab = (
    <div className="flex flex-col gap-4">
      <Panel
        title="Тариф // Активный"
        status={enrollment ? <StatusPill>Активен</StatusPill> : <StatusPill muted>Нет</StatusPill>}
      >
        <div className="flex flex-col gap-4 p-6">
          {enrollment ? (
            <>
              <div className="font-mono text-2xl text-t900">{enrollment.plan.title}</div>
              <div className="text-sm font-light text-t600">
                Активирован: {formatDate(enrollment.activatedAt)}
              </div>
              {enrollment.expiresAt ? (
                <div className="text-sm font-light text-t600">
                  {enrollment.autoRenew ? 'Следующее списание' : 'Доступ оплачен до'}:{' '}
                  <span className="font-mono text-t900">{formatDate(enrollment.expiresAt)}</span>
                </div>
              ) : null}
              <p className="text-sm font-light text-t600">
                Агент-куратор и все материалы включены в подписку.
              </p>
              {!enrollment.expiresAt ? (
                <p className="border border-line bg-surface px-4 py-3 font-mono text-xs text-t600">
                  Доступ предоставлен без автосписаний.
                </p>
              ) : enrollment.autoRenew ? (
                <form action={cancelSubscription}>
                  <Button type="submit" variant="secondary" className="self-start">
                    Отключить автопродление
                  </Button>
                </form>
              ) : enrollment.paymentMethodId ? (
                <form action={resumeSubscription}>
                  <Button type="submit" variant="primary" className="self-start">
                    <Icon name="wallet-money-linear" />
                    Возобновить автопродление
                  </Button>
                </form>
              ) : (
                <p className="border border-brand-pink/50 bg-brand-pink/10 px-4 py-3 text-sm text-t700">
                  Автопродление не настроено. После окончания оплаченного периода оформите
                  подписку снова или обратитесь в поддержку.
                </p>
              )}
            </>
          ) : (
            <Link href="/pay" className={buttonClass('primary', 'self-start')}>
              Выбрать тариф
            </Link>
          )}
        </div>
      </Panel>

      <Panel title="История платежей">
        <div className="p-2">
          {payments.length === 0 ? (
            <p className="p-4 font-mono text-xs text-t500">Платежей пока нет.</p>
          ) : (
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
                {payments.map((p) => (
                  <TRow key={p.id}>
                    <Td mono>{formatDate(p.createdAt)}</Td>
                    <Td>{p.kind === 'RENEWAL' ? 'Продление' : 'Подписка'}</Td>
                    <Td>Единая подписка</Td>
                    <Td mono>{formatRubles(p.amountKopeks)}</Td>
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

  const telegramTab = (
    <div className="flex flex-col gap-4">
      <Panel title="Telegram // Привязка">
        <TelegramPanel linked={Boolean(user.telegramChatId)} username={user.telegramUsername} />
      </Panel>
    </div>
  );

  const codexTab = (
    <Panel title="Codex / ChatGPT // Помощник по маршруту">
      <div className="p-6">
        <CodexMcpPanel
          initialActive={mcpToken.active}
          initialExpiresAt={mcpToken.expiresAt?.toISOString() ?? null}
        />
      </div>
    </Panel>
  );

  const privacyTab = (
    <div className="flex flex-col gap-4">
      <Panel title="Согласия // 152-ФЗ">
        <div className="flex flex-col gap-3 p-6 text-sm font-light text-t700">
          <div>
            Согласие на обработку ПДн:{' '}
            <span className="font-mono text-t900">
              {user.consentAt ? `${formatDate(user.consentAt)} (v${user.consentVersion})` : '—'}
            </span>
          </div>
          <Link href="/legal/privacy" className="font-mono text-xs text-accent underline">
            Политика обработки ПДн
          </Link>
        </div>
      </Panel>

      <Panel title="Лидерборд // Видимость">
        <form action={setLeaderboardVisibility} className="flex flex-col gap-4 p-6">
          <Checkbox
            id="showInLeaderboard"
            name="showInLeaderboard"
            defaultChecked={user.showInLeaderboard}
            label="Показывать меня в лидерборде (мотиватор, не позор)"
          />
          <Button type="submit" variant="secondary" className="self-start">
            Сохранить
          </Button>
        </form>
      </Panel>

      <Panel title="Уведомления">
        <form action={setNotifyPrefs} className="flex flex-col gap-4 p-6">
          <Checkbox id="notifyEmail" name="notifyEmail" defaultChecked={user.notifyEmail} label="Email" />
          <Checkbox
            id="notifyTelegram"
            name="notifyTelegram"
            defaultChecked={user.notifyTelegram}
            label="Telegram"
          />
          <Button type="submit" variant="secondary" className="self-start">
            Сохранить
          </Button>
        </form>
      </Panel>
    </div>
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Кабинет" title="Профиль" />
      <Tabs
        initialKey={
          ['profile', 'business', 'billing', 'telegram', 'codex', 'privacy'].includes(tab ?? '')
            ? tab
            : undefined
        }
        items={[
          { key: 'profile', label: 'Профиль', content: profileTab },
          { key: 'business', label: 'Бизнес-профиль', content: businessTab },
          { key: 'billing', label: 'Тариф и оплата', content: billingTab },
          { key: 'telegram', label: 'Telegram', content: telegramTab },
          { key: 'codex', label: 'Codex / MCP', content: codexTab },
          { key: 'privacy', label: 'Приватность', content: privacyTab },
        ]}
      />
    </div>
  );
}
