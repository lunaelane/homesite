/**
 * 페이지 레벨 파티클 레이어(ParticleGlobeLayer)와 MarketMap 섹션 사이의 얇은 연결.
 * 둘은 DOM 트리상 형제라 props 로 엮을 수 없어서 최소한의 스토어만 둔다.
 */

let active: string | null = null;
let flat = false;
const flatSubs = new Set<() => void>();
const wakeSubs = new Set<() => void>();

/** MarketMap → 레이어: 하이라이트할 국가 (SVG data-c 형식, 예: Saudi_Arabia) */
export function setActiveCountry(v: string | null) {
  if (v === active) return;
  active = v;
  // 레이어가 정지 상태로 rAF 를 멈춰 있을 수 있으므로 깨워서 하이라이트를 다시 그리게 한다
  wakeSubs.forEach((f) => f());
}
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

/** 외부 상태 변화로 레이어의 rAF 루프를 재개시켜야 할 때 */
export function subscribeWake(f: () => void) {
  wakeSubs.add(f);
  return () => { wakeSubs.delete(f); };
}

/**
 * 레이어 → MarketMap: 모프 진행도 P (0=구체 … 1=평면 안착).
 * 헤더 문구 시퀀스가 이 값을 그대로 재사용한다. 레이어의 rAF 안에서만 갱신되고
 * 루프가 멈추면 마지막 값이 유지된다 — 멈췄다는 건 진행도도 안 변한다는 뜻이라 그대로 맞다.
 */
let progress = 0;
const progSubs = new Set<(p: number) => void>();
export function setProgress(v: number) {
  if (v === progress) return;
  progress = v;
  progSubs.forEach((f) => f(v));
}
export function getProgress() { return progress; }
/**
 * 레이어 → MarketMap: 화면 좌표에 걸리는 진출국.
 * 모프가 완전한 평면에서 멈추지 않으므로(MORPH_MAX) SVG 히트영역 좌표와 어긋난다.
 * 실제로 그려진 점 기준으로 판정해야 보이는 것과 집히는 것이 일치한다.
 */
type HitProbe = (clientX: number, clientY: number) => string | null;
let hitProbe: HitProbe | null = null;
export function setHitProbe(f: HitProbe | null) { hitProbe = f; }
export function probeCountry(clientX: number, clientY: number) {
  return hitProbe ? hitProbe(clientX, clientY) : null;
}

export function subscribeProgress(f: (p: number) => void) {
  progSubs.add(f);
  f(progress);
  return () => { progSubs.delete(f); };
}
