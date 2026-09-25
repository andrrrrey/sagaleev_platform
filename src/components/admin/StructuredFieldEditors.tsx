'use client';

import { useState } from 'react';
import type { Kpi, RepoLink, Timecode, UsecaseStep } from '@/lib/content-types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative grid grid-cols-1 gap-3 border border-line bg-paper-panel p-4 sm:grid-cols-2">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-t400 hover:text-accent"
        title="Удалить строку"
      >
        <Icon name="trash-bin-minimalistic-linear" />
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} className="self-start">
      <Icon name="add-circle-linear" />
      {label}
    </Button>
  );
}

function secondsToClock(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function clockToSeconds(value: string) {
  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;
  const [first = 0, second = 0, third = 0] = parts;
  if (parts.length === 3) return first * 3600 + second * 60 + third;
  if (parts.length === 2) return first * 60 + second;
  return first;
}

export function TimecodesEditor({ defaults = [] }: { defaults?: Timecode[] }) {
  const [rows, setRows] = useState(() =>
    defaults.map((row) => ({ time: secondsToClock(row.t), label: row.label })),
  );
  const value = rows
    .map((row) => ({ t: clockToSeconds(row.time), label: row.label.trim() }))
    .filter((row) => row.label);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-t400">Таймкоды</div>
        <p className="mt-1 text-xs font-light text-t500">
          Добавьте время в формате 02:15 и название фрагмента. JSON писать не нужно.
        </p>
      </div>
      {rows.map((row, index) => (
        <Row
          key={index}
          onRemove={() => setRows((current) => current.filter((_, i) => i !== index))}
        >
          <Input
            aria-label={`Время таймкода ${index + 1}`}
            mono
            value={row.time}
            placeholder="02:15"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, time: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            aria-label={`Название таймкода ${index + 1}`}
            value={row.label}
            placeholder="О чём этот фрагмент"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
        </Row>
      ))}
      <input type="hidden" name="timecodesJson" value={JSON.stringify(value)} />
      <AddButton
        label="Добавить таймкод"
        onClick={() => setRows((current) => [...current, { time: '00:00', label: '' }])}
      />
    </div>
  );
}

export function KpisEditor({ defaults = [] }: { defaults?: Kpi[] }) {
  const [rows, setRows] = useState(defaults);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-t400">
          Результаты в цифрах
        </div>
        <p className="mt-1 text-xs font-light text-t500">
          Один показатель — одна строка. Например: «Конверсия» → «12%».
        </p>
      </div>
      {rows.map((row, index) => (
        <Row
          key={index}
          onRemove={() => setRows((current) => current.filter((_, i) => i !== index))}
        >
          <Input
            value={row.label}
            placeholder="Название показателя"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            value={row.value}
            placeholder="Значение"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, value: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            className="sm:col-span-2"
            value={row.hint ?? ''}
            placeholder="Пояснение — необязательно"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, hint: event.target.value } : item,
                ),
              )
            }
          />
        </Row>
      ))}
      <input
        type="hidden"
        name="kpisJson"
        value={JSON.stringify(rows.filter((row) => row.label.trim() && row.value.trim()))}
      />
      <AddButton
        label="Добавить показатель"
        onClick={() => setRows((current) => [...current, { label: '', value: '', hint: '' }])}
      />
    </div>
  );
}

export function RepoLinksEditor({ defaults = [] }: { defaults?: RepoLink[] }) {
  const [rows, setRows] = useState(defaults);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-t400">
          Полезные ссылки
        </div>
        <p className="mt-1 text-xs font-light text-t500">
          Это может быть GitHub, документ, таблица или страница сервиса.
        </p>
      </div>
      {rows.map((row, index) => (
        <Row
          key={index}
          onRemove={() => setRows((current) => current.filter((_, i) => i !== index))}
        >
          <Input
            value={row.title}
            placeholder="Название ссылки"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, title: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            type="url"
            value={row.url}
            placeholder="https://…"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, url: event.target.value } : item,
                ),
              )
            }
          />
        </Row>
      ))}
      <input
        type="hidden"
        name="repoLinksJson"
        value={JSON.stringify(rows.filter((row) => row.title.trim() && row.url.trim()))}
      />
      <AddButton
        label="Добавить ссылку"
        onClick={() => setRows((current) => [...current, { title: '', url: '' }])}
      />
    </div>
  );
}

export function StepsEditor({ defaults = [] }: { defaults?: UsecaseStep[] }) {
  const [rows, setRows] = useState(defaults);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-t400">
          Пошаговые действия
        </div>
        <p className="mt-1 text-xs font-light text-t500">
          Опишите действия по порядку. Команду или промпт можно оставить пустыми.
        </p>
      </div>
      {rows.map((row, index) => (
        <Row
          key={index}
          onRemove={() => setRows((current) => current.filter((_, i) => i !== index))}
        >
          <Input
            className="sm:col-span-2"
            value={row.title}
            placeholder={`Шаг ${index + 1}: название`}
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, title: event.target.value } : item,
                ),
              )
            }
          />
          <Textarea
            className="sm:col-span-2"
            rows={3}
            value={row.body ?? ''}
            placeholder="Что именно нужно сделать"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, body: event.target.value } : item,
                ),
              )
            }
          />
          <Textarea
            className="sm:col-span-2"
            mono
            rows={3}
            value={row.command ?? ''}
            placeholder="Команда или промпт — необязательно"
            onChange={(event) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, command: event.target.value } : item,
                ),
              )
            }
          />
        </Row>
      ))}
      <input
        type="hidden"
        name="stepsJson"
        value={JSON.stringify(rows.filter((row) => row.title.trim()))}
      />
      <AddButton
        label="Добавить шаг"
        onClick={() => setRows((current) => [...current, { title: '', body: '', command: '' }])}
      />
    </div>
  );
}
