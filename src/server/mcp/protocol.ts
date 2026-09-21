import type { Actor } from '@/server/access';
import { prisma } from '@/server/db';
import { getRouteDay, getRouteOverview, setStepProgress } from '@/server/route/service';
import { getSkillBySlug, listSkills } from '@/server/skills/service';

export const MCP_PROTOCOL_VERSION = '2025-06-18';

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

const tools = [
  {
    name: 'get_route_overview',
    title: 'Показать прогресс по маршруту',
    description: 'Возвращает три дня курса, число шагов и прогресс пользователя. С этого инструмента начинай помощь по маршруту.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_route_day',
    title: 'Прочитать день маршрута',
    description: 'Возвращает все инструкции, промпты, команды и сохранённые результаты выбранного дня. Объясняй только один следующий шаг за раз и обязательно говори, в какое окно вводить текст.',
    inputSchema: {
      type: 'object',
      properties: { dayNumber: { type: 'integer', minimum: 1, maximum: 3, description: 'Номер дня: 1, 2 или 3' } },
      required: ['dayNumber'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_current_step',
    title: 'Найти следующий шаг',
    description: 'Находит первый незавершённый шаг пользователя и возвращает его полную инструкцию. Используй перед советом, чтобы не гадать, где находится ученик.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'save_step_result',
    title: 'Сохранить результат шага',
    description: 'Сохраняет безопасную заметку/ссылку и по явному подтверждению пользователя отмечает шаг выполненным. Никогда не сохраняй пароли, токены, API-ключи, IP-адреса и персональные данные.',
    inputSchema: {
      type: 'object',
      properties: {
        stepId: { type: 'string', minLength: 1 },
        done: { type: 'boolean', description: 'true только если пользователь явно подтвердил выполнение' },
        artifactNote: { type: 'string', maxLength: 5000 },
        artifactUrl: { type: 'string', maxLength: 2000 },
      },
      required: ['stepId', 'done'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'list_skills',
    title: 'Найти скиллы платформы',
    description: 'Ищет опубликованные скиллы платформы по названию, описанию или тегам.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', maxLength: 200 }, limit: { type: 'integer', minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_skill',
    title: 'Прочитать скилл',
    description: 'Возвращает доступное пользователю содержимое конкретного скилла по slug.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', minLength: 1, maxLength: 200 } },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_business_profile',
    title: 'Прочитать бизнес-профиль',
    description: 'Возвращает бизнес-контекст пользователя, чтобы советы учитывали его компанию. Не возвращает секреты.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
] as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textResult(value: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: { data: value },
  };
}

function toolError(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

function containsSensitiveValue(value: string): boolean {
  return (
    /\b(?:api[_-]?key|secret|password|парол|токен)\b\s*[:=]/i.test(value) ||
    /\b(?:sk-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{16,}|\d{8,12}:[A-Za-z0-9_-]{25,})\b/.test(value) ||
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(value)
  );
}

async function callTool(actor: Actor, name: string, rawArgs: unknown): Promise<unknown> {
  const args = asObject(rawArgs);
  if (name === 'get_route_overview') return textResult(await getRouteOverview(actor));

  if (name === 'get_route_day') {
    const dayNumber = args.dayNumber;
    if (!Number.isInteger(dayNumber) || Number(dayNumber) < 1 || Number(dayNumber) > 3) {
      return toolError('Укажи dayNumber: 1, 2 или 3.');
    }
    const day = await getRouteDay(actor, Number(dayNumber));
    return day ? textResult(day) : toolError('День маршрута не найден.');
  }

  if (name === 'get_current_step') {
    const overview = await getRouteOverview(actor);
    for (const dayInfo of overview.days) {
      if (dayInfo.doneSteps >= dayInfo.totalSteps) continue;
      const day = await getRouteDay(actor, dayInfo.dayNumber);
      const step = day?.steps.find((item) => !item.done);
      if (day && step) return textResult({ dayNumber: day.dayNumber, dayTitle: day.title, step });
    }
    return textResult({ complete: true, message: 'Все шаги маршрута выполнены.' });
  }

  if (name === 'save_step_result') {
    const stepId = typeof args.stepId === 'string' ? args.stepId : '';
    const done = args.done;
    if (!stepId || typeof done !== 'boolean') return toolError('Нужны stepId и done.');
    const artifactNote = typeof args.artifactNote === 'string' ? args.artifactNote.trim().slice(0, 5000) : null;
    const artifactUrl = typeof args.artifactUrl === 'string' ? args.artifactUrl.trim().slice(0, 2000) : null;
    if (artifactNote && containsSensitiveValue(artifactNote)) {
      return toolError('Результат похож на секрет, токен, пароль или IP-адрес. Удали чувствительные данные и повтори сохранение.');
    }
    if (artifactUrl) {
      try {
        const parsed = new URL(artifactUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) return toolError('Ссылка должна начинаться с http:// или https://.');
      } catch {
        return toolError('Ссылка имеет неверный формат.');
      }
    }
    await setStepProgress(actor, stepId, { done, artifactNote, artifactUrl });
    return textResult({ saved: true, stepId, done });
  }

  if (name === 'list_skills') {
    const query = typeof args.query === 'string' ? args.query.trim().slice(0, 200) : undefined;
    const limit = Number.isInteger(args.limit) ? Math.min(Math.max(Number(args.limit), 1), 50) : 20;
    const items = await listSkills(actor, { q: query });
    return textResult(items.slice(0, limit));
  }

  if (name === 'get_skill') {
    const slug = typeof args.slug === 'string' ? args.slug.trim() : '';
    if (!slug) return toolError('Укажи slug скилла.');
    const skill = await getSkillBySlug(actor, slug);
    return skill ? textResult(skill) : toolError('Скилл не найден или недоступен на текущем тарифе.');
  }

  if (name === 'get_business_profile') {
    const profile = await prisma.businessProfile.findUnique({ where: { userId: actor.id } });
    return textResult(profile ?? { message: 'Бизнес-профиль ещё не заполнен.' });
  }

  return toolError(`Неизвестный инструмент: ${name}`);
}

function response(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function error(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

export async function handleMcpMessage(actor: Actor, value: unknown): Promise<JsonRpcResponse | null> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return error(null, -32600, 'Invalid Request');
  const request = value as JsonRpcRequest;
  const id = typeof request.id === 'string' || typeof request.id === 'number' || request.id === null ? request.id : null;
  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') return error(id, -32600, 'Invalid Request');

  if (request.method === 'notifications/initialized' || request.method.startsWith('notifications/')) return null;
  if (request.method === 'initialize') {
    return response(id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'sagaleev-platform', title: 'Платформа Сагалеева', version: '1.0.0' },
      instructions: 'Ты сопровождаешь нетехнического пользователя по маршруту «Маркетинговый агент за 3 дня». Сначала вызови get_current_step. Объясняй ровно одно действие за раз и всегда называй окно: платформа, ChatGPT/Codex, Telegram, Terminal/PowerShell или SSH на VPS. Не проси пароли, токены, API-ключи, IP-адреса и клиентские персональные данные. Не отмечай шаг выполненным, пока пользователь явно не подтвердил результат.',
    });
  }
  if (request.method === 'ping') return response(id, {});
  if (request.method === 'tools/list') return response(id, { tools });
  if (request.method === 'tools/call') {
    const params = asObject(request.params);
    if (typeof params.name !== 'string') return error(id, -32602, 'Invalid params: tool name is required');
    try {
      return response(id, await callTool(actor, params.name, params.arguments));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось выполнить инструмент';
      return response(id, toolError(message));
    }
  }
  return error(id, -32601, 'Method not found');
}

export async function handleMcpPayload(actor: Actor, value: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (!Array.isArray(value)) return handleMcpMessage(actor, value);
  if (value.length === 0) return error(null, -32600, 'Invalid Request');
  const results = await Promise.all(value.map((item) => handleMcpMessage(actor, item)));
  const visible = results.filter((item): item is JsonRpcResponse => item !== null);
  return visible.length ? visible : null;
}
