/**
 * 페이지 레벨 파티클 레이어(ParticleGlobeLayer)와 MarketMap 섹션 사이의 얇은 연결.
 * 둘은 DOM 트리상 형제라 props 로 엮을 수 없어서 최소한의 스토어만 둔다.
 */

let active: string | null = null;
let flat = false;
const flatSubs = new Set<() => void>();

/** MarketMap → 레이어: 하이라이트할 국가 (SVG data-c 형식, 예: Saudi_Arabia) */
export function setActiveCountry(v: string | null) { active = v; }
export function getActiveCountry() { return active; }

/** 레이어 → MarketMap: 평면 지도로 안착했는지 */
export function setFlat(v: boolean) {
  if (v === flat) return;
  flat = v;
  flatSubs.forEach((f) => f());
}
export function subscribeFlat(f: () => void) {
  flatSubs.add(f);
  return () => { flatSubs.delete(f); };
}
export function getFlat() { return flat; }
export function getFlatServer() { return false; }
