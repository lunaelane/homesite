import { site } from '@/lib/content';

export default function Footer() {
  return (
    <footer style={{ padding: '46px 0', background: '#142138' }}>
      <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
          SOHA <span style={{ fontWeight: 400, color: '#9DB0D0', fontSize: 13 }}>| LUNAE LANE Inc.</span>
        </div>
        <div style={{ fontSize: 13.5, color: '#9DB0D0', textAlign: 'right', lineHeight: 1.7 }}>
          루네레인 주식회사<br />{site.contactEmail}<br />© 2026 LUNAELANE Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
