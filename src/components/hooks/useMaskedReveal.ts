'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Masked word reveal для заголовков — перенос из эталона без изменений.
 * Слова оборачиваются в маску, внутренний .word стартует с translate-y-[120%].
 * Уважает prefers-reduced-motion (сразу видимый текст, без анимации).
 */
export function useMaskedReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    if (heading.dataset.revealed === 'true') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Разбиваем на слова в масках.
    const parsed = heading.innerHTML.trim().replace(/<br\s*\/?>/gi, '___BR___');
    const words = parsed.split(/\s+/);
    heading.innerHTML = '';
    heading.dataset.revealed = 'true';

    words.forEach((word, index) => {
      if (word === '___BR___') {
        heading.appendChild(document.createElement('br'));
        return;
      }
      const wrapper = document.createElement('span');
      wrapper.className = 'inline-block overflow-hidden align-bottom pb-1 -mb-1';
      if (index < words.length - 1 && words[index + 1] !== '___BR___') {
        wrapper.style.marginRight = '0.25em';
      }
      const inner = document.createElement('span');
      inner.className = 'word inline-block';
      inner.textContent = word;
      if (!reduce) inner.style.transform = 'translateY(120%)';
      wrapper.appendChild(inner);
      heading.appendChild(wrapper);
    });

    if (reduce) return;

    let cancelled = false;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(heading.querySelectorAll('.word'), {
        y: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger: 0.04,
        scrollTrigger: { trigger: heading, start: 'top 90%' },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [ref]);
}
