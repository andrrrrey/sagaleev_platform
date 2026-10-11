import type { ReactNode } from 'react';
import { requirePaidSection } from '@/server/access/guard';

export default async function UsecasesLayout({ children }: { children: ReactNode }) {
  await requirePaidSection('usecases');
  return children;
}
