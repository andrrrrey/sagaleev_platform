import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'action' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  // Точно по эталону (docs/02 §3.1).
  primary:
    'bg-ink text-paper px-6 py-3 border border-ink text-sm font-normal hover:bg-ink-hover transition-colors shadow-sm flex items-center justify-center gap-2',
  secondary:
    'bg-paper-panel text-t700 border border-line px-6 py-3 text-sm font-normal shadow-sm hover:bg-surface hover:text-t900 transition-colors flex items-center justify-center gap-2',
  ghost:
    'text-xs font-mono px-4 py-2 bg-transparent border border-line text-t700 hover:bg-paper-hover hover:border-t300 transition-all shadow-sm flex items-center gap-2',
  action:
    'flex items-center gap-2 bg-surface border border-line px-4 py-2 text-[11px] font-mono tracking-wide text-t700 hover:text-accent hover:border-accent/30 transition-colors shadow-sm group',
  icon: 'w-8 h-8 flex items-center justify-center text-t400 hover:text-t700 transition-colors',
};

/** Классы варианта кнопки для применения к <Link> (Next). */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(VARIANTS[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidthMobile?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', fullWidthMobile = false, className, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        VARIANTS[variant],
        fullWidthMobile && (variant === 'primary' || variant === 'secondary') && 'w-full sm:w-auto',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-inherit',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
