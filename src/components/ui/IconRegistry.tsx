'use client';

import { useEffect } from 'react';
import solarSubset from '@/lib/icons/solar-subset.json';

let registered = false;

/**
 * Регистрирует офлайн-набор Solar Linear в web-компоненте iconify-icon и
 * отключает сетевой загрузчик (CSP/приватность — без api.iconify.design).
 * Монтируется один раз в корневом layout.
 */
export function IconRegistry() {
  useEffect(() => {
    if (registered) return;
    registered = true;
    void (async () => {
      const mod = await import('iconify-icon');
      // Офлайн-набор: любые обращения к сети всё равно заблокированы CSP
      // (connect-src 'self'), а нужные иконки резолвятся из локального хранилища.
      mod.addCollection(solarSubset as Parameters<typeof mod.addCollection>[0]);
    })();
  }, []);
  return null;
}
