import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';

/** Запись действия админа/редактора в аудит-лог (docs/01 §4). */
export async function audit(
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId: entityId ?? null,
      meta: meta === undefined ? undefined : (meta as Prisma.InputJsonValue),
    },
  });
}
