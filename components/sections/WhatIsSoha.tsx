import { steps } from '@/lib/content';

export default function WhatIsSoha() {
  return (
    <section id="soha" style={{ padding: '104px 0', background: '#FFFFFF' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">WHAT IS SOHA</div>
        <h2 className="soha-rv h2">SOHA는 쇼핑몰과 해외를 잇습니다</h2>
        <p className="soha-rv lead" style={{ maxWidth: 620, marginBottom: 52, lineHeight: 1.75 }}>
          SOHA는 루네레인의 자체 운영 시스템으로, 쇼핑몰과 해외 플랫폼을 연결하여 해외 판매 과정을 보다 효율적으로 운영할 수 있도록 지원합니다.
        </p>

        <div className="soha-flow3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {steps.map((s) => (
            <div key={s.step} className="soha-rv" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '26px 22px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: s.stepColor, marginBottom: 12 }}>{s.step}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.titleColor, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: s.subColor, lineHeight: 1.55 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
