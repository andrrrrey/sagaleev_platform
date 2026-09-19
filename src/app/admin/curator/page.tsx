import { requireRole } from '@/server/access/guard';
import { StagePlaceholder } from '@/components/ui/StagePlaceholder';
export const metadata = { title: 'Админ — куратор' };
export default async function Page() {
  await requireRole(['ADMIN']);
  return <StagePlaceholder kicker="Admin" title="Агент-куратор" stage="Этапе 4" />;
}
