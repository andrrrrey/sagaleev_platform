import { cache } from 'react';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { maskSecret } from './mask';

export { maskSecret };

/**
 * Хранилище редактируемых настроек/интеграций (API-ключи и т.п.).
 *
 * Значение берётся из БД (таблица AppSetting), а если оно не задано —
 * из переменной окружения с тем же именем (fallback). Это позволяет
 * администратору вводить ключи прямо в /admin/settings, не трогая .env,
 * при этом окружение остаётся дефолтом (см. docs/01 §5, DoD: секреты — не в коде).
 *
 * Секреты никогда не отдаются на клиент в открытом виде — только признак
 * «задан/не задан» и маскированный хвост (см. describeSettings / maskSecret).
 */

export type SettingKind = 'secret' | 'text' | 'boolean';

export type SettingDef = {
  key: string;
  label: string;
  kind: SettingKind;
  group: string;
  placeholder?: string;
  hint?: string;
  /** Значение по умолчанию из окружения. */
  envFallback: () => string | undefined;
};

/** Каталог настроек, доступных в админке. Порядок = порядок отображения. */
export const SETTING_DEFS: SettingDef[] = [
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic API-ключ (куратор)',
    kind: 'secret',
    group: 'Куратор (LLM)',
    placeholder: 'sk-ant-…',
    hint: 'Ключ Claude для еженедельных разборов ИИ-куратора.',
    envFallback: () => env.ANTHROPIC_API_KEY,
  },
  {
    key: 'CURATOR_ENABLED',
    label: 'Куратор включён',
    kind: 'boolean',
    group: 'Куратор (LLM)',
    hint: 'Общий фичефлаг: выключает разборы даже при заданном ключе.',
    envFallback: () => String(env.CURATOR_ENABLED),
  },
  {
    key: 'KINESCOPE_API_KEY',
    label: 'Kinescope API-ключ',
    kind: 'secret',
    group: 'Видео (Kinescope)',
    hint: 'Необязателен для показа видео по Kinescope ID. Понадобится только при будущей автоматизации загрузки и управления видео.',
    envFallback: () => env.KINESCOPE_API_KEY,
  },
  {
    key: 'TELEGRAM_BOT_TOKEN',
    label: 'Telegram Bot Token',
    kind: 'secret',
    group: 'Telegram',
    placeholder: '123456:ABC-…',
    envFallback: () => env.TELEGRAM_BOT_TOKEN,
  },
  {
    key: 'TELEGRAM_BOT_USERNAME',
    label: 'Telegram Bot Username',
    kind: 'text',
    group: 'Telegram',
    placeholder: 'my_course_bot',
    hint: 'Без @. Используется в диплинке привязки.',
    envFallback: () => env.TELEGRAM_BOT_USERNAME,
  },
  {
    key: 'TELEGRAM_WEBHOOK_SECRET',
    label: 'Telegram Webhook Secret',
    kind: 'secret',
    group: 'Telegram',
    hint: 'Проверяется в заголовке входящего вебхука.',
    envFallback: () => env.TELEGRAM_WEBHOOK_SECRET,
  },
  {
    key: 'YOOKASSA_SHOP_ID',
    label: 'ЮKassa Shop ID',
    kind: 'text',
    group: 'Оплата (ЮKassa)',
    envFallback: () => env.YOOKASSA_SHOP_ID,
  },
  {
    key: 'YOOKASSA_SECRET_KEY',
    label: 'ЮKassa Secret Key',
    kind: 'secret',
    group: 'Оплата (ЮKassa)',
    envFallback: () => env.YOOKASSA_SECRET_KEY,
  },
  {
    key: 'SMTP_URL',
    label: 'SMTP URL',
    kind: 'secret',
    group: 'Почта (SMTP)',
    placeholder: 'smtp://user:pass@host:587',
    envFallback: () => env.SMTP_URL,
  },
  {
    key: 'MAIL_FROM',
    label: 'MAIL FROM',
    kind: 'text',
    group: 'Почта (SMTP)',
    placeholder: 'noreply@example.ru',
    envFallback: () => env.MAIL_FROM,
  },
];

export const SETTING_KEYS = SETTING_DEFS.map((d) => d.key);
const DEF_BY_KEY = new Map(SETTING_DEFS.map((d) => [d.key, d]));

/** Все переопределения из БД (за один запрос, кэш на время запроса). */
const loadOverrides = cache(async (): Promise<Map<string, string>> => {
  const rows = await prisma.appSetting.findMany();
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.value.trim().length > 0) map.set(r.key, r.value);
  }
  return map;
});

/** Итоговое значение настройки: БД → окружение. undefined, если нигде нет. */
export async function getSetting(key: string): Promise<string | undefined> {
  const overrides = await loadOverrides();
  const fromDb = overrides.get(key);
  if (fromDb !== undefined) return fromDb;
  return DEF_BY_KEY.get(key)?.envFallback();
}

/** Булева настройка (например, CURATOR_ENABLED). */
export async function getSettingBool(key: string): Promise<boolean> {
  const v = await getSetting(key);
  return v === 'true' || v === '1';
}

export type SettingView = {
  key: string;
  label: string;
  kind: SettingKind;
  group: string;
  placeholder?: string;
  hint?: string;
  /** Значение есть (в БД или окружении). */
  isSet: boolean;
  /** Источник значения. */
  source: 'db' | 'env' | 'none';
  /** Для secret — маскированный хвост; для остального — само значение. */
  display: string;
  /** Текущее значение (для text/boolean предзаполняет форму; для secret — пусто). */
  value: string;
};

/** Представление всех настроек для UI (без утечки секретов). */
export async function describeSettings(): Promise<SettingView[]> {
  const overrides = await loadOverrides();
  return SETTING_DEFS.map((d) => {
    const fromDb = overrides.get(d.key);
    const fromEnv = d.envFallback();
    const raw = fromDb ?? fromEnv ?? '';
    const source: SettingView['source'] = fromDb !== undefined ? 'db' : fromEnv ? 'env' : 'none';
    const isSet = raw.trim().length > 0;
    const display = d.kind === 'secret' ? maskSecret(raw) : raw;
    return {
      key: d.key,
      label: d.label,
      kind: d.kind,
      group: d.group,
      placeholder: d.placeholder,
      hint: d.hint,
      isSet,
      source,
      // text/boolean можно предзаполнить, секрет — никогда.
      value: d.kind === 'secret' ? '' : raw,
      display,
    };
  });
}

/**
 * Сохранение настроек. Правила:
 * - для secret пустое поле = «не менять» (пропускаем);
 * - для text/boolean пустое поле = очистить переопределение (вернуть к env);
 * - маркер удаления `__CLEAR__` очищает переопределение любого поля.
 */
export async function saveSettings(
  entries: Record<string, string | undefined>,
  actorId: string,
): Promise<string[]> {
  const changed: string[] = [];
  for (const def of SETTING_DEFS) {
    if (!(def.key in entries)) continue;
    const rawInput = entries[def.key];
    const input = (rawInput ?? '').trim();

    if (input === '__CLEAR__') {
      await prisma.appSetting.deleteMany({ where: { key: def.key } });
      changed.push(def.key);
      continue;
    }

    if (input.length === 0) {
      if (def.kind === 'secret') continue; // пустой секрет = оставить как есть
      // text/boolean: очистка переопределения
      await prisma.appSetting.deleteMany({ where: { key: def.key } });
      changed.push(def.key);
      continue;
    }

    await prisma.appSetting.upsert({
      where: { key: def.key },
      create: { key: def.key, value: input, updatedBy: actorId },
      update: { value: input, updatedBy: actorId },
    });
    changed.push(def.key);
  }
  return changed;
}
