// src/components/CursorSparkles.jsx
import { useEffect, useRef } from "react";
import useCanvasActive from "../hooks/useCanvasActive";

export default function CursorSparkles({
  targetId = "hero",
  className = "",
  violet = "186,132,255",
  white = "255,255,255",
  spawnEvery = 28,
  maxParticles = 70,
}) {
  const canvasRef = useRef(null);
  const partsRef = useRef([]);
  const rafRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const insideRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });

  // ✅ 画面内 + タブ可視 だけ true
  const active = useCanvasActive({ targetId });

  useEffect(() => {
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;

    // fine以外は実行しない（SPで余計に回さない）
    if (!fine) return;

    const target = document.getElementById(targetId);
    const canvas = canvasRef.current;
    if (!target || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rect = target.getBoundingClientRect();

    const resize = () => {
      rect = target.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const make = (x, y) => {
      const isWhite = Math.random() > 0.72;
      const size = isWhite ? rand(1.2, 2.0) : rand(0.9, 1.6);
      return {
        x,
        y,
        vx: rand(-0.55, 0.55) * 0.55,
        vy: rand(-0.85, -0.35),
        life: 0,
        ttl: rand(26, 44),
        a: rand(0.16, 0.32),
        size,
        c: isWhite ? white : violet,
      };
    };

    const spawn = (x, y) => {
      const list = partsRef.current;
      list.push(make(x, y));
      if (Math.random() > 0.5) list.push(make(x + rand(-10, 10), y + rand(-10, 10)));
      if (list.length > maxParticles) list.splice(0, list.length - maxParticles);
    };

    const drawOne = (p) => {
      const t = p.life / p.ttl;
      const fade = 1 - t;
      const alpha = p.a * fade;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6.0);
      g.addColorStop(0, `rgba(${p.c}, ${alpha})`);
      g.addColorStop(0.45, `rgba(${p.c}, ${alpha * 0.34})`);
      g.addColorStop(1, `rgba(${p.c}, 0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 6.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${p.c}, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // ✅ inactiveなら描画だけ止める（次の開始はeffect側が作る）
      if (!active) return;

      const now = performance.now();
      if (insideRef.current && now - lastSpawnRef.current > spawnEvery) {
        const { x, y } = posRef.current;
        spawn(x, y);
        lastSpawnRef.current = now;
      }

      const list = partsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.006;
        p.vx *= 0.985;

        if (p.life >= p.ttl) {
          list.splice(i, 1);
          continue;
        }
        drawOne(p);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      rect = target.getBoundingClientRect();
      posRef.current.x = e.clientX - rect.left;
      posRef.current.y = e.clientY - rect.top;
      insideRef.current = true;
    };

    const onEnter = (e) => onMove(e);
    const onLeave = () => (insideRef.current = false);

    resize();
    window.addEventListener("resize", resize, { passive: true });

    target.addEventListener("pointermove", onMove, { passive: true });
    target.addEventListener("pointerenter", onEnter, { passive: true });
    target.addEventListener("pointerleave", onLeave, { passive: true });

    // ✅ activeのときだけ起動
    if (active) rafRef.current = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, rect.width, rect.height);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      partsRef.current = [];
      ctx.clearRect(0, 0, rect.width, rect.height);
    };
  }, [targetId, violet, white, spawnEvery, maxParticles, active]);

  return (
    <canvas
      ref={canvasRef}
      className={["pointer-events-none absolute inset-0", className].join(" ")}
      aria-hidden="true"
    />
  );
}