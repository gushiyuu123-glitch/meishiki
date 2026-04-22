import { useEffect, useRef, useState } from "react";
import useAqReveal from "../hooks/useAqReveal";

const SPACE_TEXTURE = "/meishiki/space-texture1.png";

/* ─── tiny hooks ─── */
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

/* ─── validation ─── */
function pad2(v) { return String(v).padStart(2, "0"); }

function isValidYMD(y, m, d) {
  const yy = Number(y), mm = Number(m), dd = Number(d);
  if (!yy || !mm || !dd) return false;
  if (yy < 1900 || yy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const dt = new Date(yy, mm - 1, dd);
  return (
    dt.getFullYear() === yy &&
    dt.getMonth() === mm - 1 &&
    dt.getDate() === dd
  );
}

/* ─── UI parts ─── */
function SealRow() {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-[0.10em] text-[color:var(--text-muted)]">
      <span className="h-[8px] w-[8px] rounded-full border border-[color:var(--border-soft)] bg-white/5" />
      <span>記入</span>
      <span className="h-[8px] w-[8px] rounded-full border border-[color:var(--border-faint)]" />
    </div>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={["h-4 w-4 flex-shrink-0 transition-transform duration-300", open ? "rotate-180" : ""].join(" ")}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function GlowDivider() {
  return (
    <div className="meishiki-divider">
      <span className="meishiki-divider-dot" />
    </div>
  );
}

/* ─── Field label ─── */
function FieldLabel({ children, required }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 text-[10px] tracking-[0.24em] text-[color:var(--text-secondary)]">
      {children}
      {required && (
        <span className="rounded-full border border-[color:var(--mist-400)]/40 px-1.5 py-0.5 text-[9px] text-[color:var(--mist-400)]">
          必須
        </span>
      )}
    </p>
  );
}

/* ─── Buttons ─── */
function SmallBtn({ children, onClick, "aria-expanded": expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      // タッチターゲット 44px 確保
      className={[
        "inline-flex min-h-[44px] items-center gap-2",
        "rounded-[999px] border border-[color:var(--border-soft)] bg-white/5",
        "px-4 text-[10px] tracking-[0.20em]",
        "text-[color:var(--text-secondary)]",
        "transition-all duration-200 active:bg-white/10",
        "hover:border-[color:var(--border-glow)] hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/35",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      // タッチターゲット 48px
      className={[
        "meishiki-cta",
        "inline-flex min-h-[48px] w-full items-center justify-center gap-3 sm:w-auto",
        "rounded-[999px] border px-7",
        "text-[13px] tracking-[0.22em]",
        "transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-[color:var(--border-faint)] text-[color:var(--text-faint)] opacity-60"
          : [
            "border-[color:var(--border-glow)] bg-white/5 text-[color:var(--text-primary)]",
            "hover:border-[color:var(--mist-500)] hover:bg-white/10",
            "active:scale-[0.98] active:bg-white/12",
          ].join(" "),
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/40",
      ].join(" ")}
    >
      <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-white/5 text-[10px]">
        命
      </span>
      <span>{children}</span>
      <span className="text-[11px] text-white/40">→</span>
    </button>
  );
}

/* ─── Input field styles ─── */
// iOS Safari: font-size < 16px → ズームする。常に 16px
const INPUT_STYLE = { fontSize: 16 };

/* ═══════════════════════════════════════════════
   InputSection
═══════════════════════════════════════════════ */
export default function InputSection({ onSubmit }) {
  const [rootRef, shown] = useAqReveal();
  const reduce = useReduceMotion();
  const isMobile = useIsMobile();

  const yRef = useRef(null);
  const mRef = useRef(null);
  const dRef = useRef(null);
  const datePickerRef = useRef(null);
  const detailRef = useRef(null);
  const detailInnerRef = useRef(null);

  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [attempted, setAttempted] = useState(false);
  // 日付ピッカーとキーボード入力を明示的に区別
  const [usedPicker, setUsedPicker] = useState(false);

  const birthOk = isValidYMD(y, m, d);
  const birth = birthOk ? `${y}-${pad2(m)}-${pad2(d)}` : "";

  const jump = (nextRef, value, maxLen) => {
    if (String(value).length >= maxLen) nextRef?.current?.focus?.();
  };

  const onPickDate = (val) => {
    if (!val) return;
    const [yy, mm, dd] = val.split("-");
    setY(yy || "");
    setM(mm || "");
    setD(dd || "");
    setAttempted(false);
    setUsedPicker(true);
  };

  const openPicker = () => {
    const el = datePickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); } catch { el.click?.(); }
    } else {
      el.click?.();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!birthOk) {
      setAttempted(true);
      yRef.current?.focus?.();
      return;
    }
    onSubmit?.({ birth, place, time, name });
  };

  // 詳細アコーディオン：スムーズにスクロール
  useEffect(() => {
    if (!openDetail) return;
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      }, 160);
    });
  }, [openDetail]);

  return (
    <section
      id="input"
      ref={rootRef}
      className={[
        "relative overflow-hidden no-scroll-anchor",
        "bg-[color:var(--ink-mid)] text-[color:var(--text-primary)]",
        // SP: 上パディングをヒーローの分だけ確保
        "pt-[clamp(80px,12vh,200px)]",
        "pb-[clamp(80px,12vh,220px)]",
        // SP: スクロール時にヘッダーに隠れないオフセット
        "scroll-mt-[clamp(36px,6vh,90px)]",
        shown ? "aq-show" : "",
      ].join(" ")}
    >
      {/* ── keyframes ── */}
      <style>{`
        @keyframes meishikiSpaceDriftA {
          0%   { transform: translate3d(0%,0%,0) scale(1.06); opacity:.16; }
          50%  { transform: translate3d(-1.2%,-0.9%,0) scale(1.10); opacity:.22; }
          100% { transform: translate3d(0%,0%,0) scale(1.06); opacity:.16; }
        }
        @keyframes meishikiSpaceDriftB {
          0%   { transform: translate3d(0%,0%,0) scale(1.08); opacity:.10; }
          50%  { transform: translate3d(1.4%,1.0%,0) scale(1.14); opacity:.16; }
          100% { transform: translate3d(0%,0%,0) scale(1.08); opacity:.10; }
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
              "radial-gradient(ellipse at 22% 26%, rgba(110,60,200,0.22) 0%, transparent 56%)",
              "radial-gradient(ellipse at 78% 62%, rgba(80,10,160,0.14) 0%, transparent 55%)",
              "linear-gradient(170deg, rgba(15,8,24,1) 0%, rgba(10,6,16,1) 40%, rgba(13,9,32,1) 100%)",
            ].join(","),
          }}
        />
        {/* SP では重い texture を間引く */}
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
        {/* SP 向け：軽量な単色オーブで雰囲気を補う */}
        {isMobile && (
          <div
            className="absolute inset-0"
            style={{
              background: [
                "radial-gradient(circle at 30% 20%, rgba(130,70,220,0.18) 0%, transparent 52%)",
                "radial-gradient(circle at 72% 75%, rgba(80,30,160,0.12) 0%, transparent 45%)",
              ].join(","),
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(circle at 46% 46%, rgba(194,148,255,0.10), rgba(0,0,0,0) 48%)",
              "radial-gradient(circle at 18% 10%, rgba(132,88,255,0.14), rgba(0,0,0,0) 32%)",
            ].join(","),
            filter: "blur(0.3px)",
            animation: reduce ? "none" : "meishikiVeilBreathe 14s ease-in-out infinite",
          }}
        />
        {/* dots：SP ではさらに薄く */}
        <div
          className="absolute inset-0"
          style={{
            opacity: isMobile ? 0.06 : 0.10,
            backgroundImage: "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
            backgroundSize: "160px 160px",
            backgroundPosition: "28px 18px",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[22vh]"
          style={{ background: "linear-gradient(to top, rgba(8,4,14,0.92), transparent)" }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[1020px] px-4 sm:px-6">
        <div className="aq-fade">
          {/* SP: 縦一列、PC: 2カラム */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">

            {/* ── Left（見出し・説明）── */}
            <div className="md:col-span-5">
              <SealRow />

              <h2 className="mt-5 text-[clamp(22px,5vw,30px)] leading-[1.38] tracking-[0.12em]">
                生年月日を記す
              </h2>

              <div className="mt-5 text-[13px] leading-[2.1] tracking-[0.04em] text-[color:var(--text-secondary)] md:text-[14px]">
                <p>年柱（年干支）を起こす。</p>
                <p className="mt-2 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)]">
                  断定ではなく、傾向と条件を読むための記録。
                </p>
              </div>

              {/* SP では区切り線を入れてフォームと分ける */}
              <div className="mt-7 md:mt-10">
                <GlowDivider />
              </div>

              <div className="mt-6 border-t border-white/8 pt-5 text-[10px] leading-[2] tracking-[0.14em] text-[color:var(--text-muted)] md:mt-10 md:pt-7">
                <p>※ 保存なし／課金なし</p>
                <p>※ 不安を煽る表現・強い断定は行いません</p>
              </div>
            </div>

            {/* ── Right（フォーム）── */}
            <div className="md:col-span-7">
              <form onSubmit={handleSubmit} noValidate>
                {/* 縦罫線はSPでも維持（幻想的な印象を保つ） */}
                <div className="relative border-l border-white/10 pl-5 md:pl-10">
                  {/* ruled lines（PC のみ） */}
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

                  <div className="relative max-w-[760px]">
                    {/* ヘッダー行 */}
                    <div className="mb-7 flex items-center justify-between gap-4 md:mb-9">
                      <p className="text-[10px] tracking-[0.10em] text-[color:var(--text-muted)]">
                        命式入力
                      </p>
                      <p className="text-[10px] tracking-[0.18em] text-[color:var(--text-faint)]">
                        10秒ほど
                      </p>
                    </div>

                    {/* ── 生年月日 ── */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <FieldLabel required>生年月日</FieldLabel>
                        <span className="h-px flex-1 bg-white/10" />
                        {/* 日付選択：SP ではタップしやすいように大きめに */}
                        <button
                          type="button"
                          onClick={openPicker}
                          className="min-h-[36px] px-3 text-[10px] tracking-[0.14em] text-white/55 underline decoration-white/20 underline-offset-4 active:text-white/90 hover:text-white/80 hover:decoration-[color:var(--mist-400)]"
                        >
                          カレンダーで選ぶ
                        </button>
                        <input
                          ref={datePickerRef}
                          type="date"
                          className="hidden"
                          onChange={(e) => onPickDate(e.target.value)}
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                      </div>

                      {/* 年 / 月 / 日：SP ではラベル付きで分かりやすく */}
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-12 sm:gap-3">
                        {/* 年 */}
                        <div className="sm:col-span-5">
                          <div className="relative">
                            <input
                              ref={yRef}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={y}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                setY(v);
                                setAttempted(false);
                                setUsedPicker(false);
                                jump(mRef, v, 4);
                              }}
                              placeholder="1990"
                              aria-label="年（西暦4桁）"
                              style={INPUT_STYLE}
                              className={[
                                "meishiki-input pr-8",
                                attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                              ].join(" ")}
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] tracking-[0.1em] text-[color:var(--text-faint)]">
                              年
                            </span>
                          </div>
                        </div>
                        {/* 月 */}
                        <div className="sm:col-span-3">
                          <div className="relative">
                            <input
                              ref={mRef}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={m}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                setM(v);
                                setAttempted(false);
                                setUsedPicker(false);
                                jump(dRef, v, 2);
                              }}
                              placeholder="10"
                              aria-label="月"
                              style={INPUT_STYLE}
                              className={[
                                "meishiki-input pr-7",
                                attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                              ].join(" ")}
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] tracking-[0.1em] text-[color:var(--text-faint)]">
                              月
                            </span>
                          </div>
                        </div>
                        {/* 日 */}
                        <div className="sm:col-span-4">
                          <div className="relative">
                            <input
                              ref={dRef}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={d}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                setD(v);
                                setAttempted(false);
                                setUsedPicker(false);
                              }}
                              placeholder="10"
                              aria-label="日"
                              style={INPUT_STYLE}
                              className={[
                                "meishiki-input pr-7",
                                attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                              ].join(" ")}
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] tracking-[0.1em] text-[color:var(--text-faint)]">
                              日
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[10px] leading-[1.9] tracking-[0.10em] text-[color:var(--text-faint)]">
                        数字で入力 ／ カレンダー入力も可
                      </p>

                      {/* バリデーションエラー */}
                      {attempted && !birthOk && (
                        <p
                          role="alert"
                          className="mt-2.5 rounded-lg border border-[color:var(--mist-400)]/20 bg-[color:var(--mist-100)] px-3 py-2 text-[11px] leading-[1.8] tracking-[0.08em] text-white/75"
                        >
                          年・月・日を正しく入力してください
                        </p>
                      )}
                    </div>

                    {/* ── 詳細（任意）── */}
                    <div ref={detailRef} className="mt-8 border-t border-white/8 pt-6 md:mt-9 md:pt-7">
                      <div className="flex items-center justify-between gap-4">
                        <SmallBtn
                          onClick={() => setOpenDetail((v) => !v)}
                          aria-expanded={openDetail}
                        >
                          <span>詳細（任意）</span>
                          <Chevron open={openDetail} />
                        </SmallBtn>
                        <p className="text-[10px] tracking-[0.12em] text-[color:var(--text-faint)]">
                          出生地・時間・名前
                        </p>
                      </div>

                      {/* アコーディオン本体 */}
                      <div
                        ref={detailInnerRef}
                        aria-hidden={!openDetail}
                        className={[
                          "overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-ink)]",
                          openDetail ? "max-h-[600px] opacity-100 pt-6" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <div>
                            <FieldLabel>出生地</FieldLabel>
                            <input
                              type="text"
                              value={place}
                              onChange={(e) => setPlace(e.target.value)}
                              placeholder="沖縄 / 不明でも可"
                              className="meishiki-input"
                              style={INPUT_STYLE}
                              autoComplete="off"
                              // SP での過剰なオートコレクト抑制
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                            />
                          </div>

                          <div>
                            <FieldLabel>出生時間</FieldLabel>
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="meishiki-input"
                              style={INPUT_STYLE}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <FieldLabel>名前</FieldLabel>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="田中 太郎"
                              className="meishiki-input"
                              style={INPUT_STYLE}
                              autoComplete="name"
                              autoCorrect="off"
                              spellCheck="false"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Submit ── */}
                    <div className="mt-8 space-y-4 md:mt-10">
                      <PrimaryBtn disabled={!birthOk}>命式を起こす</PrimaryBtn>
                      <p className="text-[10px] leading-[2.0] tracking-[0.10em] text-[color:var(--text-muted)]">
                        入力は保存されません。<br />
                        結果はこのページ内に表示されます。
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}