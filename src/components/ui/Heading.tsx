'use client';

import { useRef } from 'react';
import { useMaskedReveal } from '@/components/hooks/useMaskedReveal';
import { cn } from '@/lib/utils';

const SIZES = {
  h1: 'text-4xl md:text-5xl lg:text-6xl leading-[1.05]',
  h2: 'text-2xl md:text-3xl leading-[1.1]',
  h3: 'text-lg md:text-xl leading-[1.1]',
} as const;

/** Заголовок с masked reveal (Inter 400, не жирный). docs/02 §1.3, §5. */
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
        'js-masked-reveal font-sans font-normal tracking-tight text-zinc-900',
        SIZES[size ?? as],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
