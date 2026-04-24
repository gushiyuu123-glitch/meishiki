import { useEffect, useMemo, useRef, useState } from "react";
import useCanvasActive from "../hooks/useCanvasActive";

/* ─────────────────────────────────────────
   Assets
───────────────────────────────────────── */
const SPACE_TEXTURE = "/meishiki/space-texture.png";
const MOON_OBJECT = "/meishiki/moon-object.png";

/* ─────────────────────────────────────────
   Utility
───────────────────────────────────────── */
const rand = (a, b) => Math.random() * (b - a) + a;

function useDeviceProfile() {
  const [profile, setProfile] = useState({
    reduce: false,
    fine: false,
    factor: 0.55,
  });

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;

    setProfile({
      reduce: Boolean(reduce),
      fine: Boolean(fine),
      factor: fine ? 1 : 0.52,
    });
  }, []);

  return profile;
}

function setupCanvasDpr(canvas, ctx) {
  const cssW = Math.max(1, canvas.offsetWidth);
  const cssH = Math.max(1, canvas.offsetHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { W: cssW, H: cssH };
}

/* ─────────────────────────────────────────
   Star field
───────────────────────────────────────── */
function StarField({ count = 260, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "320px" });
  const { reduce, factor } = useDeviceProfile();

  useEffect(() => {
    if (reduce) return undefined;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });

    if (!canvas || !ctx) return undefined;

    let raf = 0;
    let W = 0;
    let H = 0;
    let stars = [];

    const build = () => {
      const size = setupCanvasDpr(canvas, ctx);
      W = size.W;
      H = size.H;

      const actual = Math.max(90, Math.floor(count * factor));

      stars = Array.from({ length: actual }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.25, 1.35),
        alpha: rand(0.12, 0.82),
        speed: rand(0.00045, 0.0024),
        drift: rand(3, 12),
        phase: rand(0, Math.PI * 2),
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      if (!active) return;

      for (const s of stars) {
        const pulse = 0.45 + 0.55 * Math.sin(t * s.speed * 1000 + s.phase);
        const alpha = s.alpha * pulse;
        const x = s.x + Math.sin(t * 0.00035 + s.phase) * s.drift;

        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248,240,255,${alpha})`;
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
  }, [active, count, factor, reduce]);

  return <canvas ref={ref} className="meishiki-canvas meishiki-stars" aria-hidden="true" />;
}

/* ─────────────────────────────────────────
   Ink dust
───────────────────────────────────────── */
function InkDust({ count = 58, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "320px" });
  const { reduce, factor } = useDeviceProfile();

  useEffect(() => {
    if (reduce) return undefined;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });

    if (!canvas || !ctx) return undefined;

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
        vx: rand(-0.055, 0.055),
        vy: rand(-0.105, -0.035),
        r: rand(1.1, 4.2),
        alpha: rand(0.035, 0.145),
        hue: rand(255, 292),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (!active) return;

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -14) {
          p.y = H + 14;
          p.x = rand(0, W);
        }

        if (p.x < -24) p.x = W + 24;
        if (p.x > W + 24) p.x = -24;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);

        g.addColorStop(0, `hsla(${p.hue}, 72%, 80%, ${p.alpha})`);
        g.addColorStop(1, `hsla(${p.hue}, 72%, 80%, 0)`);

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
  }, [active, count, factor, reduce]);

  return <canvas ref={ref} className="meishiki-canvas meishiki-dust" aria-hidden="true" />;
}

/* ─────────────────────────────────────────
   Cursor trail
───────────────────────────────────────── */
function CursorTrail({ targetId = "hero" }) {
  const ref = useRef(null);
  const sparksRef = useRef([]);
  const lastSpawnRef = useRef(0);

  const active = useCanvasActive({ targetId, rootMargin: "320px" });
  const { reduce, fine } = useDeviceProfile();

  useEffect(() => {
    if (reduce || !fine) return undefined;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    const host = document.getElementById(targetId);

    if (!canvas || !ctx || !host) return undefined;

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

      if (now - lastSpawnRef.current < 18) return;
      lastSpawnRef.current = now;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = 0; i < 2; i += 1) {
        sparksRef.current.push({
          x: mx + rand(-4, 4),
          y: my + rand(-4, 4),
          vx: rand(-0.8, 0.8),
          vy: rand(-1.4, -0.25),
          r: rand(1, 2.6),
          life: 1,
          decay: rand(0.025, 0.052),
          hue: rand(262, 306),
        });
      }

      if (sparksRef.current.length > 160) {
        sparksRef.current.splice(0, sparksRef.current.length - 160);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (!active) return;

      const list = sparksRef.current;

      for (let i = list.length - 1; i >= 0; i -= 1) {
        const s = list[i];

        s.x += s.vx;
        s.y += s.vy;
        s.vy *= 0.97;
        s.life -= s.decay;

        if (s.life <= 0) {
          list.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 92%, 82%, ${s.life * 0.65})`;
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
  }, [active, fine, reduce, targetId]);

  return <canvas ref={ref} className="meishiki-canvas meishiki-cursor" aria-hidden="true" />;
}

/* ─────────────────────────────────────────
   Constellation
───────────────────────────────────────── */
function Constellation() {
  const nodes = useMemo(
    () => [
      { x: "72%", y: "17%" },
      { x: "81%", y: "28%" },
      { x: "75%", y: "40%" },
      { x: "88%", y: "35%" },
      { x: "83%", y: "52%" },
      { x: "70%", y: "58%" },
      { x: "91%", y: "62%" },
      { x: "78%", y: "72%" },
    ],
    []
  );

  const edges = useMemo(
    () => [
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
      [4, 5],
      [4, 6],
      [5, 7],
      [6, 7],
    ],
    []
  );

  return (
    <svg className="meishiki-constellation" aria-hidden="true">
      <defs>
        <style>{`
          @keyframes meishikiDash { to { stroke-dashoffset: 0; } }
          @keyframes meishikiTwinkle { 0%,100%{opacity:0.14} 50%{opacity:0.72} }
          .meishiki-cline {
            stroke-dasharray: 120;
            stroke-dashoffset: 120;
            animation: meishikiDash 2.8s cubic-bezier(.22,.56,.18,1) forwards;
          }
          .meishiki-cnode {
            animation: meishikiTwinkle 3.2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {edges.map(([a, b], index) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="rgba(208,170,255,0.22)"
          strokeWidth="0.72"
          className="meishiki-cline"
          style={{ animationDelay: `${0.35 + index * 0.22}s` }}
        />
      ))}

      {nodes.map((node, index) => (
        <circle
          key={`${node.x}-${node.y}`}
          cx={node.x}
          cy={node.y}
          r="2.2"
          fill="rgba(234,210,255,0.72)"
          className="meishiki-cnode"
          style={{ animationDelay: `${index * 0.36}s` }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Space texture
───────────────────────────────────────── */
function SpaceTexture() {
  return <div className="meishiki-space-texture" aria-hidden="true" />;
}

/* ─────────────────────────────────────────
   Moon artifact
───────────────────────────────────────── */
function MoonArtifact({ targetId = "hero" }) {
  const tiltRef = useRef(null);
  const { reduce, fine } = useDeviceProfile();

  useEffect(() => {
    if (reduce) return undefined;

    const host = document.getElementById(targetId);
    const el = tiltRef.current;

    if (!host || !el) return undefined;

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
        rotateX(${cy * 0.34}deg)
        rotateY(${cx * 0.44}deg)
      `;

      raf = requestAnimationFrame(tick);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
    };
  }, [fine, reduce, targetId]);

  return (
    <div className="meishiki-moon" aria-hidden="true">
      <div className="meishiki-moon-aura" />
      <div className="meishiki-moon-ring" />
      <div className="meishiki-moon-float">
        <div ref={tiltRef} className="meishiki-moon-tilt">
          <div className="meishiki-moon-glass" />
          <img
            src={MOON_OBJECT}
            alt=""
            className="meishiki-moon-img"
            loading="eager"
            decoding="async"
            draggable="false"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   UI fragments
───────────────────────────────────────── */
function InkReveal({ children, delay = 0, className = "" }) {
  return (
    <span
      className={`meishiki-ink ${className}`}
      style={{ "--delay": `${delay}s` }}
    >
      {children}
    </span>
  );
}

function GlowDivider({ delay = 0 }) {
  return (
    <div className="meishiki-divider" style={{ "--delay": `${delay}s` }} aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  );
}

function CTAButton({ onClick, delay = 0 }) {
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    window.setTimeout(() => setRipple(false), 620);
    onClick?.();
  };

  return (
    <button
      type="button"
      className="meishiki-cta"
      style={{ "--delay": `${delay}s` }}
      onClick={handleClick}
    >
      {ripple && <span className="meishiki-cta-ripple" aria-hidden="true" />}

      <span className="meishiki-cta-seal" aria-hidden="true">
        命
      </span>

      <span className="meishiki-cta-text">命式を起こす</span>
      <span className="meishiki-cta-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

function VerticalSteps() {
  const steps = ["記入", "年柱", "命式", "印"];

  return (
    <div className="meishiki-steps" aria-hidden="true">
      {steps.map((step, index) => (
        <div className="meishiki-step" key={step}>
          <span className={index === 0 ? "is-current" : ""}>{step}</span>
          {index < steps.length - 1 && <i />}
        </div>
      ))}
    </div>
  );
}

function HexLines() {
  const lines = [
    [true, true],
    [true, false],
    [true, true],
    [false, true],
    [true, true],
    [false, false],
  ];

  return (
    <div className="meishiki-hex" aria-hidden="true">
      {lines.map((pair, index) => (
        <div key={index}>
          <span className={pair[0] ? "long" : "short"} />
          <em />
          <span className={pair[1] ? "long" : "short"} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Hero
───────────────────────────────────────── */
export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const goInput = () => {
    const el = document.getElementById("input");
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section id="hero" className={`meishiki-hero ${loaded ? "is-loaded" : ""}`}>
      <style>{`
        .meishiki-hero,
        .meishiki-hero * {
          box-sizing: border-box;
        }

        .meishiki-hero {
          position: relative;
          width: 100%;
          min-height: 100svh;
          overflow: hidden;
          background: #09050f;
          color: rgba(244, 236, 255, 0.92);
          font-family: "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
          isolation: isolate;
        }

        .meishiki-hero h1,
        .meishiki-hero p {
          margin: 0;
        }

        .meishiki-hero button {
          font: inherit;
          color: inherit;
        }

        .meishiki-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse at 20% 30%, rgba(130, 60, 200, 0.30) 0%, transparent 55%),
            radial-gradient(ellipse at 78% 70%, rgba(80, 30, 150, 0.20) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(60, 20, 110, 0.24) 0%, transparent 60%),
            linear-gradient(170deg, #0f0818 0%, #09050f 40%, #0d0920 100%);
        }

        .meishiki-space-texture {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url("${SPACE_TEXTURE}");
          background-size: cover;
          background-position: center;
          opacity: 0.12;
          mix-blend-mode: screen;
          filter: saturate(0.92) contrast(1.05) brightness(0.72);
          transform: scale(1.03);
        }

        .meishiki-veil {
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(7, 3, 12, 0.72), rgba(7, 3, 12, 0.34) 36%, rgba(7, 3, 12, 0.12) 64%, rgba(7, 3, 12, 0.40)),
            linear-gradient(180deg, rgba(7, 3, 12, 0.16), transparent 42%, rgba(7, 3, 12, 0.92));
        }

        .meishiki-scan {
          position: absolute;
          inset: 0;
          z-index: 7;
          pointer-events: none;
          background-image:
            repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.012) 0px,
              rgba(255, 255, 255, 0.012) 1px,
              transparent 1px,
              transparent 3px
            );
        }

        .meishiki-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(60px);
          pointer-events: none;
          animation: meishikiOrbFloat 8s ease-in-out infinite;
          z-index: 0;
        }

        .meishiki-orb-1 {
          top: 10%;
          left: -5%;
          width: 500px;
          height: 400px;
          background: radial-gradient(circle, rgba(120, 50, 200, 0.24) 0%, transparent 70%);
        }

        .meishiki-orb-2 {
          bottom: 15%;
          right: -8%;
          width: 560px;
          height: 420px;
          background: radial-gradient(circle, rgba(80, 20, 170, 0.18) 0%, transparent 70%);
          animation-delay: 3s;
        }

        .meishiki-orb-3 {
          top: 50%;
          left: 40%;
          width: 300px;
          height: 280px;
          background: radial-gradient(circle, rgba(160, 90, 255, 0.11) 0%, transparent 70%);
          animation-delay: 5s;
        }

        .meishiki-canvas,
        .meishiki-constellation {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .meishiki-stars {
          z-index: 2;
        }

        .meishiki-dust {
          z-index: 3;
        }

        .meishiki-constellation {
          z-index: 4;
        }

        .meishiki-cursor {
          z-index: 18;
        }

        .meishiki-outer-ring {
          position: absolute;
          top: 5%;
          right: 3%;
          width: 140px;
          height: 140px;
          border-radius: 999px;
          border: 1px dashed rgba(200, 160, 255, 0.13);
          animation: meishikiRotateSlow 42s linear infinite;
          pointer-events: none;
          z-index: 5;
        }

        .meishiki-moon {
          position: absolute;
          top: 9%;
          right: 4%;
          width: clamp(220px, 26vw, 380px);
          aspect-ratio: 1 / 1;
          z-index: 9;
          pointer-events: none;
          perspective: 1200px;
        }

        .meishiki-moon-aura {
          position: absolute;
          inset: 14%;
          border-radius: 999px;
          background:
            radial-gradient(
              circle,
              rgba(177, 135, 255, 0.22) 0%,
              rgba(177, 135, 255, 0.10) 34%,
              rgba(177, 135, 255, 0.04) 56%,
              transparent 74%
            );
          filter: blur(20px);
          animation: meishikiMoonAura 6.6s ease-in-out infinite;
        }

        .meishiki-moon-ring {
          position: absolute;
          inset: 6%;
          border-radius: 999px;
          border: 1px solid rgba(210, 180, 255, 0.16);
          box-shadow:
            0 0 36px rgba(170, 110, 255, 0.12),
            inset 0 0 32px rgba(200, 160, 255, 0.06);
          animation: meishikiRotateSlow 44s linear infinite;
        }

        .meishiki-moon-float {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          animation: meishikiMoonFloat 8s ease-in-out infinite;
        }

        .meishiki-moon-tilt {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .meishiki-moon-glass {
          position: absolute;
          inset: -6%;
          border-radius: 999px;
          background:
            radial-gradient(
              circle at 35% 40%,
              rgba(255, 255, 255, 0.06),
              rgba(140, 90, 255, 0.08) 42%,
              transparent 70%
            );
          filter: blur(14px);
          opacity: 0.55;
          mix-blend-mode: screen;
          transform: translateZ(30px);
        }

        .meishiki-moon-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter:
            drop-shadow(0 18px 30px rgba(12, 6, 22, 0.42))
            drop-shadow(0 0 28px rgba(190, 145, 255, 0.18));
          transform: translateZ(24px);
          user-select: none;
          -webkit-user-drag: none;
        }

        .meishiki-wrap {
          position: relative;
          z-index: 20;
          width: 100%;
          max-width: 1120px;
          min-height: 100svh;
          margin: 0 auto;
          padding:
            clamp(56px, 8vh, 104px)
            clamp(18px, 4vw, 44px)
            clamp(44px, 7vh, 86px);
          display: flex;
          flex-direction: column;
        }

        .meishiki-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 0.8s cubic-bezier(.22,.56,.18,1),
            transform 0.8s cubic-bezier(.22,.56,.18,1);
        }

        .meishiki-hero.is-loaded .meishiki-topbar {
          opacity: 1;
          transform: translateY(0);
        }

        .meishiki-brand,
        .meishiki-status {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 0.32em;
          color: rgba(208, 170, 255, 0.68);
          white-space: nowrap;
        }

        .meishiki-brand-seal {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid rgba(208, 170, 255, 0.34);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          letter-spacing: 0;
        }

        .meishiki-status {
          gap: 14px;
          color: rgba(178, 142, 220, 0.55);
        }

        .meishiki-grid {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 48px;
          align-items: center;
          padding-top: clamp(18px, 5vh, 56px);
        }

        .meishiki-left {
          max-width: 650px;
        }

        .meishiki-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          animation: meishikiFadeUp 1.2s ease 0.8s both;
        }

        .meishiki-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
          animation: meishikiFadeUp 0.9s ease 0.3s both;
        }

        .meishiki-eyebrow-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .meishiki-eyebrow-dots i:first-child {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(208, 170, 255, 0.55);
          box-shadow: 0 0 8px rgba(208, 170, 255, 0.52);
        }

        .meishiki-eyebrow-dots i:last-child {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(208, 170, 255, 0.3);
        }

        .meishiki-eyebrow span {
          color: rgba(208, 170, 255, 0.72);
          font-size: 10px;
          letter-spacing: 0.32em;
        }

        .meishiki-title-shell {
          position: relative;
          display: inline-block;
          isolation: isolate;
        }

        .meishiki-title-glow {
          position: absolute;
          left: -6%;
          top: 8%;
          z-index: 0;
          width: 112%;
          height: 88%;
          border-radius: 999px;
          background:
            radial-gradient(
              circle,
              rgba(182, 136, 255, 0.18) 0%,
              rgba(182, 136, 255, 0.08) 28%,
              transparent 72%
            );
          filter: blur(26px);
          pointer-events: none;
        }

        .meishiki-title {
          position: relative;
          z-index: 1;
          margin: 0;
          line-height: 0.96;
          letter-spacing: 0.08em;
        }

        .meishiki-ink {
          display: inline-block;
          animation: meishikiInkReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) var(--delay) both;
        }

        .meishiki-title-small {
          display: block;
          margin-bottom: 0.12em;
          color: rgba(236, 226, 248, 0.92);
          font-size: clamp(28px, 3.1vw, 42px);
          font-weight: 500;
          letter-spacing: 0.18em;
          text-shadow:
            0 0 10px rgba(192, 150, 255, 0.16),
            0 0 1px rgba(255, 255, 255, 0.35);
        }

        .meishiki-title-main {
          display: inline-flex;
          align-items: flex-end;
          gap: 0.02em;
        }

        .meishiki-title-word {
          display: inline-block;
          font-size: clamp(52px, 7.4vw, 98px);
          font-weight: 500;
          letter-spacing: 0.12em;
          line-height: 0.94;
          background:
            linear-gradient(
              180deg,
              rgba(250, 245, 255, 0.98) 0%,
              rgba(228, 203, 255, 0.97) 22%,
              rgba(196, 150, 255, 0.95) 58%,
              rgba(236, 222, 255, 0.98) 100%
            );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter:
            drop-shadow(0 0 14px rgba(192, 144, 255, 0.18))
            drop-shadow(0 0 28px rgba(120, 70, 210, 0.12));
        }

        .meishiki-title-dot {
          display: inline-block;
          color: rgba(234, 214, 255, 0.94);
          font-size: clamp(40px, 5.2vw, 62px);
          line-height: 1;
          transform: translateY(-0.04em);
          text-shadow:
            0 0 10px rgba(196, 150, 255, 0.26),
            0 0 22px rgba(160, 108, 255, 0.16);
        }

        .meishiki-ritual-line {
          position: relative;
          width: clamp(160px, 30%, 260px);
          height: 1px;
          margin: 12px 0 32px;
          opacity: 0.95;
          animation: meishikiInkDrop 1.4s cubic-bezier(0.22, 1, 0.36, 1) 1s both;
        }

        .meishiki-ritual-line::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to right,
              transparent,
              rgba(210, 170, 255, 0.55),
              transparent
            );
          box-shadow: 0 0 18px rgba(160, 108, 255, 0.16);
        }

        .meishiki-ritual-line::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          transform: translate(-50%, -50%);
          background: rgba(240, 228, 255, 0.75);
          box-shadow:
            0 0 10px rgba(196, 150, 255, 0.32),
            0 0 22px rgba(160, 108, 255, 0.18);
        }

        .meishiki-copy {
          max-width: 56ch;
          margin-bottom: 38px;
          color: rgba(214, 196, 242, 0.82);
          font-size: clamp(13px, 1.4vw, 15px);
          line-height: 2.15;
          letter-spacing: 0.04em;
          animation: meishikiFadeUp 1s ease 1s both;
        }

        .meishiki-copy p + p {
          margin-top: 10px;
        }

        .meishiki-copy .muted {
          color: rgba(194, 166, 226, 0.64);
          font-size: 0.92em;
        }

        .meishiki-action {
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
          margin-bottom: 38px;
        }

        .meishiki-cta {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 56px;
          padding: 0 32px;
          border: 1px solid rgba(208, 170, 255, 0.30);
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(160, 100, 255, 0.14), rgba(120, 70, 200, 0.10));
          color: rgba(240, 220, 255, 0.92);
          cursor: pointer;
          box-shadow:
            0 0 12px rgba(120, 70, 200, 0.10),
            inset 0 0 20px rgba(160, 100, 255, 0.04);
          animation: meishikiFadeUp 1s ease var(--delay) both;
          transition:
            transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease,
            background 0.35s ease,
            box-shadow 0.35s ease;
        }

        .meishiki-cta:hover,
        .meishiki-cta:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(208, 170, 255, 0.52);
          background:
            linear-gradient(180deg, rgba(170, 108, 255, 0.20), rgba(120, 70, 200, 0.13));
          box-shadow:
            0 0 32px rgba(160, 100, 255, 0.22),
            inset 0 0 20px rgba(160, 100, 255, 0.08);
          outline: none;
        }

        .meishiki-cta-ripple {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 50%, rgba(208, 170, 255, 0.28), transparent 70%);
          animation: meishikiRippleOut 0.62s ease forwards;
        }

        .meishiki-cta-seal {
          position: relative;
          z-index: 1;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid rgba(208, 170, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(120, 70, 200, 0.15);
          color: rgba(224, 196, 255, 0.86);
          font-size: 11px;
          letter-spacing: 0.04em;
          transition: transform 0.35s ease;
        }

        .meishiki-cta:hover .meishiki-cta-seal {
          transform: rotate(15deg);
        }

        .meishiki-cta-text {
          position: relative;
          z-index: 1;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.28em;
        }

        .meishiki-cta-arrow {
          position: relative;
          z-index: 1;
          color: rgba(208, 170, 255, 0.60);
          font-size: 10px;
          transition: transform 0.35s ease;
        }

        .meishiki-cta:hover .meishiki-cta-arrow {
          transform: translateX(4px);
        }

        .meishiki-note {
          color: rgba(184, 150, 224, 0.60);
          font-size: 11px;
          line-height: 1.9;
          letter-spacing: 0.16em;
          animation: meishikiFadeUp 1s ease 1.4s both;
        }

        .meishiki-note span {
          color: rgba(164, 132, 202, 0.45);
        }

        .meishiki-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          animation: meishikiFadeUp 1s ease var(--delay) both;
        }

        .meishiki-divider span {
          flex: 1;
          height: 1px;
          background:
            linear-gradient(
              to right,
              transparent,
              rgba(190, 145, 255, 0.36),
              transparent
            );
        }

        .meishiki-divider i {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(208, 170, 255, 0.62);
          box-shadow: 0 0 8px rgba(208, 170, 255, 0.72);
        }

        .meishiki-flow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          color: rgba(184, 150, 224, 0.58);
          font-size: 10px;
          letter-spacing: 0.30em;
          animation: meishikiFadeUp 1s ease 1.6s both;
        }

        .meishiki-flow i {
          opacity: 0.35;
          letter-spacing: 0;
        }

        .meishiki-disclaimer {
          margin-top: 26px;
          color: rgba(164, 132, 202, 0.42);
          font-size: 10px;
          line-height: 1.9;
          letter-spacing: 0.14em;
          animation: meishikiFadeUp 1s ease 1.8s both;
        }

        .meishiki-steps {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: meishikiFadeUp 1.2s ease 1.5s both;
        }

        .meishiki-step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .meishiki-step span {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid rgba(208, 170, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(224, 196, 255, 0.45);
          font-size: 9px;
          letter-spacing: 0.1em;
        }

        .meishiki-step span.is-current {
          border-color: rgba(208, 170, 255, 0.60);
          background: rgba(160, 100, 255, 0.18);
          color: rgba(224, 196, 255, 0.90);
        }

        .meishiki-step i {
          width: 1px;
          height: 18px;
          background: rgba(160, 100, 255, 0.22);
        }

        .meishiki-hex {
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0.68;
        }

        .meishiki-hex div {
          display: flex;
          gap: 3px;
          align-items: center;
        }

        .meishiki-hex span {
          height: 1.5px;
          background: rgba(208, 170, 255, 0.45);
        }

        .meishiki-hex .long {
          width: 20px;
        }

        .meishiki-hex .short {
          width: 8px;
        }

        .meishiki-hex em {
          width: 4px;
        }

        .meishiki-kan {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          border: 1px solid rgba(190, 145, 255, 0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(224, 196, 255, 0.82);
          font-size: 22px;
          letter-spacing: 0.05em;
          box-shadow: 0 0 20px rgba(160, 100, 255, 0.15);
          animation: meishikiBreathe 5s ease-in-out infinite;
        }

        @keyframes meishikiInkReveal {
          from {
            opacity: 0;
            transform: translateY(22px) skewY(2deg);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) skewY(0deg);
            filter: blur(0);
          }
        }

        @keyframes meishikiFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes meishikiInkDrop {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }

        @keyframes meishikiOrbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }

        @keyframes meishikiRotateSlow {
          to { transform: rotate(360deg); }
        }

        @keyframes meishikiMoonFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }

        @keyframes meishikiMoonAura {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.06);
          }
        }

        @keyframes meishikiBreathe {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes meishikiRippleOut {
          from {
            transform: scale(0.8);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        @media (max-width: 980px) {
          .meishiki-grid {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .meishiki-right {
            display: none;
          }

          .meishiki-moon {
            top: 9%;
            right: -12%;
            width: clamp(190px, 46vw, 300px);
            opacity: 0.68;
          }

          .meishiki-constellation {
            opacity: 0.62;
          }
        }

        @media (max-width: 640px) {
          .meishiki-wrap {
            padding:
              34px
              20px
              58px;
          }

          .meishiki-topbar {
            align-items: flex-start;
            gap: 14px;
          }

          .meishiki-brand {
            letter-spacing: 0.20em;
          }

          .meishiki-status {
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            font-size: 9px;
            letter-spacing: 0.18em;
          }

          .meishiki-grid {
            padding-top: 74px;
          }

          .meishiki-eyebrow {
            margin-bottom: 20px;
          }

          .meishiki-eyebrow span {
            font-size: 9px;
            letter-spacing: 0.22em;
          }

          .meishiki-title-small {
            font-size: clamp(25px, 8vw, 33px);
            letter-spacing: 0.16em;
          }

          .meishiki-title-word {
            font-size: clamp(50px, 16vw, 68px);
            letter-spacing: 0.08em;
          }

          .meishiki-title-dot {
            font-size: clamp(38px, 11vw, 50px);
          }

          .meishiki-ritual-line {
            width: 52%;
            margin-bottom: 28px;
          }

          .meishiki-copy {
            max-width: 34ch;
            margin-bottom: 30px;
            font-size: 13px;
            line-height: 2.05;
          }

          .meishiki-action {
            gap: 16px;
            margin-bottom: 30px;
          }

          .meishiki-cta {
            min-height: 52px;
            width: 100%;
            justify-content: center;
            padding: 0 24px;
          }

          .meishiki-note {
            width: 100%;
            font-size: 10px;
          }

          .meishiki-flow {
            flex-wrap: wrap;
            gap: 10px;
            letter-spacing: 0.22em;
          }

          .meishiki-disclaimer {
            max-width: 32ch;
          }

          .meishiki-moon {
            top: 98px;
            right: -92px;
            width: 230px;
            opacity: 0.46;
          }

          .meishiki-outer-ring {
            top: 9%;
            right: -30px;
            width: 112px;
            height: 112px;
            opacity: 0.44;
          }
        }

        @media (max-width: 390px) {
          .meishiki-wrap {
            padding-inline: 18px;
          }

          .meishiki-title-word {
            font-size: clamp(46px, 15vw, 62px);
          }

          .meishiki-moon {
            right: -108px;
            opacity: 0.40;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .meishiki-hero *,
          .meishiki-hero *::before,
          .meishiki-hero *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="meishiki-bg" aria-hidden="true" />
      <SpaceTexture />

      <div className="meishiki-orb meishiki-orb-1" aria-hidden="true" />
      <div className="meishiki-orb meishiki-orb-2" aria-hidden="true" />
      <div className="meishiki-orb meishiki-orb-3" aria-hidden="true" />

      <StarField count={260} targetId="hero" />
      <InkDust count={58} targetId="hero" />
      <Constellation />
      <MoonArtifact targetId="hero" />
      <CursorTrail targetId="hero" />

      <div className="meishiki-outer-ring" aria-hidden="true" />
      <div className="meishiki-scan" aria-hidden="true" />
      <div className="meishiki-veil" aria-hidden="true" />

      <div className="meishiki-wrap">
        <div className="meishiki-topbar">
          <div className="meishiki-brand">
            <span className="meishiki-brand-seal" aria-hidden="true">
              命
            </span>
            <span>命式</span>
            <span aria-hidden="true" style={{ opacity: 0.35, letterSpacing: 0 }}>
              ／
            </span>
            <span style={{ color: "rgba(208, 170, 255, 0.50)" }}>
              算命学・年柱
            </span>
          </div>

          <div className="meishiki-status" aria-label="無料、登録不要、保存なし">
            <span>無料</span>
            <span>登録不要</span>
            <span>保存なし</span>
          </div>
        </div>

        <div className="meishiki-grid">
          <div className="meishiki-left">
            <div className="meishiki-eyebrow">
              <span className="meishiki-eyebrow-dots" aria-hidden="true">
                <i />
                <i />
              </span>
              <span>生年月日から年柱（年干支）を起こす</span>
            </div>

            <div className="meishiki-title-shell">
              <div className="meishiki-title-glow" aria-hidden="true" />

              <h1 className="meishiki-title">
                <InkReveal delay={0.5} className="meishiki-title-small">
                  命式を
                </InkReveal>

                <InkReveal delay={0.72} className="meishiki-title-main">
                  <span className="meishiki-title-word">起こす</span>
                  <span className="meishiki-title-dot">。</span>
                </InkReveal>
              </h1>
            </div>

            <div className="meishiki-ritual-line" aria-hidden="true" />

            <div className="meishiki-copy">
              <p>生年月日を記すと、年柱（年干支）が立ち上がる。</p>
              <p className="muted">
                断定ではなく、傾向と条件を読むための記録。
              </p>
            </div>

            <div className="meishiki-action">
              <CTAButton onClick={goInput} delay={1.2} />

              <p className="meishiki-note">
                生年月日を記す（約30秒）
                <br />
                <span>任意：出生地・出生時間・名前</span>
              </p>
            </div>

            <GlowDivider delay={1.5} />

            <div className="meishiki-flow" aria-hidden="true">
              <span>記す</span>
              <i>—</i>
              <span>年柱</span>
              <i>—</i>
              <span>印</span>
            </div>

            <p className="meishiki-disclaimer">
              ※ これは予言ではありません。あなたの判断と行動が、現実をつくります。
            </p>
          </div>

          <div className="meishiki-right" aria-hidden="true">
            <VerticalSteps />
            <HexLines />
            <div className="meishiki-kan">干</div>
          </div>
        </div>
      </div>
    </section>
  );
}