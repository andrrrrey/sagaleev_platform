import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!admin) throw new Error('Администратор для записи аудит-лога не найден.');

  const drafts = await prisma.skill.findMany({
    where: {
      state: 'DRAFT',
      tags: { some: { tag: { slug: 'external-library' } } },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDesc: true,
      inputs: true,
      outputs: true,
      prompt: true,
    },
  });

  const invalid = drafts.filter(
    (skill) =>
      !skill.title.trim() ||
      !skill.shortDesc.trim() ||
      !skill.inputs.trim() ||
      !skill.outputs.trim() ||
      !skill.prompt.trim(),
  );
  if (invalid.length > 0) {
    throw new Error(`Не прошли обязательную проверку: ${invalid.map((skill) => skill.slug).join(', ')}`);
  }

  if (drafts.length > 0) {
    await prisma.$transaction([
      prisma.skill.updateMany({
        where: { id: { in: drafts.map((skill) => skill.id) }, state: 'DRAFT' },
        data: { state: 'PUBLISHED' },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'BULK_PUBLISH',
          entity: 'SkillLibrary',
          entityId: 'external-library',
          meta: { count: drafts.length, slugs: drafts.map((skill) => skill.slug) },
        },
      }),
    ]);
  }

  const states = await prisma.skill.groupBy({
    by: ['state'],
    where: { tags: { some: { tag: { slug: 'external-library' } } } },
    _count: { _all: true },
  });
  console.log(`Опубликовано за этот запуск: ${drafts.length}.`);
  console.log(
    `Состояние импортированной библиотеки: ${states
      .map((row) => `${row.state}=${row._count._all}`)
      .join(', ')}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
