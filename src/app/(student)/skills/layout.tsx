import type { ReactNode } from 'react';
import { requirePaidSection } from '@/server/access/guard';

export default async function SkillsLayout({ children }: { children: ReactNode }) {
  await requirePaidSection('skills');
  return children;
}
