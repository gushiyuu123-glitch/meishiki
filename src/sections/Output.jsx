import { useEffect, useMemo, useRef, useState } from "react";
import useAqReveal from "../hooks/useAqReveal";
import { buildCopyText, buildMemo, formatMeta } from "../data/meishikiMemo";

const SPACE_TEXTURE = "/meishiki/space-texture2.png";

/* =========================================================
   tiny hooks / utils
========================================================= */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

function usePerfFactor() {
  const [factor, setFactor] = useState(0.7);
  useEffect(() => {
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;
    setFactor(fine ? 1 : 0.62);
  }, []);
  return factor;
}

function useCanvasActive({ targetId = "output", rootMargin = "320px" } = {}) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { root: null, rootMargin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [targetId, rootMargin]);
  return active;
}

function setupCanvasDpr(canvas, ctx) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, Math.floor(rect.width));
  const H = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { W, H };
}

const rand = (a, b) => Math.random() * (b - a) + a;

/* =========================================================
   Canvas: star field (subtle)
========================================================= */
function StarField({ targetId = "output", count = 160, z = 2 }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "420px" });
  const reduce = useReduceMotion();
  const factor = usePerfFactor();

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
      const s = setupCanvasDpr(canvas, ctx);
      W = s.W;
      H = s.H;

      const n = Math.max(70, Math.floor(count * factor));
      stars = Array.from({ length: n }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.25, 1.35),
        a: rand(0.08, 0.55),
        tw: rand(0.004, 0.018),
        phase: rand(0, Math.PI * 2),
        drift: rand(-0.18, 0.18),
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const time = t * 0.001;

      for (const s of stars) {
        const alpha = Math.max(
          0.02,
          s.a * (0.55 + 0.45 * Math.sin(time * 1.2 + s.phase))
        );

        const x = s.x + Math.sin(time * 0.22 + s.phase) * 1.1;
        const y = s.y + Math.cos(time * 0.18 + s.phase) * 0.9;

        // tiny drift (very subtle)
        s.x += s.drift * 0.02;
        if (s.x < -20) s.x = W + 20;
        if (s.x > W + 20) s.x = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(236, 220, 255, ${alpha})`;
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // a few “cross” stars (rare)
        if (s.r > 1.05 && alpha > 0.22) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(210, 170, 255, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.moveTo(x - 3.0, y);
          ctx.lineTo(x + 3.0, y);
          ctx.moveTo(x, y - 3.0);
          ctx.lineTo(x, y + 3.0);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    build();
    window.addEventListener("resize", build, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active, reduce, factor, count, targetId]);

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
        opacity: 0.75, // ←ここで薄さ調整できる
      }}
    />
  );
}

/* =========================================================
   Canvas: shooting star (one, slow)
========================================================= */
function ShootingStar({ targetId = "output", z = 3 }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "420px" });
  const reduce = useReduceMotion();
  const factor = usePerfFactor();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });
    if (!canvas || !ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let t0 = 0;

    const reset = () => {
      const s = setupCanvasDpr(canvas, ctx);
      W = s.W;
      H = s.H;
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      if (!t0) t0 = t;
      const tt = (t - t0) / 1000;

      // 周期：18秒（控えめ）
      const cycle = 18;
      const phase = tt % cycle;

      // 1.35秒だけ出す
      if (phase < 1.35) {
        const p = phase / 1.35;

        const x0 = W * 0.16 + p * W * 0.48;
        const y0 = H * 0.12 + p * H * 0.22;

        const tail = 160 * factor;
        const dx = -0.92;
        const dy = -0.55;

        const grad = ctx.createLinearGradient(
          x0,
          y0,
          x0 + tail * dx,
          y0 + tail * dy
        );
        grad.addColorStop(0, "rgba(244,232,255,0.62)");
        grad.addColorStop(0.25, "rgba(196,154,255,0.36)");
        grad.addColorStop(1, "rgba(124,88,255,0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + tail * dx, y0 + tail * dy);
        ctx.stroke();

        ctx.fillStyle = "rgba(244,232,255,0.68)";
        ctx.beginPath();
        ctx.arc(x0, y0, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    reset();
    window.addEventListener("resize", reset, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reset);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active, reduce, factor, targetId]);

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
        opacity: 0.7,
      }}
    />
  );
}

/* =========================================================
   UI parts
========================================================= */
function SealMark({ active }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mt-10 inline-flex items-center gap-3",
        "transition-all duration-[900ms]",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[6px]",
      ].join(" ")}
    >
      <span className="inline-block h-[10px] w-[10px] rounded-full border border-white/20 bg-white/5" />
      <span className="text-[11px] tracking-[0.28em] text-[color:var(--text-muted)]">
        印
      </span>
      <span className="inline-block h-[10px] w-[10px] rounded-full border border-white/12 bg-white/0" />
    </div>
  );
}

function Block({ label, subtitle, img, children }) {
  return (
    <section className="border-t border-white/10 pt-7">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3">
          {img ? (
            <img
              src={img}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="h-[30px] w-[30px] rounded-full border border-white/12 bg-white/5 object-cover"
            />
          ) : null}

          <p className="text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
            【{label}】
          </p>
        </div>

        {subtitle ? (
          <p className="text-[11px] tracking-[0.18em] text-[color:var(--text-faint)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="text-[15px] leading-[2.1] tracking-[0.02em] text-[color:var(--text-primary)]">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   Output
========================================================= */
export default function OutputSection({ formData }) {
  const [rootRef, shown] = useAqReveal();
  const reduce = useReduceMotion();

  const [sealed, setSealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const memo = useMemo(() => buildMemo(formData), [formData]);
  const meta = useMemo(() => formatMeta(formData, memo), [formData, memo]);

  useEffect(() => {
    setSealed(false);
    setCopied(false);
  }, [formData?.birth, formData?.place, formData?.time, formData?.name]);

  if (!memo) return null;

  const Btn = ({ children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "meishiki-cta",
        "rounded-[999px] border border-[color:var(--border-soft)] bg-white/5 px-5 py-2.5",
        "text-[12px] tracking-[0.22em] text-[color:var(--text-primary)]",
        "transition-all duration-300 hover:border-[color:var(--border-glow)] hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/35",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const handleSeal = () => setSealed(true);

  const handleCopy = async () => {
    try {
      const text = buildCopyText(formData, memo);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSealed(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // 静かに
    }
  };

  return (
    <section
      id="output"
      ref={rootRef}
      className={[
        "relative overflow-hidden no-scroll-anchor",
        "bg-[color:var(--ink-deep)] text-[color:var(--text-primary)]",
        "pt-[clamp(110px,16vh,220px)]",
        "pb-[clamp(140px,18vh,260px)]",
        "scroll-mt-[clamp(36px,6vh,92px)]",
        shown ? "aq-show" : "",
      ].join(" ")}
    >
      {/* keyframes：宇宙ゆらぎ */}
      <style>{`
        @keyframes meishikiSpaceDriftA {
          0%   { transform: translate3d(0%,0%,0) scale(1.06); opacity: .16; }
          50%  { transform: translate3d(-1.1%,-0.9%,0) scale(1.10); opacity: .22; }
          100% { transform: translate3d(0%,0%,0) scale(1.06); opacity: .16; }
        }
        @keyframes meishikiSpaceDriftB {
          0%   { transform: translate3d(0%,0%,0) scale(1.08); opacity: .10; }
          50%  { transform: translate3d(1.3%,1.0%,0) scale(1.14); opacity: .16; }
          100% { transform: translate3d(0%,0%,0) scale(1.08); opacity: .10; }
        }
        @keyframes meishikiVeilBreathe {
          0%,100% { opacity: .70; transform: translate3d(0,0,0) scale(1); }
          50% { opacity: .86; transform: translate3d(0,-1%,0) scale(1.02); }
        }
      `}</style>

      {/* BG（Hero/Input と同じ文法） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse at 24% 10%, rgba(130,60,200,0.18) 0%, transparent 58%)",
              "radial-gradient(ellipse at 78% 75%, rgba(80,30,160,0.12) 0%, transparent 55%)",
              "linear-gradient(170deg, rgba(15,8,24,1) 0%, rgba(10,6,16,1) 40%, rgba(13,9,32,1) 100%)",
            ].join(","),
          }}
        />

        {/* space texture A */}
        <div
          className="absolute inset-[-8%] mix-blend-screen"
          style={{
            backgroundImage: `url(${SPACE_TEXTURE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(1.2px) saturate(0.95) brightness(0.78)",
            animation: reduce ? "none" : "meishikiSpaceDriftA 26s ease-in-out infinite",
            transformOrigin: "center",
          }}
        />

        {/* space texture B */}
        <div
          className="absolute inset-[-10%] mix-blend-screen"
          style={{
            backgroundImage: `url(${SPACE_TEXTURE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(9px) saturate(1.05) brightness(0.72)",
            animation: reduce ? "none" : "meishikiSpaceDriftB 36s ease-in-out infinite",
            transformOrigin: "center",
          }}
        />

        {/* breathing veil */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(circle at 50% 45%, rgba(194,148,255,0.10), rgba(0,0,0,0) 48%)",
              "radial-gradient(circle at 18% 30%, rgba(132,88,255,0.14), rgba(0,0,0,0) 32%)",
            ].join(","),
            filter: "blur(0.3px)",
            animation: reduce ? "none" : "meishikiVeilBreathe 14s ease-in-out infinite",
          }}
        />

        {/* dots + scanline（ごく薄く） */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
            backgroundSize: "160px 160px",
            backgroundPosition: "22px 12px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-[22vh]"
          style={{
            background: "linear-gradient(to top, rgba(8,4,14,0.92), transparent)",
          }}
        />
      </div>

      {/* ★ 星粒（Canvas） */}
      <StarField targetId="output" count={160} z={2} />
      <ShootingStar targetId="output" z={3} />

      <div className="relative mx-auto max-w-[1120px] px-5 md:px-6">
        <div className="aq-fade relative border-l border-white/10 pl-6 md:pl-10">
          {/* ruled */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 56px)",
              mixBlendMode: "overlay",
            }}
          />

          <div className="relative max-w-[900px]">
            {/* Header */}
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] tracking-[0.30em] text-[color:var(--text-muted)]">
                  読解
                </p>
                <h2 className="mt-3 text-[22px] tracking-[0.12em]">命式メモ</h2>

                {meta?.length ? (
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.16em] text-[color:var(--text-muted)]">
                    {meta.map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-2">
                        <span className="opacity-80">{k}</span>
                        <span className="opacity-35">—</span>
                        <span className="text-white/80">{v}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Btn onClick={handleCopy}>印を写す</Btn>
                <Btn onClick={handleSeal}>印を残す</Btn>
                {copied ? (
                  <span className="text-[11px] tracking-[0.18em] text-[color:var(--text-muted)]">
                    写しました
                  </span>
                ) : null}
              </div>
            </div>

            {/* Blocks */}
            <div className="space-y-7">
              {memo.blocks.map((b) => (
                <Block key={b.key} label={b.label} subtitle={b.subtitle} img={b.img}>
                  {memo.values[b.key]}
                </Block>
              ))}

              <SealMark active={sealed} />

              {/* 根拠 */}
              {memo?.method ? (
                <section className="border-t border-white/10 pt-7">
                  <details className="group">
                    <summary className="cursor-pointer list-none select-none">
                      <div className="flex items-center justify-between gap-6">
                        <p className="text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
                          【算出根拠】
                        </p>
                        <span className="text-[11px] tracking-[0.14em] text-white/45 group-open:opacity-80">
                          開く
                        </span>
                      </div>
                    </summary>

                    <div className="mt-5 space-y-2 text-[12px] leading-[2.0] text-[color:var(--text-secondary)]">
                      {(memo.method.lines ?? []).map((t, i) => (
                        <p key={i}>{t}</p>
                      ))}
                    </div>

                    {(memo.method.sources ?? []).length ? (
                      <div className="mt-9">
                        <p className="mb-3 text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
                          【参考】
                        </p>

                        <ul className="space-y-2 text-[12px] leading-[1.9] text-[color:var(--text-muted)]">
                          {memo.method.sources.map((s) => (
                            <li key={s.url}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-white/20 underline-offset-4 hover:decoration-[color:var(--mist-400)]"
                              >
                                {s.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </details>
                </section>
              ) : null}

              {/* footer */}
              <div className="pt-12 text-[12px] leading-[1.9] text-[color:var(--text-muted)]">
                <p>
                  これは予言ではなく、自己理解のための記録です。あなたの判断と行動が、現実をつくります。
                </p>
                <p className="mt-4">
                  <a
                    className="text-white/70 underline decoration-white/20 underline-offset-4 hover:decoration-[color:var(--mist-400)]"
                    href="https://gushikendesign.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Designed &amp; Built by GUSHIKEN DESIGN
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}