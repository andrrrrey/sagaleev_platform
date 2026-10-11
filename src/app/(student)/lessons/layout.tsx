import type { ReactNode } from 'react';
import { requirePaidSection } from '@/server/access/guard';

export default async function LessonsLayout({ children }: { children: ReactNode }) {
  await requirePaidSection('lessons');
  return children;
}
