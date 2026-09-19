import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const metadata: Metadata = { title: 'Восстановление пароля' };

export default function ForgotPage() {
  return (
    <AuthHero
      kicker="Доступ"
      title="Восстановить пароль"
      description="Введите email — пришлём ссылку для сброса пароля."
      sidePanel={{
        label: 'Recovery // Standby',
        lines: ['Ссылка действует 1 час.', 'Ответ одинаков для любого email.'],
      }}
    >
      <ForgotForm />
    </AuthHero>
  );
}
