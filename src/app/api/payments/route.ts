import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/server/auth/session';
import { createCheckout } from '@/server/payments/service';
import { rateLimit } from '@/server/rate-limit';

const bodySchema = z.object({ planCode: z.enum(['SELF', 'SUPPORT', 'VIP']) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Требуется вход' } }, { status: 401 });
  }
  if (!rateLimit(`payments:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Слишком много попыток оплаты' } },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Некорректный тариф' } }, { status: 400 });
  }

  try {
    const result = await createCheckout({
      userId: user.id,
      userEmail: user.email,
      targetPlan: parsed.data.planCode,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ошибка создания платежа';
    return NextResponse.json({ error: { code: 'PAYMENT_ERROR', message } }, { status: 400 });
  }
}
