import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Инструкция' };

function Q({ children }: { children: React.ReactNode }) {
  return <li className="text-sm font-light leading-relaxed text-t700">{children}</li>;
}

export default function StudentHelpPage() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Инструкция"
        title="Как проходить обучение"
        description="Коротко: смотрите, внедряете, отмечаете результат. Прогресс = внедрённое в бизнесе."
      />

      <div className="flex flex-col gap-6">
        <Panel title="Главное // Как устроен кабинет">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              Это не просто курс, а рабочая среда: вы собираете своего маркетингового ИИ-агента и
              внедряете инструменты в свой бизнес. Ваш прогресс считается по тому, что вы{' '}
              <b>реально сделали</b>, а не по числу просмотренных видео.
            </p>
          </div>
        </Panel>

        <Panel title="Порядок работы // Шаг за шагом">
          <ul className="flex list-decimal flex-col gap-2 p-6 pl-10">
            <Q>
              <b>Маршрут «3 дня»</b> — стартовый путь: пройдите дни и шаги, чтобы собрать базового
              агента, который знает ваш бизнес.
            </Q>
            <Q>
              <b>Скиллы</b> — навыки для агента (стратегия, трафик, контент, удержание,
              инфраструктура). Забирайте промпты и файлы, применяйте у себя.
            </Q>
            <Q>
              <b>Юзкейсы</b> — готовые сценарии «как сделать X». <b>Уроки</b> — теория и разборы.{' '}
              <b>Эфиры</b> — записи Zoom-разборов.
            </Q>
            <Q>
              Часть контента открывается по тарифу. Если видите замок — материал доступен на более
              высоком тарифе.
            </Q>
          </ul>
        </Panel>

        <Panel title="Прогресс и статусы // Отмечайте внедрения">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>По каждому элементу отмечайте честный статус:</p>
            <ul className="flex list-disc flex-col gap-1 pl-6">
              <Q>
                <b>Посмотрел</b> → <b>Отправил</b> (сделал задание) → <b>Внедрил</b> → <b>Есть
                результат</b>.
              </Q>
              <Q>
                Для статуса «Есть результат» добавьте запись в «Движение по деньгам» — так виден
                реальный эффект.
              </Q>
            </ul>
            <p className="text-t600">Чем честнее статусы — тем полезнее разбор куратора и место в лидерборде.</p>
          </div>
        </Panel>

        <Panel title="Агент-куратор // Ваш ИИ-наставник">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              На тарифах SUPPORT и VIP раз в неделю ИИ-куратор смотрит, что вы внедрили, и присылает
              короткий разбор + 1–2 конкретных шага на следующую неделю. Он читает только учебные
              данные и ваш бизнес-профиль — не переписку и не контакты.
            </p>
            <p className="text-t600">Чтобы разбор был точнее — заполняйте еженедельный отчёт.</p>
            <Link
              href="/profile/curator"
              className="mt-1 inline-flex items-center gap-2 font-mono text-[11px] text-accent hover:underline"
            >
              Открыть куратора <Icon name="arrow-right-linear" />
            </Link>
          </div>
        </Panel>

        <Panel title="Профиль // Уведомления и доступ">
          <ul className="flex list-disc flex-col gap-2 p-6 pl-10">
            <Q>
              В профиле заполните <b>бизнес-профиль</b> — он нужен агенту и куратору, чтобы советы были
              под ваш бизнес.
            </Q>
            <Q>
              Привяжите <b>Telegram</b>, чтобы получать уведомления о разборах и новом контенте.
            </Q>
            <Q>Забыли пароль — восстановите его на странице входа. Ключи от ваших внешних сервисов платформа не хранит.</Q>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
