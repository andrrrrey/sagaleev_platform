import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Типизация web-компонента iconify-icon для JSX (React 19).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          icon: string;
          width?: string | number;
          height?: string | number;
          inline?: boolean;
          mode?: 'svg' | 'style' | 'bg' | 'mask';
          'stroke-width'?: string | number;
        },
        HTMLElement
      >;
    }
  }
}

export {};
