'use server';

import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { businessProfileSchema } from '@/lib/schemas';
import { type ActionState, fieldErrorsFromZod } from '@/lib/action-state';

/** Сохранить/обновить бизнес-профиль (онбординг и вкладка профиля). */
export async function saveBusinessProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const parsed = businessProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const data = parsed.data;
  const websiteUrl = data.websiteUrl ? data.websiteUrl : null;

  await prisma.businessProfile.upsert({
    where: { userId: actor.id },
    create: {
      userId: actor.id,
      companyName: data.companyName,
      niche: data.niche,
      whoAmI: data.whoAmI,
      product: data.product,
      audience: data.audience,
      brandVoice: data.brandVoice,
      goals: data.goals || null,
      monthlyRevenueBand: data.monthlyRevenueBand || null,
      websiteUrl,
    },
    update: {
      companyName: data.companyName,
      niche: data.niche,
      whoAmI: data.whoAmI,
      product: data.product,
      audience: data.audience,
      brandVoice: data.brandVoice,
      goals: data.goals || null,
      monthlyRevenueBand: data.monthlyRevenueBand || null,
      websiteUrl,
    },
  });

  const redirectTo = (formData.get('redirectTo') as string) || null;
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: 'Бизнес-профиль сохранён.' };
}
