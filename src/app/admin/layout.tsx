import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppFrame } from '@/components/frame/AppFrame';
import { AccountNav } from '@/components/frame/AccountNav';
import { AdminNav } from '@/components/frame/AdminNav';
import { env } from '@/lib/env';
import { getActor, getCurrentUser } from '@/server/auth/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (actor.role !== 'ADMIN' && actor.role !== 'EDITOR') redirect('/');
  const user = await getCurrentUser();

  return (
    <AppFrame
      nav={
        <AccountNav
          brand={`${env.NEXT_PUBLIC_BRAND_NAME} · Admin`}
          modeHref="/"
          modeLabel="На платформу"
        />
      }
    >
      <div className="grid grid-cols-1 bg-paper-tint/60 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-line/70 bg-paper p-4 md:min-h-[calc(100vh-88px)] md:border-b-0 md:border-r md:p-5">
          <div className="mb-4 rounded-2xl bg-paper-tint px-4 py-3 text-xs text-t500">
            <div className="font-semibold text-t900">{user?.name}</div>
            <div className="mt-0.5 uppercase tracking-wider">{actor.role}</div>
          </div>
          <AdminNav role={actor.role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </AppFrame>
  );
}
