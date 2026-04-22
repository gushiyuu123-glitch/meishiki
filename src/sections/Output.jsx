import { useEffect, useMemo, useRef, useState } from "react";
import useAqReveal from "../hooks/useAqReveal";
import { buildCopyText, buildMemo, formatMeta } from "../data/meishikiMemo";

const SPACE_TEXTURE = "/meishiki/space-texture2.png";

/* ─── hooks ─── */
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

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function usePerfFactor() {
  const [factor, setFactor] = useState(0.7);
  useEffect(() => {
    const fine =
      window.matchMedia?.("(pointer: fine)")?.matches &&
      window.matchMedia?.("(hover: hover)")?.matches;
    setFactor(fine ? 1 : 0.55); // SP：星の数を減らす
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
  // SP では dpr を 1.5 以下に制限してパフォーマンスを確保
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, Math.floor(rect.width));
  const H = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { W, H };
}

const rand = (a, b) => Math.random() * (b - a) + a;

/* ─── Canvas: StarField ─── */
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

    let raf = 0, W = 0, H = 0, stars = [];

    const build = () => {
      const s = setupCanvasDpr(canvas, ctx);
      W = s.W; H = s.H;
      const n = Math.max(40, Math.floor(count * factor));
      stars = Array.from({ length: n }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.25, 1.35),
        a: rand(0.08, 0.55),
        tw: rand(0.004, 0.018),
        phase: rand(0, Math.PI * 2),
        drift: rand(-0.14, 0.14),
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) { raf = requestAnimationFrame(draw); return; }

      const time = t * 0.001;
      for (const s of stars) {
        const alpha = Math.max(0.02, s.a * (0.55 + 0.45 * Math.sin(time * 1.2 + s.phase)));
        const x = s.x + Math.sin(time * 0.22 + s.phase) * 1.1;
        const y = s.y + Math.cos(time * 0.18 + s.phase) * 0.9;
        s.x += s.drift * 0.018;
        if (s.x < -20) s.x = W + 20;
        if (s.x > W + 20) s.x = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(236,220,255,${alpha})`;
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.r > 1.05 && alpha > 0.22) {
          ctx.strokeStyle = `rgba(210,170,255,${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    build();
    window.addEventListener("resize", build, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", build); };
  }, [active, reduce, factor, count]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: z, opacity: 0.7 }}
    />
  );
}

/* ─── Canvas: ShootingStar ─── */
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

    let raf = 0, W = 0, H = 0, t0 = 0;
    const reset = () => { const s = setupCanvasDpr(canvas, ctx); W = s.W; H = s.H; };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) { raf = requestAnimationFrame(draw); return; }
      if (!t0) t0 = t;
      const phase = ((t - t0) / 1000) % 20;
      if (phase < 1.4) {
        const p = phase / 1.4;
        const x0 = W * 0.16 + p * W * 0.48;
        const y0 = H * 0.12 + p * H * 0.22;
        const tail = 150 * factor;
        const grad = ctx.createLinearGradient(x0, y0, x0 - tail * 0.92, y0 - tail * 0.55);
        grad.addColorStop(0, "rgba(244,232,255,0.60)");
        grad.addColorStop(0.3, "rgba(196,154,255,0.34)");
        grad.addColorStop(1, "rgba(124,88,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 - tail * 0.92, y0 - tail * 0.55);
        ctx.stroke();
        ctx.fillStyle = "rgba(244,232,255,0.66)";
        ctx.beginPath();
        ctx.arc(x0, y0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    reset();
    window.addEventListener("resize", reset, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", reset); };
  }, [active, reduce, factor]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: z, opacity: 0.65 }}
    />
  );
}

/* ─── SealMark ─── */
function SealMark({ active }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mt-10 inline-flex items-center gap-3 transition-all duration-[900ms]",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[6px]",
      ].join(" ")}
    >
      <span className="h-[10px] w-[10px] rounded-full border border-white/20 bg-white/5" />
      <span className="text-[11px] tracking-[0.28em] text-[color:var(--text-muted)]">印</span>
      <span className="h-[10px] w-[10px] rounded-full border border-white/12" />
    </div>
  );
}

/* ─── Block ─── */
function Block({ label, subtitle, desc, img, children }) {
  return (
    <section className="border-t border-white/10 pt-6 md:pt-7">
      {/* ヘッダー：SP では縦積み、PC では横並び */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3">
          {img && (
            <img
              src={img}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="h-[28px] w-[28px] flex-shrink-0 rounded-full border border-white/12 bg-white/5 object-cover"
            />
          )}
          <p className="text-[11px] tracking-[0.28em] text-[color:var(--text-secondary)]">
            【{label}】
          </p>
        </div>
        {(subtitle || desc) && (
          <p className="ml-[40px] text-[10px] tracking-[0.16em] text-[color:var(--text-faint)] sm:ml-0">
            {subtitle}
          </p>
        )}
      </div>
      {/* 本文：SP での行間・字詰めを読みやすく調整 */}
      <div className="text-[14px] leading-[2.15] tracking-[0.02em] text-[color:var(--text-primary)] sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

/* ─── Meta row ─── */
function MetaRow({ meta }) {
  if (!meta?.length) return null;
  return (
    <div className="mt-5 flex flex-col gap-y-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
      {meta.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex flex-wrap items-center gap-1.5 text-[10px] tracking-[0.16em] text-[color:var(--text-muted)] sm:text-[11px]"
        >
          <span className="opacity-75">{k}</span>
          <span className="opacity-30">—</span>
          <span className="text-white/78">{v}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── CopyButton with feedback ─── */
function ActionButton({ onClick, children, done }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // タッチターゲット 44px
      className={[
        "meishiki-cta",
        "inline-flex min-h-[44px] items-center justify-center gap-2",
        "rounded-[999px] border border-[color:var(--border-soft)] bg-white/5",
        "px-5 text-[11px] tracking-[0.20em] text-[color:var(--text-primary)]",
        "transition-all duration-200",
        done ? "border-[color:var(--mist-400)] bg-white/8" : "",
        "active:scale-[0.97] active:bg-white/10",
        "hover:border-[color:var(--border-glow)] hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/35",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   OutputSection
═══════════════════════════════════════════════ */
export default function OutputSection({ formData }) {
  const [rootRef, shown] = useAqReveal();
  const reduce = useReduceMotion();
  const isMobile = useIsMobile();

  const [sealed, setSealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);

  const memo = useMemo(() => buildMemo(formData), [formData]);
  const meta = useMemo(() => formatMeta(formData, memo), [formData, memo]);

  useEffect(() => {
    setSealed(false);
    setCopied(false);
    setMethodOpen(false);
  }, [formData?.birth, formData?.place, formData?.time, formData?.name]);

  if (!memo) return null;

  const handleSeal = () => setSealed(true);

  const handleCopy = async () => {
    try {
      const text = buildCopyText(formData, memo);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSealed(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fallback（iOS Safari の制約など）
    }
  };

  return (
    <section
      id="output"
      ref={rootRef}
      className={[
        "relative overflow-hidden no-scroll-anchor",
        "bg-[color:var(--ink-deep)] text-[color:var(--text-primary)]",
        "pt-[clamp(80px,12vh,200px)]",
        "pb-[clamp(100px,14vh,240px)]",
        "scroll-mt-[clamp(36px,6vh,92px)]",
        shown ? "aq-show" : "",
      ].join(" ")}
    >
      {/* keyframes */}
      <style>{`
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
        @keyframes meishikiVeilBreathe {
          0%,100% { opacity:.70; transform:translate3d(0,0,0) scale(1); }
          50%     { opacity:.86; transform:translate3d(0,-1%,0) scale(1.02); }
        }
      `}</style>

      {/* ── BG ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
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
        {/* PC のみ texture */}
        {!isMobile && (
          <>
            <div
              className="absolute inset-[-8%] mix-blend-screen"
              style={{
                backgroundImage: `url(${SPACE_TEXTURE})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(1.2px) saturate(0.95) brightness(0.78)",
                animation: reduce ? "none" : "meishikiSpaceDriftA 26s ease-in-out infinite",
              }}
            />
            <div
              className="absolute inset-[-10%] mix-blend-screen"
              style={{
                backgroundImage: `url(${SPACE_TEXTURE})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(9px) saturate(1.05) brightness(0.72)",
                animation: reduce ? "none" : "meishikiSpaceDriftB 36s ease-in-out infinite",
              }}
            />
          </>
        )}
        {/* SP 向け軽量オーブ */}
        {isMobile && (
          <div
            className="absolute inset-0"
            style={{
              background: [
                "radial-gradient(circle at 25% 18%, rgba(130,60,200,0.16) 0%, transparent 50%)",
                "radial-gradient(circle at 75% 80%, rgba(80,30,160,0.12) 0%, transparent 46%)",
              ].join(","),
            }}
          />
        )}
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
        <div
          className="absolute inset-0"
          style={{
            opacity: isMobile ? 0.06 : 0.10,
            backgroundImage: "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
            backgroundSize: "160px 160px",
            backgroundPosition: "22px 12px",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[22vh]"
          style={{ background: "linear-gradient(to top, rgba(8,4,14,0.92), transparent)" }}
        />
      </div>

      {/* Stars（SP ではカウント半減） */}
      <StarField targetId="output" count={isMobile ? 80 : 160} z={2} />
      <ShootingStar targetId="output" z={3} />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="aq-fade relative border-l border-white/10 pl-5 md:pl-10">
          {/* ruled lines：PC のみ */}
          {!isMobile && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.09]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 56px)",
                mixBlendMode: "overlay",
              }}
            />
          )}

          <div className="relative max-w-[900px]">
            {/* ── Header ── */}
            <div className="mb-8 flex flex-col gap-5 md:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] tracking-[0.30em] text-[color:var(--text-muted)]">
                  読解
                </p>
                <h2 className="mt-2.5 text-[20px] tracking-[0.12em] md:text-[22px]">
                  命式メモ
                </h2>
                <MetaRow meta={meta} />
              </div>

              {/* アクションボタン：SP では横スクロールせずに折り返す */}
              <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
                <ActionButton onClick={handleCopy} done={copied}>
                  {copied ? "写しました" : "印を写す"}
                </ActionButton>
                <ActionButton onClick={handleSeal} done={sealed}>
                  印を残す
                </ActionButton>
              </div>
            </div>

            {/* ── Blocks ── */}
            <div className="space-y-6 md:space-y-7">
              {memo.blocks.map((b) => (
                <Block
                  key={b.key}
                  label={b.label}
                  subtitle={b.subtitle}
                  desc={b.desc}
                  img={b.img}
                >
                  {memo.values[b.key]}
                </Block>
              ))}

              <SealMark active={sealed} />

              {/* ── 算出根拠（モバイル向け：<details> を独自実装でアニメーション付き） ── */}
              {memo?.method && (
                <section className="border-t border-white/10 pt-6 md:pt-7">
                  {/* ヘッダー（タッチターゲット 44px） */}
                  <button
                    type="button"
                    onClick={() => setMethodOpen((v) => !v)}
                    aria-expanded={methodOpen}
                    className="flex min-h-[44px] w-full items-center justify-between gap-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/30"
                  >
                    <p className="text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
                      【算出根拠】
                    </p>
                    <span
                      className={[
                        "text-[10px] tracking-[0.14em] text-white/45 transition-all duration-200",
                        methodOpen ? "text-white/70" : "",
                      ].join(" ")}
                    >
                      {methodOpen ? "閉じる" : "開く"}
                    </span>
                  </button>

                  {/* アコーディオン本体 */}
                  <div
                    className={[
                      "overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-ink)]",
                      methodOpen ? "max-h-[800px] opacity-100 pt-5" : "max-h-0 opacity-0",
                    ].join(" ")}
                  >
                    <div className="space-y-2 text-[12px] leading-[2.0] text-[color:var(--text-secondary)]">
                      {(memo.method.lines ?? []).map((t, i) => (
                        <p key={i}>{t}</p>
                      ))}
                    </div>

                    {(memo.method.sources ?? []).length > 0 && (
                      <div className="mt-7">
                        <p className="mb-3 text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
                          【参考】
                        </p>
                        <ul className="space-y-2.5">
                          {memo.method.sources.map((s) => (
                            <li key={s.url}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                // リンクのタッチターゲットを広げる
                                className="block py-1 text-[12px] leading-[1.9] text-[color:var(--text-muted)] underline decoration-white/20 underline-offset-4 hover:decoration-[color:var(--mist-400)] active:text-white/80"
                              >
                                {s.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Footer ── */}
              <div className="pt-10 text-[11px] leading-[2.0] text-[color:var(--text-muted)] md:pt-12 md:text-[12px]">
                <p>
                  これは予言ではなく、自己理解のための記録です。<br className="sm:hidden" />
                  あなたの判断と行動が、現実をつくります。
                </p>
                <p className="mt-4">
                  <a
                    href="https://gushikendesign.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/65 underline decoration-white/18 underline-offset-4 hover:decoration-[color:var(--mist-400)] active:text-white/85"
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