import type { Metadata } from 'next';
import { requireRole } from '@/server/access/guard';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkillForm } from '@/components/admin/SkillForm';

export const metadata: Metadata = { title: 'Новый скилл' };

export default async function NewSkillPage() {
  await requireRole(['ADMIN', 'EDITOR']);
  const tags = await prisma.tag.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker="Admin · Скиллы" title="Новый скилл" />
      <SkillForm tags={tags} />
    </div>
  );
}
