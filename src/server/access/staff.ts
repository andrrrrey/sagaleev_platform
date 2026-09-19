import type { Role } from '@prisma/client';
import { HttpError } from './errors';

/**
 * Права сотрудников на чувствительные данные.
 * EDITOR ведёт контент, но не видит оплат и ПДн студентов (152-ФЗ).
 * См. docs/00-overview.md (роли) и docs/05 §2 тест 6.
 */
export function canReadPayments(role: Role): boolean {
  return role === 'ADMIN';
}

/** Персональные данные студентов (email, телефон, бизнес-профиль-контакты). */
export function canReadStudentPII(role: Role): boolean {
  return role === 'ADMIN';
}

/** Управление ролями/тарифами вручную. */
export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN';
}

/** CRUD контента (скиллы, юниты, теги, баннеры, маршрут). */
export function canEditContent(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function assertCanReadPayments(role: Role): void {
  if (!canReadPayments(role)) throw new HttpError('PLAN_REQUIRED');
}

export function assertCanReadStudentPII(role: Role): void {
  if (!canReadStudentPII(role)) throw new HttpError('PLAN_REQUIRED');
}
