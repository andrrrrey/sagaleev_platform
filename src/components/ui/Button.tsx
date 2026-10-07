import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'action' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white px-6 py-3 rounded-full border border-accent text-sm font-semibold hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all shadow-sm flex items-center justify-center gap-2',
  secondary:
    'bg-paper text-t800 border border-line px-6 py-3 rounded-full text-sm font-semibold shadow-sm hover:bg-paper-hover hover:text-t900 transition-colors flex items-center justify-center gap-2',
  ghost:
    'text-sm font-medium px-4 py-2.5 rounded-full bg-transparent text-t600 hover:bg-paper-hover hover:text-t900 transition-all flex items-center gap-2',
  action:
    'flex items-center gap-2 rounded-full bg-accent/10 border border-accent/15 px-4 py-2.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white transition-colors group',
  icon: 'w-10 h-10 rounded-full flex items-center justify-center text-t500 hover:bg-paper-hover hover:text-t900 transition-colors',
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
