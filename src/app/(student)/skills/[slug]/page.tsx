import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { getSkillBySlug } from '@/server/skills/service';
import { SKILL_GROUP_TITLE } from '@/lib/skill-groups';
import { Kicker } from '@/components/ui/Kicker';
import { Heading } from '@/components/ui/Heading';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { SendToAgentButton } from '@/components/content/SendToAgentButton';
import { SkillFileButton } from '@/components/skills/SkillFileButton';
import { SkillStatusForm } from '@/components/skills/SkillStatusForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActor();
  if (!actor) return { title: 'Скилл' };
  const skill = await getSkillBySlug(actor, slug);
  return { title: skill?.title ?? 'Скилл' };
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-line bg-paper-panel p-4">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-t400">{label}</div>
      <div className="whitespace-pre-line text-sm font-light text-t700">{children}</div>
    </div>
  );
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const { slug } = await params;
  const skill = await getSkillBySlug(actor, slug);
  if (!skill) notFound();

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <nav className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-t400">
        <Link href="/" className="hover:text-accent">
          Кабинет
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <Link href="/skills" className="hover:text-accent">
          Скиллы
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <span className="text-t600">{skill.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Левая колонка */}
        <div className="flex flex-col gap-6">
          <div>
            <Kicker className="mb-4">{SKILL_GROUP_TITLE[skill.group]}</Kicker>
            <Heading as="h1" size="h2">
              {skill.title}
            </Heading>
          </div>

          {skill.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((t) => (
                <Tag key={t.slug}>{t.title}</Tag>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3">
            <Spec label="Что делает">{skill.shortDesc}</Spec>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Spec label="Input // Что на входе">{skill.inputs}</Spec>
              <Spec label="Output // Что на выходе">{skill.outputs}</Spec>
            </div>
            <Spec label="Время освоения">{skill.timeToMaster}</Spec>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="flex flex-col gap-6">
          {skill.locked ? (
            <LockedPanel requiredPlan={skill.requiredPlan ?? 'SUPPORT'} />
          ) : (
            <>
              {skill.demoUnit ? (
                <Panel title="Demo // Реальный кейс">
                  <Link
                    href={`/usecases/${skill.demoUnit.slug}`}
                    className="flex items-center justify-between p-5 transition-colors hover:bg-paper-hover/40"
                  >
                    <span className="flex items-center gap-2 text-sm font-light text-t700">
                      <Icon name="chart-2-linear" className="text-accent" />
                      {skill.demoUnit.title}
                    </span>
                    <Icon name="arrow-right-linear" className="text-t400" />
                  </Link>
                </Panel>
              ) : null}

              <Panel title="Действия // Агент">
                <div className="flex flex-col gap-4 p-5">
                  {skill.prompt ? (
                    <SendToAgentButton
                      prompt={skill.prompt}
                      sendUrl={`/api/skills/${skill.slug}/send-to-agent`}
                    />
                  ) : null}
                  {skill.hasFile ? <SkillFileButton slug={skill.slug} fileName={skill.fileName} /> : null}
                </div>
              </Panel>

              <Panel
                title="Мой статус // Прогресс"
                status={skill.status !== 'NONE' ? <StatusPill>{skill.status}</StatusPill> : undefined}
              >
                <div className="p-5">
                  <SkillStatusForm slug={skill.slug} current={skill.status} proofNote={skill.proofNote} />
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>

      {/* Связанное */}
      {!skill.locked && ((skill.related?.length ?? 0) > 0 || (skill.usedInSteps?.length ?? 0) > 0) ? (
        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-line/60 pt-8 lg:grid-cols-2">
          {skill.related && skill.related.length > 0 ? (
            <div>
              <div className="mb-4 font-mono text-xs uppercase tracking-widest text-t500">
                Связанные скиллы
              </div>
              <div className="flex flex-col gap-2">
                {skill.related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/skills/${r.slug}`}
                    className="flex items-center justify-between border border-line bg-surface px-4 py-2.5 text-sm font-light text-t700 transition-colors hover:border-accent/30"
                  >
                    {r.title}
                    <Icon name="arrow-right-linear" className="text-t400" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {skill.usedInSteps && skill.usedInSteps.length > 0 ? (
            <div>
              <div className="mb-4 font-mono text-xs uppercase tracking-widest text-t500">
                Где применяется
              </div>
              <div className="flex flex-col gap-2">
                {skill.usedInSteps.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border border-line bg-surface px-4 py-2.5 text-sm font-light text-t700"
                  >
                    <Icon name="routing-linear" className="text-accent" />
                    День {u.dayNumber}: {u.title}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
