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

/* ─────────────────────────────────────────
   Canvas helpers
───────────────────────────────────────── */
function useDeviceFactor() {
  return useMemo(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;

    return { reduce, fine, factor: fine ? 1 : 0.55 };
  }, []);
}

function setupCanvasDpr(canvas, ctx) {
  const cssW = canvas.offsetWidth;
  const cssH = canvas.offsetHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { W: cssW, H: cssH };
}

/* ─────────────────────────────────────────
   Star field canvas
───────────────────────────────────────── */
function StarField({ count = 260, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "320px" });
  const { reduce, factor } = useDeviceFactor();

  useEffect(() => {
    if (reduce) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    if (!canvas || !ctx) return;

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
        r: rand(0.3, 1.4),
        alpha: rand(0.15, 0.9),
        speed: rand(0.0006, 0.003),
        phase: rand(0, Math.PI * 2),
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) return;

      for (const s of stars) {
        const a =
          s.alpha * (0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase));
        ctx.beginPath();
        ctx.arc(
          s.x + Math.sin(t * 0.0004 + s.phase) * 8,
          s.y,
          s.r,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255,245,255,${a})`;
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
        zIndex: 2,
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Ink-dust particles
───────────────────────────────────────── */
function InkDust({ count = 55, targetId = "hero" }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "320px" });
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

      const actual = Math.max(20, Math.floor(count * factor));
      pts = Array.from({ length: actual }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        vy: rand(-0.12, -0.04),
        vx: rand(-0.06, 0.06),
        r: rand(1.2, 4.0),
        alpha: rand(0.04, 0.18),
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
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Cursor sparkle trail
───────────────────────────────────────── */
function CursorTrail({ targetId = "hero" }) {
  const ref = useRef(null);
  const sparksRef = useRef([]);
  const lastSpawnRef = useRef(0);

  const active = useCanvasActive({ targetId, rootMargin: "320px" });
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
      if (now - lastSpawnRef.current < 18) return;
      lastSpawnRef.current = now;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = 0; i < 2; i++) {
        sparksRef.current.push({
          x: mx + rand(-4, 4),
          y: my + rand(-4, 4),
          vx: rand(-0.8, 0.8),
          vy: rand(-1.5, -0.4),
          r: rand(1, 2.8),
          life: 1,
          decay: rand(0.022, 0.05),
          hue: rand(260, 310),
        });
      }

      if (sparksRef.current.length > 170) {
        sparksRef.current.splice(0, sparksRef.current.length - 170);
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

        const a = s.life * 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},90%,82%,${a})`;
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
      }}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Constellation
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
      }}
    >
      <defs>
        <style>{`
          @keyframes dash { to { stroke-dashoffset: 0; } }
          @keyframes twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.7} }
          .cline { stroke-dasharray: 120; stroke-dashoffset: 120; animation: dash 2.8s ease forwards; }
          .cnode { animation: twinkle 3s ease-in-out infinite; }
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
          style={{ animationDelay: `${0.3 + i * 0.22}s` }}
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
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Space texture layer
───────────────────────────────────────── */
function SpaceTexture() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        backgroundImage: `url(${SPACE_TEXTURE})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        opacity: 0.12,
        mixBlendMode: "screen",
        filter: "saturate(0.9) contrast(1.05) brightness(0.7)",
        transform: "scale(1.03)",
      }}
    />
  );
}

/* ─────────────────────────────────────────
   Moon artifact (PNG + 立体感)
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
      {/* 奥の光膜 */}
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

      {/* 外輪 */}
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

      {/* 月本体 */}
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
   Decorative helpers
───────────────────────────────────────── */
function HexLines({ style }) {
  const lines = [
    [true, true],
    [true, false],
    [true, true],
    [false, true],
    [true, true],
    [false, false],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {lines.map((pair, i) => (
        <div key={i} style={{ display: "flex", gap: 3 }}>
          {pair[0] ? (
            <div
              style={{
                width: 20,
                height: 1.5,
                background: "rgba(200,160,255,0.45)",
              }}
            />
          ) : (
            <>
              <div
                style={{
                  width: 8,
                  height: 1.5,
                  background: "rgba(200,160,255,0.45)",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 1.5,
                  background: "rgba(200,160,255,0.45)",
                }}
              />
            </>
          )}

          <div style={{ width: 4 }} />

          {pair[1] ? (
            <div
              style={{
                width: 20,
                height: 1.5,
                background: "rgba(200,160,255,0.45)",
              }}
            />
          ) : (
            <>
              <div
                style={{
                  width: 8,
                  height: 1.5,
                  background: "rgba(200,160,255,0.45)",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 1.5,
                  background: "rgba(200,160,255,0.45)",
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

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
          boxShadow: "0 0 6px rgba(200,160,255,0.8)",
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
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 32px",
        borderRadius: 999,
        border: `1px solid rgba(200,160,255,${hovered ? 0.5 : 0.28})`,
        background: hovered ? "rgba(160,100,255,0.18)" : "rgba(120,70,200,0.12)",
        cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: hovered
          ? "0 0 32px rgba(160,100,255,0.22), inset 0 0 20px rgba(160,100,255,0.08)"
          : "0 0 12px rgba(120,70,200,0.1)",
        animation: `fadeUp 1s ease ${delay}s both`,
        outline: "none",
      }}
    >
      {ripple && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 50%, rgba(200,160,255,0.28), transparent 70%)",
            animation: "rippleOut 0.6s ease forwards",
            borderRadius: 999,
            pointerEvents: "none",
          }}
        />
      )}

      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid rgba(200,160,255,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "rgba(220,190,255,0.85)",
          letterSpacing: "0.05em",
          background: "rgba(120,70,200,0.15)",
          flexShrink: 0,
          transition: "transform 0.35s",
          transform: hovered ? "rotate(15deg)" : "rotate(0deg)",
        }}
      >
        命
      </span>

      <span
        style={{
          fontSize: 12,
          letterSpacing: "0.28em",
          color: "rgba(240,220,255,0.92)",
          fontWeight: 400,
        }}
      >
        命式を起こす
      </span>

      <span
        style={{
          fontSize: 10,
          color: "rgba(200,160,255,0.6)",
          transition: "transform 0.35s",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
        }}
      >
        →
      </span>
    </button>
  );
}

function FloatingOrb({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: "50%",
        filter: "blur(60px)",
        animation: "orbFloat 8s ease-in-out infinite",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

function VerticalSteps() {
  const steps = ["記入", "年柱", "命式", "印"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        animation: "fadeUp 1.2s ease 1.5s both",
      }}
    >
      {steps.map((s, i) => (
        <div
          key={i}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `1px solid rgba(200,160,255,${i === 0 ? 0.6 : 0.2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: `rgba(220,190,255,${i === 0 ? 0.9 : 0.45})`,
              background: i === 0 ? "rgba(160,100,255,0.18)" : "transparent",
            }}
          >
            {s}
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 1,
                height: 18,
                background: "rgba(160,100,255,0.2)",
              }}
            />
          )}
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
    /* -------------------------------------------------
      scope reset (NO global reset)
    ------------------------------------------------- */
    .meishiki-hero, .meishiki-hero * { box-sizing: border-box; }
    .meishiki-hero h1, .meishiki-hero p { margin: 0; }
    .meishiki-hero button { font: inherit; color: inherit; }

    /* -------------------------------------------------
      layout helpers
    ------------------------------------------------- */
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
    .hero-left{ max-width: 640px; }
    .hero-right{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      animation: fadeUp 1.2s ease 0.8s both;
    }
    @media (max-width: 980px){
      .hero-grid{ grid-template-columns: 1fr; gap: 42px; }
      .hero-right{ display: none; } /* 右の装飾は狭幅では退避（世界観はBG/粒子で維持） */
    }

    /* -------------------------------------------------
      keyframes (keep yours + add missing)
    ------------------------------------------------- */
    @keyframes inkReveal {
      from { opacity: 0; transform: translateY(22px) skewY(2deg); filter: blur(6px); }
      to   { opacity: 1; transform: translateY(0) skewY(0deg); filter: blur(0px); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes orbFloat {
      0%,100% { transform: translateY(0px) scale(1); }
      50%     { transform: translateY(-24px) scale(1.04); }
    }
    @keyframes rippleOut {
      from { transform: scale(0.8); opacity: 1; }
      to   { transform: scale(2); opacity: 0; }
    }
    @keyframes rotateSlow { to { transform: rotate(360deg); } }
    @keyframes breathe {
      0%,100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.03); }
    }
    @keyframes inkDrop {
      from { clip-path: inset(0 100% 0 0); }
      to   { clip-path: inset(0 0% 0 0); }
    }
    @keyframes moonFloat {
      0%,100% { transform: translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg); }
      50% { transform: translate3d(0px, -10px, 0) rotateX(2deg) rotateY(-2deg); }
    }
    @keyframes moonAura {
      0%,100% { opacity: 0.55; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.06); }
    }

    /* ★ missing: moonShimmer (you use it in the divider) */
    @keyframes moonShimmer {
      0%, 100% { transform: translate3d(-6%,0,0); opacity: 0.18; }
      50%      { transform: translate3d( 6%,0,0); opacity: 0.35; }
    }

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

  {/* subtle space texture */}
  <SpaceTexture />

  {/* atmospheric veils */}
  <FloatingOrb
    style={{
      top: "10%",
      left: "-5%",
      width: 500,
      height: 400,
      background:
        "radial-gradient(circle, rgba(120,50,200,0.22) 0%, transparent 70%)",
      animationDelay: "0s",
      zIndex: 0,
    }}
  />
  <FloatingOrb
    style={{
      bottom: "15%",
      right: "-8%",
      width: 560,
      height: 420,
      background:
        "radial-gradient(circle, rgba(80,20,170,0.16) 0%, transparent 70%)",
      animationDelay: "3s",
      zIndex: 0,
    }}
  />
  <FloatingOrb
    style={{
      top: "50%",
      left: "40%",
      width: 300,
      height: 280,
      background:
        "radial-gradient(circle, rgba(160,90,255,0.10) 0%, transparent 70%)",
      animationDelay: "5s",
      zIndex: 0,
    }}
  />

  {/* effects */}
  <StarField count={260} targetId="hero" />
  <InkDust count={55} targetId="hero" />
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
    }}
  />

  {/* content */}
  <div className="hero-wrap">
    {/* top bar */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        animation: "fadeUp 0.8s ease 0.1s both",
        opacity: loaded ? 1 : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 10,
          letterSpacing: "0.38em",
          color: "rgba(200,160,255,0.7)",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1px solid rgba(200,160,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
          }}
        >
          命
        </div>
        <span>命式</span>
        <span style={{ opacity: 0.35, letterSpacing: 0 }}>／</span>
        <span style={{ color: "rgba(200,160,255,0.5)" }}>算命学・年柱</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 10,
          letterSpacing: "0.24em",
          color: "rgba(160,120,220,0.55)",
        }}
      >
        <span>保存なし</span>
        <span style={{ opacity: 0.3 }}>｜</span>
        <span>課金なし</span>
      </div>
    </div>

    {/* center */}
    <div className="hero-grid">
      {/* left */}
      <div className="hero-left">
        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 26,
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
              letterSpacing: "0.36em",
              color: "rgba(200,160,255,0.72)",
            }}
          >
            生年月日から年柱（年干支）を起こす
          </span>
        </div>

        {/* title (your improved one) */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            isolation: "isolate",
          }}
        >
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
              transform: "translateZ(0)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          <h1
            style={{
              position: "relative",
              zIndex: 1,
              margin: 0,
              lineHeight: 0.96,
              letterSpacing: "0.08em",
            }}
          >
            <InkReveal delay={0.5} style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                  fontSize: "clamp(28px,3.1vw,42px)",
                  fontWeight: 500,
                  letterSpacing: "0.18em",
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
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "flex-end",
                  gap: "0.02em",
                  fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "clamp(52px,7.4vw,98px)",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    lineHeight: 0.94,
                    background:
                      "linear-gradient(180deg, rgba(250,245,255,0.98) 0%, rgba(228,203,255,0.97) 22%, rgba(196,150,255,0.95) 58%, rgba(236,222,255,0.98) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter:
                      "drop-shadow(0 0 14px rgba(192,144,255,0.18)) drop-shadow(0 0 28px rgba(120,70,210,0.12))",
                    textShadow: "none",
                  }}
                >
                  起こす
                </span>

                <span
                  style={{
                    display: "inline-block",
                    fontSize: "clamp(40px,5.2vw,62px)",
                    lineHeight: 1,
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

        {/* ritual line (improved) */}
        <div
          aria-hidden="true"
          style={{
            width: "clamp(160px,30%,260px)",
            height: 1,
            marginTop: 12,
            marginBottom: 32,
            position: "relative",
            opacity: 0.95,
            animation: "inkDrop 1.4s cubic-bezier(0.22,1,0.36,1) 1.0s both",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(180,130,255,0), rgba(210,170,255,0.55), rgba(180,130,255,0))",
              boxShadow: "0 0 18px rgba(160,108,255,0.16)",
              transform: "translateZ(0)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 6,
              height: 6,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(240,228,255,0.75)",
              boxShadow:
                "0 0 10px rgba(196,150,255,0.32), 0 0 22px rgba(160,108,255,0.18)",
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0) 70%)",
              mixBlendMode: "screen",
              opacity: 0.35,
              animation: "moonShimmer 6.8s ease-in-out infinite",
              transform: "translateZ(0)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* body copy */}
        <div
          style={{
            maxWidth: "56ch",
            fontSize: "clamp(13px,1.4vw,15px)",
            lineHeight: 2.15,
            letterSpacing: "0.04em",
            color: "rgba(210,190,240,0.82)",
            marginBottom: 38,
            animation: "fadeUp 1s ease 1.0s both",
          }}
        >
          <p>生年月日を記すと、年柱（年干支）が立ち上がる。</p>
          <p
            style={{
              color: "rgba(190,165,225,0.65)",
              fontSize: "0.92em",
              marginTop: 10,
            }}
          >
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
            marginBottom: 38,
          }}
        >
          <CTAButton onClick={goInput} delay={1.2} />

          <div
            style={{
              fontSize: 11,
              lineHeight: 1.9,
              letterSpacing: "0.18em",
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

        {/* small steps */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 24,
            fontSize: 10,
            letterSpacing: "0.30em",
            color: "rgba(180,150,220,0.6)",
            animation: "fadeUp 1s ease 1.6s both",
          }}
        >
          <span>記す</span>
          <span style={{ opacity: 0.35, letterSpacing: 0 }}>—</span>
          <span>年柱</span>
          <span style={{ opacity: 0.35, letterSpacing: 0 }}>—</span>
          <span>印</span>
        </div>

        {/* disclaimer */}
        <div
          style={{
            marginTop: 26,
            fontSize: 10,
            lineHeight: 1.9,
            letterSpacing: "0.14em",
            color: "rgba(160,130,200,0.42)",
            animation: "fadeUp 1s ease 1.8s both",
          }}
        >
          ※ これは予言ではありません。あなたの判断と行動が、現実をつくります。
        </div>
      </div>

      {/* right (auto-hidden on narrow) */}
      <div className="hero-right">
        <VerticalSteps />
        <HexLines style={{ opacity: 0.7 }} />
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
        >
          干
        </div>
      </div>
    </div>
  </div>

  {/* vignette */}
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      inset: "auto 0 0 0",
      height: "18vh",
      background: "linear-gradient(to top, rgba(8,4,14,0.9), transparent)",
      pointerEvents: "none",
      zIndex: 7,
    }}
  />
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      inset: "0 auto 0 0",
      width: "12%",
      background: "linear-gradient(to right, rgba(8,4,14,0.7), transparent)",
      pointerEvents: "none",
      zIndex: 7,
    }}
  />
</section>
  );
}