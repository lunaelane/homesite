'use client';

import { useEffect, useRef } from 'react';
import { getActiveCountry, setFlat, setProgress, setHitProbe, subscribeWake } from '@/lib/globeBus';

/**
 * 페이지 관통형 파티클 지구 — Hero 중앙의 구체가 스크롤에 따라 평면 세계지도로 펼쳐지고,
 * MarketMap 의 .mm-ovl 히트영역에 정확히 안착한다. 지도를 지나면 레이어 전체가 페이드아웃.
 *
 * 좌표계: map-points.json 의 px/py 는 map-overlay.svg 와 동일한 1400×690 뷰박스 기준.
 * 평면 목표를 .mm-ovl 실측 rect 로 잡으므로, 안착 후에도 지도가 섹션에 붙어 함께 스크롤된다.
 * rect 는 매 프레임 재측정하지 않고 문서 절대좌표로 캐시한 뒤 scrollY 로만 환산한다
 * (레이아웃 강제 계산 제거). 캐시는 resize / ResizeObserver 로만 무효화.
 *
 * 캔버스 2장:
 *  - pg-bg  불투명 배경 + 스타필드. 별은 오프스크린에 한 번 구워두고 3장 겹쳐 반짝임만 준다.
 *  - pg-fg  투명. 림 글로우 + 파티클. 모든 좌표를 디바이스 픽셀로 다루고,
 *           크기를 0.5px 단위로 양자화한 스프라이트를 정수 좌표에 1:1 블릿한다(리샘플 없음).
 *
 * 루프는 "움직일 이유가 있을 때만" 돈다 — 평면 안착 후 정지하거나 무대가 화면 밖이면 멈추고,
 * 스크롤·포인터·리사이즈·국가 하이라이트 변경으로 깨어난다.
 */

type Pt = [number, number, number, number]; // [lon, lat, px, py]
type RawData = { viewW: number; viewH: number; land: Pt[]; markets: Record<string, Pt[]> };

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/* ── 프로토타입 값 그대로 (회전 / 커서 반발) ───────────────────── */
const AUTO_ROTATE = 0.00022;
const DRAG_SPIN = 0.0055;
const SPIN_FRICTION = 0.94;
const CURSOR_RADIUS = 150;
const PUSH_HOVER = 22;
const PUSH_DRAG = 78;
const TILT = -0.3;
const PERSPECTIVE = 760;
const MORPH_STAGGER = 0.45;

/**
 * 모프 구간 동안 스크롤에 연동해 돌 바퀴 수.
 * 자동 회전은 시간 기반이라 12.6°/s — 모프 1.5초 동안 19° 남짓이라 "도는" 느낌이 안 난다.
 * 이 스핀은 진행도 M 에 정비례하므로 M=1 에서 정확히 정수 바퀴가 되어 잔여 각도가 0이다.
 */
const SCROLL_SPIN_TURNS = 3;

/* ── 진행도 구간 ───────────────────────────────────────────────── */
/* 모프 구간 길이가 곧 "펼쳐지는 과정이 얼마나 보이는가" 다.
   HERO_EXIT 를 낮추면 더 일찍 시작하고, MORPH_LAG 를 낮추면 P 중 펼침에 쓰는 비중이 커진다.
   둘만으로는 부족해서 MarketMap 에 .mm-track 스크롤 트랙을 따로 두었다. */
const HERO_EXIT = 0.05;   // Hero 높이의 5% 를 지나면 P 시작
const MORPH_LAG = 0.10;   // 앞 10% 만 이동, 그 뒤부터 펼쳐짐
const GLUE_FROM = 0.82;   // 이 지점부터 실측 지도 rect 에 붙기 시작
const GLOW_FROM = 0.6;    // 진출국이 흰빛을 띠기 시작

/* ── 성능 ─────────────────────────────────────────────────────── */
const DPR_MAX = 1.5;        // 정지 상태에서도 이 이상은 굽지 않는다
/* px/s — 이 이상이면 모프를 건너뛰고 목표 상태로 점프.
   반드시 EMA 로 다듬은 "지속 속도" 와 비교해야 한다. 순간 속도를 쓰면 안 된다 —
   휠 한 칸(100px)이 한 프레임에 통째로 배달돼 6000px/s 를 넘기 때문에
   평범한 스크롤까지 전부 빠른 스크롤로 잡히고, 보간이 꺼져 지구가 칸마다 순간이동한다. */
const FAST_SCROLL = 3500;
const SCROLL_VEL_EMA = 0.2;
const PLATE_PAD = 24;       // 구운 평면 판의 여백 (CSS px)
const LAND_BUCKETS = 12;    // land 원을 알파 단계별로 묶는 수 — 이 수만큼만 fill 한다

/**
 * 모프 최종 도달치. 1 이면 완전한 평면, 0.75 면 곡률이 남은 상태에서 멈춘다.
 * 진행도 M 자체를 클램프하지 않고 점별 보간계수 t 에 곱한다 —
 * M 을 클램프하면 스태거 때문에 pStag 이 작은 점만 먼저 t=1 에 도달해
 * "대부분 평평한데 일부만 덜 펴진" 지저분한 상태가 된다.
 * t 에 곱하면 모든 점이 똑같이 75% 지점에서 멈춘다.
 */
const MORPH_MAX = 1;
const HIT_RADIUS = 16;      // 히트 테스트 반경 (CSS px)

/* ── 팔레트 ───────────────────────────────────────────────────── */
const BG = '#0F1A33';
const C_LAND = '#8FA9CF';
const C_MARKET = '#9AD6FF';
const C_HOT = '#FFFFFF';
const C_RIM = '125,196,255'; // #7DC4FF

/* 점 크기 (1400 뷰박스 단위)
   land 는 arc+fill 원. 가장자리 falloff 이 없어 스프라이트(4.2)와 같은 무게로 보이려면
   실제 코어 지름 정도인 2.7 이어야 한다(원본과 A/B 비교로 확인). market 은 그대로 스프라이트. */
const DOT_LAND = 2.7;
const DOT_MARKET = 4.0;

const STAR_COUNT = 120;
const STAR_LAYERS = 3;

let dataPromise: Promise<RawData> | null = null;
const loadPoints = () => {
  if (!dataPromise) dataPromise = fetch('/map-points.json').then((r) => r.json() as Promise<RawData>);
  return dataPromise;
};

/**
 * 부드러운 원형 점 스프라이트 — 소스는 색당 딱 한 장만 둔다.
 * 측정해보면 drawImage 비용은 소스 크기·스케일·알파가 아니라 "호출 수 × 소스 전환"에 붙는다
 * (13k개 기준: 단일 소스 26ms / 크기별 32장 사다리 37ms / fillRect 2.9ms).
 */
function makeSprite(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const S = 32;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d')!;
  const grd = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0.0, `rgba(${r},${g},${b},1)`);
  grd.addColorStop(0.28, `rgba(${r},${g},${b},0.92)`);
  grd.addColorStop(0.55, `rgba(${r},${g},${b},0.22)`);
  grd.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  c.fillStyle = grd;
  c.fillRect(0, 0, S, S);
  return cv;
}

export default function ParticleGlobeLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const layer = layerRef.current, bgCv = bgRef.current, fgCv = fgRef.current;
    if (!layer || !bgCv || !fgCv) return;
    const bg = bgCv.getContext('2d', { alpha: false });
    const fg = fgCv.getContext('2d');
    if (!bg || !fg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let raf = 0;

    /* ── 파티클 (markets 먼저, 그 뒤 셔플된 land) ────────────────── */
    let n = 0, nMarket = 0, nLand = 0;
    let landBase = 0, landMax = 0;
    let jx!: Float32Array, jy!: Float32Array;
    let ux!: Float32Array, uy!: Float32Array, uz!: Float32Array; // 단위 구면 방향 (반지름은 매 프레임 곱함)
    let mx!: Float32Array, my!: Float32Array;                    // 평면 좌표 (디바이스 px, 지도 중심 기준)
    let pScale!: Float32Array, pStag!: Float32Array;
    let cIdx!: Int16Array;
    let hitX!: Float32Array, hitY!: Float32Array;   // 진출국 점의 현재 화면 좌표 (CSS px)
    let planeW = 0, planeH = 0, planeDpr = 0;
    const countryIndex = new Map<string, number>();
    const countryNames: string[] = [];
    let viewW = 1400, viewH = 690;

    const spMarket = makeSprite(C_MARKET);
    const spHot = makeSprite(C_HOT);

    /* ── 스타필드 — 레이어별로 한 번 굽고 알파만 흔든다 ──────────── */
    let starCv: HTMLCanvasElement[] = [];
    const starPhase = new Float32Array(STAR_LAYERS);
    const starSpeed = new Float32Array(STAR_LAYERS);
    function buildStars(w: number, h: number) {
      starCv = [];
      for (let L = 0; L < STAR_LAYERS; L++) {
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(w));
        cv.height = Math.max(1, Math.round(h));
        const c = cv.getContext('2d')!;
        c.fillStyle = '#C6D6F0';
        for (let i = 0; i < STAR_COUNT / STAR_LAYERS; i++) {
          c.globalAlpha = 0.1 + Math.random() * 0.3;
          c.beginPath();
          c.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 1.1, 0, TAU);
          c.fill();
        }
        starCv.push(cv);
        starPhase[L] = Math.random() * TAU;
        starSpeed[L] = 0.0006 + Math.random() * 0.0016;
      }
    }

    /* ── 화면 크기 ──────────────────────────────────────────────── */
    let W = 0, H = 0, DPR = 0;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      bgCv!.style.width = W + 'px'; bgCv!.style.height = H + 'px';
      fgCv!.style.width = W + 'px'; fgCv!.style.height = H + 'px';
      bgCv!.width = Math.round(W); bgCv!.height = Math.round(H);
      bg!.setTransform(1, 0, 0, 1, 0, 0);
      DPR = 0;
      applyDpr(1);
      buildStars(W, H);
      bgDirty = true;
      // 화면 폭에 따른 land 밀도 — 모프 중엔 landBase, 평면에선 landMax(전량)
      if (W < 880) { landMax = Math.min(nLand, 5200); landBase = Math.min(landMax, 2400); }
      else if (W < 1280) { landMax = Math.min(nLand, 9000); landBase = Math.min(landMax, 4200); }
      else { landMax = nLand; landBase = Math.min(landMax, 5200); }
      planeW = 0;     // 지도 rect 가 바뀌었을 수 있으니 평면 좌표 재계산
      plateCv = null; // 밀도(landMax)도 바뀌므로 구운 판은 버린다
      geoValid = false;
      dirty = true;
    }

    /** 평면 좌표는 지도 rect 크기와 DPR 에만 의존 — 바뀔 때만 다시 만든다. */
    function buildPlane(w: number, h: number) {
      if (w === planeW && h === planeH && DPR === planeDpr) return;
      planeW = w; planeH = h; planeDpr = DPR;
      for (let i = 0; i < n; i++) {
        mx[i] = ((jx[i] / viewW) * w - w / 2) * DPR;
        my[i] = -((jy[i] / viewH) * h - h / 2) * DPR;
      }
      dirty = true;
    }
    /** 모프 중엔 1배로 그려 래스터 비용을 낮추고, 멈추면 DPR_MAX 까지 선명하게 다시 굽는다. */
    function applyDpr(next: number) {
      if (next === DPR) return;
      DPR = next;
      fgCv!.width = Math.round(W * DPR);
      fgCv!.height = Math.round(H * DPR);
      fg!.setTransform(1, 0, 0, 1, 0, 0); // 전경은 디바이스 픽셀 좌표계로 직접 그린다
      plateCv = null; // 판은 DPR 에 종속
      dirty = true;
    }

    /**
     * 최종 상태(진행도 1)는 회전·기울기·스태거가 모두 사라져 그림이 지도 rect 에 고정된다.
     * MORPH_MAX < 1 이라 완전한 평면은 아니지만 "고정된 한 장"인 건 똑같으므로,
     * 그 프레임을 한 번 구워두고 매 프레임 판 한 장만 blit 한다 — 13k 드로우콜이 1개가 된다.
     * 하이라이트 중인 국가만 그 위에 따로 얹는다.
     *
     * 굽는 김에 진출국 점의 최종 위치(hmx/hmy)도 남긴다 — 히트 테스트가 이걸 쓴다.
     */
    let plateCv: HTMLCanvasElement | null = null;
    let hmx!: Float32Array, hmy!: Float32Array;   // 지도 중심 기준 오프셋 (디바이스 px)
    function buildPlate() {
      const pad = Math.ceil(PLATE_PAD * DPR);
      const w = Math.ceil(gMapW * DPR) + pad * 2;
      const h = Math.ceil(gMapH * DPR) + pad * 2;
      if (plateCv && plateCv.width === w && plateCv.height === h) return plateCv;

      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const c = cv.getContext('2d')!;
      c.globalCompositeOperation = 'lighter';
      const cx = w / 2, cy = h / 2;
      const unit = (gMapW / viewW) * DPR;
      const sizeLand = DOT_LAND * unit, sizeMarket = DOT_MARKET * unit;
      const total = nMarket + landMax;
      const Rd = Math.max(90, Math.min(gMapH * 0.46, gMapW * 0.25)) * DPR;
      const tf = MORPH_MAX, inv = 1 - tf;

      // 최종 상태의 한 점: 회전·기울기 0 이므로 rz2 = z 가 그대로 원근에 들어간다
      const at = (i: number) => {
        const x = Rd * ux[i] + (mx[i] - Rd * ux[i]) * tf;
        const y = Rd * uy[i] + (my[i] - Rd * uy[i]) * tf;
        const z = Rd * uz[i] * inv;
        const persp = PERSPECTIVE / (PERSPECTIVE + z / DPR);
        const depth = 0.32 + 0.68 * persp;
        return { px: cx + x * persp, py: cy - y * persp, persp, a: Math.min(1, depth * depth * 0.95) };
      };

      // land — 알파가 원근에 따라 달라지므로 구체 쪽과 같은 버킷 방식으로 묶는다
      const buckets: (Path2D | null)[] = new Array(LAND_BUCKETS).fill(null);
      for (let i = nMarket; i < total; i++) {
        const p = at(i);
        let b = (p.a * LAND_BUCKETS) | 0;
        if (b > LAND_BUCKETS - 1) b = LAND_BUCKETS - 1; else if (b < 0) b = 0;
        let path = buckets[b];
        if (!path) { path = new Path2D(); buckets[b] = path; }
        const r = sizeLand * pScale[i] * p.persp * 0.5;
        path.moveTo(p.px + r, p.py);
        path.arc(p.px, p.py, r, 0, TAU);
      }
      c.fillStyle = C_LAND;
      for (let b = 0; b < LAND_BUCKETS; b++) {
        const path = buckets[b];
        if (!path) continue;
        c.globalAlpha = (b + 0.5) / LAND_BUCKETS;
        c.fill(path);
      }

      hmx = new Float32Array(nMarket); hmy = new Float32Array(nMarket);
      for (let i = 0; i < nMarket; i++) {
        const p = at(i);
        const s = sizeMarket * pScale[i] * p.persp;
        c.globalAlpha = p.a;
        c.drawImage(spMarket, p.px - s * 0.5, p.py - s * 0.5, s, s);
        const hs = s * 1.25;
        c.globalAlpha = 0.26 * p.a;
        c.drawImage(spHot, p.px - hs * 0.5, p.py - hs * 0.5, hs, hs);
        hmx[i] = p.px - cx; hmy[i] = p.py - cy;
      }
      plateCv = cv;
      return cv;
    }

    /* ── 기하 캐시 — getBoundingClientRect 를 프레임마다 부르지 않는다 ─ */
    let heroEl: HTMLElement | null = null;
    let mapEl: HTMLElement | null = null;
    let geoValid = false;
    let gHeroTop = 0, gHeroH = 0, gMapTop = 0, gMapLeft = 0, gMapW = 0, gMapH = 0;
    function measureGeo() {
      if (!heroEl) heroEl = document.getElementById('top');
      if (!mapEl) mapEl = document.querySelector<HTMLElement>('#markets .mm-ovl');
      if (!heroEl || !mapEl) return false;
      const sy = window.scrollY, sx = window.scrollX;
      const hr = heroEl.getBoundingClientRect();
      const mr = mapEl.getBoundingClientRect();
      if (!mr.width) return false;
      gHeroTop = hr.top + sy; gHeroH = hr.height;
      gMapTop = mr.top + sy; gMapLeft = mr.left + sx; gMapW = mr.width; gMapH = mr.height;
      geoValid = true;
      return true;
    }

    /* ── 입력 (캔버스는 pointer-events:none 이라 window 에서 받는다) ─ */
    const pointer = { x: -9999, y: -9999, down: false, lastX: 0, active: false };
    let spinVel = 0, rotY = 0;
    let P = reduced ? 1 : 0;
    let dirty = true;
    let lastActIdx = -2;
    let lastScroll = -1, lastScrollT = 0, scrollVel = 0;
    let flatState: boolean | null = null;
    let curCX = 0, curCY = 0, curR = 1;
    let lastVis = -1;
    let starTick = 0;
    let bgDirty = true;
    const landPath: (Path2D | null)[] = new Array(LAND_BUCKETS).fill(null);
    // 포인터가 "떠 있는" 것과 "움직이는" 것은 다르다 — 멈춰 있으면 그림도 멈춘다
    let pointerDirty = false;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
      pointerDirty = true;
      if (pointer.down) {
        spinVel += (e.clientX - pointer.lastX) * DRAG_SPIN * 0.02;
        pointer.lastX = e.clientX;
      }
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (reduced || e.pointerType !== 'mouse') return; // 터치는 스크롤을 방해하지 않도록 제외
      if (e.target instanceof Element && e.target.closest('a,button,input,textarea,select,label')) return;
      const dx = e.clientX - curCX, dy = e.clientY - curCY;
      if (dx * dx + dy * dy > (curR * 1.5) ** 2) return; // 구체 근처에서 시작한 드래그만
      pointer.down = true;
      pointer.lastX = e.clientX;
      wake();
    };
    const onUp = () => { pointer.down = false; };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) { pointer.active = false; pointer.x = -9999; dirty = true; wake(); }
    };
    const onScroll = () => wake();
    const onResize = () => { resize(); wake(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const unsubWake = subscribeWake(() => wake());

    /*
      히트 테스트는 실제로 그려진 진출국 점 기준으로 한다.
      MORPH_MAX<1 이면 점 위치가 .mm-ovl 의 SVG 히트영역(완전 평면 좌표)과 17~37px 어긋나고,
      아핀 변환 하나로는 최대 17.6px 잔차가 남아 싱가포르(약 7px)를 못 맞춘다.
      점 기준으로 하면 어떤 모프 상태에서도 정확하고, 보이는 것과 집히는 것이 일치한다.
    */
    setHitProbe((cx, cy) => {
      if (!nMarket) return null;
      let best = -1, bd = HIT_RADIUS * HIT_RADIUS;
      for (let i = 0; i < nMarket; i++) {
        const dx = hitX[i] - cx, dy = hitY[i] - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = i; }
      }
      return best < 0 ? null : countryNames[cIdx[best]] ?? null;
    });

    /* 무대가 화면 밖이면 루프를 아예 멈춘다 */
    let onStage = true;
    const stageIo = new IntersectionObserver((es) => {
      onStage = es.some((e) => e.isIntersecting);
      if (onStage) { dirty = true; wake(); } else halt();
    }, { rootMargin: '96px' });
    if (layer.parentElement) stageIo.observe(layer.parentElement);

    /* 레이아웃이 바뀌면 기하 캐시만 무효화 */
    const ro = new ResizeObserver(() => { geoValid = false; dirty = true; wake(); });

    /* ── 루프 제어 ──────────────────────────────────────────────── */
    let running = false;
    let lastT = 0;
    function wake() {
      if (disposed || running || !onStage || !n) return;
      running = true;
      scrollVel = 0;   // 자고 있던 동안의 낡은 속도를 끌고 오지 않는다
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function halt() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    /* ── 렌더 루프 ──────────────────────────────────────────────── */
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, now - lastT);
      lastT = now;
      if (!W || !H) { resize(); return; }
      if (!geoValid && !measureGeo()) return;

      const sy = window.scrollY;
      // 스크롤 속도 — 한 프레임 스파이크가 아니라 EMA 로 다듬은 지속 속도를 본다
      const moved = lastScroll < 0 ? 0 : Math.abs(sy - lastScroll);
      const gap = Math.max(1, now - lastScrollT);
      if (lastScroll >= 0) scrollVel += ((moved / gap) * 1000 - scrollVel) * SCROLL_VEL_EMA;
      const fast = lastScroll >= 0 && scrollVel > FAST_SCROLL;
      lastScroll = sy; lastScrollT = now;

      const mapTop = gMapTop - sy, mapLeft = gMapLeft;
      const mapBottom = mapTop + gMapH;

      /* 지도를 지나면 레이어 페이드아웃 */
      const vis = clamp01(mapBottom / (H * 0.55));
      if (vis !== lastVis) { layer!.style.opacity = String(vis); lastVis = vis; }

      /* 진행도 — Hero 하단 ~ 지도가 화면 중앙에 오는 지점 */
      const startY = gHeroTop + gHeroH * HERO_EXIT;
      const endY = gMapTop + gMapH / 2 - H / 2;
      const target = reduced ? 1 : clamp01((sy - startY) / Math.max(1, endY - startY));

      if (vis <= 0.001) {
        // 이미 지나쳤다 — 되돌아왔을 때 곧바로 완성 상태로 보이도록 스냅해두고 잔다
        P = target;
        setProgress(P);
        if (target > 0.995 && !flatState) { flatState = true; setFlat(true); }
        halt();
        return;
      }

      // 빠르게 스크롤하면 모프를 건너뛰고 목표 상태로 점프 (모프는 천천히 볼 때만의 보너스)
      if (reduced || fast || Math.abs(target - P) > 0.5) P = target;
      else {
        P += (target - P) * 0.16;
        if (Math.abs(target - P) < 0.002) P = target;
      }
      // 헤더 문구 시퀀스가 구독한다. 평활화된 P 가 아니라 target 을 보낸다 —
      // P 는 구체 모션을 부드럽게 하려고 0.16 로 보간한 값이라 스크롤보다 약 0.10 뒤처진다.
      // 텍스트는 구체가 아니라 스크롤 위치를 따라가야 한다.
      setProgress(target);

      /* 이동 경로: Hero 중앙 → 화면 중앙 → (마지막 18%) 실측 지도 rect */
      const heroCY = W < 880 ? H * 0.56 : H * 0.50;
      const eMove = easeInOut(P);
      const pathCX = W / 2; // Hero 에서 이미 화면 중앙 — 가로 이동은 마지막 glue 구간에만 있다
      const pathCY = heroCY + (H / 2 - heroCY) * eMove;
      const glue = smoothstep(clamp01((P - GLUE_FROM) / (1 - GLUE_FROM)));
      const CX = pathCX + (mapLeft + gMapW / 2 - pathCX) * glue;
      const CY = pathCY + (mapTop + gMapH / 2 - pathCY) * glue;

      const heroRad = Math.max(110, Math.min(340, Math.min(W, H) * 0.3));
      const mapRad = Math.max(90, Math.min(gMapH * 0.46, gMapW * 0.25));
      const R = heroRad + (mapRad - heroRad) * eMove;
      curCX = CX; curCY = CY; curR = R;

      /* 모프 진행도 — 이동이 먼저, 펼침이 나중 */
      const M = smoothstep(clamp01((P - MORPH_LAG) / (1 - MORPH_LAG)));

      const flat = M > 0.995 && glue > 0.995;
      if (flat !== flatState) { flatState = flat; setFlat(flat); }

      rotY += (AUTO_ROTATE * dt * (reduced ? 0 : 1) + spinVel) * (1 - M);
      spinVel *= SPIN_FRICTION;

      const actIdx = (() => { const a = getActiveCountry(); return a != null ? countryIndex.get(a) ?? -1 : -1; })();
      /*
        더 그릴 게 없으면 멈춘다. 판단 기준은 "M 이 정확히 1인가" 가 아니라 "화면이 실제로 변하는가" —
        스크롤이 몇 px 못 미쳐 P 가 0.97 에서 멎으면 회전량은 사실상 0인데도 영원히 돌게 된다.
        자전은 (1-M) 로 감쇠하므로 림에서의 이동량을 px 로 환산해 임계값과 비교한다.
        moved 는 반드시 봐야 한다 — 지도는 섹션에 붙어 스크롤되므로 그림도 따라가야 한다.
      */
      const rimMove = (1 - M) * ((reduced ? 0 : AUTO_ROTATE * dt) + Math.abs(spinVel)) * R;
      const settled = moved === 0 && P === target && !pointerDirty
        && rimMove < 0.05 && actIdx === lastActIdx;
      pointerDirty = false;

      applyDpr(settled ? Math.min(window.devicePixelRatio || 1, DPR_MAX) : 1);
      if (settled && !dirty) { halt(); return; }
      dirty = false;
      lastActIdx = actIdx;

      /* ── 배경 캔버스: 별 — 반짝임은 4프레임에 한 번이면 눈에 같다 ── */
      starTick++;
      if (bgDirty || (starTick & 3) === 0) {
        bgDirty = false;
        bg!.globalAlpha = 1;
        bg!.fillStyle = BG;
        bg!.fillRect(0, 0, W, H);
        for (let L = 0; L < starCv.length; L++) {
          bg!.globalAlpha = reduced ? 1 : 0.55 + 0.45 * Math.sin(now * starSpeed[L] + starPhase[L]);
          bg!.drawImage(starCv[L], 0, 0);
        }
        bg!.globalAlpha = 1;
      }

      /* ── 전경 캔버스 (전부 디바이스 픽셀) ── */
      const Wd = W * DPR, Hd = H * DPR;
      const CXd = CX * DPR, CYd = CY * DPR, Rd = R * DPR;
      fg!.clearRect(0, 0, Wd, Hd);
      fg!.globalCompositeOperation = 'lighter';

      /* 대기광 — 구체 상태일 때만 */
      const rim = (1 - M) * 0.9;
      if (rim > 0.01) {
        const gr = fg!.createRadialGradient(CXd, CYd, Rd * 0.84, CXd, CYd, Rd * 1.55);
        gr.addColorStop(0, `rgba(${C_RIM},0)`);
        gr.addColorStop(0.22, `rgba(${C_RIM},${(0.20 * rim).toFixed(3)})`);
        gr.addColorStop(0.5, `rgba(${C_RIM},${(0.07 * rim).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${C_RIM},0)`);
        fg!.globalAlpha = 1;
        fg!.fillStyle = gr;
        fg!.fillRect(CXd - Rd * 1.6, CYd - Rd * 1.6, Rd * 3.2, Rd * 3.2);
      }

      buildPlane(gMapW, gMapH);
      const unit = (gMapW / viewW) * DPR;
      const sizeLand = DOT_LAND * unit, sizeMarket = DOT_MARKET * unit;
      const glow = clamp01((P - GLOW_FROM) / (1 - GLOW_FROM));

      /* ── 최종 안착: 구운 판 한 장 + 하이라이트만 ── */
      if (flat) {
        const plate = buildPlate();
        fg!.globalCompositeOperation = 'source-over';
        fg!.globalAlpha = 1;
        // 정수 좌표로 blit — 리샘플이 없어야 직접 렌더와 선명도가 같고, 안착 순간 튀지 않는다
        fg!.drawImage(plate, Math.round(CXd - plate.width * 0.5), Math.round(CYd - plate.height * 0.5));
        const invD = 1 / DPR;
        for (let i = 0; i < nMarket; i++) {   // 히트 캐시 — 지도가 스크롤을 따라 움직이므로 매 프레임 갱신
          hitX[i] = (CXd + hmx[i]) * invD;
          hitY[i] = (CYd + hmy[i]) * invD;
        }
        if (actIdx >= 0) {
          fg!.globalCompositeOperation = 'lighter';
          fg!.globalAlpha = 0.59 * 0.95;
          for (let i = 0; i < nMarket; i++) {
            if (cIdx[i] !== actIdx) continue;
            const hs = sizeMarket * pScale[i] * 1.9;
            fg!.drawImage(spHot, CXd + hmx[i] - hs * 0.5, CYd + hmy[i] - hs * 0.5, hs, hs);
          }
        }
        return;
      }

      const cosR = Math.cos(rotY * (1 - M)), sinR = Math.sin(rotY * (1 - M));
      const tlt = TILT * (1 - M);
      const cosT = Math.cos(tlt), sinT = Math.sin(tlt);

      /* 스크롤 연동 스핀 — 반드시 구면 좌표에만 걸고 그 뒤에 평면과 보간해야 한다.
         보간된 좌표에 걸면 t→1 에서 평면 지도 자체가 Y축으로 돌아 가로로 찌그러진다
         (M=0.9 → cos 252° = -0.31, 좌우 반전 + 31% 로 압축).
         구면 쪽에 걸면 (1-t) 가중치가 그대로 감쇠가 되어, 펴질수록 회전이 잦아들고
         t=1 에서는 스핀 각도와 무관하게 정확히 평면 좌표가 된다. */
      const spinA = SCROLL_SPIN_TURNS * TAU * M;
      const cosS = Math.cos(spinA), sinS = Math.sin(spinA);
      // 커서 반발은 구체일 때의 촉감 — 평면으로 갈수록 사라진다 (판을 구울 수 있게 하는 조건이기도)
      const push = (reduced ? 0 : pointer.down ? PUSH_DRAG : PUSH_HOVER) * DPR * (1 - M);
      const CR = CURSOR_RADIUS * DPR, CR2 = CR * CR;
      const pxr = pointer.x * DPR, pyr = pointer.y * DPR;
      const span = 1 - MORPH_STAGGER;

      // 모프가 끝나갈수록 나머지 land 점을 채워 넣는다 (평면에선 항상 전량)
      const fillIn = clamp01((M - 0.55) / 0.45);
      const fadeFrom = nMarket + landBase;
      const fadeSpan = Math.max(1, landMax - landBase);
      const count = fadeFrom + Math.round(fadeSpan * fillIn);

      /* land 는 알파 버킷별 Path2D 에 모아 fill 을 LAND_BUCKETS 회로 줄인다.
         점마다 fill 하면 래스터 비용이 호출 수에 비례해 붙는다(실측: 구체 97 → 33fps). */
      for (let b = 0; b < LAND_BUCKETS; b++) landPath[b] = null;
      fg!.fillStyle = C_LAND;

      for (let i = 0; i < count; i++) {
        let fade = 1;
        if (i >= fadeFrom) {
          fade = clamp01((fillIn - (i - fadeFrom) / fadeSpan) * 8);
          if (fade < 0.02) continue;
        }

        let t = (M - pStag[i] * MORPH_STAGGER) / span;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = smoothstep(t) * MORPH_MAX;   // 모든 점이 똑같이 MORPH_MAX 지점에서 멈춘다

        // 구면 위치를 먼저 스핀시킨 뒤 평면 목표와 보간한다
        const ax = Rd * ux[i], az = Rd * uz[i];
        const sxp = ax * cosS + az * sinS;
        const szp = -ax * sinS + az * cosS;
        const syp = Rd * uy[i];
        const x = sxp + (mx[i] - sxp) * t;
        const y = syp + (my[i] - syp) * t;
        const z = szp * (1 - t);

        const rx = x * cosR + z * sinR;
        const rz = -x * sinR + z * cosR;
        const ry = y * cosT - rz * sinT;
        const rz2 = y * sinT + rz * cosT;

        const persp = PERSPECTIVE / (PERSPECTIVE + rz2 / DPR);
        if (persp <= 0.05) continue;

        let px = CXd + rx * persp;
        let py = CYd - ry * persp;

        if (push > 0 && pointer.active) {
          const dx = px - pxr, dy = py - pyr;
          const d2 = dx * dx + dy * dy;
          if (d2 < CR2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = 1 - d / CR;
            const amt = f * f * push;
            px += (dx / d) * amt;
            py += (dy / d) * amt;
          }
        }

        const isM = i < nMarket;
        const s = (isM ? sizeMarket : sizeLand) * pScale[i] * persp;
        if (px < -s || px > Wd + s || py < -s || py > Hd + s) continue;

        // 뒷면은 어둡게 — 구체의 입체감이 여기서 나온다
        const depth = 0.32 + 0.68 * persp;
        const a = Math.min(1, depth * depth * 0.95) * fade;

        if (!isM) {
          let b = (a * LAND_BUCKETS) | 0;
          if (b > LAND_BUCKETS - 1) b = LAND_BUCKETS - 1; else if (b < 0) b = 0;
          let p = landPath[b];
          if (!p) { p = new Path2D(); landPath[b] = p; }
          const r = s * 0.5;
          p.moveTo(px + r, py);      // 새 서브패스 — 없으면 앞 점과 선으로 이어진다
          p.arc(px, py, r, 0, TAU);
          continue;
        }

        fg!.globalAlpha = a;

        fg!.drawImage(spMarket, px - s * 0.5, py - s * 0.5, s, s);
        hitX[i] = px / DPR; hitY[i] = py / DPR;   // 히트 캐시

        if (glow > 0.01) {
          const hot = cIdx[i] === actIdx && actIdx >= 0;
          const ha = (hot ? 0.85 : 0.26) * glow * a;
          if (ha > 0.01) {
            const hs = s * (hot ? 1.9 : 1.25);
            fg!.globalAlpha = ha;
            fg!.drawImage(spHot, px - hs * 0.5, py - hs * 0.5, hs, hs);
          }
        }
      }

      // 모아둔 land 원들을 버킷당 한 번씩만 채운다 ('lighter' 라 그리는 순서는 상관없다)
      fg!.fillStyle = C_LAND;
      for (let b = 0; b < LAND_BUCKETS; b++) {
        const p = landPath[b];
        if (!p) continue;
        fg!.globalAlpha = (b + 0.5) / LAND_BUCKETS;
        fg!.fill(p);
      }
    }

    /* ── 데이터 로드 → 시작 ────────────────────────────────────── */
    loadPoints().then((data) => {
      if (disposed) return;
      viewW = data.viewW || 1400;
      viewH = data.viewH || 690;

      const names = Object.keys(data.markets);
      nMarket = names.reduce((s, k) => s + data.markets[k].length, 0);

      const landOrder = data.land.slice();
      for (let i = landOrder.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const tmp = landOrder[i]; landOrder[i] = landOrder[j]; landOrder[j] = tmp;
      }
      nLand = landOrder.length;
      n = nMarket + nLand;

      jx = new Float32Array(n); jy = new Float32Array(n);
      ux = new Float32Array(n); uy = new Float32Array(n); uz = new Float32Array(n);
      mx = new Float32Array(n); my = new Float32Array(n);
      pScale = new Float32Array(n); pStag = new Float32Array(n);
      cIdx = new Int16Array(n);
      hitX = new Float32Array(nMarket).fill(-9999);
      hitY = new Float32Array(nMarket).fill(-9999);

      let k = 0;
      const put = (p: Pt, country: number) => {
        const la = p[1] * DEG, lo = p[0] * DEG, cl = Math.cos(la);
        ux[k] = cl * Math.sin(lo); uy[k] = Math.sin(la); uz[k] = cl * Math.cos(lo);
        jx[k] = p[2]; jy[k] = p[3];
        cIdx[k] = country;
        pScale[k] = 0.9 + Math.random() * 0.25;
        pStag[k] = Math.random();
        k++;
      };

      let ci = 0;
      for (const name of names) {
        const key = name.replace(/ /g, '_');
        countryIndex.set(key, ci);
        countryNames[ci] = key;
        for (const p of data.markets[name]) put(p, ci);
        ci++;
      }
      for (const p of landOrder) put(p, -1);

      resize();
      measureGeo();
      if (heroEl) ro.observe(heroEl);
      if (mapEl) ro.observe(mapEl);
      ro.observe(document.documentElement); // 이미지 로드 등으로 문서 높이가 바뀌면 캐시 무효화
      wake();
    });

    return () => {
      disposed = true;
      halt();
      stageIo.disconnect();
      ro.disconnect();
      unsubWake();
      setHitProbe(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={layerRef} className="pg-layer" aria-hidden>
      <canvas ref={bgRef} className="pg-bg" />
      <canvas ref={fgRef} className="pg-fg" />
      <div className="pg-vignette" />
    </div>
  );
}
