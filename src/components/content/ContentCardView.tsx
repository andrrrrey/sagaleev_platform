import Link from 'next/link';
import type { ContentCard } from '@/server/content/service';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';

const BASE: Record<string, string> = { LESSON: '/lessons', USECASE: '/usecases', STREAM: '/streams' };
const STATUS_LABEL: Record<string, string> = {
  VIEWED: 'Просмотрен',
  SUBMITTED: 'Сдан',
  IMPLEMENTED: 'Внедрён',
  RESULT: 'Результат',
};

export function ContentCardView({ card }: { card: ContentCard }) {
  const statusLabel = card.status !== 'NONE' ? STATUS_LABEL[card.status] : null;
  return (
    <Link href={`${BASE[card.type]}/${card.slug}`} className="group">
      <Panel
        className="h-full transition-colors group-hover:border-accent/30"
        title={`${card.title} // ${card.type === 'STREAM' ? 'Эфир' : card.type === 'LESSON' ? 'Урок' : 'Юзкейс'}`}
        status={
          card.locked ? (
            <StatusPill muted>
              <Icon name="lock-linear" className="text-xs" />
            </StatusPill>
          ) : statusLabel ? (
            <StatusPill>{statusLabel}</StatusPill>
          ) : undefined
        }
      >
        <div className="flex flex-1 flex-col gap-3 p-5">
          {card.caseClient ? (
            <div className="font-mono text-[10px] uppercase tracking-widest text-t500">
              Кейс · {card.caseClient}
            </div>
          ) : null}
          {card.airedAt ? (
            <div className="font-mono text-[10px] uppercase tracking-widest text-t500">
              Эфир · {formatDate(card.airedAt)}
            </div>
          ) : null}
          {card.summary ? <p className="line-clamp-2 text-sm font-light text-t700">{card.summary}</p> : null}

          {!card.locked && card.kpis.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {card.kpis.slice(0, 3).map((k, i) => (
                <span key={i} className="border border-line bg-paper-panel px-2 py-1 font-mono text-[10px] text-t700">
                  {k.value}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            {card.timeToMaster ? (
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-t500">
                <Icon name="clock-circle-linear" className="text-xs" />
                {card.timeToMaster}
              </span>
            ) : null}
          </div>

          {card.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.slice(0, 4).map((t) => (
                <Tag key={t.slug}>{t.title}</Tag>
              ))}
            </div>
          ) : null}

          {card.locked ? (
            <div className="mt-auto flex items-center gap-2 border-t border-line/60 pt-3 font-mono text-[10px] uppercase tracking-widest text-t400">
              <Icon name="lock-keyhole-linear" className="text-xs" />
              Откроется на тарифе {card.requiredPlan ?? 'SUPPORT'}
            </div>
          ) : null}
        </div>
      </Panel>
    </Link>
  );
}
