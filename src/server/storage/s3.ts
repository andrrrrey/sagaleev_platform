import { createHash, createHmac } from 'node:crypto';
import { env } from '@/lib/env';

/** Настроено ли S3-хранилище. */
export function isStorageConfigured(): boolean {
  return Boolean(env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}
function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Presigned GET URL (AWS SigV4, path-style) для S3-совместимого хранилища.
 * TTL по умолчанию 5 минут (docs/01 §4). Возвращает null, если S3 не настроен.
 */
export function presignGetUrl(key: string, ttlSeconds = 300): string | null {
  if (!isStorageConfigured()) return null;

  const endpoint = new URL(env.S3_ENDPOINT!);
  const host = endpoint.host;
  const region = env.S3_REGION || 'ru-central1';
  const accessKey = env.S3_ACCESS_KEY!;
  const secretKey = env.S3_SECRET_KEY!;
  const bucket = env.S3_BUCKET!;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDТHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  // path-style: /{bucket}/{key}
  const canonicalUri =
    '/' +
    `${bucket}/${key}`
      .split('/')
      .map((seg) => encodeRfc3986(seg))
      .join('/');

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKey}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(ttlSeconds),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k]!)}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return `${endpoint.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
