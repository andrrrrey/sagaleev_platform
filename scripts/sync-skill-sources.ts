import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const sourceRoot = join(process.cwd(), 'content', 'skills');

async function main() {
  if (!existsSync(sourceRoot)) throw new Error(`Каталог скиллов не найден: ${sourceRoot}`);

  const slugs = readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let updated = 0;
  const missing: string[] = [];

  for (const slug of slugs) {
    const sourcePath = join(sourceRoot, slug, 'SKILL.md');
    if (!existsSync(sourcePath)) continue;
    const skill = await prisma.skill.findUnique({ where: { slug }, select: { id: true } });
    if (!skill) {
      missing.push(slug);
      continue;
    }
    await prisma.skill.update({
      where: { id: skill.id },
      data: {
        prompt: readFileSync(sourcePath, 'utf8').trim(),
        fileKey: null,
        fileName: null,
      },
    });
    updated += 1;
  }

  console.log(`Полные инструкции синхронизированы: ${updated}.`);
  if (missing.length > 0) console.log(`Нет карточек в БД: ${missing.join(', ')}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
