-- Блокировка пользователя админом
ALTER TABLE "User" ADD COLUMN "blockedAt" TIMESTAMP(3);

-- Конфигурация/интеграции, редактируемые в админке (API-ключи и т.п.)
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
