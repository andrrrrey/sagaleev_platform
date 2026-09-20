import { env } from '@/lib/env';
import { getSetting } from '@/server/settings/store';

export type MailMessage = { to: string; subject: string; text: string };

/**
 * Отправка почты. В Ф1 — SMTP (nodemailer) в РФ-контуре. Пока SMTP не задан,
 * письмо логируется (dev). Реальную отправку подключаем в jobs/mail.send.
 * Логи без ПДн-содержимого писем в production.
 */
export async function sendMail(msg: MailMessage): Promise<void> {
  const smtpUrl = await getSetting('SMTP_URL');
  if (!smtpUrl) {
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(`[mail:dev] → ${msg.to} :: ${msg.subject}\n${msg.text}`);
    }
    return;
  }
  // TODO(этап 1/4): nodemailer transport из SMTP_URL, очередь mail.send (pg-boss).
}
