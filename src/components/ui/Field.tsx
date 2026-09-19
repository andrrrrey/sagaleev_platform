import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

const BASE =
  'w-full bg-surface border border-line px-4 py-3 text-sm font-light text-t800 placeholder:text-t400 focus:outline-none focus:border-accent/50 focus:ring-0';

/** Микро-лейбл поля (docs/02 §3.8). */
export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'mb-1 block font-mono text-[10px] uppercase tracking-widest text-t400',
        className,
      )}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 font-mono text-[11px] text-accent">{children}</p>;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { mono?: boolean; invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { mono, invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(BASE, mono && 'font-mono', invalid && 'border-accent', className)}
      {...rest}
    />
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  mono?: boolean;
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { mono, invalid, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(BASE, mono && 'font-mono', invalid && 'border-accent', className)}
      {...rest}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(BASE, 'appearance-none', invalid && 'border-accent', className)}
      {...rest}
    >
      {children}
    </select>
  );
});

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: ReactNode };

/** Квадратный чекбокс в стиле логотипа (docs/02 §3.8). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm font-light text-t700">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center appearance-none border border-t300 bg-surface',
          'checked:border-t800 checked:bg-t800',
          'checked:before:block checked:before:h-1.5 checked:before:w-1.5 checked:before:bg-paper',
          'focus:border-accent focus:outline-none',
          className,
        )}
        {...rest}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
});
