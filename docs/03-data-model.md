# 03. Модель данных (Prisma / PostgreSQL)

Ниже целевая схема Фазы 1. Используй её как основу `prisma/schema.prisma`; допустимы уточнения, не меняющие смысл. Сущности Ф2 не создаются.

## 1. Схема

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

// ───────── Enums ─────────
enum Role { // CONTRACTOR: Ф2, не используется
  STUDENT
  ADMIN
  EDITOR
  CONTRACTOR
}
enum PlanCode { // порядок = уровень доступа (1,2,3)
  SELF
  SUPPORT
  VIP
}
enum EnrollStatus {
  PENDING
  ACTIVE
  EXPIRED
  REFUNDED
}
enum PaymentStatus {
  PENDING
  SUCCEEDED
  CANCELED
  FAILED
  REFUNDED
}
enum PaymentKind {
  PURCHASE
  UPGRADE
}
enum UnitType {
  LESSON
  USECASE
  STREAM
}
enum ProgressStatus { // посмотрел=1 / сдал=2 / внедрил=5 / результат=10
  NONE
  VIEWED
  SUBMITTED
  IMPLEMENTED
  RESULT
}
enum SkillGroup {
  STRATEGY
  TRAFFIC
  CONTENT
  RETENTION
  AGENT_INFRA
}
enum PublishState {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ───────── Пользователи ─────────
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  name          String
  phone         String?
  avatarUrl     String?
  role          Role     @default(STUDENT)
  consentAt     DateTime?                 // согласие на обработку ПДн
  consentVersion String?
  telegramChatId String?  @unique         // привязка бота
  telegramUsername String?
  notifyEmail   Boolean  @default(true)
  notifyTelegram Boolean @default(true)
  showInLeaderboard Boolean @default(true) // «мотиватор, не позор»: можно скрыться
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  businessProfile BusinessProfile?
  enrollments   Enrollment[]
  payments      Payment[]
  progress      Progress[]
  routeProgress RouteStepProgress[]
  cohortId      String?
  cohort        Cohort?  @relation(fields: [cohortId], references: [id])
  moneyEntries  MoneyEntry[]
  weeklyReports WeeklyReport[]
  curatorNotes  CuratorNote[]
  leaderboard   LeaderboardEntry?
  auditLogs     AuditLog[]
}

model BusinessProfile {              // онбординг: кто ты / продукт / клиент / голос бренда
  id          String @id @default(cuid())
  userId      String @unique
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName String
  niche       String                 // сфера
  whoAmI      String  @db.Text       // кто ты
  product     String  @db.Text       // продукт/услуга
  audience    String  @db.Text       // клиент
  brandVoice  String  @db.Text       // голос бренда
  goals       String? @db.Text
  monthlyRevenueBand String?         // диапазон, не точная цифра
  websiteUrl  String?
  updatedAt   DateTime @updatedAt
}

model Cohort {                       // поток студентов (Поток-1 и далее)
  id        String @id @default(cuid())
  title     String
  startsAt  DateTime
  endsAt    DateTime?
  users     User[]
}

// ───────── Тарифы, платежи ─────────
model Plan {
  code        PlanCode @id
  title       String                 // «Самостоятельно» …
  priceKopeks Int                    // 10_000_000 …
  level       Int                    // 1,2,3
  features    Json                   // список пунктов для карточки тарифа
  active      Boolean  @default(true)
  sort        Int      @default(0)
  enrollments Enrollment[]
}

model Enrollment {                   // User × тариф
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  planCode  PlanCode
  plan      Plan     @relation(fields: [planCode], references: [code])
  status    EnrollStatus @default(PENDING)
  activatedAt DateTime?
  expiresAt DateTime?                // срок доступа (нужен для Ф2), null = бессрочно в рамках потока
  grantedByAdmin Boolean @default(false)   // ручная выдача
  createdAt DateTime @default(now())
  payments  Payment[]
  @@index([userId, status])
}
// Инвариант: у пользователя максимум один Enrollment со status=ACTIVE.
// Апгрейд = обновление planCode этого Enrollment после успешного UPGRADE-платежа.

model Payment {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  enrollmentId      String?
  enrollment        Enrollment? @relation(fields: [enrollmentId], references: [id])
  kind              PaymentKind
  targetPlan        PlanCode                 // на какой тариф оплата
  amountKopeks      Int                      // для UPGRADE = разница
  currency          String   @default("RUB")
  status            PaymentStatus @default(PENDING)
  provider          String                   // 'yookassa' | 'cloudpayments' | ...
  providerPaymentId String?  @unique
  confirmationUrl   String?
  idempotenceKey    String   @unique
  rawWebhook        Json?
  createdAt         DateTime @default(now())
  paidAt            DateTime?
  @@index([userId, status])
}

// ───────── Маршрут «агент за 3 дня» ─────────
model RouteDay {
  id        String @id @default(cuid())
  dayNumber Int    @unique            // 1..3
  title     String                    // «Фундамент»
  summary   String @db.Text
  artifact  String                    // «Агент, который знает твой бизнес»
  steps     RouteStep[]
}

model RouteStep {
  id        String @id @default(cuid())
  dayId     String
  day       RouteDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  sort      Int
  title     String
  body      String  @db.Text          // объяснение (rich text HTML)
  commands  Json                      // [{ label, text, kind: 'command'|'prompt' }]
  artifactRequired Boolean @default(true)  // требуется отметка «сделал»
  artifactHint String?                // что именно зафиксировать
  linkedSkillId String?               // подсказка «подключи скилл»
  linkedSkill Skill? @relation(fields: [linkedSkillId], references: [id])
  progress  RouteStepProgress[]
  @@unique([dayId, sort])
}

model RouteStepProgress {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  stepId    String
  step      RouteStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  done      Boolean @default(false)
  doneAt    DateTime?
  artifactNote String? @db.Text       // ссылка/текст/скрин-описание артефакта
  artifactUrl  String?
  @@unique([userId, stepId])
}

// ───────── Скиллы ─────────
model Tag {
  id    String @id @default(cuid())
  slug  String @unique
  title String
  skills SkillTag[]
  units  UnitTag[]
}

model Skill {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  group       SkillGroup
  shortDesc   String   @db.Text       // «что делает»
  inputs      String   @db.Text       // «что на входе»
  outputs     String   @db.Text       // «что на выходе»
  timeToMaster String                 // «30 минут»
  demoUnitId  String?                 // demo на реальном кейсе → юзкейс
  demoUnit    ContentUnit? @relation(fields: [demoUnitId], references: [id])
  demoVideoId String?                 // либо отдельное видео Kinescope
  prompt      String   @db.Text       // полный промпт «Отправить агенту»
  fileKey     String?                 // ключ файла скилла в S3
  fileName    String?
  minPlan     PlanCode @default(SUPPORT)   // SELF = входит в «базовый набор»
  state       PublishState @default(DRAFT)
  sort        Int      @default(0)
  tags        SkillTag[]
  routeSteps  RouteStep[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  progress    Progress[]
}
model SkillTag {
  skillId String
  tagId String
  skill Skill @relation(fields:[skillId],references:[id],onDelete:Cascade)
  tag Tag @relation(fields:[tagId],references:[id],onDelete:Cascade)
  @@id([skillId, tagId])
}

// ───────── Контент-юнит: уроки, юзкейсы, эфиры ─────────
model ContentUnit {
  id          String   @id @default(cuid())
  type        UnitType
  slug        String   @unique
  title       String
  summary     String?  @db.Text
  coverUrl    String?
  timeToMaster String?
  minPlan     PlanCode @default(SELF)
  partialFreePreview Boolean @default(false)  // для STREAM на SELF: «частично» (см. 05, матрица)
  state       PublishState @default(DRAFT)
  publishedAt DateTime?
  sort        Int      @default(0)

  // Видео
  kinescopeId String?
  durationSec Int?
  timecodes   Json     @default("[]")   // [{ t: 125, label: "Аудит выдачи" }]

  // Промпт-блок и «Отправить агенту»
  prompt      String?  @db.Text          // многошаговый промпт
  promptNote  String?                    // подсказка к промпту

  // LESSON
  block       Int?                       // 1..10 блок программы
  orderInBlock Int?
  routeDayId  String?                    // привязка к блоку маршрута/метода
  methodTag   String?                    // принцип метода: «сегментация ABCDX» и т.п.

  // USECASE
  goal        String?  @db.Text          // блок ЦЕЛЬ
  result      String?  @db.Text          // блок РЕЗУЛЬТАТ
  kpis        Json     @default("[]")    // [{ label, value, hint }] жёсткие измеримые KPI
  description Json?                      // ОПИСАНИЕ (TipTap JSON) + ссылки на репо
  repoLinks   Json     @default("[]")    // [{ title, url }]
  article     Json?                      // вкладка «Статья» (TipTap JSON)
  transcript  String?  @db.Text          // вкладка «Полный транскрипт»
  steps       Json     @default("[]")    // ПОШАГОВЫЕ ДЕЙСТВИЯ [{ title, body, command }]
  caseClient  String?                    // «Клиника Ешидоржиева», «Маамуу», …

  // STREAM
  airedAt     DateTime?                  // дата эфира

  tags        UnitTag[]
  skillsDemo  Skill[]
  progress    Progress[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([type, state, sort])
}
model UnitTag {
  unitId String
  tagId String
  unit ContentUnit @relation(fields:[unitId],references:[id],onDelete:Cascade)
  tag Tag @relation(fields:[tagId],references:[id],onDelete:Cascade)
  @@id([unitId, tagId])
}

// ───────── Прогресс и лидерборд ─────────
model Progress {                       // User × (юнит | скилл)
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  unitId    String?
  unit      ContentUnit? @relation(fields: [unitId], references: [id], onDelete: Cascade)
  skillId   String?
  skill     Skill? @relation(fields: [skillId], references: [id], onDelete: Cascade)
  status    ProgressStatus @default(NONE)     // максимальный достигнутый уровень
  viewedAt      DateTime?
  submittedAt   DateTime?
  implementedAt DateTime?
  resultAt      DateTime?
  proofNote  String? @db.Text            // что сделал / доказательство внедрения
  proofUrl   String?
  updatedAt  DateTime @updatedAt
  @@unique([userId, unitId])
  @@unique([userId, skillId])
  // CHECK (unitId IS NOT NULL) <> (skillId IS NOT NULL) — добавить SQL-миграцией
}

model MoneyEntry {                     // поле «движение по деньгам», вносит студент
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  progressId String?
  amountKopeks Int                    // + прирост выручки / − экономия допускается знаком
  kind      String                    // 'REVENUE' | 'LEADS' | 'SAVINGS' (для отображения)
  note      String? @db.Text
  periodFrom DateTime?
  periodTo   DateTime?
  createdAt DateTime @default(now())
}

model LeaderboardEntry {
  userId    String @id
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  points    Int    @default(0)
  viewedCount Int  @default(0)
  submittedCount Int @default(0)
  implementedCount Int @default(0)
  resultCount Int @default(0)
  moneyTotalKopeks BigInt @default(0)
  updatedAt DateTime @updatedAt
  @@index([points(sort: Desc)])
}

// ───────── Куратор ─────────
model WeeklyReport {                   // «что сделал за неделю» (опционально)
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart DateTime                  // понедельник недели
  text      String? @db.Text
  createdAt DateTime @default(now())
  @@unique([userId, weekStart])
}

model CuratorNote {                    // карточка результата разбора
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart DateTime
  summary   String  @db.Text          // что внедрено на этой неделе
  methodPrinciple String?             // привязка к принципу метода
  nextSteps Json                      // [{ title, why, unitId? , skillId? }] 1–2 шага
  model     String
  tokensIn  Int?
  tokensOut Int?
  status    String  @default("OK")    // OK | FAILED | SKIPPED
  createdAt DateTime @default(now())
  readAt    DateTime?
  @@unique([userId, weekStart])
}

// ───────── Прочее ─────────
model Banner {                         // карусель на Главной
  id        String @id @default(cuid())
  title     String
  subtitle  String?
  imageUrl  String?
  href      String?
  sort      Int    @default(0)
  active    Boolean @default(true)
  startsAt  DateTime?
  endsAt    DateTime?
}

model Notification {
  id        String @id @default(cuid())
  userId    String
  kind      String                    // 'CURATOR_NOTE' | 'NEW_CONTENT' | 'PAYMENT' | 'STREAM_SOON'
  title     String
  body      String?
  href      String?
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt])
}

model AuditLog {
  id        String @id @default(cuid())
  actorId   String
  actor     User   @relation(fields: [actorId], references: [id])
  action    String
  entity    String
  entityId  String?
  meta      Json?
  createdAt DateTime @default(now())
}

model LegalDocument {                  // политика ПДн, оферта — версии
  id        String @id @default(cuid())
  kind      String                    // 'PRIVACY' | 'OFFER'
  version   String
  bodyHtml  String @db.Text
  publishedAt DateTime @default(now())
  @@unique([kind, version])
}

// [Ф2 — НЕ СОЗДАВАТЬ]: Contractor, Order, Subscription, MarketplaceTransaction
```

## 2. Правила и инварианты

- **Очки.** `points = 1*viewed + 2*submitted + 5*implemented + 10*result`, где каждый юнит/скилл считается **по максимальному достигнутому статусу** (не суммируем 1+2+5+10 за один юнит). Формально: очки юнита = вес его `status`. Итог = сумма по всем `Progress` пользователя. Пример: юнит в статусе `IMPLEMENTED` даёт 5, а не 8.
- **Переходы статуса.** Вперёд по одному или прыжком (внедрил без «сдал» допустим), назад запрещены, кроме админа. Каждое повышение проставляет соответствующий `*At`.
- **`VIEWED`** ставится автоматически: видео проиграно ≥ 80% (событие от плеера) либо страница скилла открыта и нажато «Отправить агенту». `SUBMITTED`, `IMPLEMENTED`, `RESULT` студент ставит сам, обязательно с `proofNote` для `IMPLEMENTED` и `RESULT` (для `RESULT` ещё ≥ 1 `MoneyEntry`).
- **Сброс лидерборда.** `LeaderboardEntry` пересчитывается в транзакции при каждом изменении `Progress`/`MoneyEntry` и ночью полностью (страховка).
- **Один активный Enrollment на пользователя** (частичный уникальный индекс `WHERE status='ACTIVE'`).
- **Soft-delete** пользователя (`deletedAt`) + отдельная процедура анонимизации по запросу 152-ФЗ.
- **Слаги** уникальны, генерируются транслитом от названия, редактируются в админке.

## 3. Сиды (`prisma/seed.ts`)

1. `Plan`: SELF 100 000 ₽ · SUPPORT 200 000 ₽ · VIP 400 000 ₽ (в копейках), features по матрице из `05`.
2. Пользователи: `ADMIN` (Жаргал, email из env), `EDITOR`, 3 демо-студента на разных тарифах (только для dev/staging).
3. `RouteDay` 1–3 с шагами по ТЗ (см. `04-screens.md`, экран «Маршрут»), тексты-заглушки.
4. `Tag`: ~15 стартовых тегов (SEO, Директ, 2ГИС, контент, reels, реактивация, CRM, …).
5. `Skill`: 12 демо-скиллов по 5 группам, 5 из них `minPlan=SELF`.
6. `ContentUnit`: 1 эталонный юзкейс «SEO-движок на агентах» со всеми полями (KPI: статья ≥ 82/100, доскролл 75%, IndexNow, 3 слоя SEO/AEO/GEO), 3 урока, 2 эфира.
7. `LegalDocument`: черновики политики ПДн и оферты.
