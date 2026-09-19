# 05. API, гейтинг, оплата, интеграции

## 1. Матрица доступа (тариф × раздел)

Источник истины в коде: `src/server/access/matrix.ts`. Значения ресурсам присваиваются через поля `minPlan` и флаги в БД, матрица ниже описывает поведение по умолчанию.

| Раздел / возможность | SELF 100к | SUPPORT 200к | VIP 400к | Реализация |
|---|---|---|---|---|
| Маршрут 3 дня | да | да | да | без `minPlan` |
| Базовый набор скиллов | да | да | да | `Skill.minPlan = SELF` |
| Вся библиотека скиллов | нет | да | да | `Skill.minPlan = SUPPORT` |
| Уроки (10 блоков) | да | да | да | `ContentUnit.minPlan = SELF` |
| Юзкейсы | да | да | да | `ContentUnit.minPlan = SELF` |
| Эфиры (архив) | частично | да | да | `STREAM`: `minPlan = SUPPORT`, кроме `partialFreePreview = true` (SELF) |
| Разбор агента куратором | нет | да | да | фича `CURATOR` требует уровень ≥ 2 |
| Еженедельные Zoom-разборы | нет | да | да | ссылка на Zoom и «ближайший эфир» уровень ≥ 2 |
| Внедрение скиллов под ключ | нет | нет | да | информационный пункт тарифа (не функция портала), ручной процесс |
| Ф2: абонентка 5000 ₽/мес | после потока | | | не реализуется |

Уровень тарифа: SELF=1, SUPPORT=2, VIP=3. Правило: доступ есть, если `level(userPlan) >= level(resource.minPlan)`.

Дополнительно:
- Enrollment должен быть `ACTIVE` и не истёкшим (`expiresAt` null или в будущем). Иначе доступ закрыт (кроме профиля и оплаты).
- ADMIN и EDITOR обходят гейтинг для чтения контента.
- Черновики (`state != PUBLISHED`) видят только ADMIN/EDITOR.

## 2. Сервис доступа

```ts
// src/server/access/index.ts
type Actor = { id: string; role: Role; plan?: PlanCode; enrollmentActive: boolean };
type Resource =
  | { kind: 'skill' | 'unit'; minPlan: PlanCode; partialFree?: boolean }
  | { kind: 'feature'; feature: 'CURATOR' | 'ZOOM' };

export function canAccess(actor: Actor | null, res: Resource): Decision   // { ok:true } | { ok:false, code:'UNAUTHENTICATED'|'PAYMENT_REQUIRED'|'PLAN_REQUIRED', requiredPlan?: PlanCode }
export function assertAccess(actor: Actor | null, res: Resource): asserts …  // бросает HttpError 401/402/403
export function redactLocked<T>(entity: T, decision: Decision): T           // вырезает videoId, prompt, fileKey, transcript, steps, article, kpis…
```

**Контракт ответа для закрытых ресурсов:** списки возвращают превью (`title`, `summary`, `tags`, `timeToMaster`, `group`, `locked: true`, `requiredPlan`). Карточка закрытого ресурса возвращает 200 c превью и `locked: true`, а не полный объект. Поля, которые **никогда** не должны уходить без доступа: `kinescopeId`, `prompt`, `steps`, `article`, `transcript`, `fileKey`/`fileUrl`, `commands` (шаги маршрута для EXPIRED всё равно read-only).

Обязательные тесты (`tests/access/*.test.ts`):
1. SELF запрашивает скилл `SUPPORT`: в ответе нет `prompt`/`fileKey`, `locked=true`.
2. SELF запрашивает файл скилла `SUPPORT` напрямую: 403.
3. Пользователь без Enrollment: 402 на любой контент.
4. Апгрейд до SUPPORT: доступ открывается сразу после webhook.
5. Неопубликованный юнит: 404 для студента.
6. EDITOR не может читать платежи и ПДн студентов (403).

## 3. Аутентификация

- Auth.js v5, JWT-сессия или database-сессия (выбрать database для возможности принудительного выхода). Cookie `HttpOnly`.
- В сессию кладём `userId`, `role`; `plan` и `enrollmentActive` загружаются на сервере (кэш 30 секунд) для актуальности после оплаты.
- Middleware (`src/middleware.ts`): защита групп `(student)` и `admin`; редирект по шагам (`/pay`, `/onboarding`).
- Email-верификация обязательна до оплаты.

## 4. Оплата

### 4.1 Интерфейс провайдера

```ts
// src/server/payments/provider.ts
export interface PaymentProvider {
  createPayment(input: {
    amountKopeks: number; description: string; returnUrl: string;
    idempotenceKey: string; metadata: { paymentId: string; userId: string };
    receipt?: { customerEmail: string; items: ReceiptItem[] };   // чек 54-ФЗ
  }): Promise<{ providerPaymentId: string; confirmationUrl: string }>;

  getPayment(providerPaymentId: string): Promise<{ status: 'pending'|'succeeded'|'canceled'; paid: boolean; raw: unknown }>;

  verifyWebhook(req: Request): Promise<{ ok: boolean; providerPaymentId?: string }>;   // подпись/IP-allowlist
}
```

Реализации: `YookassaProvider` (по умолчанию). `CloudPaymentsProvider`, `ProdamusProvider` добавляются позже одним файлом; выбор через `PAYMENT_PROVIDER`. Для тестов `MockProvider` (мгновенное подтверждение) активен только в dev/test.

### 4.2 Процесс покупки и апгрейда

1. `POST /api/payments` `{ planCode }`: сервер определяет `kind` (нет Enrollment → `PURCHASE`, есть → `UPGRADE`), считает сумму (`price(target) − price(current)`; для апгрейда только вверх), создаёт `Payment(PENDING)` с `idempotenceKey`, вызывает провайдера, возвращает `confirmationUrl`.
2. Пользователь платит у провайдера, возвращается на `/pay/result`.
3. `POST /api/webhooks/payment`: проверка подлинности → повторный `getPayment` → в транзакции: `Payment.status=SUCCEEDED`, `paidAt`, затем `PURCHASE` создаёт/активирует `Enrollment` (`ACTIVE`, `activatedAt`), `UPGRADE` меняет `planCode`; письмо-чек, `Notification`, `AuditLog`. Идемпотентно по `providerPaymentId`.
4. `GET /api/payments/[id]` отдаёт статус для polling.
5. Отмена/ошибка: `Payment.status=CANCELED|FAILED`, доступ не меняется.
6. Чеки по 54-ФЗ: передавать `receipt` (email покупателя, позиция «Доступ к обучающей платформе», НДС по настройке). Параметры налогообложения в env/настройках.
7. Возвраты: вручную в кабинете провайдера; админ помечает платёж и закрывает Enrollment (`REFUNDED`), либо webhook `refund.succeeded`.

Граничные случаи: двойной клик (идемпотентность), повторный webhook, оплата после отмены пользователем, параллельный апгрейд (блокировка по пользователю `SELECT … FOR UPDATE`), смена цены между созданием и оплатой (сумма фиксируется в `Payment`).

## 5. REST/Server Actions: перечень

Префикс `/api`. Формат ошибок: `{ error: { code, message, requiredPlan? } }`. Валидация zod. Server Actions допустимы вместо route handlers для форм; ниже контракт функциональности.

### Auth / профиль
| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| POST | `/auth/register` | Регистрация + согласие ПДн | 🅿 |
| POST | `/auth/verify-email` | Подтверждение email | 🅿 |
| POST | `/auth/forgot`, `/auth/reset` | Восстановление | 🅿 |
| GET/PATCH | `/me` | Профиль | 🎓 |
| GET/PUT | `/me/business-profile` | Бизнес-профиль | 🎓 |
| GET | `/me/business-profile/export` | Markdown для агента | 🎓 |
| POST | `/me/avatar` | Presigned upload | 🎓 |
| DELETE | `/me` | Запрос на удаление/анонимизацию | 🎓 |

### Оплата
| POST | `/payments` | Создать платёж (покупка/апгрейд) | активный аккаунт |
| GET | `/payments/[id]` | Статус | владелец |
| GET | `/me/payments` | История | 🎓 |
| POST | `/webhooks/payment` | Webhook провайдера | подпись |

### Маршрут
| GET | `/route` | Дни, шаги, мой прогресс | 🎓 (активный) |
| PUT | `/route/steps/[id]/progress` | `{ done, artifactNote?, artifactUrl? }` | 🎓 |

### Скиллы
| GET | `/skills?q&group&tags&availableOnly&status` | Список (превью для закрытых) | 🎓 |
| GET | `/skills/[slug]` | Карточка (redact при locked) | 🎓 |
| POST | `/skills/[slug]/send-to-agent` | Событие + `VIEWED` | 🎓 + доступ |
| GET | `/skills/[slug]/file` | Presigned URL (TTL 5 мин) | 🎓 + доступ |
| PUT | `/skills/[slug]/progress` | Статус/proof | 🎓 + доступ |

### Контент (уроки/юзкейсы/эфиры)
| GET | `/content?type&block&tags&q&client` | Список | 🎓 |
| GET | `/content/[slug]` | Юнит целиком (redact) | 🎓 |
| GET | `/content/[slug]/player` | Токен/параметры Kinescope (если нужны) | 🎓 + доступ |
| POST | `/content/[slug]/events` | `video_progress`, `sent_to_agent`, `timecode_click` | 🎓 + доступ |
| PUT | `/content/[slug]/progress` | Статус/proof | 🎓 + доступ |

### Прогресс, деньги, лидерборд
| GET | `/me/progress` | Сводка и список | 🎓 |
| GET/POST/PATCH/DELETE | `/me/money` | `MoneyEntry` | 🎓 |
| GET | `/leaderboard?scope=cohort|all` | Топ + моя позиция | 🎓 |
| PATCH | `/me/leaderboard-visibility` | `showInLeaderboard` | 🎓 |

### Главная и уведомления
| GET | `/home` | Агрегат: баннеры, «Новое», виджет, эфир, куратор | 🎓 |
| GET | `/notifications`, POST `/notifications/[id]/read` | | 🎓 |
| GET/POST | `/me/telegram/link`, DELETE `/me/telegram` | Токен привязки | 🎓 |
| POST | `/webhooks/telegram` | Webhook бота (`/start <token>`) | секрет |

### Куратор
| GET | `/me/curator/notes` | Заметки | 🎓 SUPPORT+ |
| PUT | `/me/curator/weekly-report` | «Что сделал за неделю» | 🎓 SUPPORT+ |

### Админ (`/api/admin/*`)
CRUD: `skills`, `content`, `tags`, `banners`, `route` (дни/шаги), `plans`; `students` (list, get, grant-plan, revoke, impersonate, anonymize), `payments` (list, mark-manual), `users` (staff), `cohorts`, `curator` (settings, run, notes approve), `settings`, `legal`; `GET /admin/cohort/[id]/progress`, `GET /admin/export/students.csv`. Каждое изменение пишет `AuditLog`. Загрузки: `POST /admin/uploads/presign`.

## 6. Kinescope

- Плеер: iframe `https://kinescope.io/embed/{id}` (приватные видео, whitelist домена).
- Таймкоды и прогресс: Kinescope IFrame Player API (`@kinescope/player-iframe-api`): `seekTo(sec)`, события `timeupdate`, `ended`. Компонент `KinescopePlayer` инкапсулирует API, выдаёт `onProgress(percent)` (25/50/80/100) и `seekTo`.
- `videoId` отдаётся только при доступе. Админка проверяет id через Kinescope API (`KINESCOPE_API_KEY`) и подтягивает длительность.
- CSP: разрешить `frame-src https://kinescope.io https://*.kinescope.io`.

## 7. Telegram

- Бот платформы (grammY, webhook). Задачи Ф1: (1) уведомления студенту, (2) привязка аккаунта по одноразовому токену (`/start <token>`, TTL 15 мин), (3) напоминания об эфире, (4) сообщение «разбор куратора готов».
- **Вывод студенческого агента в Telegram** (День 3 маршрута) происходит на стороне студента (его агент, его бот). Платформа даёт пошаговые инструкции и команды в шагах маршрута и **не хранит токены бота/ключи студента**. Отметка «сделал» + артефакт (скрин/ссылка/описание).
- Пользователь управляет подписками уведомлений в профиле; при блокировке бота (`403`) поле `telegramChatId` очищается.

## 8. Агент-куратор (лёгкий режим Ф1)

Раз в неделю (по умолчанию понедельник 09:00 МСК), для каждого студента SUPPORT/VIP с `Enrollment ACTIVE`, джобой pg-boss `curator.weekly`:

1. **Сбор данных** (только учебный воркспейс): бизнес-профиль (без контактов), чек-лист недели (маршрут + рекомендуемые юниты по неделе программы), `Progress` за неделю (статусы, `proofNote`), `RouteStepProgress`, `MoneyEntry` за неделю, опционально `WeeklyReport.text`.
2. **Один вызов LLM** (Anthropic API, Claude Sonnet, `temperature` низкий, structured output по JSON-схеме). Системный промпт хранится в БД/настройках (редактируется в A10) и содержит метод: сегментация ABCDX, ЦП/лестница Ханта, воронка, правило «1–2 шага, конкретно и выполнимо за неделю», тон поддерживающий, без давления.
3. **Ответ по схеме:** `{ summary, methodPrinciple, nextSteps: [{ title, why, refType: 'unit'|'skill'|'routeStep'|null, refId }] (1..2) }`. Валидация zod; при невалидном ответе один ретрай, затем `status=FAILED`, без блокирующих последствий.
4. **Сохранение** `CuratorNote` (уникален по `userId+weekStart`), `Notification` + Telegram/email (по настройкам). Если включена модерация (A10), заметка `status=DRAFT` до одобрения.
5. **Приватность:** в промпт не попадают email, телефон, ФИО целиком (только имя), переписка. Логи хранят токены, а не тексты промптов. Ключ `ANTHROPIC_API_KEY` только на сервере. Фичефлаг `CURATOR_ENABLED`.
6. **Отказоустойчивость:** таймаут 60 с, ретраи джобы 3 раза с backoff, дедупликация по `(userId, weekStart)`, ограничение параллелизма 3, бюджет токенов на запуск в настройках.

## 9. Джобы (pg-boss)

| Джоба | Расписание | Назначение |
|---|---|---|
| `leaderboard.rebuild` | ежедневно 03:00 | Полный пересчёт `LeaderboardEntry` |
| `curator.weekly` | пн 09:00 МСК | Разбор студентов |
| `notify.stream-reminder` | за 24 ч и за 1 ч до эфира | Уведомления |
| `payments.reconcile` | каждые 10 мин | Дочитать `PENDING` платежи старше 15 мин у провайдера |
| `auth.cleanup` | ежедневно | Просроченные токены |
| `mail.send` | по событию | Отправка писем с ретраями |

## 10. Аналитика (минимально)

Таблица событий `Event(userId, name, meta, createdAt)` или структурные логи: `sent_to_agent`, `timecode_click`, `video_progress`, `skill_file_download`, `paywall_view`, `upgrade_click`. Используется в дашборде потока и для очков `VIEWED`.

## 11. Rate limits и защита

Login/register/forgot: 5/мин на IP+email; `/payments`: 10/час на пользователя; файлы скиллов: 30/час; общий API: 120/мин на пользователя. Реализация: таблица/Postgres-счётчик (без Redis) либо in-memory LRU + БД для критичных.
