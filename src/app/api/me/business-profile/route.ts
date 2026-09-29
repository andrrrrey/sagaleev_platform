import { NextResponse } from 'next/server';
import { businessProfileSchema } from '@/lib/schemas';
import { fieldErrorsFromZod } from '@/lib/action-state';
import { getActor } from '@/server/auth/session';
import { upsertBusinessProfile } from '@/server/profile/service';

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Требуется вход в аккаунт.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = businessProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Не удалось сохранить анкету. Проверьте поле с ошибкой.',
        fieldErrors: fieldErrorsFromZod(parsed.error.issues),
      },
      { status: 400 },
    );
  }

  await upsertBusinessProfile(actor.id, parsed.data);
  return NextResponse.json({ ok: true, message: 'Бизнес-профиль сохранён.' });
}
