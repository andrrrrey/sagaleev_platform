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
import { Label, Checkbox } from '@/components/ui/Field';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';
import { ExportProfileButton } from '@/components/profile/ExportProfileButton';
import { setLeaderboardVisibility, setNotifyPrefs } from '@/server/profile/settings-actions';

export const metadata: Metadata = { title: 'Профиль' };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
  FAILED: 'Ошибка',
  REFUNDED: 'Возврат',
};

export default async function ProfilePage() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, enrollment, payments] = await Promise.all([
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
  ]);

  const profileTab = (
    <div className="flex flex-col gap-4">
      <Panel title="Аккаунт // Профиль">
        <div className="flex flex-col gap-4 p-6">
          <div>
            <Label>Имя</Label>
            <div className="text-sm font-light text-t800">{user.name}</div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="font-mono text-sm text-t800">{user.email}</div>
          </div>
          <div>
            <Label>Телефон</Label>
            <div className="font-mono text-sm text-t800">{user.phone ?? '—'}</div>
          </div>
          <Link href="/forgot" className={buttonClass('secondary', 'self-start')}>
            <Icon name="shield-check-linear" />
            Сменить пароль
          </Link>
        </div>
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
              <Link href="/pay" className={buttonClass('primary', 'self-start')}>
                <Icon name="wallet-money-linear" />
                Улучшить тариф
              </Link>
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
                    <Td>{p.kind === 'UPGRADE' ? 'Апгрейд' : 'Покупка'}</Td>
                    <Td mono>{p.targetPlan}</Td>
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
        items={[
          { key: 'profile', label: 'Профиль', content: profileTab },
          { key: 'business', label: 'Бизнес-профиль', content: businessTab },
          { key: 'billing', label: 'Тариф и оплата', content: billingTab },
          { key: 'privacy', label: 'Приватность', content: privacyTab },
        ]}
      />
    </div>
  );
}
