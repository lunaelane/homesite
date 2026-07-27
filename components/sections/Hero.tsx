import Image from 'next/image';
import { hero } from '@/lib/content';
import ModalButton from '../ModalButton';

export default function Hero() {
  return (
    <header id="top" style={{ position: 'relative', padding: '120px 0 110px', overflow: 'hidden', background: '#0F1A33' }}>
      {/* 장식용 배경. 어두운 그라디언트가 최대 96% 덮으므로 저품질로 충분. */}
      <Image
        src={hero.bgImage}
        alt=""
        aria-hidden
        fill
        priority
        quality={40}
        sizes="100vw"
        style={{ objectFit: 'cover', zIndex: 0 }}
      />
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(105deg,rgba(9,15,28,.96) 0%,rgba(13,21,38,.9) 44%,rgba(18,29,50,.8) 74%,rgba(20,32,55,.72) 100%)' }}
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
