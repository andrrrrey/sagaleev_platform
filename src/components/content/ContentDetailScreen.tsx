import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { UnitType } from '@prisma/client';
import { getActor } from '@/server/auth/session';
import { getContentBySlug } from '@/server/content/service';
import { Kicker } from '@/components/ui/Kicker';
import { Heading } from '@/components/ui/Heading';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { ContentUnit } from './ContentUnit';

const SECTION: Record<UnitType, { label: string; base: string; kicker: string }> = {
  LESSON: { label: 'Уроки', base: '/lessons', kicker: 'Урок' },
  USECASE: { label: 'Юзкейсы', base: '/usecases', kicker: 'Юзкейс' },
  STREAM: { label: 'Эфиры', base: '/streams', kicker: 'Эфир' },
};

export async function ContentDetailScreen({
  slug,
  expectedType,
  initialTab,
  initialT,
}: {
  slug: string;
  expectedType: UnitType;
  initialTab?: string;
  initialT?: number;
}) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const detail = await getContentBySlug(actor, slug);
  if (!detail || detail.type !== expectedType) notFound();

  const s = SECTION[detail.type];
  const kicker = detail.block ? `${s.kicker} · Блок ${detail.block}` : s.kicker;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-t400">
        <Link href="/" className="hover:text-accent">
          Кабинет
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <Link href={s.base} className="hover:text-accent">
          {s.label}
        </Link>
        <Icon name="alt-arrow-right-linear" />
        <span className="text-t600">{detail.title}</span>
      </nav>

      <div className="mb-8 max-w-3xl">
        <Kicker className="mb-4">{kicker}</Kicker>
        <Heading as="h1" size="h2">
          {detail.title}
        </Heading>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {detail.methodTag ? <Tag active>{detail.methodTag}</Tag> : null}
          {detail.tags.map((t) => (
            <Tag key={t.slug}>{t.title}</Tag>
          ))}
          {detail.timeToMaster ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-t500">
              <Icon name="clock-circle-linear" className="text-xs" />
              {detail.timeToMaster}
            </span>
          ) : null}
        </div>
        {detail.summary ? (
          <p className="mt-4 text-base font-light leading-relaxed text-t600">{detail.summary}</p>
        ) : null}
      </div>

      {detail.locked ? (
        <div className="max-w-xl">
          <LockedPanel requiredPlan={detail.requiredPlan ?? 'SUPPORT'} />
        </div>
      ) : (
        <ContentUnit detail={detail} initialTab={initialTab} initialT={initialT} />
      )}
    </div>
  );
}
