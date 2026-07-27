import ModalButton from '../ModalButton';

export default function Cta() {
  return (
    <section id="contact" style={{ padding: '104px 0', background: '#1B2A4A', textAlign: 'center' }}>
      <div className="wrap">
        <h2 className="soha-rv h2" style={{ color: '#fff' }}>해외 판매를 함께 시작해보세요</h2>
        <p className="soha-rv" style={{ color: '#AEBDD8', fontSize: 17, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          관심 있으시다면 서비스 소개자료를 받아보시거나 편하게 문의해 주세요.
        </p>
        <div className="soha-rv" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <ModalButton kind="brochure" variant="primary">서비스 소개자료 받기</ModalButton>
          <ModalButton kind="inquiry" variant="ghost">문의하기</ModalButton>
        </div>
      </div>
    </section>
  );
}
