import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Вход' };

const NOTICES: Record<string, string> = {
  ok: 'Email подтверждён. Теперь можно войти.',
  invalid: 'Ссылка подтверждения недействительна или истекла.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const { verify } = await searchParams;
  const notice = verify ? NOTICES[verify] : undefined;

  return (
    <AuthHero
      kicker="Доступ"
      title="Войти в цифровой отдел маркетинга"
      description="Закрытый портал для собственников микробизнеса."
    >
      <LoginForm notice={notice} />
    </AuthHero>
  );
}
