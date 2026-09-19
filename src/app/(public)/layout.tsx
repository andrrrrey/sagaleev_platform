import type { ReactNode } from 'react';
import { AppFrame } from '@/components/frame/AppFrame';
import { PublicNav } from '@/components/frame/PublicNav';
import { env } from '@/lib/env';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame topLabel="sys_auth_01" nav={<PublicNav brand={env.NEXT_PUBLIC_BRAND_NAME} />}>
      {children}
    </AppFrame>
  );
}
