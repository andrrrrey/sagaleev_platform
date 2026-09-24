import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/server/access/guard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Админ — инструкция' };

function Q({ children }: { children: React.ReactNode }) {
  return <li className="text-sm font-light leading-relaxed text-t700">{children}</li>;
}

export default async function AdminHelpPage() {
  const me = await requireRole(['ADMIN', 'EDITOR']);
  const isAdmin = me.role === 'ADMIN';

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <PageHeader
        kicker="Инструкция"
        title="Как работать с платформой"
        description={`Ваша роль: ${me.role}. Ниже — что вы можете и как это делается.`}
      />

      <div className="flex flex-col gap-6">
        <Panel title="О продукте // Главный принцип">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              «Цифровой отдел маркетинга» — закрытый портал: обучающий курс + рабочая среда, где
              студент собирает своего маркетингового ИИ-агента.
            </p>
            <p className="text-t600">
              <b>Ключевой принцип:</b> прогресс студента считается по тому, что он{' '}
              <b>реально внедрил</b> в бизнесе (отметки «внедрил / есть результат», движение по
              деньгам), а не по числу просмотренных видео. Держите это в голове при наполнении
              контента и оценке потока.
            </p>
          </div>
        </Panel>

        <Panel title="Роли // Кто что может">
          <div className="flex flex-col gap-3 p-6 text-sm font-light leading-relaxed text-t700">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent">ADMIN</span>
              <p>
                Полный доступ: пользователи и роли, тарифы и оплаты, поток и лидерборд, куратор,
                настройки и API-ключи, а также весь контент.
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-t500">EDITOR</span>
              <p>
                Ведёт контент: скиллы, маршрут, уроки/юзкейсы/эфиры, теги, баннеры. Не видит оплаты и
                персональные данные студентов (152-ФЗ).
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-t500">STUDENT</span>
              <p>Ученик: проходит маршрут, собирает агента, отмечает внедрения. Инструкция для него — на странице «Инструкция» в кабинете.</p>
            </div>
          </div>
        </Panel>

        {isAdmin ? (
          <Panel title="Для администратора // Пошагово">
            <ul className="flex list-disc flex-col gap-2 p-6 pl-10">
              <Q>
                <b>Пользователи</b> (раздел «Пользователи»): создавайте сотрудников (ADMIN/EDITOR) и
                при необходимости студентов, меняйте пароли, блокируйте доступ. Блокировка мгновенно
                закрывает вход.
              </Q>
              <Q>
                <b>Студенты</b>: карточка студента — прогресс, деньги, платежи. Там же ручная выдача
                тарифа (с причиной в аудит-лог), смена пароля и блокировка конкретного студента.
              </Q>
              <Q>
                <b>Тарифы и оплаты</b>: справочник тарифов и история платежей. Доступ к контенту
                гейтится тарифом на сервере — UI лишь отражает решение.
              </Q>
              <Q>
                <b>Агент-куратор</b>: включение, ручной запуск разбора и логи. Что это — см. блок
                ниже.
              </Q>
              <Q>
                <b>Настройки → Интеграции / API-ключи</b>: все ключи (Anthropic, Kinescope, Telegram,
                ЮKassa, S3, SMTP) вводятся здесь. Значение из формы имеет приоритет над{' '}
                <span className="font-mono text-xs">.env</span>. Секреты хранятся маскированными.
              </Q>
              <Q>
                <b>Поток</b> и <b>Лидерборд</b>: сводка по когорте; лидерборд можно пересчитать
                вручную в «Настройках».
              </Q>
            </ul>
          </Panel>
        ) : null}

        <Panel title="Для редактора // Контент">
          <ul className="flex list-disc flex-col gap-2 p-6 pl-10">
            <Q>
              <b>Единый контент-юнит.</b> Уроки, юзкейсы и эфиры — это один тип контента с разным
              «типом» (LESSON / USECASE / STREAM). Создаются и редактируются одной формой в разделе
              «Контент».
            </Q>
            <Q>
              <b>Статусы публикации:</b> DRAFT (черновик, не виден студентам) → PUBLISHED (виден по
              тарифу) → ARCHIVED. Проверяйте тип, теги и порядок сортировки.
            </Q>
            <Q>
              <b>Скиллы</b> — блоки-навыки для сборки агента (стратегия, трафик, контент, удержание,
              инфраструктура). У скилла может быть прикреплённый файл.
            </Q>
            <Q>
              <b>Маршрут «3 дня»</b> — дни и шаги (как на экране редактора). Артефакт дня — то, что
              студент получает на выходе.
            </Q>
            <Q>
              <b>Теги</b> и <b>Баннеры</b> — навигация по контенту и промо на главной.
            </Q>
            <Q>
              <b>Дизайн 1:1.</b> Не добавляйте свои цвета, тени и скругления — используйте
              существующие поля и токены платформы.
            </Q>
          </ul>
        </Panel>

        <Panel title="Агент-куратор // Что это">
          <div className="flex flex-col gap-2 p-6 text-sm font-light leading-relaxed text-t700">
            <p>
              Встроенный ИИ-наставник (на модели Claude). Раз в неделю анализирует, что студент
              реально внедрил, и выдаёт короткий разбор + 1–2 шага на неделю. Включён для всех
              студентов с активной единой подпиской.
            </p>
            <p className="text-t600">
              Приватность (152-ФЗ): читает только учебные данные и бизнес-профиль, не видит переписку,
              контакты и платежи. Ключ и системный промпт — в «Настройках».
            </p>
            {isAdmin ? (
              <Link
                href="/admin/curator"
                className="mt-1 inline-flex items-center gap-2 font-mono text-[11px] text-accent hover:underline"
              >
                Перейти к куратору <Icon name="arrow-right-linear" />
              </Link>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
