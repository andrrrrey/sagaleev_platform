import Link from 'next/link';
import type { DraftReview } from '@/server/admin/draft-review';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/utils';

export function DraftReviewPanel({
  review,
  entityId,
  previewHref,
  canPublish,
  published,
  publishAction,
  result,
}: {
  review: DraftReview;
  entityId: string;
  previewHref: string;
  canPublish: boolean;
  published: boolean;
  publishAction: (formData: FormData) => Promise<void>;
  result?: string;
}) {
  return (
    <Panel
      className="mb-6"
      title="Проверка // Перед публикацией"
      status={
        <StatusPill muted={!review.ready}>
          {published ? 'Опубликован' : review.ready ? 'Готов к публикации' : 'Нужно исправить'}
        </StatusPill>
      }
    >
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          {review.issues.map((issue, index) => (
            <div
              key={`${issue.field}-${index}`}
              className="flex items-start gap-2 text-sm text-t700"
            >
              <Icon
                name={issue.level === 'ok' ? 'check-circle-linear' : 'danger-triangle-linear'}
                className={cn(
                  'mt-0.5 shrink-0',
                  issue.level === 'ok'
                    ? 'text-accent'
                    : issue.level === 'warning'
                      ? 'text-t500'
                      : 'text-brand-pink',
                )}
              />
              <span>{issue.message}</span>
            </div>
          ))}
          {result === 'published' ? (
            <p className="pt-2 text-sm font-semibold text-accent">Материал опубликован.</p>
          ) : result === 'failed' ? (
            <p className="pt-2 text-sm font-semibold text-brand-pink">
              Публикация остановлена: исправьте обязательные пункты.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={previewHref} target="_blank" className={buttonClass('secondary')}>
            <Icon name="eye-linear" />
            Предпросмотр
          </Link>
          {canPublish && !published ? (
            <form action={publishAction}>
              <input type="hidden" name="id" value={entityId} />
              <Button type="submit" disabled={!review.ready}>
                <Icon name="check-circle-linear" />
                Опубликовать
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      {!canPublish && !published ? (
        <div className="border-t border-line/60 px-5 py-3 text-xs text-t500">
          После заполнения черновик проверит и опубликует администратор.
        </div>
      ) : null}
    </Panel>
  );
}
