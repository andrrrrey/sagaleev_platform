// Извлекает подмножество набора Solar Linear в статический JSON для офлайн-режима
// (без запросов на api.iconify.design). Запуск: node scripts/build-icons.mjs
import { getIcons } from '@iconify/utils';
import solar from '@iconify-json/solar/icons.json' with { type: 'json' };
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const NAMES = [
  // из эталона
  'alt-arrow-down-linear', 'arrow-right-linear', 'server-square-linear',
  'pen-new-square-linear', 'graph-up-linear', 'power-linear', 'star-linear',
  'programming-linear', 'database-linear', 'paperclip-linear', 'play-circle-linear',
  // навигация / разделы
  'alt-arrow-right-linear', 'alt-arrow-left-linear', 'arrow-left-linear',
  'home-smile-linear', 'routing-linear', 'bolt-linear', 'chart-2-linear',
  'videocamera-record-linear', 'microphone-3-linear', 'cup-first-linear',
  'user-linear', 'users-group-rounded-linear', 'card-linear', 'settings-linear',
  'settings-minimalistic-linear', 'magnifer-linear', 'clock-circle-linear',
  'hamburger-menu-linear', 'widget-linear', 'document-text-linear',
  // действия / статусы
  'lock-linear', 'lock-keyhole-linear', 'copy-linear', 'download-minimalistic-linear',
  'check-circle-linear', 'check-read-linear', 'close-circle-linear', 'link-linear',
  'danger-triangle-linear', 'eye-linear', 'eye-closed-linear', 'logout-2-linear',
  'bell-linear', 'plain-linear', 'plain-2-linear', 'add-circle-linear',
  'trash-bin-minimalistic-linear', 'pen-linear', 'export-linear', 'refresh-linear',
  'calendar-linear', 'shield-check-linear', 'wallet-money-linear', 'graph-new-linear',
  'diploma-verified-linear', 'notebook-linear', 'point-on-map-linear',
  // переключатель темы
  'sun-2-linear', 'moon-linear', 'monitor-smartphone-linear',
];

const subset = getIcons(solar, NAMES);
if (!subset) {
  console.error('getIcons вернул null');
  process.exit(1);
}
const found = Object.keys(subset.icons);
const missing = NAMES.filter((n) => !found.includes(n) && !(subset.aliases && subset.aliases[n]));
if (missing.length) {
  console.warn('Не найдены иконки (проверь имена):', missing.join(', '));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'src', 'lib', 'icons');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'solar-subset.json'), JSON.stringify(subset));
console.log(`Записано ${found.length} иконок Solar в src/lib/icons/solar-subset.json`);
