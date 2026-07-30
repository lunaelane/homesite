import { hero } from '@/lib/content';
import ModalButton from '../ModalButton';

/** 배경은 페이지 레벨 파티클 레이어(ParticleGlobeLayer)가 그린다 — 여기선 투명. */
export default function Hero() {
  return (
    <header id="top" style={{ position: 'relative', padding: '120px 0 110px', background: 'transparent' }}>
      {/* 좌측 텍스트가 우측 구체와 겹치지 않도록 가독성 그라디언트만 얇게 */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(100deg,rgba(15,26,51,.92) 0%,rgba(15,26,51,.72) 38%,rgba(15,26,51,0) 62%)' }}
      />
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ width: 48, height: 3, background: '#fff', marginBottom: 26 }} />
        <h1 style={{ fontSize: 'clamp(36px,5vw,52px)', fontWeight: 700, lineHeight: 1.28, letterSpacing: '-1.4px', color: '#fff', marginBottom: 24, maxWidth: 820 }}>
          {hero.title[0]}<br />{hero.title[1]}
        </h1>
        <p style={{ fontSize: 'clamp(17px,2vw,19px)', lineHeight: 1.78, color: '#D5DCEA', maxWidth: 560, marginBottom: 38 }}>
          {hero.desc}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ModalButton kind="brochure" variant="primary">서비스 소개자료 받기</ModalButton>
          <ModalButton kind="inquiry" variant="ghost">문의하기</ModalButton>
        </div>
      </div>
    </header>
  );
}
