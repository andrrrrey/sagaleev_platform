import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1';

function keyFromSecret(masterSecret: string): Buffer {
  return createHash('sha256')
    .update('sagaleev-platform:app-settings:v1')
    .update('\0')
    .update(masterSecret)
    .digest();
}

/** Шифрует секрет AES-256-GCM перед сохранением в AppSetting. */
export function sealSettingSecret(value: string, masterSecret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFromSecret(masterSecret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

export function isSealedSettingSecret(value: string): boolean {
  return value.startsWith(`${PREFIX}:`);
}

/**
 * Расшифровывает новое значение. Старые значения без префикса поддерживаются,
 * чтобы существующие интеграции продолжили работать до следующего сохранения.
 */
export function openSettingSecret(value: string, masterSecret: string): string {
  if (!isSealedSettingSecret(value)) return value;
  const [, , ivValue, tagValue, encryptedValue] = value.split(':');
  if (!ivValue || !tagValue || encryptedValue === undefined) {
    throw new Error('Некорректный формат зашифрованной настройки.');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyFromSecret(masterSecret),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
