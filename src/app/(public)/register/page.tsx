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
      description="Создайте аккаунт и сразу переходите на платформу. Подтверждать email не нужно."
      sidePanel={{
        label: 'Registry // New',
        lines: [
          'Поток-1 стартует в ноябре 2026.',
          'Маршрут на 3 дня и агент-куратор доступны бесплатно.',
          'Уроки, юзкейсы и скиллы — по подписке 5 000 ₽ в месяц.',
          'Данные хранятся в РФ-контуре (152-ФЗ).',
        ],
      }}
    >
      <RegisterForm invite={invite} />
    </AuthHero>
  );
}
