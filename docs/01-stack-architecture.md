# 01. Стек и архитектура

## 1. Стек

| Слой | Выбор | Почему |
|---|---|---|
| Фреймворк | **Next.js 15** (App Router, RSC, Server Actions), TypeScript strict | Один репо, фронт + API, быстро для соло-разработки |
| Рантайм | Node.js 22 LTS, pnpm | |
| БД | **PostgreSQL 16** | Реляционная модель, JSONB для таймкодов/шагов |
| ORM | **Prisma 6** | Типобезопасность, миграции |
| Auth | **Auth.js v5** (Credentials: email + пароль, argon2id; magic-link по email как опция) | Без внешних сервисов, данные в РФ |
| Стили | **Tailwind CSS 3.4** с конфигом токенов из `02-design-system.md` | В эталоне Tailwind. Сохраняем те же утилиты |
| Иконки | `iconify-icon` + набор **Solar Linear** (`solar:*-linear`) | Как в эталоне |
| Анимации | **GSAP 3.12** + ScrollTrigger (masked reveal заголовков) | Как в эталоне |
| Шрифты | Inter 300/400, JetBrains Mono 400 через `next/font/google` (self-host при сборке) | Как в эталоне |
| Формы/валидация | react-hook-form + **zod** (общие схемы клиент/сервер) | |
| Редактор текста в админке | **TipTap** (StarterKit + Link + Table minimal), хранение как JSON + отрендеренный HTML | Для «Статья», «Описание» юзкейса |
| Видео | **Kinescope** iframe-embed + Player API (postMessage) для seek по таймкодам | Требование ТЗ |
| Оплата | Интерфейс `PaymentProvider`, реализация **ЮKassa** (webhook-подтверждение) | См. `05` |
| Telegram | Bot API (grammY), webhook-режим | Уведомления и привязка аккаунта |
| LLM (куратор) | Anthropic API (Claude Sonnet), один вызов раз в неделю на студента | Разовый вызов, не агентный цикл |
| Очереди/cron | **pg-boss** (очередь на Postgres) + один worker-процесс | Без Redis, меньше инфры |
| Почта | SMTP (Unisender/Yandex 360) через nodemailer | РФ-контур |
| Файлы | S3-совместимое хранилище (Yandex Object Storage / Selectel), presigned URLs | Файлы скиллов, баннеры |
| Тесты | Vitest (unit), Playwright (e2e) | |
| Качество | ESLint, Prettier, `tsc --noEmit`, husky + lint-staged | |
| Деплой | Docker Compose на VPS в РФ (Selectel / Yandex Cloud / Timeweb): `app`, `worker`, `postgres`, `caddy` (TLS) | 152-ФЗ |
| Мониторинг | Sentry (self-hosted или EU), pino-логи, `/api/health` | |

Регистрация доступа к Claude Code у студента идёт мимо платформы: платформа только выдаёт промпты.

## 2. Структура репозитория

```
/
├─ CLAUDE.md
├─ docs/                     # это ТЗ
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (public)/           # /login, /register, /pay/*, /forgot
│  │  ├─ (student)/          # оболочка со студенческой навигацией
│  │  │  ├─ page.tsx         # Главная
│  │  │  ├─ route/           # Маршрут «3 дня»
│  │  │  ├─ skills/
│  │  │  ├─ lessons/
│  │  │  ├─ usecases/
│  │  │  ├─ streams/         # Эфиры (URL /streams)
│  │  │  ├─ leaderboard/
│  │  │  └─ profile/
│  │  ├─ admin/              # ADMIN + EDITOR
│  │  └─ api/                # webhooks, health, uploads, kinescope token
│  ├─ components/
│  │  ├─ frame/              # AppFrame, CornerBrackets, TickBorder, Crosshair
│  │  ├─ ui/                 # Button, Input, Tag, Panel, Tabs, Table, ...
│  │  └─ content/            # ContentUnit, VideoPlayer, Timecodes, PromptBlock, StepList, KpiBlock
│  ├─ server/
│  │  ├─ auth/               # Auth.js config, session helpers
│  │  ├─ access/             # assertAccess, plan matrix, policies
│  │  ├─ payments/           # PaymentProvider, yookassa adapter
│  │  ├─ progress/           # scoring, leaderboard
│  │  ├─ curator/            # weekly job, prompt builder
│  │  ├─ telegram/
│  │  └─ jobs/               # pg-boss workers
│  ├─ lib/                   # zod-схемы, utils, env.ts (валидация env)
│  └─ styles/globals.css
├─ tests/                    # unit + e2e
├─ docker/                   # Dockerfile, compose, Caddyfile
└─ .env.example
```

## 3. Ключевые архитектурные решения

### 3.1 Server-first
Страницы студента это React Server Components, данные тянутся прямо из сервисного слоя (`src/server/*`). Мутации это Server Actions или route handlers. Клиентские компоненты только там, где нужна интерактивность (плеер, чек-лист, табы, копирование, формы).

### 3.2 Сервисный слой
Роуты не ходят в Prisma напрямую. Бизнес-логика живёт в `src/server/<домен>`. Каждая публичная функция сервиса принимает `actor` (текущего пользователя) и внутри вызывает `assertAccess`.

### 3.3 Гейтинг
Единая точка: `assertAccess(actor, resource)` и `canAccess(actor, resource)`. Ресурс: `{ kind, minPlan, partial? }`. Поведение:

- нет сессии: 401;
- роль `ADMIN`/`EDITOR`: полный доступ к контенту;
- студент без оплаченного `Enrollment` (status `ACTIVE`): 402 (для UI редирект на `/pay`);
- тариф ниже `minPlan`: 403 с кодом `PLAN_REQUIRED` и `requiredPlan` (UI показывает замок и CTA на апгрейд).

Для списков сервис возвращает **превью закрытых карточек** (заголовок, теги, `locked: true`), но не `videoId`, `prompt`, `fileUrl`, `transcript`, `steps`. Это правило проверяется тестом.

### 3.4 Единый контент-юнит
Таблица `ContentUnit` с `type`: `LESSON | USECASE | STREAM`. Общие поля (видео, таймкоды, промпт, теги, minPlan) плюс расширения в JSONB (`kpi`, `steps`, `article`, `transcript`). Один компонент `<ContentUnit unit={...} />` рендерит по набору доступных секций. Одна форма в админке.

### 3.5 Прогресс
`Progress` хранит состояние на пару (user, unit/skill/routeStep). Очки лидерборда считаются из `Progress`, лидерборд материализуется в таблицу `LeaderboardEntry` пересчётом при событии (транзакционно) + ночной пересчёт.

### 3.6 Идемпотентность и надёжность платежей
Платёж создаётся записью `Payment` (status `PENDING`), подтверждение приходит webhook’ом с проверкой подписи/IP и перепроверкой статуса запросом к провайдеру. Обработка идемпотентна по `providerPaymentId`. Активация `Enrollment` происходит только в webhook-обработчике, не по редиректу пользователя.

## 4. Безопасность и приватность

- Пароли argon2id; rate-limit на login/register/forgot (по IP + email), lockout после N ошибок.
- CSRF: Server Actions защищены Next.js, для route handlers c cookie-сессией проверка `Origin`.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Заголовки: CSP (разрешить `kinescope.io`, `code.iconify.design` только если не self-host; предпочтительно self-host иконок), HSTS, `X-Frame-Options: DENY` для всего, кроме нужного.
- Kinescope: приватные видео, домен-ограничение на стороне Kinescope. `videoId` отдаётся только авторизованному.
- Файлы скиллов: только через presigned URL с TTL 5 минут после проверки доступа.
- 152-ФЗ: чекбокс согласия на обработку ПДн при регистрации (сохраняем `consentAt`, `consentVersion`), страница политики, хранение в РФ-контуре, возможность удаления аккаунта запросом.
- Куратор получает только: чек-лист недели, статусы Progress, поле «что сделал за неделю», бизнес-профиль (без контактов). Никаких email/телефонов в промпте.
- Аудит-лог админских действий (`AuditLog`): смена тарифа вручную, изменение ролей, удаление контента.

## 5. Переменные окружения (`.env.example`)

```
APP_URL=
NEXT_PUBLIC_BRAND_NAME="Цифровой отдел маркетинга"
DATABASE_URL=
AUTH_SECRET=
PAYMENT_PROVIDER=yookassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
KINESCOPE_API_KEY=
S3_ENDPOINT= S3_REGION= S3_BUCKET= S3_ACCESS_KEY= S3_SECRET_KEY=
SMTP_URL= MAIL_FROM=
TELEGRAM_BOT_TOKEN= TELEGRAM_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
CURATOR_ENABLED=true
SENTRY_DSN=
```

`src/lib/env.ts` валидирует их zod-схемой при старте, приложение падает с понятной ошибкой.

## 6. Наблюдаемость и эксплуатация

- `/api/health` (БД + очередь).
- Ежедневный `pg_dump` в S3, хранение 14 дней.
- Миграции применяются при деплое (`prisma migrate deploy`) отдельным шагом.
- GitHub Actions: lint, typecheck, unit, e2e на PR; деплой по тегу через SSH + `docker compose pull && up -d`.
