'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Icon } from '@/components/ui/Icon';
import { LinedBlock } from '@/components/ui/LinedBlock';

const MCP_URL = 'https://platform.sagaleev.ru/api/mcp';

export function CodexMcpPanel({
  initialActive,
  initialExpiresAt,
}: {
  initialActive: boolean;
  initialExpiresAt: string | null;
}) {
  const [active, setActive] = useState(initialActive);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const config = useMemo(
    () => token
      ? `[mcp_servers.sagaleev_platform]\nurl = "${MCP_URL}"\nhttp_headers = { Authorization = "Bearer ${token}" }\ndefault_tools_approval_mode = "writes"`
      : '',
    [token],
  );

  async function createToken() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/me/mcp-token', { method: 'POST' });
      if (!response.ok) throw new Error('Не удалось создать токен');
      const data = (await response.json()) as { token: string; expiresAt: string };
      setToken(data.token);
      setExpiresAt(data.expiresAt);
      setActive(true);
    } catch {
      setMessage('Не удалось создать токен. Обнови страницу или напиши в поддержку.');
    } finally {
      setPending(false);
    }
  }

  async function revokeToken() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/me/mcp-token', { method: 'DELETE' });
      if (!response.ok) throw new Error('Не удалось отключить токен');
      setToken(null);
      setActive(false);
      setExpiresAt(null);
      setMessage('Доступ отключён. Codex больше не сможет читать маршрут этим токеном.');
    } catch {
      setMessage('Не удалось отключить токен. Попробуй ещё раз или напиши в поддержку.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-line bg-paper-panel p-5 text-sm font-light leading-relaxed text-t700">
        <p><strong className="font-medium text-t900">Что это даёт.</strong> Локальный Codex или ChatGPT на компьютере сможет сам прочитать твой текущий день, найти следующий незавершённый шаг, открыть скиллы и сохранить подтверждённый результат.</p>
        <p className="mt-3"><strong className="font-medium text-t900">Что MCP не получает.</strong> Пароль от платформы, Telegram-токен, API-ключи и пароль VPS ему не передаются.</p>
      </div>

      <div className="border border-line bg-paper-panel p-5">
        <ol className="list-decimal space-y-3 pl-5 text-sm font-light leading-relaxed text-t700">
          <li>Нажми кнопку «Создать новый токен». Если старый токен был, он сразу перестанет работать.</li>
          <li>Скопируй готовый блок настроек. Не отправляй его в чат: внутри находится секретный токен.</li>
          <li>В Codex открой <span className="font-mono text-xs text-t900">Settings → MCP servers → Open config.toml</span>.</li>
          <li>Вставь блок в конец файла, сохрани файл и перезапусти Codex/ChatGPT.</li>
          <li>В новом чате напиши: «Открой мой текущий шаг на Платформе Сагалеева и объясняй по одному действию».</li>
          <li>Если Codex хочет отметить шаг выполненным, приложение сначала попросит твоё подтверждение.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={createToken} disabled={pending}>
          <Icon name="key-linear" />
          {pending ? 'Подождите…' : active ? 'Создать новый токен' : 'Создать токен'}
        </Button>
        {active ? (
          <Button type="button" variant="secondary" onClick={revokeToken} disabled={pending}>
            Отключить доступ
          </Button>
        ) : null}
        <span className="font-mono text-[11px] text-t500">
          {active ? `Доступ включён${expiresAt ? ` до ${new Date(expiresAt).toLocaleDateString('ru-RU')}` : ''}` : 'Доступ выключен'}
        </span>
      </div>

      {token ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-t900">Скопируй сейчас: после обновления страницы токен больше не будет показан.</p>
          <LinedBlock label="CODEX / CHATGPT — config.toml">
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6">{config}</pre>
          </LinedBlock>
          <CopyButton text={config} label="Скопировать настройки" />
        </div>
      ) : null}

      {message ? <p className="font-mono text-xs text-t600">{message}</p> : null}
      <p className="text-xs font-light leading-relaxed text-t500">
        Файл config.toml содержит секрет. Не публикуй его и не прикладывай к обращению в поддержку. Если случайно показал файл другому человеку — нажми «Создать новый токен».
      </p>
    </div>
  );
}
