import { problems } from '@/lib/content';

export default function Problem() {
  return (
    <section id="problem" style={{ padding: '104px 0', background: '#FFFFFF' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">THE PROBLEM</div>
        <h2 className="soha-rv h2">왜 해외 판매가 어려울까요?</h2>
        <p className="soha-rv lead" style={{ maxWidth: 560, marginBottom: 56 }}>진출하고 싶어도, 넘어야 할 운영의 벽이 너무 많습니다.</p>

        <div className="soha-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, borderTop: '1px solid #E6E6E6', borderLeft: '1px solid #E6E6E6' }}>
          {problems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="soha-rv" style={{ padding: '32px 28px', borderRight: '1px solid #E6E6E6', borderBottom: '1px solid #E6E6E6' }}>
              <div style={{ color: '#1B2A4A', marginBottom: 18 }}><Icon size={24} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1B2A4A', marginBottom: 9 }}>{title}</div>
              <div style={{ fontSize: 15, color: '#566074', lineHeight: 1.62 }}>{desc}</div>
            </div>
          ))}
        </div>

        <div className="soha-rv" style={{ marginTop: 48, padding: '34px 40px', background: '#1B2A4A', borderRadius: 6 }}>
          <p style={{ fontSize: 'clamp(19px,2.4vw,24px)', fontWeight: 700, color: '#fff', letterSpacing: '-.4px', lineHeight: 1.5 }}>
            해외 판매를 막는 것은 상품이 아니라 운영입니다.
          </p>
          <p style={{ fontSize: 16, color: '#AEBDD8', marginTop: 8 }}>SOHA가 그 운영 부담을 대신 줄여드립니다.</p>
        </div>
      </div>
    </section>
  );
}
