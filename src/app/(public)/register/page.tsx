import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Регистрация' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  return (
    <AuthHero
      kicker="Регистрация"
      title="Создать аккаунт"
      description="После подтверждения email выберите тариф и оплатите доступ."
      sidePanel={{
        label: 'Registry // New',
        lines: [
          'Поток-1 стартует в ноябре 2026.',
          'Одна подписка: весь контент и агент-куратор за 5 000 ₽ в месяц.',
          'Данные хранятся в РФ-контуре (152-ФЗ).',
        ],
      }}
    >
      <RegisterForm invite={invite} />
    </AuthHero>
  );
}
