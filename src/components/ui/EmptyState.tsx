import type { ReactNode } from 'react';
import { LinedBlock } from './LinedBlock';

/** Пустое состояние: LinedBlock + crosshair (docs/02 §6). */
export function EmptyState({
  label = 'Пусто',
  children,
  action,
}: {
  label?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative rounded-[24px] border border-dashed border-line bg-paper p-2">
      <LinedBlock label={label}>
        <div className="flex flex-col items-start gap-4">
          <span>{children}</span>
          {action}
        </div>
      </LinedBlock>
    </div>
  );
}
