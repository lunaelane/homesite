'use client';

import { useEffect, useRef, useState } from 'react';
import { screens } from '@/lib/content';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** 원본 setupSystemScrub() 이식. 스크롤 진행도로 화면 전환 + 성공 오버레이 애니메이션. */
export default function SystemScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<(HTMLDivElement | null)[]>([]);
  const successRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const frames = framesRef.current.filter(Boolean) as HTMLDivElement[];
    if (!track || frames.length < 2) return;

    const success = successRef.current;
    const ring = success?.querySelector<SVGElement>('.ring');
    const chk = success?.querySelector<SVGPathElement>('.chk');
    const txt = success?.querySelector<HTMLElement>('.txt');
    const n = frames.length;
    let raf: number | null = null;

    const apply = () => {
      raf = null;
      const vh = window.innerHeight || 800;
      const total = track.offsetHeight - vh;
      const top = track.getBoundingClientRect().top;
      const p = clamp01(total > 0 ? -top / total : 0);
      const fpos = p * (n - 1);

      frames.forEach((f, i) => {
        const vis = Math.max(0, 1 - Math.abs(fpos - i));
        const e = vis * vis * (3 - 2 * vis);
        const off = i - fpos;
        f.style.opacity = String(e);
        f.style.transform = `translateY(${off * 26}px) scale(${0.93 + 0.07 * e}) rotateX(${off * 5}deg)`;
        f.style.zIndex = String(Math.round(e * 10));
        f.style.pointerEvents = e > 0.6 ? 'auto' : 'none';
      });

      if (success) {
        if (matchMedia('(max-width:880px)').matches) {
          success.style.opacity = '0';
        } else {
          const sp = clamp01((fpos - 0.26) / (0.86 - 0.26));
          const ov = sp <= 0 || sp >= 1 ? 0 : sp < 0.13 ? sp / 0.13 : sp < 0.85 ? 1 : (1 - sp) / 0.15;
          success.style.opacity = String(clamp01(ov));

          const rp = clamp01((sp - 0.06) / 0.30);
          const c1 = 1.70158, c3 = c1 + 1;
          const back = rp <= 0 ? 0 : 1 + c3 * (rp - 1) ** 3 + c1 * (rp - 1) ** 2;
          if (ring) ring.style.transform = `scale(${back.toFixed(3)})`;

          const cp = clamp01((sp - 0.34) / 0.26);
          if (chk) chk.style.strokeDashoffset = String(40 * (1 - cp));

          const tp = clamp01((sp - 0.52) / 0.20);
          if (txt) { txt.style.opacity = String(tp); txt.style.transform = `translateY(${9 * (1 - tp)}px)`; }
        }
      }

      setActive(Math.max(0, Math.min(n - 1, Math.round(fpos))));
    };

    const onScroll = () => { if (raf == null) raf = requestAnimationFrame(apply); };
    addEventListener('scroll', onScroll, { passive: true, capture: true });
    addEventListener('resize', onScroll, { passive: true });
    apply();

    return () => {
      removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      removeEventListener('resize', onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="system" style={{ background: '#FFFFFF' }}>
      <div id="sysTrack" ref={trackRef} style={{ position: 'relative', height: '300vh' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#FFFFFF' }}>
          <div className="soha-syswrap" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 36px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="soha-rv eyebrow" style={{ marginBottom: 12 }}>THE SYSTEM</div>
              <h2 className="soha-rv h2" style={{ marginBottom: 12 }}>실제 시스템 화면</h2>
              <p className="soha-rv" style={{ color: '#566074', fontSize: 16 }}>스크롤하면 시스템 화면이 차례로 전환됩니다.</p>
            </div>

            <div className="soha-sysgrid" style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 30, alignItems: 'center' }}>
              <div id="sysSteps" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {screens.map((s) => {
                  const on = s.idx === active;
                  return (
                    <div key={s.idx} style={{ position: 'relative', padding: '16px 18px 16px 22px', borderRadius: 8, transition: 'background .35s', background: on ? '#F4F6FA' : 'transparent' }}>
                      <span style={{ position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3, transition: 'background .35s', background: on ? '#1B2A4A' : '#E6E6E6' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, transition: 'color .35s', color: on ? '#1B2A4A' : '#9AA3B5' }}>{s.num}</span>
                        <span style={{ fontSize: 15.5, transition: 'color .35s', color: on ? '#1B2A4A' : '#566074', fontWeight: on ? 700 : 600 }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ perspective: 1600 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E6E6E6', borderRadius: 10, overflow: 'hidden', boxShadow: '0 30px 70px rgba(27,42,74,.16)' }}>
                  <div id="sysFrames" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#FFFFFF' }}>
                    {screens.map((s, i) => (
                      <div
                        key={s.idx}
                        ref={(el) => { framesRef.current[i] = el; }}
                        style={{ position: 'absolute', inset: 0, willChange: 'opacity,transform' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={s.label} loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', background: '#FFFFFF' }} />
                      </div>
                    ))}
                    <div id="sysSuccess" ref={successRef}>
                      <div className="ring">
                        <svg viewBox="0 0 52 52"><path className="chk" d="M14 27l8 8 16-17" /></svg>
                      </div>
                      <div className="txt">상품등록 성공</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
