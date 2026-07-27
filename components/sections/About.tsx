import { keywords } from '@/lib/content';

export default function About() {
  return (
    <section id="about" style={{ padding: '104px 0', background: '#1B2A4A' }}>
      <div className="wrap">
        <div className="soha-about-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 60, alignItems: 'start' }}>
          <div>
            <div className="soha-rv" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#9DB0D0', marginBottom: 18 }}>ABOUT LUNAE LANE</div>
            <h2 className="soha-rv" style={{ fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1.34, marginBottom: 26 }}>
              쇼핑몰의 해외 진출을 잇는<br />글로벌 커머스 기업
            </h2>
            <div className="soha-rv" style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {keywords.map((k) => (
                <span key={k} style={{ fontSize: 13, fontWeight: 600, color: '#C3CFE3', border: '1px solid rgba(255,255,255,.2)', padding: '8px 14px', borderRadius: 4 }}>{k}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
            <p className="soha-rv" style={{ fontSize: 17, lineHeight: 1.78, color: '#E4E9F2' }}>
              루네레인은 한국 패션 쇼핑몰이 해외 판매를 보다 쉽게 시작할 수 있도록 지원하는 글로벌 커머스 기업입니다.
            </p>
            <p className="soha-rv" style={{ fontSize: 16, lineHeight: 1.78, color: '#AEBDD8' }}>
              자체 운영 시스템인 <strong style={{ color: '#fff', fontWeight: 700 }}>SOHA</strong>를 기반으로 해외 판매 운영을 지원하며, 쇼핑몰이 상품과 브랜드에 더욱 집중할 수 있는 환경을 만드는 것을 목표로 합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
