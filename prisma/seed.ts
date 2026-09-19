import { PrismaClient, type PlanCode } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CONSENT_VERSION = '2026-09-19';

const PLANS: Array<{
  code: PlanCode;
  title: string;
  priceKopeks: number;
  level: number;
  sort: number;
  features: string[];
}> = [
  {
    code: 'SELF',
    title: 'Самостоятельно',
    priceKopeks: 10_000_000,
    level: 1,
    sort: 1,
    features: [
      'Маршрут «Агент за 3 дня»',
      'Базовый набор скиллов',
      'Уроки 10-недельной программы',
      'Юзкейсы с реальными цифрами',
      'Эфиры частично',
    ],
  },
  {
    code: 'SUPPORT',
    title: 'Сопровождение',
    priceKopeks: 20_000_000,
    level: 2,
    sort: 2,
    features: [
      'Всё из «Самостоятельно»',
      'Вся библиотека скиллов',
      'Эфиры полностью',
      'Разбор агента куратором',
      'Еженедельные Zoom-разборы',
    ],
  },
  {
    code: 'VIP',
    title: 'ВИП-внедрение',
    priceKopeks: 40_000_000,
    level: 3,
    sort: 3,
    features: [
      'Всё из «Сопровождения»',
      'Внедрение скиллов под ключ в команду',
      'Приоритетная поддержка',
    ],
  },
];

const TAGS = [
  ['seo', 'SEO'],
  ['direct', 'Директ'],
  ['2gis', '2ГИС'],
  ['content', 'Контент'],
  ['reels', 'Reels'],
  ['reactivation', 'Реактивация'],
  ['crm', 'CRM'],
  ['segmentation', 'Сегментация'],
  ['funnel', 'Воронка'],
  ['positioning', 'Позиционирование'],
  ['telegram', 'Telegram'],
  ['automation', 'Автоматизация'],
  ['analytics', 'Аналитика'],
  ['audit', 'Аудит'],
  ['agent', 'Агент'],
] as const;

async function hash(pw: string) {
  return argon2.hash(pw, { type: argon2.argon2id });
}

async function main() {
  // ── Plans ──
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        title: p.title,
        priceKopeks: p.priceKopeks,
        level: p.level,
        sort: p.sort,
        features: p.features,
      },
      update: { title: p.title, priceKopeks: p.priceKopeks, level: p.level, sort: p.sort, features: p.features },
    });
  }

  // ── Cohort ──
  const cohort = await prisma.cohort.upsert({
    where: { id: 'cohort-1' },
    create: { id: 'cohort-1', title: 'Поток-1', startsAt: new Date('2026-11-01') },
    update: {},
  });

  // ── Staff ──
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.ru').toLowerCase();
  const editorEmail = (process.env.EDITOR_EMAIL ?? 'editor@example.ru').toLowerCase();
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Жаргал (админ)',
      role: 'ADMIN',
      passwordHash: await hash(process.env.ADMIN_PASSWORD ?? 'change-me-admin'),
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
    },
    update: { role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: editorEmail },
    create: {
      email: editorEmail,
      name: 'Редактор',
      role: 'EDITOR',
      passwordHash: await hash(process.env.EDITOR_PASSWORD ?? 'change-me-editor'),
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
    },
    update: { role: 'EDITOR' },
  });

  // ── Demo students (dev/staging only) ──
  const demo: Array<{ email: string; name: string; plan: PlanCode }> = [
    { email: 'student-self@example.ru', name: 'Аюна (SELF)', plan: 'SELF' },
    { email: 'student-support@example.ru', name: 'Баир (SUPPORT)', plan: 'SUPPORT' },
    { email: 'student-vip@example.ru', name: 'Сэсэг (VIP)', plan: 'VIP' },
  ];
  for (const d of demo) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      create: {
        email: d.email,
        name: d.name,
        role: 'STUDENT',
        passwordHash: await hash('demo-password-123'),
        emailVerifiedAt: new Date(),
        consentAt: new Date(),
        consentVersion: CONSENT_VERSION,
        cohortId: cohort.id,
      },
      update: { cohortId: cohort.id },
    });

    const existing = await prisma.enrollment.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    });
    if (!existing) {
      await prisma.enrollment.create({
        data: { userId: user.id, planCode: d.plan, status: 'ACTIVE', activatedAt: new Date() },
      });
    }

    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName: `${d.name.split(' ')[0]} и Ко`,
        niche: 'Локальный сервис',
        whoAmI: 'Собственник микробизнеса, хочу системный маркетинг.',
        product: 'Услуги с средним чеком 5 000 ₽.',
        audience: 'Локальные клиенты, ищут в 2ГИС и Директе.',
        brandVoice: 'Дружелюбный, без канцелярита.',
        goals: 'Стабильный поток заявок.',
        monthlyRevenueBand: '300k-1m',
      },
      update: {},
    });
  }

  // ── Tags ──
  for (const [slug, title] of TAGS) {
    await prisma.tag.upsert({ where: { slug }, create: { slug, title }, update: { title } });
  }

  // ── Legal drafts ──
  await prisma.legalDocument.upsert({
    where: { kind_version: { kind: 'PRIVACY', version: CONSENT_VERSION } },
    create: {
      kind: 'PRIVACY',
      version: CONSENT_VERSION,
      bodyHtml:
        '<h2>Политика обработки персональных данных</h2><p>Черновик. Данные хранятся в РФ-контуре (152-ФЗ). Итоговый текст согласуется с заказчиком.</p>',
    },
    update: {},
  });
  await prisma.legalDocument.upsert({
    where: { kind_version: { kind: 'OFFER', version: CONSENT_VERSION } },
    create: {
      kind: 'OFFER',
      version: CONSENT_VERSION,
      bodyHtml: '<h2>Публичная оферта</h2><p>Черновик оферты. Итоговый текст согласуется с заказчиком.</p>',
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log('Seed завершён: 3 тарифа, admin/editor, 3 демо-студента, теги, легал-черновики.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
