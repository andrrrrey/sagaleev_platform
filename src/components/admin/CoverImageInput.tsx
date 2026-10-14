'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1000;

async function prepareImage(
  file: File,
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Файл больше 10 МБ');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Поддерживаются JPG, PNG и WebP');
  }

  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Не удалось прочитать изображение'));
      element.src = source;
    });
    const scale = Math.min(1, MAX_WIDTH / image.naturalWidth, MAX_HEIGHT / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Браузер не может обработать изображение');
    context.drawImage(image, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/webp', 0.82), width, height };
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function CoverImageInput({
  name = 'coverUrl',
  defaultValue = '',
  ratioLabel = '16:9',
  recommendedSize = '1600 × 900 px',
}: {
  name?: string;
  defaultValue?: string;
  ratioLabel?: string;
  recommendedSize?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function choose(file?: File) {
    if (!file) return;
    setPending(true);
    setMessage(null);
    try {
      const prepared = await prepareImage(file);
      setValue(prepared.dataUrl);
      const ratio = prepared.width / prepared.height;
      const ratioWarning = ratio < 1.65 || ratio > 1.9 ? ' Соотношение отличается от 16:9.' : '';
      setMessage(`${prepared.width} × ${prepared.height} px.${ratioWarning}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось обработать изображение');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void choose(event.target.files?.[0])}
      />
      <div className="overflow-hidden rounded-2xl border border-dashed border-line bg-paper-tint">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Предпросмотр обложки"
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-t400">
            <Icon name="gallery-add-linear" className="text-3xl" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-t700 hover:border-t400 disabled:opacity-50"
        >
          {pending ? 'Обрабатываем…' : value ? 'Заменить изображение' : 'Выбрать изображение'}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue('');
              setMessage(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="px-2 py-2 text-xs text-t500 hover:text-accent"
          >
            Удалить
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-t500">
        Рекомендуется {recommendedSize}, соотношение {ratioLabel}. JPG, PNG или WebP, до 10 МБ. Файл
        автоматически уменьшается перед сохранением.
      </p>
      {message ? <p className="text-xs text-t600">{message}</p> : null}
    </div>
  );
}
