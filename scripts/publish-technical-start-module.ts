import { readFileSync } from 'node:fs';
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_SLUG = 'digital-marketing-department';
const MODULE_ID = 'technical-agent-start-module';
const SOURCE_URL = new URL('../docs/technical-agent-start-module.md', import.meta.url);

const lessons = [
  {
    number: 1,
    slug: 'technical-start-agent-basics',
    summary:
      'Разбираемся, чем отличаются языковая модель, локальный помощник, Hermes и VPS, и готовим безопасное рабочее место.',
    timeToMaster: '15–20 минут',
  },
  {
    number: 2,
    slug: 'technical-start-vps-and-ssh',
    summary:
      'Выбираем зарубежный VPS, создаём SSH-ключ и безопасно подключаем локального помощника к серверу.',
    timeToMaster: '25–40 минут',
  },
  {
    number: 3,
    slug: 'technical-start-hermes-and-model',
    summary:
      'Устанавливаем Hermes из официального источника, подключаем провайдера модели и проверяем первый диалог.',
    timeToMaster: '25–45 минут',
  },
  {
    number: 4,
    slug: 'technical-start-telegram',
    summary:
      'Создаём Telegram-бота, ограничиваем доступ и включаем круглосуточный запуск Hermes после перезагрузки VPS.',
    timeToMaster: '20–30 минут',
  },
  {
    number: 5,
    slug: 'technical-start-agent-instructions',
    summary:
      'Задаём первому агенту роль координатора, постоянную личность, алгоритм работы и безопасные границы.',
    timeToMaster: '20–30 минут',
  },
  {
    number: 6,
    slug: 'technical-start-platform-mcp',
    summary:
      'Подключаем Hermes к MCP платформы, читаем бизнес-профиль и проверяем поиск и получение скиллов.',
    timeToMaster: '20–30 минут',
  },
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(value: string): string {
  let html = escapeHtml(value);
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  html = html.replace(/&lt;(https?:\/\/[^&\s]+)&gt;/g, (_match, url: string) => {
    const safeUrl = url.replace(/&quot;/g, '');
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function markdownToRichHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let code: string[] | null = null;
  let tableRows: string[][] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };

  const flushTable = () => {
    if (!tableRows?.length) return;
    const rows = tableRows.filter(
      (row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell.trim())),
    );
    const dataRows = rows.length > 1 ? rows.slice(1) : rows;
    output.push('<ul>');
    for (const row of dataRows) {
      const [label, ...rest] = row;
      const value = rest.join(' — ');
      output.push(
        `<li><strong>${inlineMarkdown(label ?? '')}</strong>${value ? ` — ${inlineMarkdown(value)}` : ''}</li>`,
      );
    }
    output.push('</ul>');
    tableRows = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      flushParagraph();
      closeList();
      flushTable();
      if (code) {
        output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else {
        code = [];
      }
      continue;
    }

    if (code) {
      code.push(rawLine);
      continue;
    }

    if (/^\|.*\|$/.test(line.trim())) {
      flushParagraph();
      closeList();
      tableRows ??= [];
      tableRows.push(
        line
          .trim()
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim()),
      );
      continue;
    }
    flushTable();

    if (!line.trim() || line.trim() === '---') {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1]!.length;
      output.push(`<h${level}>${inlineMarkdown(heading[2]!)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        output.push(`<${listType}>`);
      }
      let item = (unordered?.[1] ?? ordered?.[1] ?? '').trim();
      item = item.replace(/^\[ \]\s*/, '☐ ').replace(/^\[x\]\s*/i, '☑ ');
      output.push(`<li>${inlineMarkdown(item)}</li>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  flushTable();
  if (code) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return output.join('\n');
}

function extractLesson(source: string, number: number): { title: string; markdown: string } {
  const lessonPattern = /^# Урок (\d+)\. (.+)$/gm;
  const matches = [...source.matchAll(lessonPattern)];
  const currentIndex = matches.findIndex((match) => Number(match[1]) === number);
  if (currentIndex < 0) throw new Error(`В документе не найден урок ${number}`);

  const current = matches[currentIndex]!;
  const next = matches[currentIndex + 1];
  const start = (current.index ?? 0) + current[0].length;
  const end = next?.index ?? source.indexOf('\n# Сценарий короткого вводного видео', start);
  const markdown = source
    .slice(start, end > start ? end : source.length)
    .replace(/\n---\s*$/, '')
    .trim();
  return { title: current[2]!.trim(), markdown };
}

async function main() {
  const source = readFileSync(SOURCE_URL, 'utf8');
  const course = await prisma.course.findUnique({
    where: { slug: COURSE_SLUG },
    select: { id: true, title: true },
  });
  if (!course) throw new Error(`Курс ${COURSE_SLUG} не найден`);

  const prepared = lessons.map((lesson) => {
    const extracted = extractLesson(source, lesson.number);
    return { ...lesson, ...extracted, articleHtml: markdownToRichHtml(extracted.markdown) };
  });

  await prisma.$transaction(async (tx) => {
    const courseModule = await tx.courseModule.upsert({
      where: { id: MODULE_ID },
      create: {
        id: MODULE_ID,
        courseId: course.id,
        title: 'Технический старт: запускаем первого агента',
        summary:
          'От базовых понятий и выбора VPS до работающего Hermes Agent в Telegram — пошагово для нетехнического пользователя.',
        sort: 0,
      },
      update: {
        courseId: course.id,
        title: 'Технический старт: запускаем первого агента',
        summary:
          'От базовых понятий и выбора VPS до работающего Hermes Agent в Telegram — пошагово для нетехнического пользователя.',
        sort: 0,
      },
    });

    for (const lesson of prepared) {
      const data: Prisma.ContentUnitUncheckedCreateInput = {
        type: 'LESSON',
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        timeToMaster: lesson.timeToMaster,
        minPlan: 'SUPPORT',
        partialFreePreview: false,
        state: 'PUBLISHED',
        publishedAt: new Date(),
        sort: lesson.number,
        article: { html: lesson.articleHtml },
      };

      const unit = await tx.contentUnit.upsert({
        where: { slug: lesson.slug },
        create: data,
        update: {
          title: data.title,
          summary: data.summary,
          timeToMaster: data.timeToMaster,
          minPlan: data.minPlan,
          partialFreePreview: false,
          state: 'PUBLISHED',
          publishedAt: new Date(),
          sort: lesson.number,
          article: data.article,
        },
      });

      await tx.courseUnit.upsert({
        where: { moduleId_unitId: { moduleId: courseModule.id, unitId: unit.id } },
        create: { moduleId: courseModule.id, unitId: unit.id, sort: lesson.number },
        update: { sort: lesson.number },
      });
    }
  });

  const publishedModule = await prisma.courseModule.findUnique({
    where: { id: MODULE_ID },
    include: {
      units: {
        orderBy: { sort: 'asc' },
        include: { unit: { select: { slug: true, title: true, state: true, minPlan: true } } },
      },
    },
  });

  if (!publishedModule || publishedModule.units.length !== lessons.length) {
    throw new Error('Проверка публикации не пройдена: модуль или уроки отсутствуют');
  }

  console.log(`Курс: ${course.title}`);
  console.log(`Модуль: ${publishedModule.title} (позиция ${publishedModule.sort})`);
  for (const placement of publishedModule.units) {
    console.log(
      `${placement.sort}. ${placement.unit.title} — ${placement.unit.state}, ${placement.unit.minPlan}, /lessons/${placement.unit.slug}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
