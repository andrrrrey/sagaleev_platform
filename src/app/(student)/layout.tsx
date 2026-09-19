import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppFrame } from '@/components/frame/AppFrame';
import { Nav } from '@/components/frame/Nav';
import { MobileNav } from '@/components/frame/MobileNav';
import { env } from '@/lib/env';
import { getActor, getCurrentUser } from '@/server/auth/session';
import { prisma } from '@/server/db';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  // Сотрудники работают в /admin, но могут смотреть студенческую зону.
  const isStaff = actor.role === 'ADMIN' || actor.role === 'EDITOR';

  if (!isStaff) {
    if (!actor.enrollmentActive) redirect('/pay');
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!profile) redirect('/onboarding');
  }

  const user = await getCurrentUser();

  return (
    <AppFrame
      topLabel="sys_cabinet_01"
      nav={<Nav brand={env.NEXT_PUBLIC_BRAND_NAME} userName={user?.name} />}
      mobileNav={<MobileNav />}
    >
      <div className="pb-20 md:pb-0">{children}</div>
    </AppFrame>
  );
}
