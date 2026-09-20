import { z } from 'zod';

/**
 * Валидация переменных окружения при старте. Приложение падает с понятной
 * ошибкой, если конфигурация неполна. См. docs/01-stack-architecture.md §5.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default('Цифровой отдел маркетинга'),

  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),

  PAYMENT_PROVIDER: z.enum(['yookassa', 'mock']).default('mock'),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),

  KINESCOPE_API_KEY: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  CURATOR_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  EDITOR_EMAIL: z.string().email().optional(),
  EDITOR_PASSWORD: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Некорректные переменные окружения:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof schema>;
