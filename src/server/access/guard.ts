import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { getActor } from '@/server/auth/session';

/** Гейт для страниц: требует одну из ролей, иначе редирект. */
export async function requireRole(roles: Role[]): Promise<{ id: string; role: Role }> {
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (!roles.includes(actor.role)) redirect('/admin');
  return { id: actor.id, role: actor.role };
}

/** Закрытый учебный раздел: студенту без подписки показываем страницу тарифа. */
export async function requirePaidSection(
  section: 'lessons' | 'usecases' | 'skills',
): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect(`/login?callbackUrl=/${section}`);
  const isStaff = actor.role === 'ADMIN' || actor.role === 'EDITOR';
  if (!isStaff && !actor.enrollmentActive) {
    redirect(`/pay?from=${section}`);
  }
}
