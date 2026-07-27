import { reasons } from '@/lib/content';

export default function WhyLunaeLane() {
  return (
    <section id="why" style={{ padding: '104px 0', background: '#F4F6FA', borderTop: '1px solid #E6E6E6', borderBottom: '1px solid #E6E6E6' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">WHY LUNAE LANE</div>
        <h2 className="soha-rv h2">왜 루네레인일까요?</h2>
        <p className="soha-rv lead" style={{ maxWidth: 560, marginBottom: 52 }}>새로운 부담을 더하지 않고, 지금 그대로 해외로 넓힙니다.</p>

        <div className="soha-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="soha-rv" style={{ borderTop: '2px solid #1B2A4A', paddingTop: 20 }}>
              <div style={{ color: '#1B2A4A', marginBottom: 14 }}><Icon size={22} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 14.5, color: '#566074', lineHeight: 1.62 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
