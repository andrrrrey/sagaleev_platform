import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { assertSkillFileAccess } from '@/server/skills/service';
import { presignGetUrl, isStorageConfigured } from '@/server/storage/s3';
import { errorResponse } from '@/server/http';
import { HttpError } from '@/server/access/errors';
import { rateLimit } from '@/server/rate-limit';

/**
 * Ссылка на файл скилла: 403 при недоступности тарифа, иначе presigned URL
 * (TTL 5 мин). Доступ проверяется ДО выдачи ключа/URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  if (!rateLimit(`skill-file:${actor.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Слишком часто' } }, { status: 429 });
  }

  const { slug } = await params;
  try {
    const { fileKey, fileName } = await assertSkillFileAccess(actor, slug);
    const url = presignGetUrl(fileKey);
    if (!url) {
      return NextResponse.json(
        {
          error: {
            code: 'STORAGE_NOT_CONFIGURED',
            message: isStorageConfigured() ? 'Не удалось сформировать ссылку' : 'Хранилище файлов не настроено (dev)',
          },
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ url, fileName });
  } catch (e) {
    return errorResponse(e);
  }
}
