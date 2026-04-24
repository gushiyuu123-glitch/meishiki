import { useEffect, useMemo, useRef, useState } from "react";
import useAqReveal from "../hooks/useAqReveal";
import { buildCopyText, buildMemo, formatMeta } from "../data/meishikiMemo";

const SPACE_TEXTURE = "/meishiki/space-texture2.png";

/* ─────────────────────────────────────────
   Utility
───────────────────────────────────────── */
const rand = (a, b) => Math.random() * (b - a) + a;

function fallbackCopyText(text) {
  try {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand?.("copy");

    document.body.removeChild(textarea);

    return Boolean(ok);
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────
   Device profile
───────────────────────────────────────── */
function useDeviceProfile() {
  const [profile, setProfile] = useState({
    reduce: false,
    mobile: false,
    fine: false,
    factor: 0.55,
  });

  useEffect(() => {
    const update = () => {
      const reduce = Boolean(
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      );

      const fine = Boolean(
        window.matchMedia?.("(pointer: fine)")?.matches &&
          window.matchMedia?.("(hover: hover)")?.matches
      );

      const mobile = window.innerWidth < 768;

      setProfile({
        reduce,
        mobile,
        fine,
        factor: fine ? 1 : 0.52,
      });
    };

    update();

    window.addEventListener("resize", update, { passive: true });

    const reduceMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reduceMq?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", update);
      reduceMq?.removeEventListener?.("change", update);
    };
  }, []);

  return profile;
}

function useCanvasActive({ targetId = "output", rootMargin = "360px" } = {}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin,
        threshold: 0,
      }
    );

    io.observe(el);

    return () => io.disconnect();
  }, [targetId, rootMargin]);

  return active;
}

function setupCanvasDpr(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    window.innerWidth < 768 ? 1.5 : 2
  );

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { W: width, H: height };
}

/* ─────────────────────────────────────────
   Canvas: Star field
───────────────────────────────────────── */
function StarField({ targetId = "output", count = 170, z = 2 }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "460px" });
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

      const amount = Math.max(40, Math.floor(count * factor));

      stars = Array.from({ length: amount }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.24, 1.28),
        a: rand(0.07, 0.52),
        phase: rand(0, Math.PI * 2),
        drift: rand(-0.13, 0.13),
      }));
    };

    const draw = (timeStamp) => {
      ctx.clearRect(0, 0, W, H);

      if (!active) return;

      const time = timeStamp * 0.001;

      for (const star of stars) {
        const alpha = Math.max(
          0.02,
          star.a * (0.55 + 0.45 * Math.sin(time * 1.18 + star.phase))
        );

        const x = star.x + Math.sin(time * 0.22 + star.phase) * 1.08;
        const y = star.y + Math.cos(time * 0.18 + star.phase) * 0.88;

        star.x += star.drift * 0.018;

        if (star.x < -20) star.x = W + 20;
        if (star.x > W + 20) star.x = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(236, 220, 255, ${alpha})`;
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (star.r > 1.05 && alpha > 0.22) {
          ctx.strokeStyle = `rgba(210, 170, 255, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    build();

    const onResize = () => build();

    window.addEventListener("resize", onResize, { passive: true });

    if (active) {
      raf = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active, count, factor, reduce]);

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
        opacity: 0.68,
      }}
    />
  );
}

/* ─────────────────────────────────────────
   Canvas: Shooting star
───────────────────────────────────────── */
function ShootingStar({ targetId = "output", z = 3 }) {
  const ref = useRef(null);
  const active = useCanvasActive({ targetId, rootMargin: "460px" });
  const { reduce, factor } = useDeviceProfile();

  useEffect(() => {
    if (reduce) return undefined;

    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d", { alpha: true });

    if (!canvas || !ctx) return undefined;

    let raf = 0;
    let W = 0;
    let H = 0;
    let start = 0;

    const reset = () => {
      const size = setupCanvasDpr(canvas, ctx);

      W = size.W;
      H = size.H;
    };

    const draw = (timeStamp) => {
      ctx.clearRect(0, 0, W, H);

      if (!active) return;

      if (!start) start = timeStamp;

      const phase = ((timeStamp - start) / 1000) % 20;

      if (phase < 1.4) {
        const progress = phase / 1.4;
        const x = W * 0.16 + progress * W * 0.48;
        const y = H * 0.12 + progress * H * 0.22;
        const tail = 150 * factor;

        const grad = ctx.createLinearGradient(
          x,
          y,
          x - tail * 0.92,
          y - tail * 0.55
        );

        grad.addColorStop(0, "rgba(244, 232, 255, 0.60)");
        grad.addColorStop(0.3, "rgba(196, 154, 255, 0.34)");
        grad.addColorStop(1, "rgba(124, 88, 255, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - tail * 0.92, y - tail * 0.55);
        ctx.stroke();

        ctx.fillStyle = "rgba(244, 232, 255, 0.66)";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    reset();

    window.addEventListener("resize", reset, { passive: true });

    if (active) {
      raf = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reset);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active, factor, reduce]);

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
        opacity: 0.64,
      }}
    />
  );
}

/* ─────────────────────────────────────────
   UI parts
───────────────────────────────────────── */
function SealMark({ active }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mt-10 inline-flex items-center gap-3 transition-all duration-[900ms]",
        active ? "translate-y-0 opacity-100" : "translate-y-[6px] opacity-0",
      ].join(" ")}
    >
      <span className="h-[10px] w-[10px] rounded-full border border-white/20 bg-white/5 shadow-[0_0_12px_rgba(200,160,255,0.16)]" />
      <span className="text-[11px] tracking-[0.28em] text-[color:var(--text-muted)]">
        印
      </span>
      <span className="h-[10px] w-[10px] rounded-full border border-white/12" />
    </div>
  );
}

function Block({ label, subtitle, desc, img, children }) {
  return (
    <section className="group border-t border-white/10 pt-6 md:pt-7">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3">
          {img && (
            <img
              src={img}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable="false"
              className="
                h-[28px] w-[28px] flex-shrink-0 rounded-full
                border border-white/12 bg-white/5 object-cover
                shadow-[0_0_20px_rgba(180,130,255,0.08)]
              "
            />
          )}

          <p className="text-[11px] tracking-[0.28em] text-[color:var(--text-secondary)]">
            【{label}】
          </p>
        </div>

        {(subtitle || desc) && (
          <p className="ml-[40px] text-[10px] tracking-[0.16em] text-[color:var(--text-faint)] sm:ml-0">
            {subtitle || desc}
          </p>
        )}
      </div>

      <div className="text-[14px] leading-[2.18] tracking-[0.025em] text-[color:var(--text-primary)] sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function MetaRow({ meta }) {
  if (!meta?.length) return null;

  return (
    <div className="mt-5 flex flex-col gap-y-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
      {meta.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex flex-wrap items-center gap-1.5 text-[10px] tracking-[0.16em] text-[color:var(--text-muted)] sm:text-[11px]"
        >
          <span className="opacity-75">{key}</span>
          <span className="opacity-30">—</span>
          <span className="text-white/78">{value}</span>
        </span>
      ))}
    </div>
  );
}

function ActionButton({ onClick, children, done }) {
  return (
    <button
      type="button"
      onClick={onClick}
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

function Toast({ children }) {
  if (!children) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        -mt-2 mb-8 inline-flex max-w-[560px]
        rounded-[14px] border border-white/12 bg-white/5
        px-4 py-3 text-[11px] leading-[1.9]
        tracking-[0.12em] text-white/80
        backdrop-blur
      "
    >
      {children}
    </div>
  );
}

function MethodToggle({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="meishiki-method"
      className="
        flex min-h-[44px] w-full items-center justify-between gap-6
        focus:outline-none focus-visible:ring-2
        focus-visible:ring-[color:var(--mist-400)]/30
      "
    >
      <p className="text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
        【算出根拠】
      </p>

      <span
        className={[
          "text-[10px] tracking-[0.14em] text-white/45 transition-all duration-200",
          open ? "text-white/70" : "",
        ].join(" ")}
      >
        {open ? "閉じる" : "開く"}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   OutputSection
═══════════════════════════════════════════════ */
export default function OutputSection({ formData }) {
  const [rootRef, shown] = useAqReveal();
  const { reduce, mobile } = useDeviceProfile();

  const [sealed, setSealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [shared, setShared] = useState(false);
  const [sharedKind, setSharedKind] = useState("");

  const [methodOpen, setMethodOpen] = useState(false);
  const [toast, setToast] = useState("");

  const toastTimer = useRef(0);

  const memo = useMemo(() => buildMemo(formData), [formData]);
  const meta = useMemo(() => (memo ? formatMeta(formData, memo) : []), [
    formData,
    memo,
  ]);

  const copyText = useMemo(() => {
    if (!memo) return "";
    return buildCopyText(formData, memo);
  }, [formData, memo]);

  useEffect(() => {
    setSealed(false);
    setCopied(false);
    setShared(false);
    setSharedKind("");
    setMethodOpen(false);
    setToast("");

    window.clearTimeout(toastTimer.current);
  }, [formData?.birth, formData?.place, formData?.time, formData?.name]);

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1850);
  };

  if (!memo) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const ok = fallbackCopyText(copyText);
        if (!ok) throw new Error("copy_failed");
      }

      setCopied(true);
      setSealed(true);
      showToast("写しました。");

      window.setTimeout(() => setCopied(false), 1650);
    } catch {
      showToast("写せませんでした。長押しでコピーしてください。");
    }
  };

  const handleShare = async () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = "";

    const url = currentUrl.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "MEISHIKI — 命式メモ",
          text: "予言ではなく、自己理解の記録。年柱（年干支）を起こして、いまの傾向を整える。",
          url,
        });

        setShared(true);
        setSharedKind("sheet");
        setSealed(true);
        showToast("開きました。");

        window.setTimeout(() => setShared(false), 1650);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);

        setShared(true);
        setSharedKind("copy");
        setSealed(true);
        showToast("URLを写しました。");

        window.setTimeout(() => setShared(false), 1650);
        return;
      }

      window.prompt("このURLをコピーして共有してください。", url);

      setShared(true);
      setSharedKind("prompt");
      setSealed(true);
      showToast("URLを表示しました。");

      window.setTimeout(() => setShared(false), 1650);
    } catch (error) {
      if (error?.name === "AbortError") {
        showToast("閉じました。");
        return;
      }

      showToast("共有できませんでした。URLをコピーしてください。");
    }
  };

  const shareDoneLabel =
    sharedKind === "copy"
      ? "写しました"
      : sharedKind === "prompt"
        ? "表示"
        : "開きました";

  return (
    <section
      id="output"
      ref={rootRef}
      className={[
        "relative overflow-hidden no-scroll-anchor",
        "bg-[color:var(--ink-deep)] text-[color:var(--text-primary)]",
        "pt-[clamp(84px,12vh,200px)]",
        "pb-[clamp(104px,14vh,240px)]",
        "scroll-mt-[clamp(36px,6vh,92px)]",
      ].join(" ")}
    >
      <style>{`
        @keyframes meishikiOutputSpaceDriftA {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.06); opacity: 0.15; }
          50%  { transform: translate3d(-1.1%, -0.9%, 0) scale(1.10); opacity: 0.22; }
          100% { transform: translate3d(0%, 0%, 0) scale(1.06); opacity: 0.15; }
        }

        @keyframes meishikiOutputSpaceDriftB {
          0%   { transform: translate3d(0%, 0%, 0) scale(1.08); opacity: 0.10; }
          50%  { transform: translate3d(1.3%, 1.0%, 0) scale(1.14); opacity: 0.16; }
          100% { transform: translate3d(0%, 0%, 0) scale(1.08); opacity: 0.10; }
        }

        @keyframes meishikiOutputVeilBreathe {
          0%, 100% { opacity: 0.70; transform: translate3d(0, 0, 0) scale(1); }
          50%      { opacity: 0.86; transform: translate3d(0, -1%, 0) scale(1.02); }
        }

        @keyframes meishikiOutputAuroraSweep {
          0%   { transform: translate3d(-18%, 0, 0) rotate(-4deg); opacity: 0.16; }
          50%  { transform: translate3d(10%, 0, 0) rotate(2deg); opacity: 0.28; }
          100% { transform: translate3d(22%, 0, 0) rotate(-2deg); opacity: 0.16; }
        }

        @keyframes meishikiSealPulse {
          0%, 100% {
            opacity: 0.56;
            transform: scale(1);
          }
          50% {
            opacity: 0.92;
            transform: scale(1.035);
          }
        }
      `}</style>

      {/* BG */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, var(--ink-mid) 0%, var(--ink-deep) 22vh, var(--ink-deep) calc(100% - 22vh), var(--ink-mid) 100%)",
              "radial-gradient(ellipse at 24% 10%, rgba(130,60,200,0.18) 0%, transparent 58%)",
              "radial-gradient(ellipse at 78% 75%, rgba(80,30,160,0.12) 0%, transparent 55%)",
            ].join(","),
          }}
        />

        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "clamp(90px, 14vh, 260px)",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.16) 48%, rgba(0,0,0,0) 100%)",
            opacity: 0.55,
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "clamp(110px, 16vh, 320px)",
            background:
              "linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0) 100%)",
            opacity: 0.55,
          }}
        />

        <div
          className="absolute inset-[-12%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(190,145,255,0.10) 40%, rgba(170,110,255,0.06) 54%, rgba(0,0,0,0) 100%)",
            filter: "blur(26px) saturate(1.12)",
            mixBlendMode: "screen",
            animation: reduce
              ? "none"
              : "meishikiOutputAuroraSweep 18s ease-in-out infinite",
            opacity: mobile ? 0.42 : 0.55,
          }}
        />

        {!mobile && (
          <>
            <div
              className="absolute inset-[-8%] mix-blend-screen"
              style={{
                backgroundImage: `url(${SPACE_TEXTURE})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(1.2px) saturate(0.95) brightness(0.78)",
                animation: reduce
                  ? "none"
                  : "meishikiOutputSpaceDriftA 26s ease-in-out infinite",
              }}
            />

            <div
              className="absolute inset-[-10%] mix-blend-screen"
              style={{
                backgroundImage: `url(${SPACE_TEXTURE})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(9px) saturate(1.05) brightness(0.72)",
                animation: reduce
                  ? "none"
                  : "meishikiOutputSpaceDriftB 36s ease-in-out infinite",
              }}
            />
          </>
        )}

        {mobile && (
          <div
            className="absolute inset-0"
            style={{
              background: [
                "radial-gradient(circle at 25% 18%, rgba(130,60,200,0.16) 0%, transparent 50%)",
                "radial-gradient(circle at 75% 80%, rgba(80,30,160,0.12) 0%, transparent 46%)",
              ].join(","),
              opacity: 0.9,
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
            animation: reduce
              ? "none"
              : "meishikiOutputVeilBreathe 14s ease-in-out infinite",
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            opacity: mobile ? 0.055 : 0.1,
            backgroundImage:
              "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
            backgroundSize: "160px 160px",
            backgroundPosition: "22px 12px",
          }}
        />
      </div>

      <StarField targetId="output" count={mobile ? 86 : 180} z={2} />
      <ShootingStar targetId="output" z={3} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1120px] px-4 sm:px-6">
        <div
          className={[
            "aq-fade relative border-l border-white/10 pl-5 md:pl-10",
            shown ? "aq-show" : "",
          ].join(" ")}
        >
          {!mobile && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 56px)",
                mixBlendMode: "overlay",
              }}
            />
          )}

          <div className="relative max-w-[920px]">
            <div className="mb-8 flex flex-col gap-5 md:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] tracking-[0.30em] text-[color:var(--text-muted)]">
                  読解
                </p>

                <div className="mt-2.5 flex items-center gap-4">
                  <h2 className="text-[20px] tracking-[0.12em] md:text-[22px]">
                    命式メモ
                  </h2>

                  <span
                    aria-hidden="true"
                    className="hidden h-[30px] w-[30px] items-center justify-center rounded-full border border-white/12 bg-white/5 text-[11px] text-white/55 shadow-[0_0_24px_rgba(180,130,255,0.10)] sm:inline-flex"
                    style={{
                      animation: sealed
                        ? "meishikiSealPulse 4.8s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    印
                  </span>
                </div>

                <MetaRow meta={meta} />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
                <ActionButton onClick={handleCopy} done={copied}>
                  {copied ? "写しました" : "印を写す"}
                </ActionButton>

                <ActionButton onClick={handleShare} done={shared}>
                  {shared ? shareDoneLabel : "印を共有する"}
                </ActionButton>
              </div>
            </div>

            <Toast>{toast}</Toast>

            <div
              className="
                relative rounded-[22px] border border-white/10
                bg-white/[0.025] px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)]
                sm:px-7 sm:py-8 md:px-9 md:py-9
              "
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.018]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.16) 0.42px, transparent 0.42px)",
                  backgroundSize: "4px 4px",
                }}
              />

              <div className="relative space-y-6 md:space-y-7">
                {memo.blocks.map((block) => (
                  <Block
                    key={block.key}
                    label={block.label}
                    subtitle={block.subtitle}
                    desc={block.desc}
                    img={block.img}
                  >
                    {memo.values[block.key]}
                  </Block>
                ))}

                <SealMark active={sealed} />

                {memo?.method && (
                  <section className="border-t border-white/10 pt-6 md:pt-7">
                    <MethodToggle
                      open={methodOpen}
                      onClick={() => setMethodOpen((value) => !value)}
                    />

                    <div
                      id="meishiki-method"
                      className={[
                        "overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-ink)]",
                        methodOpen
                          ? "max-h-[900px] opacity-100 pt-5"
                          : "max-h-0 opacity-0",
                      ].join(" ")}
                    >
                      <div className="space-y-2 text-[12px] leading-[2.0] text-[color:var(--text-secondary)]">
                        {(memo.method.lines ?? []).map((text, index) => (
                          <p key={`${text}-${index}`}>{text}</p>
                        ))}
                      </div>

                      {(memo.method.sources ?? []).length > 0 && (
                        <div className="mt-7">
                          <p className="mb-3 text-[11px] tracking-[0.30em] text-[color:var(--text-secondary)]">
                            【参考】
                          </p>

                          <ul className="space-y-2.5">
                            {memo.method.sources.map((source) => (
                              <li key={source.url}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="
                                    block py-1 text-[12px] leading-[1.9]
                                    text-[color:var(--text-muted)] underline
                                    decoration-white/20 underline-offset-4
                                    hover:decoration-[color:var(--mist-400)]
                                    active:text-white/80
                                  "
                                >
                                  {source.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <div className="pt-10 text-[11px] leading-[2.0] text-[color:var(--text-muted)] md:pt-12 md:text-[12px]">
                  <p>
                    これは予言ではなく、自己理解のための記録です。
                    <br className="sm:hidden" />
                    あなたの判断と行動が、現実をつくります。
                  </p>

                  <p className="mt-4">
                    <a
                      href="https://gushikendesign.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-white/65 underline decoration-white/18
                        underline-offset-4 hover:decoration-[color:var(--mist-400)]
                        active:text-white/85
                      "
                    >
                      Designed &amp; Built by GUSHIKEN DESIGN
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}