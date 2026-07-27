'use client';

import { nav } from '@/lib/content';
import { useModal } from './ModalProvider';

export default function Nav() {
  const { open } = useModal();

  const toggle = () => {
    const m = document.getElementById('soha-navlinks');
    if (m) m.dataset.open = m.dataset.open === '1' ? '0' : '1';
  };

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1B2A4A' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
        <a href="#top" style={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '.3px', textDecoration: 'none' }}>
          SOHA <span style={{ fontWeight: 400, color: '#9DB0D0', fontSize: 14 }}>| LUNAE LANE</span>
        </a>

        <button
          type="button"
          className="soha-toggle"
          onClick={toggle}
          aria-label="메뉴 열기"
          aria-controls="soha-navlinks"
          style={{ alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: 19, color: '#fff' }}
        >
          ☰
        </button>

        <div className="soha-navlinks" id="soha-navlinks" data-open="0" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="nv-link" onClick={() => { const m = document.getElementById('soha-navlinks'); if (m) m.dataset.open = '0'; }}>
              {n.label}
            </a>
          ))}
          <button type="button" className="nv-cta" onClick={() => open('inquiry')}>문의하기</button>
        </div>
      </div>
    </nav>
  );
}
