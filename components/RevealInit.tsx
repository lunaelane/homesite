'use client';

import { useEffect } from 'react';

/**
 * .soha-rv 요소를 뷰포트 진입 시 .soha-in 으로 전환.
 * 원본 setupReveal() 이식 — IntersectionObserver + 스크롤 스윕 폴백 + 1.6초 강제 해제.
 * 섹션들을 서버 컴포넌트로 유지하려고 래퍼 대신 전역 초기화 방식 사용.
 */
export default function RevealInit() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('.soha-rv')];
    if (!els.length) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('soha-in'));
      return;
    }

    let io: IntersectionObserver | null = null;
    try {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('soha-in'); io?.unobserve(e.target); }
        }),
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      els.forEach((el) => io!.observe(el));
    } catch { /* noop */ }

    let pending = els.slice();
    let interval: ReturnType<typeof setInterval> | null = null;
    const sweep = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      pending = pending.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < h * 0.94 && r.bottom > -40) { el.classList.add('soha-in'); return false; }
        return true;
      });
      if (!pending.length && interval) { clearInterval(interval); interval = null; }
    };
    addEventListener('scroll', sweep, { passive: true });
    addEventListener('resize', sweep, { passive: true });
    interval = setInterval(sweep, 200);
    sweep();

    // 애니메이션이 얼어붙은 환경 대비 강제 해제
    const t = setTimeout(() => {
      els.forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.99) {
          el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none';
          el.classList.add('soha-in');
        }
      });
    }, 1600);

    return () => {
      io?.disconnect();
      removeEventListener('scroll', sweep);
      removeEventListener('resize', sweep);
      if (interval) clearInterval(interval);
      clearTimeout(t);
    };
  }, []);

  return null;
}
