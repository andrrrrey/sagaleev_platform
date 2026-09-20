/** Маска секрета: показываем только последние 4 символа. Чистая функция. */
export function maskSecret(value: string): string {
  const v = value.trim();
  if (v.length === 0) return '';
  if (v.length <= 4) return '••••';
  return `••••${v.slice(-4)}`;
}
