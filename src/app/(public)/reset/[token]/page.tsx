import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';
import { ResetForm } from '@/components/auth/ResetForm';

export const metadata: Metadata = { title: 'Новый пароль' };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthHero
      kicker="Доступ"
      title="Новый пароль"
      description="Задайте новый пароль для входа."
      sidePanel={{ label: 'Recovery // Reset', lines: ['Минимум 10 символов.'] }}
    >
      <ResetForm token={token} />
    </AuthHero>
  );
}
