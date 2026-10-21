import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';

export const metadata: Metadata = { title: 'Онбординг' };

export default async function OnboardingPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  // ADMIN/EDITOR не проходят онбординг.
  if (actor.role === 'ADMIN' || actor.role === 'EDITOR') redirect('/admin');

  // Если профиль уже собран — на Главную.
  const [existing, user] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId: actor.id } }),
    prisma.user.findUnique({
      where: { id: actor.id },
      select: { phone: true, telegramUsername: true },
    }),
  ]);
  if (existing) redirect('/');

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Онбординг"
        title="Соберём твой бизнес-профиль"
        description="Эти данные агент загрузит в память на Дне 1 маршрута. Контакты не используются куратором."
      />
      <div className="max-w-2xl">
        <OnboardingWizard
          redirectTo="/"
          defaults={{
            phone: user?.phone ?? undefined,
            telegramUsername: user?.telegramUsername
              ? `@${user.telegramUsername.replace(/^@/, '')}`
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
