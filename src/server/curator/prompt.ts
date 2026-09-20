import { z } from 'zod';

/** Системный промпт куратора по умолчанию (редактируется в A10). docs/05 §8. */
export const CURATOR_SYSTEM_DEFAULT = `Ты — куратор платформы «Цифровой отдел маркетинга».
Метод: сегментация ABCDX, лестница Ханта, воронка. Тон поддерживающий, без давления.
Правило: дай 1–2 конкретных шага, выполнимых за неделю. Опирайся только на учебные данные.
Не упоминай контактные данные. Ответ строго в JSON по схеме.`;

/** Контекст для куратора — БЕЗ контактов (email/телефон/фамилия). */
export type CuratorContext = {
  firstName: string;
  business: {
    companyName: string;
    niche: string;
    whoAmI: string;
    product: string;
    audience: string;
    brandVoice: string;
    goals?: string | null;
    monthlyRevenueBand?: string | null;
  };
  weekProgress: { title: string; status: string }[];
  routeDone: number;
  routeTotal: number;
  moneyThisWeekKopeks: number;
  weeklyReport?: string | null;
};

/** Сборка пользовательского промпта. Использует только безопасные поля контекста. */
export function buildCuratorUserPrompt(ctx: CuratorContext): string {
  const lines = [
    `Студент: ${ctx.firstName}`,
    `Бизнес: ${ctx.business.companyName}, ниша: ${ctx.business.niche}`,
    `Кто он: ${ctx.business.whoAmI}`,
    `Продукт: ${ctx.business.product}`,
    `Клиент: ${ctx.business.audience}`,
    `Голос бренда: ${ctx.business.brandVoice}`,
    ctx.business.goals ? `Цель: ${ctx.business.goals}` : null,
    ctx.business.monthlyRevenueBand ? `Ориентир выручки: ${ctx.business.monthlyRevenueBand}` : null,
    '',
    `Маршрут: пройдено ${ctx.routeDone} из ${ctx.routeTotal} шагов.`,
    `Прогресс за неделю: ${ctx.weekProgress.map((p) => `${p.title} — ${p.status}`).join('; ') || 'нет активности'}`,
    `Движение по деньгам за неделю: ${Math.round(ctx.moneyThisWeekKopeks / 100)} ₽`,
    ctx.weeklyReport ? `Что сделал за неделю (со слов студента): ${ctx.weeklyReport}` : null,
    '',
    'Сформируй разбор: краткий итог внедрённого, принцип метода и 1–2 следующих шага.',
  ].filter((l): l is string => l !== null);
  return lines.join('\n');
}

/** Схема ответа куратора (structured output). */
export const curatorResponseSchema = z.object({
  summary: z.string().min(1),
  methodPrinciple: z.string().nullable().optional(),
  nextSteps: z
    .array(
      z.object({
        title: z.string().min(1),
        why: z.string().min(1),
        refType: z.enum(['unit', 'skill', 'routeStep']).nullable().optional(),
        refId: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(2),
});
export type CuratorResponse = z.infer<typeof curatorResponseSchema>;

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s()-]{9,})/;

/** Страховка приватности: в тексте не должно быть email/телефона. */
export function assertNoContacts(text: string): void {
  if (EMAIL_RE.test(text)) throw new Error('CONTACT_LEAK_EMAIL');
  if (PHONE_RE.test(text)) throw new Error('CONTACT_LEAK_PHONE');
}
