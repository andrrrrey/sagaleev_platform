import type { ContentDetail } from '@/server/content/service';
import { richToHtml } from '@/lib/rich';
import { formatDate } from '@/lib/utils';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { CopyButton } from '@/components/ui/CopyButton';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Icon } from '@/components/ui/Icon';
import { KinescopePlayer } from './KinescopePlayer';
import { KpiBlock } from './KpiBlock';
import { PromptBlock } from './PromptBlock';
import { ContentStatusForm } from './ContentStatusForm';

function Rich({ json }: { json: unknown }) {
  const html = richToHtml(json);
  if (!html) return null;
  return (
    <div
      className="text-sm font-light leading-relaxed text-t700 [&_a]:text-accent [&_a]:underline [&_h2]:mt-4 [&_h2]:font-normal [&_h2]:text-t900 [&_h3]:mt-3 [&_h3]:text-t800 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-accent">
        <span className="h-px w-6 bg-accent" />
        {label}
      </div>
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: NonNullable<ContentDetail['steps']> }) {
  if (steps.length === 0) return null;
  return (
    <Section label="Пошаговые действия">
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={i} className="border border-line bg-paper-panel p-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm font-normal text-t900">{s.title}</span>
            </div>
            {s.body ? <p className="mb-3 text-sm font-light text-t700">{s.body}</p> : null}
            {s.command ? (
              <div className="flex flex-col gap-2">
                <LinedBlock label="Команда">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-[28px]">
                    {s.command}
                  </pre>
                </LinedBlock>
                <CopyButton text={s.command} label="Скопировать" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * Единый рендер контент-юнита: урок / юзкейс / эфир (docs/03 §3.4, §04 S6/S8/S10).
 * Предполагает, что юнит доступен (гейтинг/замок — на уровне страницы).
 */
export function ContentUnit({
  detail,
  initialTab,
  initialT,
}: {
  detail: ContentDetail;
  initialTab?: string;
  initialT?: number;
}) {
  const hasTabs = detail.type === 'USECASE' || detail.type === 'STREAM';

  const overview = (
    <div className="flex flex-col gap-8">
      {detail.type === 'STREAM' && detail.airedAt ? (
        <div className="font-mono text-xs uppercase tracking-widest text-t500">
          Эфир от {formatDate(detail.airedAt)} · Разбор кейса участника
        </div>
      ) : null}
      {detail.goal ? (
        <Section label="Цель">
          <p className="text-sm font-light leading-relaxed text-t700">{detail.goal}</p>
        </Section>
      ) : null}
      {detail.result || (detail.kpis && detail.kpis.length > 0) ? (
        <Section label="Результат">
          {detail.result ? (
            <p className="text-sm font-light leading-relaxed text-t700">{detail.result}</p>
          ) : null}
          {detail.kpis ? <KpiBlock kpis={detail.kpis} /> : null}
        </Section>
      ) : null}
      {richToHtml(detail.description) || (detail.repoLinks && detail.repoLinks.length > 0) ? (
        <Section label="Описание">
          <Rich json={detail.description} />
          {detail.repoLinks && detail.repoLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.repoLinks.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-line bg-surface px-3 py-2 font-mono text-[11px] text-t700 transition-colors hover:border-accent/30 hover:text-accent"
                >
                  <Icon name="link-linear" className="text-sm text-accent" />
                  {l.title}
                </a>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}
      {detail.prompt ? <PromptBlock prompt={detail.prompt} slug={detail.slug} note={detail.promptNote} /> : null}
      {detail.steps ? <StepList steps={detail.steps} /> : null}
    </div>
  );

  const tabItems: TabItem[] = [{ key: 'overview', label: 'Обзор', content: overview }];
  if (richToHtml(detail.article)) {
    tabItems.push({ key: 'article', label: 'Статья', content: <Rich json={detail.article} /> });
  }
  if (detail.transcript) {
    tabItems.push({
      key: 'transcript',
      label: 'Транскрипт',
      content: <LinedBlock label="Transcript">{detail.transcript}</LinedBlock>,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {detail.kinescopeId ? (
        <KinescopePlayer
          id={detail.kinescopeId}
          timecodes={detail.timecodes ?? []}
          slug={detail.slug}
          initialT={initialT}
        />
      ) : null}

      {hasTabs ? (
        <Tabs items={tabItems} initialKey={initialTab} />
      ) : (
        <div className="flex flex-col gap-8">
          {detail.prompt ? (
            <PromptBlock prompt={detail.prompt} slug={detail.slug} note={detail.promptNote} />
          ) : null}
        </div>
      )}

      <Panel
        title="Мой статус // Прогресс"
        status={detail.status !== 'NONE' ? <StatusPill>{detail.status}</StatusPill> : undefined}
      >
        <div className="p-5">
          <ContentStatusForm slug={detail.slug} current={detail.status} proofNote={detail.proofNote} />
        </div>
      </Panel>

      {detail.related && detail.related.length > 0 ? (
        <div className="border-t border-line/60 pt-6">
          <div className="mb-4 font-mono text-xs uppercase tracking-widest text-t500">Связанное</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {detail.related.map((r) => (
              <a
                key={r.slug}
                href={`/${r.type === 'LESSON' ? 'lessons' : r.type === 'STREAM' ? 'streams' : 'usecases'}/${r.slug}`}
                className="flex items-center justify-between border border-line bg-surface px-4 py-2.5 text-sm font-light text-t700 transition-colors hover:border-accent/30"
              >
                {r.title}
                <Icon name="arrow-right-linear" className="text-t400" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
