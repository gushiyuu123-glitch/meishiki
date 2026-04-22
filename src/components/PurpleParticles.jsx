// src/components/PurpleParticles.jsx
import { useEffect, useRef } from "react";
import useCanvasActive from "../hooks/useCanvasActive";

export default function PurpleParticles({
  className = "",
  targetId = "hero",
  density = 1,
  strength = 1,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const partsRef = useRef([]);

  const active = useCanvasActive({ targetId });

  useEffect(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    const target = document.getElementById(targetId);
    const canvas = canvasRef.current;
    if (!target || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rect = target.getBoundingClientRect();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;

    const mobileFactor = fine ? 1 : 0.65;

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

    const desired =
      Math.floor((rect.width * rect.height) / 52000) *
      density *
      mobileFactor;

    const make = () => {
      const violet = Math.random() > 0.55;
      return {
        x: rand(0, rect.width),
        y: rand(0, rect.height),
        r: rand(0.6, 1.9) * (violet ? 1.0 : 0.9),
        vx: rand(-0.18, 0.18) * (0.9 + strength * 0.35),
        vy: rand(-0.06, 0.22) * (0.9 + strength * 0.35),
        a: rand(0.05, 0.12) * (violet ? 1.0 : 0.8),
        c: violet ? "186,132,255" : "255,255,255",
      };
    };

    const rebuild = () => {
      partsRef.current = [];
      const count = Math.max(18, Math.min(160, Math.floor(desired)));
      for (let i = 0; i < count; i++) partsRef.current.push(make());
    };

    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!active) return;

      const list = partsRef.current;

      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = rect.width + 20;
        if (p.x > rect.width + 20) p.x = -20;
        if (p.y < -20) p.y = rect.height + 20;
        if (p.y > rect.height + 20) p.y = -20;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, `rgba(${p.c}, ${p.a})`);
        g.addColorStop(0.6, `rgba(${p.c}, ${p.a * 0.25})`);
        g.addColorStop(1, `rgba(${p.c}, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    rebuild();
    window.addEventListener("resize", () => {
      resize();
      rebuild();
    }, { passive: true });

    if (active) rafRef.current = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, rect.width, rect.height);

    return () => {
      cancelAnimationFrame(rafRef.current);
      partsRef.current = [];
      ctx.clearRect(0, 0, rect.width, rect.height);
      window.removeEventListener("resize", resize);
    };
  }, [targetId, density, strength, active]);

  return (
    <canvas
      ref={canvasRef}
      className={["pointer-events-none absolute inset-0", className].join(" ")}
      aria-hidden="true"
    />
  );
}