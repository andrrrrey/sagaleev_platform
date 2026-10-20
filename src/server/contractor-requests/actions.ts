'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ContractorRequestStatus } from '@prisma/client';
import { CONTRACTOR_SERVICES } from '@/lib/contractor-services';
import { fieldErrorsFromZod, type ActionState } from '@/lib/action-state';
import { prisma } from '@/server/db';
import { getActor } from '@/server/auth/session';
import { requireRole } from '@/server/access/guard';
import { audit } from '@/server/admin/audit';

const allowedCategories = CONTRACTOR_SERVICES.map((service) => service.value) as [
  string,
  ...string[],
];

const createSchema = z.object({
  category: z.enum(allowedCategories, { message: 'Выберите направление' }),
  description: z
    .string()
    .trim()
    .min(20, 'Опишите задачу чуть подробнее — минимум 20 символов')
    .max(5000, 'Описание слишком длинное'),
});

const mutableStatuses: ContractorRequestStatus[] = [
  'NEW',
  'IN_REVIEW',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
];

export async function createContractorRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) return { ok: false, message: 'Войдите в аккаунт' };
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  await prisma.contractorRequest.create({
    data: {
      userId: actor.id,
      category: parsed.data.category,
      description: parsed.data.description,
    },
  });
  revalidatePath('/requests');
  revalidatePath('/admin/requests');
  return { ok: true, message: 'Запрос отправлен. Мы увидим его в админке и свяжемся с вами.' };
}

export async function cancelContractorRequest(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!actor) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.contractorRequest.updateMany({
    where: { id, userId: actor.id, status: { in: ['NEW', 'IN_REVIEW'] } },
    data: { status: 'CANCELED', canceledAt: new Date() },
  });
  revalidatePath('/requests');
  revalidatePath('/admin/requests');
}

export async function updateContractorRequestStatus(formData: FormData): Promise<void> {
  const actor = await requireRole(['ADMIN']);
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as ContractorRequestStatus;
  const adminNote = String(formData.get('adminNote') ?? '').trim();
  if (!id || !mutableStatuses.includes(status)) return;

  await prisma.contractorRequest.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote || null,
      canceledAt: status === 'CANCELED' ? new Date() : null,
    },
  });
  await audit(actor.id, 'UPDATE', 'ContractorRequest', id, { status });
  revalidatePath('/requests');
  revalidatePath('/admin/requests');
}
