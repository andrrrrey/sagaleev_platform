import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type IconProps = {
  /** Имя без префикса, напр. "copy-linear". Префикс solar добавляется автоматически. */
  name: string;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
};

/** Иконка Solar Linear (iconify-icon, офлайн-набор). */
export function Icon({ name, className, strokeWidth = 1.5, style, ...rest }: IconProps) {
  return (
    <iconify-icon
      icon={`solar:${name}`}
      stroke-width={strokeWidth}
      className={cn(className)}
      style={style}
      aria-hidden={rest['aria-hidden'] ?? true}
    />
  );
}
