// src/components/ShootingStars.jsx
import { useEffect, useRef } from "react";
import useCanvasActive from "../hooks/useCanvasActive";

export default function ShootingStars({
  targetId = "hero",
  className = "",
  minInterval = 2200,
  maxInterval = 4600,
  maxStars = 2,
  onFlash,
}) {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  const active = useCanvasActive({ targetId });

  useEffect(() => {
    const target = document.getElementById(targetId);
    const canvas = canvasRef.current;
    if (!target || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rect = target.getBoundingClientRect();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

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

    const spawn = () => {
      if (!active) return;
      if (starsRef.current.length >= maxStars) return;

      const x = rand(rect.width * 0.18, rect.width * 0.92);
      const y = rand(rect.height * 0.06, rect.height * 0.44);

      const angle = rand(0.72, 1.02);
      const speed = rand(9.0, 14.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      starsRef.current.push({
        x,
        y,
        vx,
        vy,
        life: 0,
        ttl: rand(28, 44),
        len: rand(90, 180),
        width: rand(0.85, 1.55),
        alpha: rand(0.22, 0.46),
        violet: Math.random() > 0.66,
      });

      onFlash?.();
    };

    const schedule = () => {
      clearTimeout(timerRef.current);
      if (!active) return;

      const delay = rand(minInterval, maxInterval);
      timerRef.current = window.setTimeout(() => {
        spawn();
        schedule();
      }, delay);
    };

    const draw = (s) => {
      const t = s.life / s.ttl;
      const fade = 1 - t;
      const a = s.alpha * fade;

      const tailX = s.x - s.vx * (s.len / 12);
      const tailY = s.y - s.vy * (s.len / 12);

      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);

      if (s.violet) {
        grad.addColorStop(0, `rgba(255,255,255, ${a})`);
        grad.addColorStop(0.35, `rgba(186,132,255, ${a * 0.85})`);
        grad.addColorStop(1, "rgba(186,132,255, 0)");
      } else {
        grad.addColorStop(0, `rgba(255,255,255, ${a})`);
        grad.addColorStop(0.4, `rgba(255,255,255, ${a * 0.60})`);
        grad.addColorStop(1, "rgba(255,255,255, 0)");
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.width * 7);
      glow.addColorStop(0, `rgba(255,255,255, ${a * 0.75})`);
      glow.addColorStop(0.55, `rgba(220,200,255, ${a * 0.22})`);
      glow.addColorStop(1, "rgba(255,255,255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.width * 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!active) return;

      const list = starsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        s.life += 1;
        s.x += s.vx;
        s.y += s.vy;

        if (s.life >= s.ttl) {
          list.splice(i, 1);
          continue;
        }
        draw(s);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // ✅ active時だけ開始
    if (active) {
      schedule();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      starsRef.current = [];
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      starsRef.current = [];
      ctx.clearRect(0, 0, rect.width, rect.height);
    };
  }, [targetId, minInterval, maxInterval, maxStars, onFlash, active]);

  return (
    <canvas
      ref={canvasRef}
      className={["pointer-events-none absolute inset-0", className].join(" ")}
      aria-hidden="true"
    />
  );
}