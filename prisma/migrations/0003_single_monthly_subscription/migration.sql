ALTER TYPE "PaymentKind" ADD VALUE IF NOT EXISTS 'RENEWAL';

ALTER TABLE "Enrollment"
  ADD COLUMN "paymentMethodId" TEXT,
  ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canceledAt" TIMESTAMP(3);

UPDATE "Plan"
SET
  "title" = 'Единая подписка',
  "priceKopeks" = 500000,
  "level" = 2,
  "sort" = 1,
  "active" = true,
  "features" = '["Весь маршрут и все материалы", "Полная библиотека скиллов", "Уроки, юзкейсы и эфиры", "Персональный агент-куратор", "Новые материалы без доплаты"]'::jsonb
WHERE "code" = 'SUPPORT';

UPDATE "Plan" SET "active" = false WHERE "code" IN ('SELF', 'VIP');

-- Сохраняем доступ действующим студентам после перехода на единый тариф.
UPDATE "Enrollment"
SET "planCode" = 'SUPPORT'
WHERE "status" = 'ACTIVE' AND "planCode" IN ('SELF', 'VIP');

UPDATE "Skill" SET "minPlan" = 'SUPPORT';
UPDATE "ContentUnit" SET "minPlan" = 'SUPPORT';
