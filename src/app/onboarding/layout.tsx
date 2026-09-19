import type { ReactNode } from 'react';
import { AppFrame } from '@/components/frame/AppFrame';
import { AccountNav } from '@/components/frame/AccountNav';
import { env } from '@/lib/env';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame topLabel="sys_onboarding_01" nav={<AccountNav brand={env.NEXT_PUBLIC_BRAND_NAME} />}>
      {children}
    </AppFrame>
  );
}
