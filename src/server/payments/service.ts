import { randomUUID } from 'node:crypto';
import type { PlanCode } from '@prisma/client';
import { prisma } from '@/server/db';
import { env } from '@/lib/env';
import { getPaymentProvider } from './index';
import { computeCharge } from './pricing';
import type { ProviderStatus } from './provider';

/** Активный тариф пользователя (или null). */
async function currentActivePlan(userId: string): Promise<PlanCode | null> {
  const e = await prisma.enrollment.findFirst({
    where: { userId, status: 'ACTIVE' },
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
    description:
      charge.kind === 'PURCHASE'
        ? `Доступ к платформе: тариф ${charge.targetPlan}`
        : `Апгрейд тарифа до ${charge.targetPlan}`,
    returnUrl: `${env.APP_URL}/pay/result?paymentId=${payment.id}`,
    idempotenceKey,
    metadata: { paymentId: payment.id, userId: input.userId },
    receipt: {
      customerEmail: input.userEmail,
      items: [
        {
          description: 'Доступ к обучающей платформе',
          amountKopeks: charge.amountKopeks,
          quantity: 1,
          vatCode: 1, // без НДС / по настройке налогообложения
        },
      ],
    },
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
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELED', rawWebhook: input.raw as object },
    });
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

    if (payment.kind === 'UPGRADE' && active) {
      await tx.enrollment.update({
        where: { id: active.id },
        data: { planCode: payment.targetPlan },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { enrollmentId: active.id } });
    } else {
      const enrollment = active
        ? await tx.enrollment.update({
            where: { id: active.id },
            data: { planCode: payment.targetPlan, status: 'ACTIVE', activatedAt: new Date() },
          })
        : await tx.enrollment.create({
            data: {
              userId: payment.userId,
              planCode: payment.targetPlan,
              status: 'ACTIVE',
              activatedAt: new Date(),
            },
          });
      await tx.payment.update({ where: { id: payment.id }, data: { enrollmentId: enrollment.id } });
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        kind: 'PAYMENT',
        title: 'Оплата подтверждена',
        body: `Доступ к тарифу ${payment.targetPlan} открыт.`,
        href: '/',
      },
    });
  });

  return { handled: true };
}
