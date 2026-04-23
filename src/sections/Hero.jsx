import { useEffect, useMemo, useRef, useState } from "react";
import useCanvasActive from "../hooks/useCanvasActive";

/* ─────────────────────────────────────────
   Assets（世界観統一）
───────────────────────────────────────── */
const SPACE_TEXTURE = "/meishiki/space-texture.png";
const MOON_OBJECT = "/meishiki/moon-object.png";

/* ─────────────────────────────────────────
   Utility
───────────────────────────────────────── */
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ─────────────────────────────────────────
   Device helpers
───────────────────────────────────────── */
function useDeviceFactor() {
  return useMemo(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;
    const isMobile = window.matchMedia?.("(max-width: 767px)")?.matches;
    return { reduce: !!reduce, fine: !!fine, isMobile: !!isMobile, factor: fine ? 1 : 0.55 };
  }, []);
}

function setupCanvasDpr(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));

  // SPは1.5上限（Canvasを軽く）
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    window.innerWidth < 768 ? 1.5 : 2
  );

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { W: cssW, H: cssH };
}

/* ─────────────────────────────────────────
   Star field（リアル寄り・小粒・自然な瞬き）
───────────────────────────────────────── */
function StarField({ count = 920, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "420px" });
  const { reduce, factor } = useDeviceFactor();

  useEffect(() => {
    if (reduce) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    if (!canvas || !ctx) return;

    let raf = 0;
    let W = 0, H = 0;

    // ===== 静的 micro 星（高密度・ほぼ不動） =====
    let staticLayer = null;
    let staticDriftPhase = 0;

    // ===== 動的 星（明るい星だけが瞬く） =====
    let stars = [];

    const pick = (arr) => arr[(Math.random() * arr.length) | 0];
    const easeOut = (t) => 1 - (1 - t) * (1 - t);
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    // 低彩度（雰囲気保持）＋青/金は少量
    const C_WHITE = ["244,238,255", "236,220,255", "232,242,255"];
    const C_WARM  = ["255,246,232", "255,238,214", "255,244,226"];
    const C_COOL  = ["226,238,255", "214,232,255", "232,246,255"];
    const C_GOLD  = ["255,236,198", "255,228,176"]; // 少量
    const C_BLUE  = ["202,224,255", "188,214,255"]; // 少量

    const buildStatic = (dpr) => {
      const sc = document.createElement("canvas");
      sc.width = canvas.width;
      sc.height = canvas.height;
      const sctx = sc.getContext("2d", { alpha: true });
      if (!sctx) return null;

      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.clearRect(0, 0, W, H);

      // micro 星は “点” と “微グラデ” を混ぜる
      const microCount = Math.max(600, Math.floor((count * 2.8) * factor)); // 密度の核
      for (let i = 0; i < microCount; i++) {
        const x = rand(0, W);
        const y = rand(0, H);

        // さらに小さく、リアル寄り
        const r = rand(0.12, 0.42);
        const a = rand(0.015, 0.06);

        const roll = Math.random();
        let color = pick(C_WHITE);
        if (roll > 0.995) color = pick(C_GOLD);      // ごく少量
        else if (roll > 0.990) color = pick(C_BLUE); // ごく少量
        else if (roll > 0.70) color = pick(C_COOL);
        else if (roll > 0.42) color = pick(C_WARM);

        // micro はほぼ点
        if (r < 0.26) {
          sctx.fillStyle = `rgba(${color},${a})`;
          sctx.beginPath();
          sctx.arc(x, y, r, 0, Math.PI * 2);
          sctx.fill();
        } else {
          const g = sctx.createRadialGradient(x, y, 0, x, y, r * 3.0);
          g.addColorStop(0, `rgba(255,255,255,${a * 0.12})`);
          g.addColorStop(0.45, `rgba(${color},${a})`);
          g.addColorStop(1, `rgba(${color},0)`);
          sctx.fillStyle = g;
          sctx.beginPath();
          sctx.arc(x, y, r * 3.0, 0, Math.PI * 2);
          sctx.fill();
        }
      }

      return sc;
    };

    const build = () => {
      const size = setupCanvasDpr(canvas, ctx);
      W = size.W;
      H = size.H;

      const dpr = canvas.width / W;

      // 静的 micro 星を作り直す
      staticLayer = buildStatic(dpr);
      staticDriftPhase = Math.random() * Math.PI * 2;

      // 動的星（明るい星だけを集める）
      const actual = Math.max(160, Math.floor(count * factor));
      const now = performance.now();

      stars = Array.from({ length: actual }, () => {
        const r = rand(0.22, 1.05); // 小粒中心 + 少しだけ大きい星
        const bright = r > 0.70;

        const roll = Math.random();
        let color = pick(C_WHITE);
        if (roll > 0.985) color = pick(C_GOLD);
        else if (roll > 0.970) color = pick(C_BLUE);
        else if (roll > 0.72) color = pick(C_COOL);
        else if (roll > 0.46) color = pick(C_WARM);

        // アート寄り：キラッ頻度を上げる（ただし全部は光らせない）
        const sparkChance = bright ? 0.36 : 0.12;

        return {
          x: rand(0, W),
          y: rand(0, H),

          r,
          baseA: bright ? rand(0.10, 0.34) : rand(0.05, 0.18),

          tw1: rand(0.9, 2.4),
          tw2: rand(1.8, 4.8),
          phase: rand(0, Math.PI * 2),

          dx: rand(-0.016, 0.016),
          dy: rand(-0.010, 0.010),

          color,

          sparkOK: Math.random() < sparkChance,
          nextSpark: now + rand(900, 5400),
          sparkDur: rand(140, 260),
          sparkAmp: bright ? rand(0.22, 0.52) : rand(0.10, 0.26),
          sparkEnd: 0,

          // halo は強めでもOK（アート版）
          halo: bright ? rand(3.0, 8.5) : 0,

          // フレアは bright の一部だけ
          flareOK: bright && Math.random() < 0.30,
        };
      });
    };

    const drawStatic = (t) => {
      if (!staticLayer) return;

      // micro 星の“生きてる感” = ほんの少しだけ漂い + 全体呼吸
      const time = t * 0.001;
      const driftX = Math.sin(time * 0.05 + staticDriftPhase) * 3.2;
      const driftY = Math.cos(time * 0.04 + staticDriftPhase) * 2.0;
      const breathe = 0.78 + 0.22 * Math.sin(time * 0.35 + staticDriftPhase);

      ctx.save();
      ctx.globalAlpha = 0.80 * breathe; // microは強すぎない
      ctx.drawImage(staticLayer, driftX, driftY, W, H);
      // 端の欠け防止（反対側にもう1枚）
      ctx.drawImage(staticLayer, driftX - W, driftY, W, H);
      ctx.drawImage(staticLayer, driftX + W, driftY, W, H);
      ctx.restore();
    };

    const drawDynamic = (t) => {
      const now = performance.now();
      const time = t * 0.001;

      for (const s of stars) {
        // 漂い
        s.x += s.dx;
        s.y += s.dy;
        if (s.x < -12) s.x = W + 12;
        if (s.x > W + 12) s.x = -12;
        if (s.y < -12) s.y = H + 12;
        if (s.y > H + 12) s.y = -12;

        // 自然な瞬き（複合）
        const twA = 0.68 + 0.32 * Math.sin(time * s.tw1 + s.phase);
        const twB = 0.80 + 0.20 * Math.sin(time * s.tw2 + s.phase * 1.7);
        let a = s.baseA * twA * twB;

        // キラッ（短時間）
        let spark = 0;
        if (s.sparkOK && now >= s.nextSpark) {
          s.sparkEnd = now + s.sparkDur;
          s.nextSpark = now + rand(1100, 7600);
        }
        if (s.sparkOK && now < s.sparkEnd) {
          const p = 1 - (s.sparkEnd - now) / s.sparkDur; // 0→1
          spark = s.sparkAmp * easeOut(p);
        }

        a = Math.min(0.88, a + spark);

        const x = s.x + Math.sin(time * 0.20 + s.phase) * 1.0;
        const y = s.y + Math.cos(time * 0.16 + s.phase) * 0.7;

        // halo（spark時は強め）
        if (s.halo > 0 && (spark > 0.04 || s.r > 0.82)) {
          const hr = s.halo * (0.90 + spark * 1.05);
          const g = ctx.createRadialGradient(x, y, 0, x, y, hr);
          g.addColorStop(0, `rgba(${s.color},${a * 0.18})`);
          g.addColorStop(0.55, `rgba(${s.color},${a * 0.07})`);
          g.addColorStop(1, `rgba(${s.color},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, hr, 0, Math.PI * 2);
          ctx.fill();
        }

        // core（立体感）
        const cg = ctx.createRadialGradient(x, y, 0, x, y, s.r * 1.7);
        cg.addColorStop(0, `rgba(255,255,255,${a * 0.22})`);
        cg.addColorStop(0.38, `rgba(${s.color},${a})`);
        cg.addColorStop(1, `rgba(${s.color},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 1.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${s.color},${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // flare（アート版：短い十字＋斜め）
        if (s.flareOK && spark > 0.18) {
          const len = s.r * (4.2 + spark * 2.2);
          const aa = a * (0.18 + spark * 0.28);

          ctx.lineWidth = 0.85;
          ctx.strokeStyle = `rgba(${s.color},${aa})`;
          ctx.beginPath();
          ctx.moveTo(x - len, y);
          ctx.lineTo(x + len, y);
          ctx.moveTo(x, y - len);
          ctx.lineTo(x, y + len);
          ctx.stroke();

          ctx.lineWidth = 0.65;
          ctx.strokeStyle = `rgba(${s.color},${aa * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(x - len * 0.72, y - len * 0.72);
          ctx.lineTo(x + len * 0.72, y + len * 0.72);
          ctx.moveTo(x + len * 0.72, y - len * 0.72);
          ctx.lineTo(x - len * 0.72, y + len * 0.72);
          ctx.stroke();
        }
      }
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // micro は少し加算気味の方が“迫力”出る（やりすぎ注意）
      const prev = ctx.globalCompositeOperation;

      ctx.globalCompositeOperation = "source-over";
      drawStatic(t);

      ctx.globalCompositeOperation = "lighter";
      drawDynamic(t);

      ctx.globalCompositeOperation = prev;

      raf = requestAnimationFrame(draw);
    };

    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize, { passive: true });

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, W, H);
      staticLayer = null;
      stars = [];
    };
  }, [count, active, reduce, factor]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0.96, // 迫力側に少し上げ
      }}
    />
  );
}
function MilkyWayBand({ targetId = "hero", count = 1800, z = 2.6 }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "520px" });
  const { reduce, factor, isMobile } = useDeviceFactor();

  const gaussian = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  useEffect(() => {
    if (reduce) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    if (!canvas || !ctx) return;

    let raf = 0;
    let W = 0, H = 0;
    let pts = [];

    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    const C_BASE = ["232,242,255", "244,238,255", "236,220,255"];
    const C_COOL = ["214,232,255", "202,224,255"];
    const C_WARM = ["255,246,232", "255,238,214"];
    const C_GOLD = ["255,236,198"];
    const C_BLUE = ["188,214,255"];

    const build = () => {
      const size = setupCanvasDpr(canvas, ctx);
      W = size.W; H = size.H;

      const actual = Math.max(
        520,
        Math.floor(count * factor * (isMobile ? 0.72 : 1))
      );

      const bandY = H * 0.60;
      const slope = -H * 0.18;
      const spread = H * (isMobile ? 0.060 : 0.075); // 少し太く

      pts = Array.from({ length: actual }, () => {
        const x = rand(0, W);
        const t = x / W - 0.5;
        const centerY = bandY + slope * t;
        const y = centerY + gaussian() * spread;

        const r = rand(0.14, 0.85);
        const bright = r > 0.55;

        const roll = Math.random();
        let color = pick(C_BASE);
        if (roll > 0.993) color = pick(C_GOLD);
        else if (roll > 0.986) color = pick(C_BLUE);
        else if (roll > 0.74) color = pick(C_COOL);
        else if (roll > 0.46) color = pick(C_WARM);

        return {
          x, y, r, color,
          a: bright ? rand(0.020, 0.070) : rand(0.012, 0.050),
          phase: rand(0, Math.PI * 2),
          tw: rand(0.8, 2.4),
          dx: rand(-0.014, 0.014),
          sparkOK: bright && Math.random() < 0.14, // 増やす
        };
      });
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const time = t * 0.001;
      const prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "lighter";

      for (const p of pts) {
        p.x += p.dx;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const tw = 0.76 + 0.24 * Math.sin(time * p.tw + p.phase);
        let a = p.a * tw;

        if (p.sparkOK) {
          const s = 0.5 + 0.5 * Math.sin(time * (p.tw * 2.6) + p.phase * 1.2);
          a += p.a * 0.45 * s; // 増やす
        }

        if (p.r > 0.52) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
          g.addColorStop(0, `rgba(255,255,255,${a * 0.16})`);
          g.addColorStop(0.45, `rgba(${p.color},${a})`);
          g.addColorStop(1, `rgba(${p.color},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${p.color},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = prev;
      raf = requestAnimationFrame(draw);
    };

    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, W, H);
      pts = [];
    };
  }, [count, active, reduce, factor, isMobile]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: z,
        opacity: 0.92, // 少し上げる
      }}
    />
  );
}
/* ─────────────────────────────────────────
   Ink-dust（雰囲気維持：少し薄めて星を主役に）
───────────────────────────────────────── */
function InkDust({ count = 55, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "360px" });
  const { reduce, factor } = useDeviceFactor();

  useEffect(() => {
    if (reduce) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    if (!canvas || !ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let pts = [];

    const build = () => {
      const size = setupCanvasDpr(canvas, ctx);
      W = size.W;
      H = size.H;

      const actual = Math.max(18, Math.floor(count * factor));
      pts = Array.from({ length: actual }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        vy: rand(-0.11, -0.045),
        vx: rand(-0.05, 0.05),
        r: rand(1.2, 3.6),
        alpha: rand(0.028, 0.12), // ★薄め
        hue: rand(250, 300),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (!active) return;

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = H + 10;
          p.x = rand(0, W);
        }
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `hsla(${p.hue},70%,80%,${p.alpha})`);
        g.addColorStop(1, `hsla(${p.hue},70%,80%,0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize, { passive: true });

    if (active) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, W, H);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [count, active, reduce, factor]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
        opacity: 0.9,
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Cursor sparkle trail（PCのみ）
───────────────────────────────────────── */
function CursorTrail({ targetId = "hero" }) {
  const ref = useRef(null);
  const sparksRef = useRef([]);
  const lastSpawnRef = useRef(0);

  const active = useCanvasActive({ targetId, rootMargin: "360px" });
  const { reduce, fine } = useDeviceFactor();

  useEffect(() => {
    if (reduce || !fine) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    const host = document.getElementById(targetId);
    if (!canvas || !ctx || !host) return;

    let raf = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      const size = setupCanvasDpr(canvas, ctx);
      W = size.W;
      H = size.H;
    };

    const onMove = (e) => {
      if (!active) return;

      const now = performance.now();
      if (now - lastSpawnRef.current < 22) return; // 少し間引き（上品）
      lastSpawnRef.current = now;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      sparksRef.current.push({
        x: mx + rand(-3, 3),
        y: my + rand(-3, 3),
        vx: rand(-0.65, 0.65),
        vy: rand(-1.15, -0.35),
        r: rand(0.7, 2.0),
        life: 1,
        decay: rand(0.03, 0.06),
        hue: rand(260, 310),
      });

      if (sparksRef.current.length > 120) {
        sparksRef.current.splice(0, sparksRef.current.length - 120);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (!active) return;

      const list = sparksRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy *= 0.97;
        s.life -= s.decay;

        if (s.life <= 0) {
          list.splice(i, 1);
          continue;
        }

        const a = s.life * 0.55;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},80%,86%,${a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    host.addEventListener("pointermove", onMove, { passive: true });

    if (active) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, W, H);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointermove", onMove);
      sparksRef.current = [];
      ctx.clearRect(0, 0, W, H);
    };
  }, [targetId, active, reduce, fine]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 11,
        opacity: 0.95,
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Constellation（そのまま）
───────────────────────────────────────── */
function Constellation() {
  const nodes = [
    { x: "72%", y: "18%" },
    { x: "81%", y: "28%" },
    { x: "76%", y: "40%" },
    { x: "88%", y: "35%" },
    { x: "83%", y: "52%" },
    { x: "70%", y: "58%" },
    { x: "91%", y: "62%" },
    { x: "78%", y: "72%" },
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
  ];

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 4,
        opacity: 0.95,
      }}
    >
      <defs>
        <style>{`
          @keyframes dash { to { stroke-dashoffset: 0; } }
          @keyframes twinkle { 0%,100%{opacity:0.12} 50%{opacity:0.68} }
          .cline { stroke-dasharray: 120; stroke-dashoffset: 120; animation: dash 2.8s ease forwards; }
          .cnode { animation: twinkle 3.2s ease-in-out infinite; }
        `}</style>
      </defs>

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="rgba(200,160,255,0.22)"
          strokeWidth="0.7"
          className="cline"
          style={{ animationDelay: `${0.25 + i * 0.2}s` }}
        />
      ))}

      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r="2.2"
          fill="rgba(230,200,255,0.7)"
          className="cnode"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Space texture layer（2層・ドリフト）
───────────────────────────────────────── */
function SpaceTexture({ reduce }) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `url(${SPACE_TEXTURE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.12,
          mixBlendMode: "screen",
          filter: "saturate(0.92) contrast(1.06) brightness(0.74)",
          transform: "scale(1.04)",
          animation: reduce ? "none" : "meishikiSpaceDriftA 26s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-10%",
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `url(${SPACE_TEXTURE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          mixBlendMode: "screen",
          filter: "blur(10px) saturate(1.05) brightness(0.70)",
          transform: "scale(1.10)",
          animation: reduce ? "none" : "meishikiSpaceDriftB 38s ease-in-out infinite",
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────
   Moon artifact（そのまま）
───────────────────────────────────────── */
function MoonArtifact({ targetId = "hero" }) {
  const wrapRef = useRef(null);
  const { reduce, fine } = useDeviceFactor();

  useEffect(() => {
    if (reduce) return;

    const host = document.getElementById(targetId);
    const el = wrapRef.current;
    if (!host || !el) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e) => {
      if (!fine) return;
      const rect = host.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      tx = (px - 0.5) * 16;
      ty = (py - 0.5) * -16;
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;

      el.style.transform = `
        translate3d(${cx}px, ${cy}px, 0)
        rotateX(${cy * 0.35}deg)
        rotateY(${cx * 0.45}deg)
        scale(1)
      `;

      raf = requestAnimationFrame(tick);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
    };
  }, [reduce, fine, targetId]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "10%",
        right: "4%",
        width: "clamp(220px, 26vw, 380px)",
        aspectRatio: "1 / 1",
        zIndex: 8,
        pointerEvents: "none",
        perspective: "1200px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "14%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(177,135,255,0.20) 0%, rgba(177,135,255,0.10) 34%, rgba(177,135,255,0.04) 56%, rgba(177,135,255,0) 74%)",
          filter: "blur(20px)",
          animation: "moonAura 6.5s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "50%",
          border: "1px solid rgba(210,180,255,0.16)",
          boxShadow:
            "0 0 36px rgba(170,110,255,0.12), inset 0 0 32px rgba(200,160,255,0.06)",
          animation: "rotateSlow 42s linear infinite",
        }}
      />

      <div
        ref={wrapRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          transformStyle: "preserve-3d",
          animation: "moonFloat 8s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-6%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 40%, rgba(255,255,255,0.06), rgba(140,90,255,0.08) 42%, rgba(0,0,0,0) 70%)",
            filter: "blur(14px)",
            opacity: 0.55,
            mixBlendMode: "screen",
            pointerEvents: "none",
            transform: "translateZ(30px)",
          }}
        />

        <img
          src={MOON_OBJECT}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            filter:
              "drop-shadow(0 18px 30px rgba(12,6,22,0.42)) drop-shadow(0 0 28px rgba(190,145,255,0.18))",
            transform: "translateZ(24px)",
            userSelect: "none",
            WebkitUserDrag: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Decorative helpers（記号群のアップグレード）
───────────────────────────────────────── */
function InkReveal({ children, delay = 0, style }) {
  return (
    <span
      style={{
        display: "inline-block",
        animation: `inkReveal 1.2s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function GlowDivider({ delay = 0 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: `fadeUp 1s ease ${delay}s both`,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to right, rgba(180,130,255,0), rgba(180,130,255,0.35), rgba(180,130,255,0))",
        }}
      />
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "rgba(200,160,255,0.6)",
          boxShadow: "0 0 7px rgba(200,160,255,0.75)",
        }}
      />
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to right, rgba(180,130,255,0), rgba(180,130,255,0.35), rgba(180,130,255,0))",
        }}
      />
    </div>
  );
}

function CTAButton({ onClick, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    onClick?.();
  };

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className="hero-cta"
      style={{
        animation: `fadeUp 1s ease ${delay}s both`,
      }}
    >
      {ripple && <span className="hero-cta-ripple" aria-hidden="true" />}

      <span className="hero-cta-mark" aria-hidden="true">
        命
      </span>

      <span className="hero-cta-text">命式を起こす</span>
      <span className="hero-cta-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

function GlyphPill({ children, strong = false }) {
  return (
    <span
      className={["hero-glyph", strong ? "is-strong" : ""].join(" ")}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

// PC：縦の儀式（記入/年柱/命式/印）
function VerticalSteps() {
  const steps = ["記入", "年柱", "命式", "印"];
  return (
    <div className="hero-steps" aria-hidden="true">
      {steps.map((s, i) => (
        <div key={i} className="hero-steps-item">
          <GlyphPill strong={i === 0}>{s}</GlyphPill>
          {i < steps.length - 1 && <span className="hero-steps-line" />}
        </div>
      ))}
    </div>
  );
}
// SP：PCと同じ儀式UIを「右下の背景」として固定
function MobileGlyphRow() {
  const steps = ["記入", "年柱", "命式", "印"];

  return (
    <div className="hero-mobile-ritual hero-mobile-ritual--bg" aria-hidden="true">
      <div className="hero-steps hero-steps--mobile">
        {steps.map((s, i) => (
          <div key={s} className="hero-steps-item">
            <GlyphPill strong={i === 0}>{s}</GlyphPill>
            {i < steps.length - 1 && <span className="hero-steps-line" />}
          </div>
        ))}
      </div>

      <div className="hero-mobile-kan">

      </div>
    </div>
  );
}
/* ─────────────────────────────────────────
   Main Hero
───────────────────────────────────────── */
export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const { reduce, isMobile } = useDeviceFactor();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const goInput = () => {
    const el = document.getElementById("input");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="hero"
      className="meishiki-hero"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100svh",
        background: "#0a0610",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* scope reset */
        .meishiki-hero, .meishiki-hero * { box-sizing: border-box; }
        .meishiki-hero h1, .meishiki-hero p { margin: 0; }
        .meishiki-hero button { font: inherit; color: inherit; }

        /* layout */
        .hero-wrap{
          position: relative;
          z-index: 20;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(56px,8vh,104px) clamp(18px,4vw,44px) clamp(44px,7vh,86px);
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          font-family: 'Noto Serif JP','Hiragino Mincho ProN',serif;
        }
        .hero-grid{
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 48px;
          align-items: center;
          padding-top: clamp(18px,5vh,56px);
        }
        .hero-left{ max-width: 680px; }
        .hero-right{
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          animation: fadeUp 1.2s ease 0.8s both;
        }
        @media (max-width: 980px){
          .hero-grid{ grid-template-columns: 1fr; gap: 36px; }
          .hero-right{ display: none; }
        }

        /* topbar：SPで散らばりを抑える */
        .hero-topbar{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap: 16px;
          animation: fadeUp 0.8s ease 0.1s both;
          opacity: ${loaded ? 1 : 0};
        }
        .hero-top-left{
          display:flex;
          align-items:center;
          gap:10px;
          font-size:10px;
          letter-spacing:0.34em;
          color: rgba(200,160,255,0.7);
        }
        .hero-top-right{
          display:flex;
          align-items:center;
          gap:16px;
          font-size:10px;
          letter-spacing:0.22em;
          color: rgba(160,120,220,0.55);
        }
        .hero-top-badge{
          width:18px;height:18px;border-radius:999px;
          border:1px solid rgba(200,160,255,0.35);
          display:flex;align-items:center;justify-content:center;
          font-size:8px; letter-spacing:0.05em;
          background: rgba(120,70,200,0.10);
        }
        @media (max-width: 640px){
          .hero-topbar{ flex-direction:column; align-items:flex-start; gap:10px; }
          .hero-top-left{ letter-spacing:0.26em; }
          .hero-top-right{ letter-spacing:0.18em; gap:10px; }
        }

        /* keyframes */
        @keyframes inkReveal {
          from { opacity: 0; transform: translateY(22px) skewY(2deg); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) skewY(0deg); filter: blur(0px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rippleOut {
          from { transform: scale(0.8); opacity: 1; }
          to   { transform: scale(2); opacity: 0; }
        }
        @keyframes rotateSlow { to { transform: rotate(360deg); } }
        @keyframes breathe { 0%,100%{opacity:.65; transform: scale(1);} 50%{opacity:1; transform: scale(1.03);} }
        @keyframes moonFloat {
          0%,100% { transform: translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg); }
          50% { transform: translate3d(0px, -10px, 0) rotateX(2deg) rotateY(-2deg); }
        }
        @keyframes moonAura {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
        @keyframes meishikiSpaceDriftA {
          0%   { transform:translate3d(0%,0%,0) scale(1.06); opacity:.16; }
          50%  { transform:translate3d(-1.1%,-0.9%,0) scale(1.10); opacity:.22; }
          100% { transform:translate3d(0%,0%,0) scale(1.06); opacity:.16; }
        }
        @keyframes meishikiSpaceDriftB {
          0%   { transform:translate3d(0%,0%,0) scale(1.08); opacity:.10; }
          50%  { transform:translate3d(1.3%,1.0%,0) scale(1.14); opacity:.16; }
          100% { transform:translate3d(0%,0%,0) scale(1.08); opacity:.10; }
        }
        @keyframes meishikiAuroraSweep {
          0%   { transform:translate3d(-18%,0,0) rotate(-4deg); opacity:.14; }
          50%  { transform:translate3d(10%,0,0) rotate(2deg);  opacity:.28; }
          100% { transform:translate3d(22%,0,0) rotate(-2deg); opacity:.14; }
        }

        /* CTA */
        .hero-cta{
          position:relative;
          overflow:hidden;
          display:inline-flex;
          align-items:center;
          gap:12px;
          padding: 14px 32px;
          border-radius: 999px;
          border: 1px solid rgba(200,160,255,0.30);
          background: rgba(120,70,200,0.12);
          cursor:pointer;
          transition: all .35s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 0 14px rgba(120,70,200,0.10);
          outline:none;
        }
        .hero-cta:hover{
          border-color: rgba(200,160,255,0.52);
          background: rgba(160,100,255,0.16);
          box-shadow: 0 0 34px rgba(160,100,255,0.20), inset 0 0 18px rgba(160,100,255,0.08);
        }
        .hero-cta:active{ transform: scale(0.985); background: rgba(170,110,255,0.18); }
        .hero-cta-ripple{
          position:absolute; inset:0;
          background: radial-gradient(circle at 50% 50%, rgba(200,160,255,0.26), transparent 70%);
          animation: rippleOut 0.6s ease forwards;
          border-radius: 999px;
          pointer-events:none;
        }
        .hero-cta-mark{
          width:28px;height:28px;border-radius:999px;
          border: 1px solid rgba(200,160,255,0.40);
          display:flex;align-items:center;justify-content:center;
          font-size:11px; letter-spacing:0.06em;
          color: rgba(220,190,255,0.86);
          background: rgba(120,70,200,0.15);
          flex-shrink:0;
        }
        .hero-cta-text{
          font-size:12px;
          letter-spacing:0.28em;
          color: rgba(240,220,255,0.92);
          font-weight:400;
        }
        .hero-cta-arrow{
          font-size:10px;
          color: rgba(200,160,255,0.60);
        }
        @media (max-width: 640px){
          .hero-cta{ padding: 14px 22px; }
          .hero-cta-text{ letter-spacing: 0.22em; }
        }

        /* Glyphs（記入/年柱/命式/印/干/命） */
        .hero-glyph{
          width: 30px; height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(200,160,255,0.22);
          display:flex; align-items:center; justify-content:center;
          font-size: 9px;
          letter-spacing: 0.10em;
          color: rgba(220,190,255,0.50);
          background: rgba(255,255,255,0.02);
          box-shadow: inset 0 0 18px rgba(180,130,255,0.06);
          backdrop-filter: blur(8px);
        }
        .hero-glyph.is-strong{
          border-color: rgba(200,160,255,0.55);
          color: rgba(236,218,255,0.88);
          background: rgba(160,100,255,0.14);
        }

        .hero-steps{ display:flex; flex-direction:column; align-items:center; gap:0; }
        .hero-steps-item{ display:flex; flex-direction:column; align-items:center; }
        .hero-steps-line{
          width:1px; height:18px;
          background: rgba(160,100,255,0.18);
        }

        /* SP: 集合させたギリ読める行（散らばり防止） */
        .hero-glyph-row{
          display:none;
          margin-top: 18px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          width: fit-content;
          max-width: 100%;
        }
        .hero-glyph-row-item{
          display:inline-flex;
          align-items:center;
          gap:8px;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: rgba(235,220,255,0.72);
          white-space: nowrap;
        }
        .hero-glyph-row-dot{
          width:6px;height:6px;border-radius:999px;
          background: rgba(200,160,255,0.40);
          box-shadow: 0 0 10px rgba(200,160,255,0.20);
        }
        .hero-glyph-row-text{ transform: translateY(0.5px); }
        .hero-glyph-row-sep{
          margin: 0 10px;
          opacity: 0.28;
          letter-spacing: 0;
        }
        @media (max-width: 980px){
          .hero-glyph-row{ display:inline-block; }
        }

        /* reduced motion */
        @media (prefers-reduced-motion: reduce){
          .meishiki-hero * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* deep bg */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(ellipse at 20% 30%, rgba(130,60,200,0.28) 0%, transparent 55%)",
            "radial-gradient(ellipse at 78% 70%, rgba(80,30,150,0.18) 0%, transparent 50%)",
            "radial-gradient(ellipse at 50% 90%, rgba(60,20,110,0.22) 0%, transparent 60%)",
            "linear-gradient(170deg, #0f0818 0%, #0a0610 40%, #0d0920 100%)",
          ].join(","),
          zIndex: 0,
        }}
      />

      {/* aurora薄膜 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-12%",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(190,145,255,0.10) 40%, rgba(170,110,255,0.06) 54%, rgba(0,0,0,0) 100%)",
          filter: "blur(26px) saturate(1.12)",
          mixBlendMode: "screen",
          animation: reduce ? "none" : "meishikiAuroraSweep 18s ease-in-out infinite",
          opacity: 0.55,
        }}
      />

      {/* texture */}
      <SpaceTexture reduce={reduce} />

      {/* dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 0.10,
          backgroundImage:
            "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
          backgroundSize: "160px 160px",
          backgroundPosition: "22px 12px",
        }}
      />

      {/* effects */}
<StarField count={920} targetId="hero" />
<MilkyWayBand targetId="hero" count={1800} />
<InkDust count={72} targetId="hero" />
      <Constellation />
      <MoonArtifact targetId="hero" />
      <CursorTrail targetId="hero" />

      {/* outer ring */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "5%",
          right: "3%",
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "1px dashed rgba(180,130,255,0.12)",
          animation: "rotateSlow 40s linear infinite",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* scan line */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 6,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)",
          opacity: 0.85,
        }}
      />

      {/* content */}
      <div className="hero-wrap">
        {/* top bar（命/命式/年柱を維持） */}
        <div className="hero-topbar">
          <div className="hero-top-left">
            <div className="hero-top-badge">命</div>
            <span>命式</span>
            <span style={{ opacity: 0.35, letterSpacing: 0 }}>／</span>
            <span style={{ color: "rgba(200,160,255,0.52)" }}>算命学・年柱</span>
          </div>

          <div className="hero-top-right">
            <span>保存なし</span>
            <span style={{ opacity: 0.28 }}>｜</span>
            <span>課金なし</span>
          </div>
        </div>

        {/* center */}
        <div className="hero-grid">
          {/* left */}
          <div className="hero-left">
            {/* eyebrow（SPは少し詰めて見やすく） */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
                animation: "fadeUp 0.9s ease 0.3s both",
              }}
            >
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "rgba(200,160,255,0.55)",
                    boxShadow: "0 0 6px rgba(200,160,255,0.6)",
                  }}
                />
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(200,160,255,0.3)",
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: 10,
                  letterSpacing: isMobile ? "0.22em" : "0.36em",
                  color: "rgba(200,160,255,0.72)",
                }}
              >
                生年月日から年柱（年干支）を起こす
              </span>
            </div>

            {/* title */}
            <div style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-6%",
                  top: "8%",
                  width: "112%",
                  height: "88%",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle, rgba(182,136,255,0.18) 0%, rgba(182,136,255,0.08) 28%, rgba(182,136,255,0) 72%)",
                  filter: "blur(26px)",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />

              <h1 style={{ position: "relative", zIndex: 1, lineHeight: 0.98, letterSpacing: "0.08em" }}>
                <InkReveal delay={0.5} style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(28px,3.1vw,42px)",
                      fontWeight: 500,
                      letterSpacing: isMobile ? "0.14em" : "0.18em",
                      color: "rgba(236,226,248,0.92)",
                      textShadow:
                        "0 0 10px rgba(192,150,255,0.16), 0 0 1px rgba(255,255,255,0.35)",
                      marginBottom: "0.12em",
                    }}
                  >
                    命式を
                  </span>
                </InkReveal>

                <InkReveal delay={0.72} style={{ display: "block" }}>
                  <span style={{ display: "inline-flex", alignItems: "flex-end", gap: "0.02em" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "clamp(52px,7.4vw,98px)",
                        fontWeight: 500,
                        letterSpacing: isMobile ? "0.08em" : "0.12em",
                        lineHeight: 0.94,
                        background:
                          "linear-gradient(180deg, rgba(250,245,255,0.98) 0%, rgba(228,203,255,0.97) 22%, rgba(196,150,255,0.95) 58%, rgba(236,222,255,0.98) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter:
                          "drop-shadow(0 0 14px rgba(192,144,255,0.18)) drop-shadow(0 0 28px rgba(120,70,210,0.12))",
                      }}
                    >
                      起こす
                    </span>

                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "clamp(40px,5.2vw,62px)",
                        transform: "translateY(-0.04em)",
                        color: "rgba(234,214,255,0.94)",
                        textShadow:
                          "0 0 10px rgba(196,150,255,0.26), 0 0 22px rgba(160,108,255,0.16)",
                      }}
                    >
                      。
                    </span>
                  </span>
                </InkReveal>
              </h1>
            </div>

            {/* mobile glyph row（散らばりを集合） */}
            <MobileGlyphRow />

            {/* body copy */}
            <div
              style={{
                maxWidth: "56ch",
                fontSize: "clamp(13px,1.4vw,15px)",
                lineHeight: 2.15,
                letterSpacing: isMobile ? "0.02em" : "0.04em",
                color: "rgba(210,190,240,0.82)",
                marginTop: 22,
                marginBottom: 34,
                animation: "fadeUp 1s ease 1.0s both",
              }}
            >
              <p>生年月日を記すと、年柱（年干支）が立ち上がる。</p>
              <p style={{ color: "rgba(190,165,225,0.65)", fontSize: "0.92em", marginTop: 10 }}>
                断定ではなく、傾向と条件を読むための記録。
              </p>
            </div>

            {/* CTA row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                flexWrap: "wrap",
                marginBottom: 34,
              }}
            >
              <CTAButton onClick={goInput} delay={1.2} />

              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.9,
                  letterSpacing: isMobile ? "0.12em" : "0.18em",
                  color: "rgba(180,150,220,0.6)",
                  animation: "fadeUp 1s ease 1.4s both",
                }}
              >
                生年月日を記す（約30秒）
                <br />
                <span style={{ color: "rgba(160,130,200,0.45)" }}>
                  任意：出生地・出生時間・名前
                </span>
              </div>
            </div>

            <GlowDivider delay={1.5} />

            {/* disclaimer */}
            <div
              style={{
                marginTop: 22,
                fontSize: 10,
                lineHeight: 1.9,
                letterSpacing: isMobile ? "0.10em" : "0.14em",
                color: "rgba(160,130,200,0.42)",
                animation: "fadeUp 1s ease 1.8s both",
              }}
            >
              ※ これは予言ではありません。あなたの判断と行動が、現実をつくります。
            </div>
          </div>

          {/* right（PCのみ）：記入/年柱/命式/印 + 干 を保持 */}
          <div className="hero-right">
            <VerticalSteps />

            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "1px solid rgba(180,130,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "rgba(220,190,255,0.8)",
                boxShadow: "0 0 20px rgba(160,100,255,0.15)",
                animation: "breathe 5s ease-in-out infinite",
                letterSpacing: "0.05em",
              }}
              aria-hidden="true"
              title="干"
            >
              干
            </div>

            {/* 「印」も右側に残像的に */}
            <div
              aria-hidden="true"
              style={{
                marginTop: 2,
                fontSize: 10,
                letterSpacing: "0.32em",
                color: "rgba(200,160,255,0.38)",
              }}
            >
              印
            </div>
          </div>
        </div>
      </div>

      {/* bottom vignette（Inputへ溶ける） */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          height: "18vh",
          background: "linear-gradient(to top, rgba(8,4,14,0.92), transparent)",
          pointerEvents: "none",
          zIndex: 7,
        }}
      />
    </section>
  );
}