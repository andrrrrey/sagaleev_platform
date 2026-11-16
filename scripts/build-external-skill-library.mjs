import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const sourceRoot = resolve(process.argv[2] ?? '/Users/a/Documents/Skills');
const outputPath = resolve(
  process.argv[3] ?? join(process.cwd(), 'content', 'external-skill-library.json'),
);

if (!existsSync(sourceRoot)) {
  throw new Error(`Каталог с исходными скиллами не найден: ${sourceRoot}`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() && entry.name === 'SKILL.md' ? [path] : [];
  });
}

function frontmatterValue(source, key) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) return '';
  const lines = match[1].split('\n');
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index < 0) return '';

  const first = lines[index].slice(key.length + 1).trim();
  if (first && !['>', '>-', '|', '|-'].includes(first)) {
    return first.replace(/^['"]|['"]$/g, '').trim();
  }

  const values = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (/^[A-Za-z][A-Za-z0-9_-]*:/.test(line)) break;
    if (line.trim()) values.push(line.trim());
  }
  return values.join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function plainText(value) {
  return value
    .replace(/[`*_>#\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFrom(source, slug) {
  const body = source.replace(/^---\s*\n[\s\S]*?\n---\s*/, '');
  const heading = body.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return plainText(heading).slice(0, 180);
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function classify(slug, title, description, owner) {
  const text = `${slug} ${title} ${description} ${owner}`.toLowerCase();
  if (/seo|traffic|ads|direct|реклам|трафик|semant|instagram|youtube|social/.test(text)) {
    return 'TRAFFIC';
  }
  if (/brand|content|reels|video|design|visual|illustr|carousel|copy|story|animation|motion|контент|бренд/.test(text)) {
    return 'CONTENT';
  }
  if (/crm|sales|retention|reactivat|client|customer|ворон|продаж|клиент/.test(text)) {
    return 'RETENTION';
  }
  if (/agent|mcp|server|code|dev|debug|deploy|git|browser|system|memory|infra|skill|агент/.test(text)) {
    return 'AGENT_INFRA';
  }
  return 'STRATEGY';
}

function candidateScore(candidate) {
  const { owner, slug, prompt } = candidate;
  let score = Math.min(prompt.length / 10_000, 8);
  if (owner === 'jarvis') score += 20;
  if (owner === 'manshud' && /brand|content|design|reels|video|visual|carousel/.test(slug)) score += 35;
  if (owner === 'traffic' && /seo|traffic|ads|direct|research/.test(slug)) score += 40;
  if (owner === 'varis' && /agent|mcp|server|code|dev|deploy|infra|debug|browser/.test(slug)) score += 30;
  if (owner === 'shared') score += 5;
  return score;
}

const candidates = [];
for (const path of walk(sourceRoot)) {
  const prompt = readFileSync(path, 'utf8').trim();
  const parts = relative(sourceRoot, path).split(sep);
  const owner = parts.at(-3) ?? 'shared';
  const folderName = parts.at(-2) ?? '';
  const declaredName = frontmatterValue(prompt, 'name');
  const slug = normalizeSlug(declaredName || folderName);
  if (!slug) continue;

  const description = plainText(frontmatterValue(prompt, 'description'));
  const companionFiles = readdirSync(dirname(path), { withFileTypes: true })
    .filter((entry) => entry.name !== 'SKILL.md')
    .map((entry) => entry.name)
    .sort();

  candidates.push({
    slug,
    title: titleFrom(prompt, slug),
    description,
    prompt,
    owner,
    source: parts.join('/'),
    companionFiles,
    hash: createHash('sha256').update(prompt).digest('hex'),
  });
}

const bySlug = new Map();
for (const candidate of candidates) {
  const current = bySlug.get(candidate.slug);
  if (!current || candidateScore(candidate) > candidateScore(current)) {
    bySlug.set(candidate.slug, candidate);
  }
}

const skills = [...bySlug.values()]
  .sort((left, right) => left.slug.localeCompare(right.slug))
  .map((candidate, index) => {
    const group = classify(candidate.slug, candidate.title, candidate.description, candidate.owner);
    const dependencyNote = candidate.companionFiles.length
      ? ` Есть дополнительные файлы: ${candidate.companionFiles.join(', ')}.`
      : '';
    return {
      slug: candidate.slug,
      title: candidate.title,
      group,
      shortDesc:
        (candidate.description || `Инструкция агента «${candidate.title}».`).slice(0, 700) +
        dependencyNote,
      inputs: 'Задача пользователя, рабочий контекст и разрешённые исходные материалы.',
      outputs: 'Результат по этапам, ограничениям и формату, описанным в инструкции скилла.',
      timeToMaster: 'Используется агентом',
      minPlan: 'SUPPORT',
      state: 'DRAFT',
      sort: 10_000 + index,
      tags: ['external-library', candidate.owner, group.toLowerCase()],
      prompt: candidate.prompt,
      source: candidate.source,
      hasCompanionFiles: candidate.companionFiles.length > 0,
      hash: candidate.hash,
    };
  });

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceRoot: 'Documents/Skills',
  sourceFiles: candidates.length,
  uniqueSkills: skills.length,
  duplicateFiles: candidates.length - skills.length,
  skills,
};

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
  `Каталог собран: ${manifest.sourceFiles} файлов, ${manifest.uniqueSkills} уникальных скиллов, ` +
    `${manifest.duplicateFiles} дублей.`,
);
console.log(`Манифест: ${outputPath}`);
