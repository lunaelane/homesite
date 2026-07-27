'use client';

import { useModal } from './ModalProvider';

/** 히어로 / CTA 섹션에서 쓰는 모달 트리거 버튼 */
export default function ModalButton({ kind, variant, children }: {
  kind: 'brochure' | 'inquiry';
  variant: 'primary' | 'ghost' | 'nav';
  children: React.ReactNode;
}) {
  const { open } = useModal();
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'nv-cta';
  return (
    <button type="button" className={cls} onClick={() => open(kind)}>
      {children}
    </button>
  );
}
