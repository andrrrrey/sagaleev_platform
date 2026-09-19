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
  if (!actor.enrollmentActive) redirect('/pay');

  // Если профиль уже собран — на Главную.
  const existing = await prisma.businessProfile.findUnique({ where: { userId: actor.id } });
  if (existing) redirect('/');

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Онбординг"
        title="Соберём твой бизнес-профиль"
        description="Эти данные агент загрузит в память на Дне 1 маршрута. Контакты не используются куратором."
      />
      <div className="max-w-2xl">
        <OnboardingWizard redirectTo="/" />
      </div>
    </div>
  );
}
