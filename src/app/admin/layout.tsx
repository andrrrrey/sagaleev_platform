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
    <AppFrame topLabel="sys_admin_01" nav={<AccountNav brand={`${env.NEXT_PUBLIC_BRAND_NAME} · Admin`} />}>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-b border-[#e0dcd0]/70 p-4 md:border-b-0 md:border-r">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {user?.name} · {actor.role}
          </div>
          <AdminNav role={actor.role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </AppFrame>
  );
}
