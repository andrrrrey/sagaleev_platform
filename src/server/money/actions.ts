'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getActor } from '@/server/auth/session';
import { rebuildLeaderboardEntry } from '@/server/progress/leaderboard';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';

const moneySchema = z.object({
  amountRub: z.coerce.number().int('Целое число').refine((v) => v !== 0, 'Сумма не может быть 0'),
  kind: z.enum(['REVENUE', 'LEADS', 'SAVINGS']),
  note: z.string().optional(),
});

/** Добавить запись «движение по деньгам» (docs/04 S1/S12). */
export async function addMoneyEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const parsed = moneySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };

  await prisma.moneyEntry.create({
    data: {
      userId: actor.id,
      amountKopeks: Math.round(parsed.data.amountRub * 100),
      kind: parsed.data.kind,
      note: parsed.data.note || null,
    },
  });
  await rebuildLeaderboardEntry(actor.id);

  revalidatePath('/');
  revalidatePath('/leaderboard');
  revalidatePath('/profile');
  return { ok: true, message: 'Запись добавлена' };
}
