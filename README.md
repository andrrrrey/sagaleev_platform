# Цифровой отдел маркетинга — платформа (Фаза 1)

Закрытый портал для собственников микробизнеса: обучающий курс + рабочая среда, где студент собирает своего маркетингового ИИ-агента. ТЗ и дизайн-система — в `docs/` и `CLAUDE.md`.

**Ключевой принцип:** прогресс = что студент реально внедрил в бизнесе, а не сколько видео посмотрел.

## Стек

Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · Tailwind (токены из `docs/02`) · Prisma 6 + PostgreSQL 16 · Auth.js v5 (Credentials, argon2id) · Vitest + Playwright. Стиль строго 1:1 с `docs/reference/docuframe-hero.html`.

## Быстрый старт

```bash
pnpm install
cp .env.example .env          # заполните секреты (см. ниже)
pnpm db:up                    # docker compose: postgres на :5432
pnpm db:migrate               # prisma migrate dev (создаст схему)
pnpm db:seed                  # тарифы, admin, editor, 3 демо-студента, теги
pnpm dev                      # http://localhost:3000
```

Проверки качества:

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e                 # playwright (нужен запущенный dev или CI)
pnpm build                    # продакшн-сборка (standalone)
pnpm build:icons             # пересобрать офлайн-набор иконок Solar
```

## Переменные окружения

Все переменные валидируются `src/lib/env.ts` (zod) при старте — приложение падает с понятной ошибкой при неполной конфигурации. Полный список — в `.env.example`. Ключевые:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Postgres (РФ-контур) |
| `AUTH_SECRET` | секрет сессий Auth.js (`openssl rand -base64 32`) |
| `PAYMENT_PROVIDER` | `yookassa` (бой) или `mock` (dev/test, в production запрещён) |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | ЮKassa (sandbox для разработки) |
| `NEXT_PUBLIC_BRAND_NAME`, `APP_URL` | бренд и адрес |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`, `EDITOR_EMAIL` / `EDITOR_PASSWORD` | учётки для сида (dev/staging) |

Секреты — только через окружение, в код не попадают.

## Что готово в Этапе 1

- **Каркас проекта:** Next.js + TS strict, Tailwind с токенами эталона, офлайн-иконки Solar, ESLint/Prettier, Vitest/Playwright, Docker Compose (postgres), CI (`.github/workflows/ci.yml`).
- **Визуальный каркас 1:1:** `AppFrame`, `CornerBrackets`, `Nav`/`MobileNav`/`AdminNav`, `TickBorder`, `Crosshair`, `Panel`, `Button` (5 вариантов), `StatusPill`, `LinedBlock`, `Kicker`, `Heading` (masked reveal), `Tag`, формы, `Tabs`, `Table`, `Modal`, `Toast`, `ProgressBar`, `LockedPanel`, `useMaskedReveal`. Витрина: `/dev/ui` (только dev).
- **Данные:** Prisma-схема (`docs/03`), сиды (Plan/admin/editor/демо-студенты/теги/легал-черновики).
- **Гейтинг на сервере:** `assertAccess`/`canAccess`/`redactLocked`, матрица тарифов, политика ролей. Тесты из `docs/05 §2` — зелёные.
- **Auth:** регистрация с согласием ПДн, подтверждение email, вход, восстановление пароля, rate limits.
- **Оплата:** `PaymentProvider` + `YookassaProvider` + `MockProvider`, `/pay`, `/pay/result` (polling), webhook с идемпотентной активацией `Enrollment`, апгрейд с доплатой разницы.
- **Экраны:** `/login`, `/register`, `/forgot`, `/reset/[token]`, `/legal/[kind]`, `/onboarding`, `/` (каркас), `/profile` (4 вкладки), админ-каркас (обзор, студенты, оплаты, тарифы, пользователи), `/api/health`.

Разделы Юзкейсы/Уроки/Эфиры/Лидерборд — заглушки со стилем, наполняются на Этапах 3–4.

## Что готово в Этапе 2

- **Маршрут «Агент за 3 дня»** (`/route`, `/route/[day]`): 3 дня, чек-лист шагов (аккордеон), копируемые команды/промпты (`CopyButton`), фиксация артефактов (`RouteStepProgress`), навигация по дням, экран «День пройден».
- **Библиотека скиллов** (`/skills`): группировка по 5 функциям, серверный поиск (`ILIKE`), фильтры по тегам, «Только доступные»/«Внедрено»/«Не начато», состояние в URL (`?q=&group=&tags=&available=&status=`), превью с замком для закрытых.
- **Карточка скилла** (`/skills/[slug]`): спецификации (что делает/вход/выход/время), «Отправить агенту» (раскрывает промпт + копирует + ставит `VIEWED` один раз), скачивание файла (presigned URL, TTL 5 мин; 403 для закрытых), блок «Мой статус» (Сдал/Внедрил/Результат с proof), связанные скиллы и «где применяется».
- **Гейтинг S3/S4:** превью без `prompt`/`fileKey`/`demoVideoId`; прямой запрос файла закрытого скилла → 403 (`redactLocked` + `assertAccess`).
- **Хранилище:** SigV4 presigner для S3-совместимого хранилища (Yandex/Selectel), включается при заданном `S3_*`.
- **Админка:** A4 скиллы (список + форма создания/редактирования, теги, `minPlan`, статус), A5 маршрут (редактор дней и шагов), A7 теги (CRUD); все мутации пишут `AuditLog`.
- **Сиды:** маршрут 3 дня со связанными скиллами, 12 демо-скиллов (5 `minPlan=SELF`).

## Приёмка (демо-сценарий Этапа 1)

С `PAYMENT_PROVIDER=mock`:

1. `/register` → согласие ПДн + оферта → в dev показывается ссылка подтверждения email → переход по ней → `/login`.
2. Вход → редирект на `/pay` (нет активного тарифа).
3. Выбор SELF → mock-оплата мгновенно подтверждается webhook’ом → `/pay/result` показывает «Доступ открыт».
4. `/onboarding` (4 шага) → Главная (каркас).
5. Апгрейд `/pay` → SUPPORT списывает ровно разницу (100 000 ₽); после webhook тариф меняется.
6. Повторный webhook не создаёт дублей (проверяется идемпотентностью по `providerPaymentId`).
7. Прямой запрос закрытого ресурса без тарифа → 402/403, поля контента отсутствуют (тесты `tests/access`).
8. ADMIN и EDITOR входят в `/admin`; EDITOR не видит оплат и ПДн (пункты меню скрыты, страницы редиректят).

Демо-учётки после сида (dev/staging): `admin@example.ru` / `editor@example.ru` (пароли из env), студенты `student-self|support|vip@example.ru` с паролем `demo-password-123`.

## Деплой

Docker Compose на VPS в РФ: `app` (образ `docker/Dockerfile`, standalone), `worker` (Этап 4), `postgres`, `caddy` (TLS, `docker/Caddyfile`). Миграции — `prisma migrate deploy` отдельным шагом. `/api/health` для проверки живости.

## Документация

`CLAUDE.md` · `docs/00-overview.md` · `01-stack-architecture.md` · `02-design-system.md` · `03-data-model.md` · `04-screens.md` · `05-api-and-gating.md` · `06-stages-and-acceptance.md` · `docs/reference/docuframe-hero.html`.
