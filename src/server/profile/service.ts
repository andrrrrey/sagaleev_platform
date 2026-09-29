import type { BusinessProfileInput } from '@/lib/schemas';
import { prisma } from '@/server/db';

/** Единое сохранение бизнес-профиля для онбординга и настроек профиля. */
export async function upsertBusinessProfile(
  userId: string,
  data: BusinessProfileInput,
): Promise<void> {
  const values = {
    companyName: data.companyName,
    niche: data.niche,
    whoAmI: data.whoAmI,
    product: data.product,
    audience: data.audience,
    brandVoice: data.brandVoice,
    goals: data.goals || null,
    monthlyRevenueBand: data.monthlyRevenueBand || null,
    websiteUrl: data.websiteUrl || null,
  };

  await prisma.businessProfile.upsert({
    where: { userId },
    create: { userId, ...values },
    update: values,
  });
}
