import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Вход' };

export default function LoginPage() {
  return (
    <AuthHero
      kicker="Доступ"
      title="Войти в цифровой отдел маркетинга"
      description="Закрытый портал для собственников микробизнеса."
    >
      <LoginForm />
    </AuthHero>
  );
}
