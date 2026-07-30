'use client';

import { useEffect, useRef } from 'react';
import { getActiveCountry, setFlat } from '@/lib/globeBus';

/**
 * 페이지 관통형 파티클 지구 — Hero 우측의 구체가 스크롤에 따라 중앙으로 이동하며
 * 평면 세계지도로 펼쳐지고, MarketMap 의 .mm-ovl 히트영역에 정확히 안착한다.
 * 지도를 지나면 레이어 전체가 페이드아웃.
 *
 * 좌표계: map-points.json 의 px/py 는 map-overlay.svg 와 동일한 1400×690 뷰박스 기준.
 * 평면 목표를 매 프레임 .mm-ovl 실측 rect 로 잡으므로, 안착 후에도 지도가 섹션에 붙어 함께 스크롤된다.
 *
 * 캔버스 2장:
 *  - pg-bg  불투명 배경 + 스타필드(반짝임). 싸서 매 프레임 그린다.
 *  - pg-fg  투명. 림 글로우 + 파티클. 멈춰 있으면 통째로 건너뛴다.
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

/* ── 진행도 구간 ───────────────────────────────────────────────── */
const HERO_EXIT = 0.28;   // Hero 높이의 28% 를 지나면 P 시작
const MORPH_LAG = 0.25;   // 앞 25% 는 이동만, 그 뒤부터 펼쳐짐
const GLUE_FROM = 0.82;   // 이 지점부터 실측 지도 rect 에 붙기 시작
const GLOW_FROM = 0.6;    // 진출국이 흰빛을 띠기 시작

/* ── 팔레트 ───────────────────────────────────────────────────── */
const BG = '#0F1A33';
const C_LAND = '#8FA9CF';
const C_MARKET = '#9AD6FF';
const C_HOT = '#FFFFFF';
const C_RIM = '125,196,255'; // #7DC4FF

/* 스프라이트 박스 크기 (1400 뷰박스 단위) */
const DOT_LAND = 4.2;
const DOT_MARKET = 4.0;

const STAR_COUNT = 120;

let dataPromise: Promise<RawData> | null = null;
const loadPoints = () => {
  if (!dataPromise) dataPromise = fetch('/map-points.json').then((r) => r.json() as Promise<RawData>);
  return dataPromise;
};

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
    let mx!: Float32Array, my!: Float32Array;                    // 평면 좌표 (지도 rect 크기 기준)
    let pScale!: Float32Array, pStag!: Float32Array;
    let cIdx!: Int16Array;
    let planeW = 0, planeH = 0;
    const countryIndex = new Map<string, number>();
    let viewW = 1400, viewH = 690;

    const spLand = makeSprite(C_LAND);
    const spMarket = makeSprite(C_MARKET);
    const spHot = makeSprite(C_HOT);

    /* ── 스타필드 ───────────────────────────────────────────────── */
    let stars = new Float32Array(0); // x, y, r, base alpha, phase, speed
    function buildStars(w: number, h: number) {
      stars = new Float32Array(STAR_COUNT * 6);
      for (let i = 0; i < STAR_COUNT; i++) {
        const o = i * 6;
        stars[o] = Math.random() * w;
        stars[o + 1] = Math.random() * h;
        stars[o + 2] = 0.5 + Math.random() * 1.1;
        stars[o + 3] = 0.1 + Math.random() * 0.3;
        stars[o + 4] = Math.random() * TAU;
        stars[o + 5] = 0.0006 + Math.random() * 0.0016;
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
      // 화면 폭에 따른 land 밀도 (markets 는 항상 전량)
      if (W < 880) { landMax = Math.min(nLand, 4500); landBase = Math.min(landMax, 3000); }
      else if (W < 1280) { landMax = Math.min(nLand, 8000); landBase = Math.min(landMax, 5500); }
      else { landMax = nLand; landBase = Math.min(landMax, 8000); }
      planeW = 0; // 지도 rect 가 바뀌었을 수 있으니 평면 좌표 재계산
      dirty = true;
    }

    /** 평면 좌표는 지도 rect 크기에만 의존 — 크기가 바뀔 때만 다시 만든다. */
    function buildPlane(w: number, h: number) {
      if (w === planeW && h === planeH) return;
      planeW = w; planeH = h;
      for (let i = 0; i < n; i++) {
        mx[i] = (jx[i] / viewW) * w - w / 2;
        my[i] = -((jy[i] / viewH) * h - h / 2);
      }
      dirty = true;
    }
    /** 모프 중엔 1배로 그려 래스터 비용을 낮추고, 멈추면 선명하게 다시 굽는다. */
    function applyDpr(next: number) {
      if (next === DPR) return;
      DPR = next;
      fgCv!.width = Math.round(W * DPR);
      fgCv!.height = Math.round(H * DPR);
      fg!.setTransform(DPR, 0, 0, DPR, 0, 0);
      dirty = true;
    }

    /* ── 입력 (캔버스는 pointer-events:none 이라 window 에서 받는다) ─ */
    const pointer = { x: -9999, y: -9999, down: false, lastX: 0, active: false };
    let spinVel = 0, rotY = 0;
    let P = reduced ? 1 : 0;
    let dirty = true;
    let lastActIdx = -2, lastScroll = -1;
    let flatState: boolean | null = null;
    let curCX = 0, curCY = 0, curR = 1;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
      if (pointer.down) {
        spinVel += (e.clientX - pointer.lastX) * DRAG_SPIN * 0.02;
        pointer.lastX = e.clientX;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (reduced || e.pointerType !== 'mouse') return; // 터치는 스크롤을 방해하지 않도록 제외
      if (e.target instanceof Element && e.target.closest('a,button,input,textarea,select,label')) return;
      const dx = e.clientX - curCX, dy = e.clientY - curCY;
      if (dx * dx + dy * dy > (curR * 1.5) ** 2) return; // 구체 근처에서 시작한 드래그만
      pointer.down = true;
      pointer.lastX = e.clientX;
    };
    const onUp = () => { pointer.down = false; };
    const onOut = (e: PointerEvent) => { if (!e.relatedTarget) { pointer.active = false; pointer.x = -9999; } };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('resize', resize);

    /* ── 렌더 루프 ──────────────────────────────────────────────── */
    let lastT = performance.now();
    let heroEl: HTMLElement | null = null;
    let mapEl: HTMLElement | null = null;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, now - lastT);
      lastT = now;
      if (!W || !H) { resize(); return; }

      if (!heroEl) heroEl = document.getElementById('top');
      if (!mapEl) mapEl = document.querySelector<HTMLElement>('#markets .mm-ovl');
      if (!heroEl || !mapEl) return;

      const heroR = heroEl.getBoundingClientRect();
      const mapR = mapEl.getBoundingClientRect();
      const sy = window.scrollY;

      /* 지도를 지나면 레이어 페이드아웃 */
      const vis = clamp01(mapR.bottom / (H * 0.55));
      layer!.style.opacity = String(vis);
      if (vis <= 0.001) { lastScroll = sy; return; }

      /* 진행도 — Hero 하단 ~ 지도가 화면 중앙에 오는 지점 */
      const startY = heroR.top + sy + heroR.height * HERO_EXIT;
      const endY = mapR.top + sy + mapR.height / 2 - H / 2;
      const target = reduced ? 1 : clamp01((sy - startY) / Math.max(1, endY - startY));
      if (reduced) P = 1;
      else {
        P += (target - P) * 0.16;
        if (Math.abs(target - P) < 0.002) P = target;
      }

      /* 이동 경로: Hero 우측 → 화면 중앙 → (마지막 18%) 실측 지도 rect */
      const heroCX = W < 880 ? W * 0.54 : W * 0.70;
      const heroCY = W < 880 ? H * 0.56 : H * 0.50;
      const eMove = easeInOut(P);
      const pathCX = heroCX + (W / 2 - heroCX) * eMove;
      const pathCY = heroCY + (H / 2 - heroCY) * eMove;
      const glue = smoothstep(clamp01((P - GLUE_FROM) / (1 - GLUE_FROM)));
      const CX = pathCX + (mapR.left + mapR.width / 2 - pathCX) * glue;
      const CY = pathCY + (mapR.top + mapR.height / 2 - pathCY) * glue;

      const heroRad = Math.max(110, Math.min(340, Math.min(W, H) * 0.3));
      const mapRad = Math.max(90, Math.min(mapR.height * 0.46, mapR.width * 0.25));
      const R = heroRad + (mapRad - heroRad) * eMove;
      curCX = CX; curCY = CY; curR = R;

      /* 모프 진행도 — 이동이 먼저, 펼침이 나중 */
      const M = smoothstep(clamp01((P - MORPH_LAG) / (1 - MORPH_LAG)));

      const flat = M > 0.995 && glue > 0.995;
      if (flat !== flatState) { flatState = flat; setFlat(flat); }

      /* ── 배경 캔버스: 별 ── */
      bg!.globalCompositeOperation = 'source-over';
      bg!.globalAlpha = 1;
      bg!.fillStyle = BG;
      bg!.fillRect(0, 0, W, H);
      bg!.fillStyle = '#C6D6F0';
      for (let i = 0; i < STAR_COUNT; i++) {
        const o = i * 6;
        const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(now * stars[o + 5] + stars[o + 4]);
        bg!.globalAlpha = stars[o + 3] * tw;
        bg!.beginPath();
        bg!.arc(stars[o], stars[o + 1], stars[o + 2], 0, TAU);
        bg!.fill();
      }
      bg!.globalAlpha = 1;

      /* ── 전경 캔버스 ── */
      rotY += (AUTO_ROTATE * dt * (reduced ? 0 : 1) + spinVel) * (1 - M);
      spinVel *= SPIN_FRICTION;

      const actIdx = (() => { const a = getActiveCountry(); return a != null ? countryIndex.get(a) ?? -1 : -1; })();
      const still = M >= 1 && Math.abs(target - P) < 5e-4 && !pointer.active
        && Math.abs(spinVel) < 1e-5 && sy === lastScroll;
      lastScroll = sy;
      applyDpr(still ? Math.min(window.devicePixelRatio || 1, 2) : 1);
      if (still && !dirty && actIdx === lastActIdx) return;
      dirty = false;
      lastActIdx = actIdx;

      fg!.setTransform(DPR, 0, 0, DPR, 0, 0);
      fg!.clearRect(0, 0, W, H);
      fg!.globalCompositeOperation = 'lighter';

      /* 대기광 — 구체 상태일 때만 */
      const rim = (1 - M) * 0.9;
      if (rim > 0.01) {
        const gr = fg!.createRadialGradient(CX, CY, R * 0.84, CX, CY, R * 1.55);
        gr.addColorStop(0, `rgba(${C_RIM},0)`);
        gr.addColorStop(0.22, `rgba(${C_RIM},${(0.20 * rim).toFixed(3)})`);
        gr.addColorStop(0.5, `rgba(${C_RIM},${(0.07 * rim).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${C_RIM},0)`);
        fg!.globalAlpha = 1;
        fg!.fillStyle = gr;
        fg!.fillRect(CX - R * 1.6, CY - R * 1.6, R * 3.2, R * 3.2);
      }

      const cosR = Math.cos(rotY * (1 - M)), sinR = Math.sin(rotY * (1 - M));
      const tlt = TILT * (1 - M);
      const cosT = Math.cos(tlt), sinT = Math.sin(tlt);
      const push = reduced ? 0 : pointer.down ? PUSH_DRAG : PUSH_HOVER;
      const CR = CURSOR_RADIUS, CR2 = CR * CR;
      const span = 1 - MORPH_STAGGER;
      const glow = clamp01((P - GLOW_FROM) / (1 - GLOW_FROM));

      const mapW = mapR.width, mapH = mapR.height;
      buildPlane(mapW, mapH);
      const unit = mapW / viewW;
      const sizeLand = DOT_LAND * unit, sizeMarket = DOT_MARKET * unit;

      // 마지막 28% 구간에서 나머지 land 점을 서서히 채워 넣는다 (평면에선 항상 전량)
      const fillIn = clamp01((M - 0.72) / 0.28);
      const fadeFrom = nMarket + landBase;
      const fadeSpan = Math.max(1, landMax - landBase);
      const count = fadeFrom + Math.round(fadeSpan * fillIn);

      for (let i = 0; i < count; i++) {
        let fade = 1;
        if (i >= fadeFrom) {
          fade = clamp01((fillIn - (i - fadeFrom) / fadeSpan) * 8);
          if (fade < 0.02) continue;
        }

        let t = (M - pStag[i] * MORPH_STAGGER) / span;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = smoothstep(t);

        const sxp = R * ux[i], syp = R * uy[i], szp = R * uz[i];
        const x = sxp + (mx[i] - sxp) * t;
        const y = syp + (my[i] - syp) * t;
        const z = szp * (1 - t);

        const rx = x * cosR + z * sinR;
        const rz = -x * sinR + z * cosR;
        const ry = y * cosT - rz * sinT;
        const rz2 = y * sinT + rz * cosT;

        const persp = PERSPECTIVE / (PERSPECTIVE + rz2);
        if (persp <= 0.05) continue;

        let px = CX + rx * persp;
        let py = CY - ry * persp;

        if (push > 0 && pointer.active) {
          const dx = px - pointer.x, dy = py - pointer.y;
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
        if (px < -s || px > W + s || py < -s || py > H + s) continue;

        // 뒷면은 어둡게 — 구체의 입체감이 여기서 나온다
        const depth = 0.32 + 0.68 * persp;
        const a = Math.min(1, depth * depth * 0.95) * fade;

        fg!.globalAlpha = a;
        fg!.drawImage(isM ? spMarket : spLand, px - s / 2, py - s / 2, s, s);

        if (isM && glow > 0.01) {
          const hot = cIdx[i] === actIdx && actIdx >= 0;
          const ha = (hot ? 0.85 : 0.26) * glow * a;
          if (ha > 0.01) {
            const hs = s * (hot ? 1.9 : 1.25);
            fg!.globalAlpha = ha;
            fg!.drawImage(spHot, px - hs / 2, py - hs / 2, hs, hs);
          }
        }
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
        countryIndex.set(name.replace(/ /g, '_'), ci);
        for (const p of data.markets[name]) put(p, ci);
        ci++;
      }
      for (const p of landOrder) put(p, -1);

      resize();
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('resize', resize);
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
