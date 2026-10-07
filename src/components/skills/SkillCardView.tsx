import Link from 'next/link';
import type { SkillCard } from '@/server/skills/service';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';

const STATUS_LABEL: Record<string, string> = {
  VIEWED: 'Просмотрен',
  SUBMITTED: 'Сдан',
  IMPLEMENTED: 'Внедрён',
  RESULT: 'Результат',
};

export function SkillCardView({ skill }: { skill: SkillCard }) {
  const statusLabel = skill.status !== 'NONE' ? STATUS_LABEL[skill.status] : null;

  return (
    <Link href={`/skills/${skill.slug}`} className="group">
      <Panel
        className="h-full group-hover:-translate-y-1 group-hover:border-accent/20"
        title="Скилл для агента"
        status={
          skill.locked ? (
            <StatusPill muted>
              <Icon name="lock-linear" className="text-xs" />
            </StatusPill>
          ) : statusLabel ? (
            <StatusPill>{statusLabel}</StatusPill>
          ) : undefined
        }
      >
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-t900">
            {skill.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-t600">{skill.shortDesc}</p>
          {skill.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.slice(0, 4).map((t) => (
                <Tag key={t.slug}>{t.title}</Tag>
              ))}
            </div>
          ) : null}
          {!skill.locked ? (
            <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold text-t500">
              Открыть инструкцию
              <Icon name="arrow-right-linear" className="text-sm text-accent" />
            </div>
          ) : null}
          {skill.locked ? (
            <div className="mt-auto flex items-center gap-2 border-t border-line/60 pt-3 text-xs font-medium text-t400">
              <Icon name="lock-keyhole-linear" className="text-xs" />
              Откроется на тарифе {skill.requiredPlan ?? 'SUPPORT'}
            </div>
          ) : null}
        </div>
      </Panel>
    </Link>
  );
}
