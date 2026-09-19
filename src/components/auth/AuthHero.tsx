import type { ReactNode } from 'react';
import { Crosshair } from '@/components/frame/Crosshair';
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
    label: 'Session // Standby',
    lines: [
      'Собери маркетингового ИИ-агента за 3 дня.',
      'Скиллы и кейсы с бизнес-результатом.',
      'Прогресс = что внедрено, а не просмотрено.',
    ],
  };

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
      <div className="relative flex flex-col justify-center p-8 md:p-14 lg:p-20">
        <Crosshair className="absolute right-12 top-12" />
        <Crosshair className="absolute bottom-12 left-8" />
        <div className="z-10 w-full max-w-md">
          <Kicker className="mb-6">{kicker}</Kicker>
          <Heading as="h1" size="h2" className="mb-6">
            {title}
          </Heading>
          {description ? (
            <p className="mb-8 text-base font-light leading-relaxed text-zinc-600">{description}</p>
          ) : null}
          {children}
        </div>
      </div>

      <div className="relative flex min-h-[320px] items-center justify-center border-t border-[#e0dcd0]/70 bg-[#efede6]/40 p-6 lg:min-h-full lg:border-l lg:border-t-0 lg:p-12">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.03]" />
        <Panel
          className="z-10 w-full max-w-md"
          title={panel.label}
          status={<StatusPill pulse>Готов к работе</StatusPill>}
        >
          <LinedBlock label="Brief">
            {panel.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </LinedBlock>
        </Panel>
      </div>
    </div>
  );
}
