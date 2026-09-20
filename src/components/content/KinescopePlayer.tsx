'use client';

import { useEffect, useRef, useState } from 'react';
import type { Timecode } from '@/lib/content-types';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { formatTimecode } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

/**
 * Плеер Kinescope: iframe с приватным видео + клик по таймкоду (seek через
 * перезагрузку с #t=). Прогресс просмотра: слушаем postMessage `timeupdate`
 * от плеера (Player API), fallback — ручная отметка «Просмотрел» (docs/05 §6).
 */
export function KinescopePlayer({
  id,
  timecodes,
  slug,
  initialT,
}: {
  id: string;
  timecodes: Timecode[];
  slug: string;
  initialT?: number;
}) {
  const { notify } = useToast();
  const [activeT, setActiveT] = useState<number | null>(initialT ?? null);
  const [nonce, setNonce] = useState(0);
  const [viewedSent, setViewedSent] = useState(false);
  const viewedRef = useRef(false);

  function seekTo(t: number) {
    setActiveT(t);
    setNonce((n) => n + 1);
  }

  async function markViewed(percent: number) {
    if (viewedRef.current) return;
    if (percent < 80) return;
    viewedRef.current = true;
    setViewedSent(true);
    try {
      await fetch(`/api/content/${slug}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'video_progress', percent }),
      });
    } catch {
      viewedRef.current = false;
      setViewedSent(false);
    }
  }

  // Слушаем события Kinescope Player API (best-effort).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.origin === 'string' && !e.origin.includes('kinescope')) return;
      const data = e.data as { type?: string; data?: { currentTime?: number; duration?: number } };
      if (data?.type === 'timeupdate' && data.data?.currentTime && data.data?.duration) {
        const pct = (data.data.currentTime / data.data.duration) * 100;
        if (pct >= 80) void markViewed(100);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const src = `https://kinescope.io/embed/${id}${activeT != null ? `#t=${activeT}` : ''}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
      <div className="relative border border-line bg-black">
        <div className="absolute -left-px -top-px z-10 h-2 w-2 border-l-2 border-t-2 border-t300" />
        <div className="absolute -right-px -top-px z-10 h-2 w-2 border-r-2 border-t-2 border-t300" />
        <div className="aspect-video w-full">
          <iframe
            key={nonce}
            src={src}
            title="Видео"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {timecodes.length > 0 ? (
          <div className="border border-line bg-paper-panel">
            <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-t500">
              Таймкоды
            </div>
            <ul className="max-h-[320px] overflow-y-auto">
              {timecodes.map((tc, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => seekTo(tc.t)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-paper-hover',
                      activeT === tc.t ? 'text-accent' : 'text-t600',
                    )}
                  >
                    <span className={cn('tabular-nums', activeT === tc.t ? 'text-accent' : 'text-t400')}>
                      {formatTimecode(tc.t)}
                    </span>
                    <span className="flex-1 font-sans font-light">{tc.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          variant="secondary"
          type="button"
          disabled={viewedSent}
          onClick={() => {
            void markViewed(100);
            notify(viewedSent ? 'Уже отмечено' : 'Отмечено как просмотрено');
          }}
        >
          <Icon name="check-read-linear" />
          {viewedSent ? 'Просмотрено' : 'Отметить просмотр'}
        </Button>
      </div>
    </div>
  );
}
