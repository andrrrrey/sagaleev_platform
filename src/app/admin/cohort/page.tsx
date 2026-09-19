import { requireRole } from '@/server/access/guard';
import { StagePlaceholder } from '@/components/ui/StagePlaceholder';
export const metadata = { title: 'Админ — поток' };
export default async function Page() {
  await requireRole(['ADMIN']);
  return <StagePlaceholder kicker="Admin" title="Дашборд потока" stage="Этапе 4" />;
}
