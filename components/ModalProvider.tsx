'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Check, Mail } from 'lucide-react';
import { site } from '@/lib/content';

type ModalKind = 'brochure' | 'inquiry' | null;

/** null=작성 중, 'sent'=서버 접수 완료, 'mailto'=전송 실패로 메일 앱에 넘김(=미접수) */
type SendResult = null | 'sent' | 'mailto';

const Ctx = createContext<{ open: (k: Exclude<ModalKind, null>) => void }>({ open: () => {} });
export const useModal = () => useContext(Ctx);

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [result, setResult] = useState<SendResult>(null);
  const [sending, setSending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const open = useCallback((k: Exclude<ModalKind, null>) => {
    document.getElementById('soha-navlinks')?.setAttribute('data-open', '0');
    setResult(null);
    setModal(k);
  }, []);
  const close = useCallback(() => { setModal(null); setResult(null); }, []);

  // ESC로 닫기
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal, close]);

  // 열릴 때 첫 입력란으로 포커스 이동
  useEffect(() => {
    if (!modal) return;
    dialogRef.current?.querySelector<HTMLElement>('input, textarea')?.focus();
  }, [modal]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? '').trim();

    let payload: Record<string, string>, subject: string, body: string;
    if (modal === 'brochure') {
      const [name, company, email, phone, url] =
        ['name', 'company', 'email', 'phone', 'url'].map(g);
      subject = `[소개자료 요청] ${company} / ${name}`;
      payload = { _subject: subject, 구분: '서비스 소개자료 요청', 성함: name, 쇼핑몰명: company, 이메일: email, 연락처: phone, '쇼핑몰 URL': url };
      body = ['SOHA 서비스 소개자료를 요청합니다.', '', `성함: ${name}`, `쇼핑몰명: ${company}`, `이메일: ${email}`, `연락처: ${phone}`, `쇼핑몰 URL: ${url}`].join('\n');
    } else {
      const [name, email, msg] = ['name', 'email', 'msg'].map(g);
      subject = `[문의] ${name}`;
      payload = { _subject: subject, 구분: '문의', 성함: name, 이메일: email, '문의 내용': msg };
      body = ['문의 내용', '──────────', msg, '', `성함: ${name}`, `이메일: ${email}`].join('\n');
    }
    payload._captcha = 'false';
    payload._template = 'table';

    setSending(true);
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${site.contactEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('bad status');
      await r.json();
      setSending(false);
      setResult('sent');
    } catch {
      // 네트워크/CORS 실패 시 메일 앱으로 폴백. 아직 접수된 게 아니므로 'sent'와 구분한다.
      window.location.href =
        `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSending(false);
      setResult('mailto');
    }
  }

  const isBrochure = modal === 'brochure';

  return (
    <Ctx.Provider value={{ open }}>
      {children}

      {modal && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(9,15,28,.62)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 470, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 90px rgba(9,15,28,.45)' }}
          >
            <div style={{ padding: '34px 36px 0', position: 'relative' }}>
              <button onClick={close} aria-label="닫기" className="modal-x">✕</button>
              <div style={{ width: 42, height: 3, background: '#1B2A4A', marginBottom: 18 }} />
              <h3 style={{ fontSize: 23, fontWeight: 700, color: '#1B2A4A', letterSpacing: '-.5px', marginBottom: 9 }}>
                {isBrochure ? '서비스 소개자료 받기' : '문의하기'}
              </h3>
              <p style={{ fontSize: 14, color: '#566074', lineHeight: 1.6 }}>
                {isBrochure
                  ? '정보를 남겨주시면 서비스 소개자료를 이메일로 보내드립니다.'
                  : '궁금한 점을 남겨주시면 담당자가 빠르게 답변드리겠습니다.'}
              </p>
            </div>

            {!result ? (
              <form onSubmit={submit} style={{ padding: '24px 36px 34px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <Field name="name" label="성함" required placeholder="홍길동" />
                  {isBrochure && <Field name="company" label="쇼핑몰명" required placeholder="쇼핑몰 이름" />}
                  <Field name="email" label="이메일" type="email" required placeholder="name@company.com" />
                  {isBrochure && <Field name="phone" label="연락처" type="tel" placeholder="010-0000-0000" />}
                  {isBrochure && <Field name="url" label="쇼핑몰 URL" placeholder="https://" />}
                  {!isBrochure && (
                    <div>
                      <label htmlFor="i-msg" className="fld-label">문의 내용 <span className="fld-req">*</span></label>
                      <textarea id="i-msg" name="msg" required rows={4} className="fld" placeholder="궁금한 점을 자유롭게 남겨주세요." />
                    </div>
                  )}
                </div>
                <button type="submit" disabled={sending} className="btn-submit">
                  {sending ? '보내는 중…' : isBrochure ? '소개자료 요청하기' : '문의 보내기'}
                </button>
                <p style={{ fontSize: 11.5, color: '#98A0AE', textAlign: 'center', lineHeight: 1.5, marginTop: 2 }}>
                  입력하신 정보는 문의 응대 목적으로만 사용됩니다.
                </p>
              </form>
            ) : result === 'sent' ? (
              <div style={{ padding: '14px 36px 40px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EAF3EC', color: '#2E8B57', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px auto 20px' }}>
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: 19, fontWeight: 700, color: '#1B2A4A', marginBottom: 10 }}>정상적으로 접수되었습니다</h4>
                <p style={{ fontSize: 14, color: '#566074', lineHeight: 1.65, marginBottom: 24 }}>
                  소중한 요청 감사합니다. 담당자가 확인 후<br />입력하신 이메일로 빠르게 연락드리겠습니다.
                </p>
                <button onClick={close} className="btn-close">닫기</button>
              </div>
            ) : (
              <div style={{ padding: '14px 36px 40px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FDF3E3', color: '#B7791F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px auto 20px' }}>
                  <Mail size={28} />
                </div>
                <h4 style={{ fontSize: 19, fontWeight: 700, color: '#1B2A4A', marginBottom: 10 }}>메일 앱이 열렸습니다</h4>
                <p style={{ fontSize: 14, color: '#566074', lineHeight: 1.65, marginBottom: 16 }}>
                  자동 전송에 실패해 작성하신 내용을 메일 앱으로 옮겼습니다.<br />
                  <strong style={{ color: '#1B2A4A', fontWeight: 700 }}>발송 버튼을 눌러야 접수됩니다.</strong>
                </p>
                <p style={{ fontSize: 13, color: '#98A0AE', lineHeight: 1.6, marginBottom: 24 }}>
                  메일 앱이 열리지 않았다면 아래 주소로 보내주세요.<br />
                  <a href={`mailto:${site.contactEmail}`} style={{ color: '#1B2A4A', fontWeight: 600 }}>{site.contactEmail}</a>
                </p>
                <button onClick={close} className="btn-close">닫기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

function Field({ name, label, required, type = 'text', placeholder }: {
  name: string; label: string; required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="fld-label">
        {label} {required && <span className="fld-req">*</span>}
      </label>
      <input id={`f-${name}`} name={name} type={type} required={required} placeholder={placeholder} className="fld" />
    </div>
  );
}
