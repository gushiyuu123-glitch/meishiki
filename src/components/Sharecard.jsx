// src/components/ShareCard.jsx
// ─────────────────────────────────────────────────────────
//  スクショ共有カード（個人情報ゼロ）
//  ・生年月日/名前/出生地/出生時間は一切含めない
//  ・html2canvas で画像化するため、完全インライン CSS のみ
//  ・display:none は描けないので「画面外に配置」推奨
// ─────────────────────────────────────────────────────────

export default function ShareCard({
  memo,
  cardRef,
  variant = "square",        // "square" | "og"
  showFriction = false,      // true で「地雷」も載せる
  footerUrl = "meishiki-rose.vercel.app",
}) {
  if (!memo) return null;

  // ── safe getters ───────────────────────────────
  const nenchuKanji = memo?.nenchu?.kanji ?? "";
  const yinYang = memo?.yinYang ?? "";
  const element = memo?.element ?? "";
  const elementDesc = memo?.elementDesc ?? "";
  const pillarNote = memo?.pillarNote ?? "";
  const values = memo?.values ?? {};

  const core = safeTrim(values.core, 210);
  const friction = safeTrim(values.friction, 190);
  const seal = safeTrim(values.seal, 78);

  // ── size presets (base size, capture with scale=2 → retina) ──
  // square: 600×600 (→ 1200×1200)
  // og:     600×315 (→ 1200×630)
  const size =
    variant === "og"
      ? { w: 600, h: 315, padX: 44, padT: 40, padB: 30 }
      : { w: 600, h: 600, padX: 44, padT: 48, padB: 40 };

  // ── element accent ─────────────────────────────
  const elementColor =
    ({
      木: "#7ec88a",
      火: "#e07a5f",
      土: "#c4a265",
      金: "#b8c4d4",
      水: "#7aa8d4",
    }[element] ?? "#b08aff");

  // ── styles (inline only) ───────────────────────
  const s = {
    wrap: {
      width: size.w,
      height: size.h,
      boxSizing: "border-box",
      padding: `${size.padT}px ${size.padX}px ${size.padB}px`,
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      background:
        "linear-gradient(160deg, #0d0818 0%, #0a0614 52%, #0f0a1e 100%)",
      fontFamily:
        "'Noto Serif JP','Hiragino Mincho ProN','Yu Mincho',serif",
      fontFeatureSettings: "'palt' 1",
      color: "rgba(235,220,255,0.92)",
    },

    // soft grain (very subtle)
    grain: {
      position: "absolute",
      inset: 0,
      opacity: 0.10,
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
      pointerEvents: "none",
      mixBlendMode: "overlay",
    },

    // background orbs
    orb1: {
      position: "absolute",
      top: -70,
      left: -70,
      width: 300,
      height: 300,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(110,50,200,0.24) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    orb2: {
      position: "absolute",
      bottom: -50,
      right: -50,
      width: 240,
      height: 240,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(80,30,160,0.18) 0%, transparent 70%)",
      pointerEvents: "none",
    },

    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: variant === "og" ? 18 : 26,
    },
    brand: {
      fontSize: 11,
      letterSpacing: "0.38em",
      color: "rgba(180,140,255,0.68)",
      whiteSpace: "nowrap",
    },
    headRight: {
      fontSize: 11,
      letterSpacing: "0.28em",
      color: "rgba(180,140,255,0.48)",
      whiteSpace: "nowrap",
    },

    pillarRow: {
      display: "flex",
      alignItems: "baseline",
      gap: 14,
      marginBottom: 8,
    },
    pillarKanji: {
      fontSize: variant === "og" ? 46 : 52,
      letterSpacing: "0.12em",
      color: "rgba(240,225,255,0.97)",
      lineHeight: 1,
      fontWeight: 400,
    },
    elementBadge: {
      fontSize: 11,
      letterSpacing: "0.20em",
      color: elementColor,
      border: `1px solid ${elementColor}55`,
      borderRadius: 999,
      padding: "3px 10px",
      whiteSpace: "nowrap",
    },

    pillarNote: {
      fontSize: 12,
      letterSpacing: "0.06em",
      color: "rgba(190,165,230,0.68)",
      lineHeight: 1.85,
      marginBottom: variant === "og" ? 16 : 22,
      minHeight: variant === "og" ? 0 : 0,
    },

    divider: {
      height: 1,
      background:
        "linear-gradient(to right, rgba(160,110,255,0.30), rgba(160,110,255,0.06))",
      marginBottom: variant === "og" ? 14 : 18,
    },

    blockWrap: {
      marginBottom: variant === "og" ? 12 : 16,
    },
    blockLabel: {
      fontSize: 9,
      letterSpacing: "0.32em",
      color: "rgba(160,130,210,0.65)",
      marginBottom: 6,
    },
    blockText: {
      fontSize: 13,
      lineHeight: 2.0,
      letterSpacing: "0.03em",
      color: "rgba(225,210,250,0.88)",
    },

    sealWrap: {
      marginTop: variant === "og" ? 12 : 18,
      paddingTop: variant === "og" ? 12 : 16,
      borderTop: "1px solid rgba(160,110,255,0.15)",
    },
    sealLabel: {
      fontSize: 9,
      letterSpacing: "0.32em",
      color: "rgba(160,130,210,0.55)",
      marginBottom: 8,
    },
    sealText: {
      fontSize: 14,
      letterSpacing: "0.12em",
      color: "rgba(230,215,255,0.90)",
      lineHeight: 1.75,
    },

    footer: {
      position: "absolute",
      left: size.padX,
      right: size.padX,
      bottom: variant === "og" ? 18 : 22,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 18,
    },
    footerNote: {
      fontSize: 9,
      letterSpacing: "0.16em",
      color: "rgba(140,110,190,0.48)",
      lineHeight: 1.7,
      maxWidth: "76%",
    },
    footerUrl: {
      fontSize: 9,
      letterSpacing: "0.16em",
      color: "rgba(140,110,190,0.48)",
      whiteSpace: "nowrap",
    },
  };

  // ── render ─────────────────────────────────────
  return (
    <div ref={cardRef} style={s.wrap}>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.grain} />

      {/* header */}
      <div style={s.header}>
        <span style={s.brand}>M E I S H I K I</span>
        <span style={s.headRight}>{variant === "og" ? "命式メモ（年柱）" : "命式メモ"}</span>
      </div>

      {/* year pillar */}
      <div style={s.pillarRow}>
        <span style={s.pillarKanji}>{nenchuKanji || "—"}</span>
        <span style={s.elementBadge}>
          {yinYang || ""}{element || "　"}　{elementDesc || ""}
        </span>
      </div>

      {pillarNote ? <p style={s.pillarNote}>{safeTrim(pillarNote, variant === "og" ? 120 : 180)}</p> : null}

      <div style={s.divider} />

      {/* core */}
      {core ? (
        <div style={s.blockWrap}>
          <p style={s.blockLabel}>【核】あなたの基本の質感</p>
          <p style={s.blockText}>{core}</p>
        </div>
      ) : null}

      {/* optional friction */}
      {showFriction && friction ? (
        <div style={s.blockWrap}>
          <p style={s.blockLabel}>【地雷】性能が落ちる条件</p>
          <p style={s.blockText}>{friction}</p>
        </div>
      ) : null}

      {/* seal */}
      {seal ? (
        <div style={s.sealWrap}>
          <p style={s.sealLabel}>【今日の印】</p>
          <p style={s.sealText}>{seal}</p>
        </div>
      ) : null}

      {/* footer */}
      <div style={s.footer}>
        <p style={s.footerNote}>これは予言ではなく、自己理解のための記録です。</p>
        <span style={s.footerUrl}>{footerUrl}</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   helpers
─────────────────────────────────────────────── */
function safeTrim(str, max = 160) {
  if (!str) return "";
  const s = String(str).replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}