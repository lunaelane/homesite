import { Check } from 'lucide-react';
import { youList, sohaList } from '@/lib/content';

export default function Roles() {
  return (
    <section id="roles" style={{ padding: '104px 0', background: '#F4F6FA', borderTop: '1px solid #E6E6E6', borderBottom: '1px solid #E6E6E6' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">DIVISION OF WORK</div>
        <h2 className="soha-rv h2">쇼핑몰은 기존 운영을 유지합니다</h2>
        <p className="soha-rv lead" style={{ maxWidth: 560, marginBottom: 52 }}>쇼핑몰은 기존 운영을 그대로 유지하고, 복잡한 해외 운영은 SOHA가 맡습니다.</p>

        <div className="soha-grid-3c" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #E6E6E6', borderRadius: 6, overflow: 'hidden' }}>
          <div className="soha-rv" style={{ padding: '42px 40px', borderRight: '1px solid #E6E6E6' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#9AA3B5', marginBottom: 6 }}>평소 하던 일 그대로</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1B2A4A', marginBottom: 28 }}>쇼핑몰이 유지하는 업무</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {youList.map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, fontWeight: 500, color: '#1B2A4A' }}>
                  <span style={{ color: '#1B2A4A', display: 'inline-flex' }}><Check size={18} /></span>{t}
                </li>
              ))}
            </ul>
          </div>

          <div className="soha-rv" style={{ padding: '42px 40px', background: '#1B2A4A' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px', color: '#9DB0D0', marginBottom: 6 }}>복잡한 해외 운영 전부</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 28 }}>SOHA가 지원하는 업무</div>
            <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {sohaList.map((t) => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 15.5, fontWeight: 500, color: '#E4E9F2' }}>
                  <span style={{ color: '#9DB0D0', display: 'inline-flex' }}><Check size={17} /></span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
