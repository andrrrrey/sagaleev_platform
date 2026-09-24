import { randomUUID } from 'node:crypto';
import type { PlanCode } from '@prisma/client';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { getPaymentProvider } from './index';
import { computeCharge } from './pricing';
import type { ProviderStatus } from './provider';

const SUBSCRIPTION_PLAN: PlanCode = 'SUPPORT';

function addBillingMonth(from: Date): Date {
  const target = new Date(from);
  const day = target.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function savedPaymentMethodId(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const method = (raw as { payment_method?: unknown }).payment_method;
  if (!method || typeof method !== 'object') return null;
  const { id, saved } = method as { id?: unknown; saved?: unknown };
  return saved === true && typeof id === 'string' ? id : null;
}

/** Активный тариф пользователя (или null). */
async function currentActivePlan(userId: string): Promise<PlanCode | null> {
  const e = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { planCode: true },
  });
  return e?.planCode ?? null;
}

/**
 * Создать платёж (покупка/апгрейд): считает сумму, пишет Payment(PENDING),
 * вызывает провайдера, возвращает confirmationUrl. docs/05 §4.2.
 */
export async function createCheckout(input: {
  userId: string;
  userEmail: string;
  targetPlan: PlanCode;
}): Promise<{ paymentId: string; confirmationUrl: string }> {
  if (input.targetPlan !== SUBSCRIPTION_PLAN) {
    throw new Error('Для покупки доступна только единая подписка.');
  }
  const plans = await prisma.plan.findMany({ select: { code: true, priceKopeks: true } });
  const prices = Object.fromEntries(plans.map((p) => [p.code, p.priceKopeks])) as Record<
    PlanCode,
    number
  >;

  const current = await currentActivePlan(input.userId);
  const charge = computeCharge(current, input.targetPlan, prices);

  const provider = getPaymentProvider();
  const idempotenceKey = randomUUID();

  // Сумма фиксируется в Payment на момент создания.
  const payment = await prisma.payment.create({
    data: {
      userId: input.userId,
      kind: charge.kind,
      targetPlan: charge.targetPlan,
      amountKopeks: charge.amountKopeks,
      status: 'PENDING',
      provider: provider.name,
      idempotenceKey,
    },
  });

  const result = await provider.createPayment({
    amountKopeks: charge.amountKopeks,
    description: 'Единая подписка на платформу на один месяц',
    returnUrl: `${env.APP_URL}/pay/result?paymentId=${payment.id}`,
    idempotenceKey,
    metadata: { paymentId: payment.id, userId: input.userId },
    receipt: {
      customerEmail: input.userEmail,
      items: [
        {
          description: 'Ежемесячная подписка на обучающую платформу',
          amountKopeks: charge.amountKopeks,
          quantity: 1,
          vatCode: 1, // без НДС / по настройке налогообложения
        },
      ],
    },
    savePaymentMethod: true,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerPaymentId: result.providerPaymentId, confirmationUrl: result.confirmationUrl },
  });

  return { paymentId: payment.id, confirmationUrl: result.confirmationUrl };
}

/**
 * Дочитать PENDING-платежи старше 15 минут у провайдера (джоба
 * payments.reconcile, docs/05 §9). Возвращает число обработанных.
 */
export async function reconcilePendingPayments(): Promise<number> {
  const cutoff = new Date(Date.now() - 15 * 60_000);
  const pending = await prisma.payment.findMany({
    where: { status: 'PENDING', providerPaymentId: { not: null }, createdAt: { lt: cutoff } },
    select: { providerPaymentId: true },
    take: 100,
  });
  const provider = getPaymentProvider();
  let handled = 0;
  for (const p of pending) {
    if (!p.providerPaymentId) continue;
    try {
      const fresh = await provider.getPayment(p.providerPaymentId);
      if (fresh.status !== 'pending') {
        await applyPaymentConfirmation({
          providerPaymentId: p.providerPaymentId,
          status: fresh.status,
          raw: fresh.raw,
        });
        handled += 1;
      }
    } catch {
      /* пропускаем, попробуем в следующий раз */
    }
  }
  return handled;
}

/**
 * Идемпотентная обработка подтверждения платежа. Активация Enrollment
 * происходит ТОЛЬКО здесь (не по редиректу пользователя). docs/05 §4.2.
 */
export async function applyPaymentConfirmation(input: {
  providerPaymentId: string;
  status: ProviderStatus;
  raw: unknown;
}): Promise<{ handled: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId: input.providerPaymentId },
  });
  if (!payment) return { handled: false };

  // Идемпотентность: уже терминальный статус — ничего не делаем.
  if (payment.status === 'SUCCEEDED' || payment.status === 'CANCELED' || payment.status === 'FAILED') {
    return { handled: true };
  }

  if (input.status === 'canceled') {
    if (payment.kind === 'RENEWAL' && payment.enrollmentId) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'CANCELED', rawWebhook: input.raw as object },
        }),
        prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { autoRenew: false },
        }),
        prisma.notification.create({
          data: {
            userId: payment.userId,
            kind: 'PAYMENT',
            title: 'Не удалось продлить подписку',
            body: 'Автопродление отключено. После окончания периода оформите подписку снова.',
            href: '/profile?tab=billing',
          },
        }),
      ]);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELED', rawWebhook: input.raw as object },
      });
    }
    return { handled: true };
  }

  if (input.status !== 'succeeded') {
    // pending — просто фиксируем сырьё, доступ не меняем.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { rawWebhook: input.raw as object },
    });
    return { handled: true };
  }

  // succeeded → в транзакции: пометить платёж, активировать/апгрейдить Enrollment.
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED', paidAt: new Date(), rawWebhook: input.raw as object },
    });

    const active = await tx.enrollment.findFirst({
      where: { userId: payment.userId, status: 'ACTIVE' },
    });

    const paidAt = new Date();
    const paymentMethodId = savedPaymentMethodId(input.raw);

    if (payment.kind === 'RENEWAL' && active) {
      const periodStart =
        active.expiresAt && active.expiresAt > paidAt ? active.expiresAt : paidAt;
      await tx.enrollment.update({
        where: { id: active.id },
        data: {
          planCode: SUBSCRIPTION_PLAN,
          status: 'ACTIVE',
          expiresAt: addBillingMonth(periodStart),
          autoRenew: true,
          canceledAt: null,
        },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { enrollmentId: active.id } });
    } else if (payment.kind === 'UPGRADE' && active) {
      await tx.enrollment.update({
        where: { id: active.id },
        data: {
          planCode: SUBSCRIPTION_PLAN,
          expiresAt: addBillingMonth(paidAt),
          paymentMethodId,
          autoRenew: Boolean(paymentMethodId),
          canceledAt: null,
        },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { enrollmentId: active.id } });
    } else {
      const enrollment = active
        ? await tx.enrollment.update({
            where: { id: active.id },
            data: {
              planCode: SUBSCRIPTION_PLAN,
              status: 'ACTIVE',
              activatedAt: paidAt,
              expiresAt: addBillingMonth(paidAt),
              paymentMethodId,
              autoRenew: Boolean(paymentMethodId),
              canceledAt: null,
            },
          })
        : await tx.enrollment.create({
            data: {
              userId: payment.userId,
              planCode: SUBSCRIPTION_PLAN,
              status: 'ACTIVE',
              activatedAt: paidAt,
              expiresAt: addBillingMonth(paidAt),
              paymentMethodId,
              autoRenew: Boolean(paymentMethodId),
            },
          });
      await tx.payment.update({ where: { id: payment.id }, data: { enrollmentId: enrollment.id } });
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        kind: 'PAYMENT',
        title: 'Оплата подтверждена',
        body:
          payment.kind === 'RENEWAL'
            ? 'Единая подписка продлена ещё на месяц.'
            : 'Единая подписка активна. Агент-куратор включён.',
        href: '/',
      },
    });
  });

  return { handled: true };
}

/** Списывает оплату по подпискам, срок которых наступил. Запускается worker-ом. */
export async function renewDueSubscriptions(): Promise<{
  succeeded: number;
  pending: number;
  failed: number;
}> {
  const renewalWindow = new Date(Date.now() + 24 * 60 * 60_000);
  const due = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      planCode: SUBSCRIPTION_PLAN,
      autoRenew: true,
      paymentMethodId: { not: null },
      expiresAt: { lte: renewalWindow },
    },
    include: { user: { select: { email: true } }, plan: true },
    take: 100,
  });
  const result = { succeeded: 0, pending: 0, failed: 0 };
  const provider = getPaymentProvider();

  for (const enrollment of due) {
    if (!enrollment.expiresAt || !enrollment.paymentMethodId) continue;
    const idempotenceKey = `renewal:${enrollment.id}:${enrollment.expiresAt.toISOString()}`;
    const existing = await prisma.payment.findUnique({ where: { idempotenceKey } });
    if (existing) continue;

    const payment = await prisma.payment.create({
      data: {
        userId: enrollment.userId,
        enrollmentId: enrollment.id,
        kind: 'RENEWAL',
        targetPlan: SUBSCRIPTION_PLAN,
        amountKopeks: enrollment.plan.priceKopeks,
        status: 'PENDING',
        provider: provider.name,
        idempotenceKey,
      },
    });

    try {
      const fresh = await provider.createRecurringPayment({
        amountKopeks: enrollment.plan.priceKopeks,
        description: 'Ежемесячная подписка на платформу',
        idempotenceKey,
        paymentMethodId: enrollment.paymentMethodId,
        metadata: { paymentId: payment.id, userId: enrollment.userId },
        receipt: {
          customerEmail: enrollment.user.email,
          items: [
            {
              description: 'Ежемесячная подписка на обучающую платформу',
              amountKopeks: enrollment.plan.priceKopeks,
              quantity: 1,
              vatCode: 1,
            },
          ],
        },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerPaymentId: fresh.providerPaymentId },
      });
      await applyPaymentConfirmation({
        providerPaymentId: fresh.providerPaymentId,
        status: fresh.status,
        raw: fresh.raw,
      });
      if (fresh.status === 'succeeded') result.succeeded += 1;
      else if (fresh.status === 'canceled') result.failed += 1;
      else result.pending += 1;
    } catch (error) {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } }),
        prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { autoRenew: false },
        }),
        prisma.notification.create({
          data: {
            userId: enrollment.userId,
            kind: 'PAYMENT',
            title: 'Не удалось продлить подписку',
            body: 'Автопродление отключено. Откройте тариф и оплату, чтобы восстановить доступ.',
            href: '/pay',
          },
        }),
      ]);
      console.error('[payments.renew]', enrollment.id, error);
      result.failed += 1;
    }
  }
  return result;
}
