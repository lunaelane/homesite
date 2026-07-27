import { Mail } from 'lucide-react';
import { team } from '@/lib/content';

export default function Team() {
  return (
    <section id="team" style={{ padding: '104px 0', background: '#FFFFFF', borderTop: '1px solid #E6E6E6' }}>
      <div className="wrap">
        <div className="soha-rv eyebrow">OUR TEAM</div>
        <h2 className="soha-rv h2">팀 소개</h2>
        <p className="soha-rv lead" style={{ maxWidth: 560, marginBottom: 52 }}>커머스와 기술, 운영을 아우르는 팀이 함께합니다.</p>

        <div className="soha-team" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: '1px solid #E6E6E6', borderLeft: '1px solid #E6E6E6' }}>
          {team.map((m) => (
            <div key={m.email} className="soha-rv" style={{ padding: '38px 34px', borderRight: '1px solid #E6E6E6', borderBottom: '1px solid #E6E6E6' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#1B2A4A', border: '1px solid #1B2A4A', padding: '5px 11px', borderRadius: 4, marginBottom: 24 }}>{m.role}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{m.name}</div>
              <div style={{ fontSize: 15, color: '#566074', paddingTop: 13, borderTop: '1px solid #EDEDED' }}>{m.area}</div>
              <a href={`mailto:${m.email}`} className="team-mail"><Mail size={15} />{m.email}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
