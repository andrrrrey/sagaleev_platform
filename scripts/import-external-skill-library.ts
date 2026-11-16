import { PrismaClient, type PlanCode, type PublishState, type SkillGroup } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type ManifestSkill = {
  slug: string;
  title: string;
  group: SkillGroup;
  shortDesc: string;
  inputs: string;
  outputs: string;
  timeToMaster: string;
  minPlan: PlanCode;
  state: PublishState;
  sort: number;
  tags: string[];
  prompt: string;
  source: string;
  hasCompanionFiles: boolean;
  hash: string;
};

type Manifest = {
  sourceFiles: number;
  uniqueSkills: number;
  duplicateFiles: number;
  skills: ManifestSkill[];
};

const prisma = new PrismaClient();
const manifestPath = join(process.cwd(), 'content', 'external-skill-library.json');

function tagTitle(slug: string) {
  const titles: Record<string, string> = {
    'external-library': 'Внешняя библиотека',
    jarvis: 'Jarvis',
    manshud: 'Маншуд',
    traffic: 'Трафик',
    varis: 'Варис',
    shared: 'Общий',
    strategy: 'Стратегия',
    content: 'Контент',
    retention: 'Удержание',
    agent_infra: 'Инфраструктура агентов',
  };
  return titles[slug] ?? slug;
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
  const existing = new Set(
    (await prisma.skill.findMany({ select: { slug: true } })).map((skill) => skill.slug),
  );

  const allTags = [...new Set(manifest.skills.flatMap((skill) => skill.tags))];
  for (const slug of allTags) {
    await prisma.tag.upsert({
      where: { slug },
      create: { slug, title: tagTitle(slug) },
      update: { title: tagTitle(slug) },
    });
  }
  const tagRows = await prisma.tag.findMany({
    where: { slug: { in: allTags } },
    select: { id: true, slug: true },
  });
  const tagIds = new Map(tagRows.map((tag) => [tag.slug, tag.id]));

  let created = 0;
  let skipped = 0;
  for (const skill of manifest.skills) {
    if (existing.has(skill.slug)) {
      skipped += 1;
      continue;
    }

    await prisma.skill.create({
      data: {
        slug: skill.slug,
        title: skill.title,
        group: skill.group,
        shortDesc: skill.shortDesc,
        inputs: skill.inputs,
        outputs: skill.outputs,
        timeToMaster: skill.timeToMaster,
        minPlan: skill.minPlan,
        state: 'DRAFT',
        sort: skill.sort,
        prompt: skill.prompt,
        tags: {
          create: skill.tags.flatMap((slug) => {
            const tagId = tagIds.get(slug);
            return tagId ? [{ tagId }] : [];
          }),
        },
      },
    });
    created += 1;
  }

  console.log(
    `Импорт завершён: создано ${created}, пропущено существующих ${skipped}. ` +
      `В исходнике ${manifest.sourceFiles} файлов / ${manifest.uniqueSkills} уникальных.`,
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
