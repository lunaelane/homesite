// 랜딩 페이지의 모든 카피/데이터. 문구 수정은 전부 여기서만.
import type { LucideIcon } from 'lucide-react';
import {
  Globe, Languages, Headphones, Truck,
  UserCheck, Wallet, Settings, Repeat,
} from 'lucide-react';

export const site = {
  title: '루네레인 LUNAELANE | 해외판매 파트너 SOHA',
  description: '루네레인(LUNAELANE)은 한국 패션 쇼핑몰의 해외 판매를 지원하는 글로벌 커머스 기업입니다. 자체 시스템 SOHA로 상품등록만으로 동남아 해외 판매를 시작하세요.',
  url: 'https://www.lunaelane.com/',
  siteName: 'SOHA',
  naverVerification: '52f6b3d831c3cedbd2d72b850aefb0d476e39a87',
  contactEmail: 'contact@lunaelane.com',
} as const;

export const nav = [
  { href: '#problem', label: '왜 해외 판매가 어려운가' },
  { href: '#soha', label: 'SOHA란' },
  { href: '#roles', label: '역할 분담' },
  { href: '#about', label: '회사 소개' },
  { href: '#team', label: '팀' },
] as const;

export const hero = {
  title: ['상품등록만으로', '해외 판매를 시작하세요'],
  desc: '루네레인은 한국 패션 쇼핑몰이 추가적인 해외 운영 부담 없이 판매 채널을 확장할 수 있도록 지원합니다. 별도의 해외 운영 인력이나 플랫폼 학습 없이, 기존 운영을 유지하면서 해외 판매를 시작하세요.',
  bgImage: '/hero.jpg',
} as const;

export const problems: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Globe, title: '해외 플랫폼 운영', desc: '플랫폼마다 다른 정책과 운영 방식을 처음부터 익혀야 합니다.' },
  { icon: Languages, title: '국가별 번역·현지화', desc: '상품 정보를 시장별 언어와 현지 기준에 맞춰 가공해야 합니다.' },
  { icon: Headphones, title: '주문 및 CS 관리', desc: '여러 시장의 주문을 모으고, 현지 언어 문의에 대응해야 합니다.' },
  { icon: Truck, title: '해외 배송 운영', desc: '국가별 배송 절차와 물류를 직접 챙기기엔 부담이 큽니다.' },
];

export const reasons: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserCheck, title: '추가 인력 없이', desc: '새로운 해외 운영팀을 꾸릴 필요가 없습니다.' },
  { icon: Wallet, title: '월 고정비 없이', desc: '매달 나가는 고정 비용 없이 해외 판매를 시작할 수 있습니다.' },
  { icon: Settings, title: '검증된 운영 지원', desc: '루네레인이 자체 시스템 SOHA를 통해 해외 판매 운영을 직접 지원합니다.' },
  { icon: Repeat, title: '기존 운영 유지', desc: '현재 운영 방식 그대로 해외 판매를 확장합니다.' },
];

export const steps = [
  { step: 'STEP 01', title: '쇼핑몰', sub: '평소처럼 상품 등록', bg: '#FFFFFF', border: '#E6E6E6', stepColor: '#16161A', titleColor: '#1B2A4A', subColor: '#566074' },
  { step: 'STEP 02', title: 'SOHA', sub: '연동·현지화·배송·CS', bg: '#1B2A4A', border: '#1B2A4A', stepColor: '#9DB0D0', titleColor: '#FFFFFF', subColor: '#AEBDD8' },
  { step: 'STEP 03', title: '해외 패션 플랫폼', sub: '동남아 주요 채널', bg: '#FFFFFF', border: '#E6E6E6', stepColor: '#16161A', titleColor: '#1B2A4A', subColor: '#566074' },
  { step: 'STEP 04', title: '해외 고객', sub: '현지 환경에서 구매', bg: '#FFFFFF', border: '#E6E6E6', stepColor: '#16161A', titleColor: '#1B2A4A', subColor: '#566074' },
] as const;

// ⚠️ 인도네시아 포함 여부 확인 필요 (별도 확인 섹션 참고)
export const markets = ['🇻🇳 베트남', '🇹🇭 태국', '🇵🇭 필리핀', '🇲🇾 말레이시아', '🇸🇬 싱가포르', '🇮🇩 인도네시아'] as const;

export const beforeTags = [
  { t: '현지 판매 계정 개설', v: 'a', deg: -3 },
  { t: '상점 심사', v: 'b', deg: 2 },
  { t: '번역 외주', v: 'c', deg: -2 },
  { t: '환율 계산', v: 'a', deg: 3 },
  { t: '국제 배송 계약', v: 'b', deg: -4 },
  { t: '현지 CS', v: 'c', deg: 2 },
  { t: '세금 신고', v: 'a', deg: -2 },
  { t: '정산 관리', v: 'b', deg: 3 },
] as const;

export const afterItems = ['상품 등록', '택배 발송'] as const;

export const youList = ['상품 등록', '재고 관리', '국내 발송'] as const;
export const sohaList = ['현지화', '플랫폼 등록', '주문 수집', '통합 재고 관리', '해외 배송', 'CS (고객 응대)'] as const;

export const screens = [
  { idx: 0, num: '01', label: '상품 등록 화면', src: '/sys-product.png' },
  { idx: 1, num: '02', label: '주문·판매 현황 화면', src: '/sys-orders.png' },
  { idx: 2, num: '03', label: '플랫폼 연동 화면', src: '/sys-connect.png' },
] as const;

export const keywords = ['Global Commerce', 'B2B Solution', 'SOHA', 'K-Fashion'] as const;

export const team = [
  { name: '유예준', role: 'CEO', area: 'Business & Strategy', email: 'yooyejune@lunaelane.com' },
  { name: '이승주', role: 'COO', area: 'Operation & Finance', email: 'leeseungju@lunaelane.com' },
  { name: '이유겸', role: 'CTO', area: 'Product & Development', email: 'leeyukyum@lunaelane.com' },
] as const;
