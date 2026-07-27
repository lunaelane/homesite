import { markets, beforeTags, afterItems } from '@/lib/content';

const rowY = [96, 136, 176, 216, 256, 296];
const curveY = [110, 150, 190, 230, 270, 310];

export default function Markets() {
  return (
    <section id="markets" style={{ padding: '104px 0', background: '#F4F6FA', borderTop: '1px solid #E6E6E6' }}>
      <div style={{ maxWidth: 1384, margin: '0 auto', padding: '0 40px' }}>
        <div className="soha-rv eyebrow">WHY SOHA</div>
        <h2 className="soha-rv h2">한 번의 등록으로, 여섯 개의 시장으로</h2>
        <p className="soha-rv lead" style={{ maxWidth: 640, marginBottom: 52 }}>
          현지 계정 개설부터 번역, 물류, 정산까지 — 해외 판매에 필요한 모든 과정을 SOHA가 대신합니다. 공급처는 상품을 등록하고 택배를 보내기만 하면 됩니다.
        </p>

        <div className="soha-mk-cols">
          {/* 그래픽 1: 6개 시장 다이어그램 (SVG — 용량 ~2KB) */}
          <div className="soha-rv soha-markets">
            <svg viewBox="0 0 680 380" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="등록 한 번, 6개 시장 동시 판매">
              <rect x="0" y="0" width="680" height="380" fill="#FFFFFF" rx="10" />
              <text x="46" y="52" fontFamily="sans-serif" fontSize="22" fontWeight="800" fill="#1B2A4A">등록 한 번, 6개 시장 동시 판매</text>
              <text x="46" y="76" fontFamily="sans-serif" fontSize="13" fill="#7A828F">번역 · 등록 · 주문 · 정산은 SOHA가 대신합니다</text>

              <rect x="46" y="164" width="150" height="92" rx="14" fill="#1B2A4A" />
              <text x="121" y="200" textAnchor="middle" fontFamily="sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF">한국 공급처</text>
              <text x="121" y="222" textAnchor="middle" fontFamily="sans-serif" fontSize="12.5" fill="#B9C2D4">상품 등록 한 번</text>
              <rect x="91" y="234" width="60" height="8" rx="4" fill="#3A517E" />

              <g stroke="#1B2A4A" strokeWidth="1.6" fill="none" opacity="0.85">
                {curveY.map((y) => <path key={y} d={`M196 210 C 300 210 320 ${y + 6} 400 ${y}`} />)}
              </g>
              <g fill="#1B2A4A">
                {curveY.map((y) => <path key={y} d={`M400 ${y} l-9 -4 v8 z`} />)}
              </g>

              <g fontFamily="sans-serif">
                {markets.map((m, i) => (
                  <g key={m}>
                    <rect x="408" y={rowY[i]} width="226" height="28" rx="14" fill="#F1F4F9" />
                    <text x="424" y={rowY[i] + 18} fontSize="13.5" fontWeight="600" fill="#1B2A4A">{m}</text>
                  </g>
                ))}
              </g>

              <text x="46" y="356" fontFamily="sans-serif" fontSize="12.5" fill="#9CA3AF">공급처는 상품 등록과 발송만 — 나머지는 SOHA가 처리합니다</text>
            </svg>
          </div>

          {/* 그래픽 2: Before / After */}
          <div className="soha-rv soha-ba">
            <div className="soha-ba__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bg-busy.png" alt="" loading="lazy" />
              <div className="soha-ba__fade-r" />
              <div className="soha-ba__fade-b" />
              <div className="soha-ba__fade-t" />
            </div>

            <div className="soha-ba__inner">
              <h2 className="soha-ba__title">해야 할 일이, 이렇게 줄어듭니다</h2>
              <div className="soha-ba__cols">
                <div className="soha-ba__left">
                  <div className="soha-ba__label soha-ba__label--before">직접 진출하면</div>
                  <div className="soha-ba__tags">
                    {beforeTags.map((t) => (
                      <span key={t.t} className={`soha-ba__tag soha-ba__tag--${t.v}`} style={{ transform: `rotate(${t.deg}deg)` }}>{t.t}</span>
                    ))}
                  </div>
                </div>

                <div className="soha-ba__arrow">
                  <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M6 20 H30" stroke="#1B2A4A" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M24 12 L32 20 L24 28" stroke="#1B2A4A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>

                <div className="soha-ba__right">
                  <div className="soha-ba__label soha-ba__label--after">SOHA와 함께라면</div>
                  <div className="soha-ba__card">
                    {afterItems.map((t) => (
                      <div key={t} className="soha-ba__item"><span className="soha-ba__dot" /><span>{t}</span></div>
                    ))}
                    <div className="soha-ba__end">끝.</div>
                  </div>
                  <div className="soha-ba__sub">나머지 전부는 SOHA가 처리합니다</div>
                </div>
              </div>
              <div className="soha-ba__foot">번역 · 해외 등록 · 주문 수집 · 물류 연계 · 정산까지</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
