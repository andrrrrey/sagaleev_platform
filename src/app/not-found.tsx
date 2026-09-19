import Link from 'next/link';
import { AppFrame } from '@/components/frame/AppFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <AppFrame topLabel="sys_404_01">
      <div className="px-6 py-12 md:px-10 md:py-20">
        <PageHeader kicker="Error // 404" title="Страница не найдена" />
        <div className="max-w-xl">
          <EmptyState
            label="404"
            action={
              <Link href="/" className={buttonClass('primary')}>
                <Icon name="home-smile-linear" />
                На главную
              </Link>
            }
          >
            Такой страницы нет или доступ к ней закрыт.
          </EmptyState>
        </div>
      </div>
    </AppFrame>
  );
}
