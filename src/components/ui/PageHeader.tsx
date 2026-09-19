import type { ReactNode } from 'react';
import { Kicker } from './Kicker';
import { Heading } from './Heading';

/** Стандартная шапка экрана: Kicker + H1 (masked reveal) + подзаголовок. */
export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Kicker className="mb-6">{kicker}</Kicker>
        <Heading as="h1">{title}</Heading>
        {description ? (
          <p className="mt-6 max-w-md text-base font-light leading-relaxed text-t600 md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
