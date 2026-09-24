import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppFrame } from '@/components/frame/AppFrame';
import { Nav } from '@/components/frame/Nav';
import { MobileNav } from '@/components/frame/MobileNav';
import { env } from '@/lib/env';
import { getActor, getCurrentUser } from '@/server/auth/session';

/** Личный кабинет доступен и без активной подписки. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const user = await getCurrentUser();

  return (
    <AppFrame
      topLabel="sys_account_01"
      nav={<Nav brand={env.NEXT_PUBLIC_BRAND_NAME} userName={user?.name} />}
      mobileNav={<MobileNav />}
    >
      <div className="pb-20 md:pb-0">{children}</div>
    </AppFrame>
  );
}
