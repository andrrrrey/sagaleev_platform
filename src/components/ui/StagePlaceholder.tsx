import { PageHeader } from './PageHeader';
import { EmptyState } from './EmptyState';

/** Заглушка для разделов, наполняемых на следующих этапах. */
export function StagePlaceholder({
  kicker,
  title,
  stage,
}: {
  kicker: string;
  title: string;
  stage: string;
}) {
  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader kicker={kicker} title={title} />
      <div className="max-w-xl">
        <EmptyState label={`Stage // ${stage}`}>
          Раздел появится на {stage}. Каркас и стиль уже готовы.
        </EmptyState>
      </div>
    </div>
  );
}
