import type { ReactNode } from 'react';
import { Panel } from '@/components/ui/Panel';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { StatusPill } from '@/components/ui/StatusPill';
import { Kicker } from '@/components/ui/Kicker';
import { Heading } from '@/components/ui/Heading';

/** Двухколоночный hero для публичных экранов авторизации (docs/04 P1). */
export function AuthHero({
  kicker,
  title,
  description,
  children,
  sidePanel,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: ReactNode;
  sidePanel?: { label: string; lines: string[] };
}) {
  const panel = sidePanel ?? {
    label: 'Что вас ждёт внутри',
    lines: [
      'Собери маркетингового ИИ-агента за 3 дня.',
      'Скиллы и кейсы с бизнес-результатом.',
      'Прогресс = что внедрено, а не просмотрено.',
    ],
  };

  return (
    <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 px-4 pb-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div className="relative flex flex-col justify-center rounded-[30px] bg-paper p-7 md:p-12 lg:p-16">
        <div className="z-10 w-full max-w-md">
          <Kicker className="mb-6">{kicker}</Kicker>
          <Heading as="h1" size="h2" className="mb-6">
            {title}
          </Heading>
          {description ? (
            <p className="mb-8 text-base leading-relaxed text-t600">{description}</p>
          ) : null}
          {children}
        </div>
      </div>

      <div className="brand-gradient bg-grid relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[30px] border border-line/60 p-6 lg:min-h-full lg:p-12">
        <Panel
          className="z-10 w-full max-w-md"
          title={panel.label}
          status={<StatusPill pulse>Доступно</StatusPill>}
        >
          <LinedBlock label="Платформа">
            {panel.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </LinedBlock>
        </Panel>
      </div>
    </div>
  );
}
