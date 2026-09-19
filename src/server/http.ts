import { NextResponse } from 'next/server';
import { HttpError } from '@/server/access/errors';

/** Преобразует ошибку сервиса в JSON-ответ с кодом (docs/05 формат ошибок). */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json(
      { error: { code: e.code, message: e.message, requiredPlan: e.requiredPlan } },
      { status: e.status },
    );
  }
  const message = e instanceof Error ? e.message : 'Internal error';
  return NextResponse.json({ error: { code: 'INTERNAL', message } }, { status: 500 });
}
