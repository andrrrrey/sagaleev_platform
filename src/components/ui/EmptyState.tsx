import type { ReactNode } from 'react';
import { Crosshair } from '@/components/frame/Crosshair';
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
    <div className="relative border border-[#e0dcd0]">
      <Crosshair className="absolute right-4 top-4" />
      <Crosshair className="absolute bottom-4 left-4" />
      <LinedBlock label={label}>
        <div className="flex flex-col items-start gap-4">
          <span>{children}</span>
          {action}
        </div>
      </LinedBlock>
    </div>
  );
}
