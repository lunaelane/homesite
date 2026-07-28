import Image from 'next/image';
import { marketMap } from '@/lib/content';

export default function MarketMap() {
  return (
    <section id="markets" style={{ padding: '104px 0', background: '#FFFFFF' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">{marketMap.eyebrow}</div>
        <h2 className="soha-rv h2">{marketMap.title}</h2>
        <p className="soha-rv lead" style={{ maxWidth: 640, marginBottom: 48 }}>
          {marketMap.lead}
        </p>
        <div
          className="soha-rv"
          style={{ position: 'relative', width: '100%', aspectRatio: '1672 / 941', borderRadius: 6, overflow: 'hidden', background: '#0F1A33' }}
        >
          <Image
            src={marketMap.image}
            alt={marketMap.alt}
            fill
            quality={60}
            sizes="(max-width: 1200px) 100vw, 1120px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  );
}
