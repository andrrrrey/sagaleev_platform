'use client';

import { useRef } from 'react';
import { useMaskedReveal } from '@/components/hooks/useMaskedReveal';
import { cn } from '@/lib/utils';

const SIZES = {
  h1: 'text-4xl md:text-5xl lg:text-[56px] leading-[1.02]',
  h2: 'text-2xl md:text-4xl leading-[1.08]',
  h3: 'text-xl md:text-2xl leading-[1.15]',
} as const;

/** Крупный продуктовый заголовок. */
export function Heading({
  as = 'h1',
  size,
  children,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3';
  size?: keyof typeof SIZES;
  children: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useMaskedReveal(ref);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={cn(
        'js-masked-reveal font-display font-extrabold tracking-[-0.04em] text-t900',
        SIZES[size ?? as],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
