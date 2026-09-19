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
  const tagRows = await prisma.tag.findMany({ select: { id: true, slug: true } });
  const tagId = (slug: string) => tagRows.find((t) => t.slug === slug)?.id;

  // ── Skills (12, из них 5 minPlan=SELF) ──
  const skills: Array<{
    slug: string;
    title: string;
    group: 'STRATEGY' | 'TRAFFIC' | 'CONTENT' | 'RETENTION' | 'AGENT_INFRA';
    shortDesc: string;
    inputs: string;
    outputs: string;
    timeToMaster: string;
    minPlan: PlanCode;
    prompt: string;
    tags: string[];
    fileName?: string;
    fileKey?: string;
  }> = [
    {
      slug: 'pozicionirovanie', title: 'Позиционирование за час', group: 'STRATEGY',
      shortDesc: 'Формулирует чёткое позиционирование бренда на основе бизнес-профиля.',
      inputs: 'Бизнес-профиль, ниша, конкуренты.', outputs: 'Позиционирование, УТП, 3 сообщения.',
      timeToMaster: '30 минут', minPlan: 'SELF', tags: ['positioning', 'segmentation'],
      prompt: 'Ты стратег-маркетолог. На основе бизнес-профиля сформулируй позиционирование:\n1) кто клиент, 2) какую боль решаем, 3) чем отличаемся, 4) УТП одним предложением.\n⏸ СТОП: согласуй УТП с владельцем перед использованием.',
    },
    {
      slug: 'abcdx-segmentaciya', title: 'Сегментация ABCDX', group: 'STRATEGY',
      shortDesc: 'Разбивает клиентскую базу по ценности и приоритезирует сегменты.',
      inputs: 'Выгрузка клиентов/сделок.', outputs: 'Матрица ABCDX, приоритеты.',
      timeToMaster: '45 минут', minPlan: 'SUPPORT', tags: ['segmentation', 'crm', 'analytics'],
      prompt: 'Проведи ABCDX-сегментацию клиентской базы. Опиши профиль каждого сегмента и рекомендации по работе.',
    },
    {
      slug: 'seo-audit', title: 'SEO-аудит выдачи', group: 'TRAFFIC',
      shortDesc: 'Проводит экспресс-аудит сайта и выдачи по ключевым запросам.',
      inputs: 'URL сайта, список запросов.', outputs: 'Список проблем и приоритетов по SEO.',
      timeToMaster: '30 минут', minPlan: 'SELF', tags: ['seo', 'audit'],
      prompt: 'Проведи SEO-аудит сайта по запросам. Дай приоритезированный список улучшений (3 слоя: SEO/AEO/GEO).',
      fileName: 'seo-audit-checklist.md', fileKey: 'skills/seo-audit-checklist.md',
    },
    {
      slug: 'direct-nastrojka', title: 'Настройка Яндекс.Директ', group: 'TRAFFIC',
      shortDesc: 'Собирает структуру кампаний и минус-слова для Директа.',
      inputs: 'Услуги, гео, бюджет.', outputs: 'Структура кампаний, ключи, объявления.',
      timeToMaster: '1 час', minPlan: 'SUPPORT', tags: ['direct'],
      prompt: 'Собери структуру рекламных кампаний в Яндекс.Директ: группы, ключи, минус-слова, тексты объявлений.',
    },
    {
      slug: 'gis-2-kartochka', title: 'Карточка 2ГИС', group: 'TRAFFIC',
      shortDesc: 'Оптимизирует карточку компании в 2ГИС для локального трафика.',
      inputs: 'Данные компании, категории.', outputs: 'Оптимизированная карточка, чек-лист.',
      timeToMaster: '20 минут', minPlan: 'SUPPORT', tags: ['2gis'],
      prompt: 'Оптимизируй карточку 2ГИС: категории, описание, фото, ответы на отзывы.',
    },
    {
      slug: 'kontent-plan', title: 'Контент-план на месяц', group: 'CONTENT',
      shortDesc: 'Собирает контент-план под нишу и голос бренда.',
      inputs: 'Бизнес-профиль, площадки.', outputs: 'Контент-план на 4 недели.',
      timeToMaster: '40 минут', minPlan: 'SELF', tags: ['content'],
      prompt: 'Составь контент-план на месяц с учётом голоса бренда из бизнес-профиля. Форматы, темы, CTA.',
    },
    {
      slug: 'reels-scenarii', title: 'Сценарии Reels', group: 'CONTENT',
      shortDesc: 'Пишет сценарии коротких видео с хуками.',
      inputs: 'Темы, продукт.', outputs: '5 сценариев с хуками.',
      timeToMaster: '30 минут', minPlan: 'SUPPORT', tags: ['reels', 'content'],
      prompt: 'Напиши 5 сценариев Reels с сильными хуками под нишу клиента.',
    },
    {
      slug: 'stati-seo', title: 'SEO-статьи движком', group: 'CONTENT',
      shortDesc: 'Генерирует SEO-оптимизированные статьи ≥ 82/100.',
      inputs: 'Ключи, тема.', outputs: 'Статья с оценкой и разметкой.',
      timeToMaster: '1 час', minPlan: 'SUPPORT', tags: ['seo', 'content'],
      prompt: 'Напиши SEO-статью по теме, цель ≥ 82/100. Структура, заголовки, внутренние ссылки.',
    },
    {
      slug: 'reaktivaciya-bazy', title: 'Реактивация базы', group: 'RETENTION',
      shortDesc: 'Готовит сценарий возврата «спящих» клиентов.',
      inputs: 'База контактов, история покупок.', outputs: 'Сегменты и цепочка сообщений.',
      timeToMaster: '30 минут', minPlan: 'SELF', tags: ['reactivation', 'crm'],
      prompt: 'Составь сценарий реактивации базы: сегменты, поводы, тексты сообщений.',
    },
    {
      slug: 'crm-voronka', title: 'Воронка в CRM', group: 'RETENTION',
      shortDesc: 'Проектирует этапы воронки и триггеры в CRM.',
      inputs: 'Процесс продаж.', outputs: 'Этапы, поля, автозадачи.',
      timeToMaster: '50 минут', minPlan: 'SUPPORT', tags: ['crm', 'funnel'],
      prompt: 'Спроектируй воронку продаж в CRM: этапы, критерии перехода, автозадачи.',
    },
    {
      slug: 'agent-pamyat', title: 'Память агента', group: 'AGENT_INFRA',
      shortDesc: 'Настраивает память агента между сессиями.',
      inputs: 'Бизнес-профиль, наработки.', outputs: 'Структура памяти агента.',
      timeToMaster: '20 минут', minPlan: 'SELF', tags: ['agent', 'automation'],
      prompt: 'Настрой память агента: что хранить, как структурировать, как обновлять.',
    },
    {
      slug: 'agent-telegram', title: 'Агент в Telegram', group: 'AGENT_INFRA',
      shortDesc: 'Выводит агента в Telegram-бота студента.',
      inputs: 'Токен бота студента.', outputs: 'Рабочий агент в мессенджере.',
      timeToMaster: '40 минут', minPlan: 'SUPPORT', tags: ['agent', 'telegram', 'automation'],
      prompt: 'Пошагово выведи агента в Telegram: создание бота, вебхук, команды. Ключи не передавай платформе.',
    },
  ];

  for (const s of skills) {
    const created = await prisma.skill.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug, title: s.title, group: s.group, shortDesc: s.shortDesc,
        inputs: s.inputs, outputs: s.outputs, timeToMaster: s.timeToMaster,
        prompt: s.prompt, minPlan: s.minPlan, state: 'PUBLISHED',
        fileName: s.fileName ?? null, fileKey: s.fileKey ?? null,
      },
      update: {
        title: s.title, group: s.group, shortDesc: s.shortDesc, inputs: s.inputs,
        outputs: s.outputs, timeToMaster: s.timeToMaster, prompt: s.prompt,
        minPlan: s.minPlan, state: 'PUBLISHED',
        fileName: s.fileName ?? null, fileKey: s.fileKey ?? null,
      },
    });
    await prisma.skillTag.deleteMany({ where: { skillId: created.id } });
    const ids = s.tags.map(tagId).filter((x): x is string => Boolean(x));
    if (ids.length) {
      await prisma.skillTag.createMany({
        data: ids.map((id) => ({ skillId: created.id, tagId: id })),
        skipDuplicates: true,
      });
    }
  }

  const skillIdBySlug = async (slug: string) =>
    (await prisma.skill.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;

  // ── Маршрут «Агент за 3 дня» ──
  const routeDays = [
    {
      dayNumber: 1, title: 'Фундамент', artifact: 'Агент, который знает твой бизнес',
      summary: 'Окружение, личность агента и загрузка бизнеса в память.',
      steps: [
        { sort: 0, title: 'Поставь окружение (Claude Code)', body: '<p>Установи окружение и проверь доступ.</p>', commands: [{ label: 'Проверка', text: 'claude --version', kind: 'command' }], artifactRequired: true, artifactHint: 'скрин версии', linkedSlug: null },
        { sort: 1, title: 'Задай личность агента', body: '<p>Опиши роль и тон агента.</p>', commands: [{ label: 'Личность', text: 'Ты — маркетинговый агент моего бизнеса...', kind: 'prompt' }], artifactRequired: true, artifactHint: 'файл личности', linkedSlug: null },
        { sort: 2, title: 'Загрузи бизнес-профиль в память', body: '<p>Скопируй бизнес-профиль из кабинета и загрузи агенту.</p>', commands: [], artifactRequired: true, artifactHint: 'подтверждение загрузки', linkedSlug: 'agent-pamyat' },
      ],
    },
    {
      dayNumber: 2, title: 'Первая боевая работа', artifact: 'Агент делает маркетинг, а не болтает',
      summary: 'Подключение 2–3 маркетинг-скиллов: аудит и позиционирование/контент.',
      steps: [
        { sort: 0, title: 'Подключи SEO-аудит', body: '<p>Отправь агенту скилл SEO-аудита.</p>', commands: [], artifactRequired: true, artifactHint: 'результат аудита', linkedSlug: 'seo-audit' },
        { sort: 1, title: 'Собери позиционирование', body: '<p>Используй скилл позиционирования.</p>', commands: [], artifactRequired: true, artifactHint: 'УТП', linkedSlug: 'pozicionirovanie' },
        { sort: 2, title: 'Сделай контент-план', body: '<p>Сгенерируй контент-план на месяц.</p>', commands: [], artifactRequired: true, artifactHint: 'план', linkedSlug: 'kontent-plan' },
      ],
    },
    {
      dayNumber: 3, title: 'Агент в кармане + автоматизация', artifact: 'Маркетинговый агент 24/7 в мессенджере',
      summary: 'Вывод в Telegram, память между сессиями, первый крон.',
      steps: [
        { sort: 0, title: 'Выведи агента в Telegram', body: '<p>Создай бота и подключи агента. Платформа ключи не хранит.</p>', commands: [], artifactRequired: true, artifactHint: 'скрин чата с ботом', linkedSlug: 'agent-telegram' },
        { sort: 1, title: 'Настрой память между сессиями', body: '<p>Проверь, что агент помнит контекст.</p>', commands: [], artifactRequired: true, artifactHint: 'подтверждение', linkedSlug: 'agent-pamyat' },
        { sort: 2, title: 'Запусти первый крон', body: '<p>Настрой регулярную задачу агента.</p>', commands: [{ label: 'Пример', text: '0 9 * * 1 напомни план на неделю', kind: 'command' }], artifactRequired: true, artifactHint: 'расписание', linkedSlug: null },
      ],
    },
  ];

  for (const d of routeDays) {
    const day = await prisma.routeDay.upsert({
      where: { dayNumber: d.dayNumber },
      create: { dayNumber: d.dayNumber, title: d.title, summary: d.summary, artifact: d.artifact },
      update: { title: d.title, summary: d.summary, artifact: d.artifact },
    });
    for (const st of d.steps) {
      const linkedSkillId = st.linkedSlug ? await skillIdBySlug(st.linkedSlug) : null;
      await prisma.routeStep.upsert({
        where: { dayId_sort: { dayId: day.id, sort: st.sort } },
        create: {
          dayId: day.id, sort: st.sort, title: st.title, body: st.body,
          commands: st.commands, artifactRequired: st.artifactRequired,
          artifactHint: st.artifactHint, linkedSkillId,
        },
        update: {
          title: st.title, body: st.body, commands: st.commands,
          artifactRequired: st.artifactRequired, artifactHint: st.artifactHint, linkedSkillId,
        },
      });
    }
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
  console.log('Seed завершён: тарифы, admin/editor, демо-студенты, теги, 12 скиллов, маршрут 3 дня, легал.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
