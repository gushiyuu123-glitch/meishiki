import { useEffect, useRef, useState } from "react";
import useAqReveal from "../hooks/useAqReveal";

const SPACE_TEXTURE = "/meishiki/space-texture1.png";

function SealRow() {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-[0.10em] text-[color:var(--text-muted)]">
      <span className="h-[9px] w-[9px] rounded-full border border-[color:var(--border-soft)] bg-white/5" />
      <span>記入</span>
      <span className="h-[9px] w-[9px] rounded-full border border-[color:var(--border-faint)] bg-white/0" />
    </div>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={[
        "h-4 w-4 transition-transform duration-100",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
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

function pad2(v) {
  return String(v).padStart(2, "0");
}

function isValidYMD(y, m, d) {
  const yy = Number(y);
  const mm = Number(m);
  const dd = Number(d);
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

export default function InputSection({ onSubmit }) {
  const [rootRef, shown] = useAqReveal();
  const reduce = useReduceMotion();

  // Y/M/D（自力入力）
  const yRef = useRef(null);
  const mRef = useRef(null);
  const dRef = useRef(null);
  const datePickerRef = useRef(null);
  const detailRef = useRef(null);

  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");

  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [attempted, setAttempted] = useState(false);

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
  };

  const openPicker = () => {
    const el = datePickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click?.();
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

  // 詳細を開いた時、そこへ“軽く”寄せる（開閉で下に伸びる事故を抑える）
  useEffect(() => {
    if (!openDetail) return;

    // 1) 次フレームで展開開始
    requestAnimationFrame(() => {
      // 2) 少し待ってから（max-h transitionを考慮）
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    });
  }, [openDetail]);

  const SmallBtn = ({ children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2",
        "rounded-[999px] border border-[color:var(--border-soft)] bg-white/5",
        "px-4 py-2.5 text-[10px] tracking-[0.20em]",
        "text-[color:var(--text-secondary)]",
        "transition-all duration-100 hover:border-[color:var(--border-glow)] hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/35",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const PrimaryBtn = ({ children, disabled }) => (
    <button
      type="submit"
      disabled={disabled}
      className={[
        "meishiki-cta",
        "inline-flex items-center justify-center gap-3",
        "rounded-[999px] border px-6 py-3",
        "text-[12px] tracking-[0.22em]",
        "transition-all duration-100",
        disabled
          ? "border-[color:var(--border-faint)] text-[color:var(--text-faint)] opacity-70"
          : "border-[color:var(--border-glow)] bg-white/5 text-[color:var(--text-primary)] hover:border-[color:var(--mist-500)] hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mist-400)]/40",
      ].join(" ")}
    >
      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-white/5 text-[10px]">
        命
      </span>
      <span>{children}</span>
      <span className="text-[10px] text-white/45">→</span>
    </button>
  );

  // iOSズーム保険
  const inputStyle = { fontSize: 16 };

  return (
    <section
      id="input"
      ref={rootRef}
      className={[
        "relative overflow-hidden no-scroll-anchor",
        "bg-[color:var(--ink-mid)] text-[color:var(--text-primary)]",
        "pt-[clamp(132px,18vh,240px)]",
        "pb-[clamp(140px,18vh,260px)]",
        "scroll-mt-[clamp(44px,7vh,100px)]",
        shown ? "aq-show" : "",
      ].join(" ")}
    >
      {/* drift animation（局所定義） */}
      <style>{`
        @keyframes meishikiSpaceDriftA {
          0%   { transform: translate3d(0%,0%,0) scale(1.06); opacity: .16; }
          50%  { transform: translate3d(-1.2%,-0.9%,0) scale(1.10); opacity: .22; }
          100% { transform: translate3d(0%,0%,0) scale(1.06); opacity: .16; }
        }
        @keyframes meishikiSpaceDriftB {
          0%   { transform: translate3d(0%,0%,0) scale(1.08); opacity: .10; }
          50%  { transform: translate3d(1.4%,1.0%,0) scale(1.14); opacity: .16; }
          100% { transform: translate3d(0%,0%,0) scale(1.08); opacity: .10; }
        }
        @keyframes meishikiVeilBreathe {
          0%,100% { opacity: .70; transform: translate3d(0,0,0) scale(1); }
          50% { opacity: .86; transform: translate3d(0,-1%,0) scale(1.02); }
        }
      `}</style>

      {/* BG（Heroの延長 + 宇宙テクスチャゆらぎ） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse at 22% 26%, rgba(110,60,200,0.24) 0%, transparent 56%)",
              "radial-gradient(ellipse at 78% 62%, rgba(80,10,160,0.16) 0%, transparent 55%)",
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
            pointerEvents: "none",
          }}
        />

        {/* space texture B (blur veil) */}
        <div
          className="absolute inset-[-10%] mix-blend-screen"
          style={{
            backgroundImage: `url(${SPACE_TEXTURE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(9px) saturate(1.05) brightness(0.72)",
            animation: reduce ? "none" : "meishikiSpaceDriftB 36s ease-in-out infinite",
            transformOrigin: "center",
            pointerEvents: "none",
          }}
        />

        {/* breathing veil */}
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

        {/* dots (very subtle) */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
            backgroundSize: "160px 160px",
            backgroundPosition: "28px 18px",
          }}
        />

        {/* scanline */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* bottom dark fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-[22vh]"
          style={{
            background: "linear-gradient(to top, rgba(8,4,14,0.92), transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1020px] px-5 md:px-6">
        <div className="aq-fade grid grid-cols-12 gap-10 md:gap-12">
          {/* Left */}
          <div className="col-span-12 md:col-span-5">
            <SealRow />

            <h2 className="mt-7 text-[clamp(24px,3vw,32px)] leading-[1.35] tracking-[0.12em]">
              生年月日を記す
            </h2>

            <div className="mt-7 text-[14px] leading-[2.1] tracking-[0.04em] text-[color:var(--text-secondary)]">
              <p>年柱（年干支）を起こす。</p>
              <p className="mt-2 text-[12px] tracking-[0.18em] text-[color:var(--text-muted)]">
                断定ではなく、傾向と条件を読むための記録。
              </p>
            </div>

            <div className="mt-10">
              <GlowDivider />
            </div>

            <div className="mt-10 border-t border-white/10 pt-7 text-[10px] leading-[2] tracking-[0.14em] text-[color:var(--text-muted)]">
              <p>※ 保存なし／課金なし</p>
              <p>※ 不安を煽る表現・強い断定は行いません</p>
            </div>
          </div>

          {/* Right */}
          <div className="col-span-12 md:col-span-7">
            <form onSubmit={handleSubmit} className="relative">
              {/* “カード”を作らない：本文の縦罫線 */}
              <div className="relative border-l border-white/10 pl-6 md:pl-10">
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

                <div className="relative max-w-[760px]">
                  <div className="mb-9 flex items-center justify-between gap-6">
                    <p className="text-[10px] tracking-[0.10em] text-[color:var(--text-muted)]">
                      命式入力
                    </p>
                    <p className="text-[10px] tracking-[0.18em] text-[color:var(--text-faint)]">
                      所要：10秒ほど
                    </p>
                  </div>

                  {/* Birth */}
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[10px] tracking-[0.24em] text-[color:var(--text-secondary)]">
                        生年月日（必須）
                      </span>
                      <span className="h-px flex-1 bg-white/10" />

                      <button
                        type="button"
                        onClick={openPicker}
                        className="text-[10px] tracking-[0.14em] text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white/80 hover:decoration-[color:var(--mist-400)]"
                      >
                        選択
                      </button>

                      <input
                        ref={datePickerRef}
                        type="date"
                        className="hidden"
                        onChange={(e) => onPickDate(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5">
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
                            jump(mRef, v, 4);
                          }}
                          placeholder="1990"
                          className={[
                            "meishiki-input",
                            attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                          ].join(" ")}
                          style={inputStyle}
                          aria-label="年"
                        />
                      </div>

                      <div className="col-span-3">
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
                            jump(dRef, v, 2);
                          }}
                          placeholder="10"
                          className={[
                            "meishiki-input",
                            attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                          ].join(" ")}
                          style={inputStyle}
                          aria-label="月"
                        />
                      </div>

                      <div className="col-span-4">
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
                          }}
                          placeholder="10"
                          className={[
                            "meishiki-input",
                            attempted && !birthOk ? "border-[color:var(--mist-500)]" : "",
                          ].join(" ")}
                          style={inputStyle}
                          aria-label="日"
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-[10px] leading-[1.9] tracking-[0.10em] text-[color:var(--text-faint)]">
                      例：1990 / 10 / 10（数字でOK）
                    </p>

                    {attempted && !birthOk ? (
                      <p className="mt-3 text-[10px] leading-[1.9] tracking-[0.08em] text-white/70">
                        年 / 月 / 日を正しく入力してください。
                      </p>
                    ) : null}
                  </div>

                  {/* Detail */}
                  <div className="mt-9 border-t border-white/10 pt-7">
                    <div className="flex items-center justify-between gap-5">
                      <SmallBtn onClick={() => setOpenDetail((v) => !v)}>
                        <span>詳細（任意）</span>
                        <Chevron open={openDetail} />
                      </SmallBtn>

                      <p className="text-[10px] tracking-[0.12em] text-[color:var(--text-faint)]">
                        出生地・出生時間・名前
                      </p>
                    </div>

                    <div
                      ref={detailRef}
                      className={[
                        "overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-ink)]",
                        openDetail ? "max-h-[560px] opacity-100 pt-7" : "max-h-0 opacity-0",
                      ].join(" ")}
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-[10px] tracking-[0.24em] text-[color:var(--text-secondary)]">
                            出生地（任意）
                          </p>
                          <input
                            type="text"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                            placeholder="例：沖縄 / 不明でも可"
                            className="meishiki-input"
                            style={inputStyle}
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] tracking-[0.24em] text-[color:var(--text-secondary)]">
                            出生時間（任意）
                          </p>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="meishiki-input"
                            style={inputStyle}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <p className="mb-2 text-[10px] tracking-[0.24em] text-[color:var(--text-secondary)]">
                            名前（任意）
                          </p>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例：田中 太郎"
                            className="meishiki-input"
                            style={inputStyle}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                    <PrimaryBtn disabled={!birthOk}>命式を起こす</PrimaryBtn>

                    <p className="text-[10px] leading-[1.9] tracking-[0.10em] text-[color:var(--text-muted)]">
                      入力は保存されません。<br />
                      結果はこの下に表示されます。
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}