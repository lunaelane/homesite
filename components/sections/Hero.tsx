import { hero } from '@/lib/content';
import ModalButton from '../ModalButton';

/** 배경은 페이지 레벨 파티클 레이어(ParticleGlobeLayer)가 그린다 — 여기선 투명. */
export default function Hero() {
  return (
    <header id="top" style={{ position: 'relative', padding: '120px 0 110px', background: 'transparent' }}>
      {/*
        구체가 화면 중앙으로 오면서 좌측 텍스트와 겹친다.
        파티클 쪽 알파를 깎는 대신 텍스트 뒤에 스크림을 깐다 —
        배경 휘도가 파티클 밀도·자전 위상과 무관하게 고정되어 대비가 흔들리지 않고,
        점마다 영역 판정을 추가하지 않으므로 렌더 비용도 늘지 않는다.
        무대 배경색(#0F1A33)과 같은 색이라 구체 좌측이 그림자로 잠기는 것처럼 읽힌다.
        아래쪽은 마스크로 서서히 걷어 MarketMap 과의 경계선이 보이지 않게 한다.
      */}
      <div aria-hidden className="hero-scrim" />
      {/* 텍스트는 캔버스(.pg-layer, z-index 0)보다 항상 위 */}
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
