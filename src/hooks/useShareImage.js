// src/hooks/useShareImage.js
// ─────────────────────────────────────────────────────────
//  html2canvas で ShareCard を画像化して
//  ダウンロード or Web Share API で共有する
//
//  npm i html2canvas
// ─────────────────────────────────────────────────────────
import { useCallback, useRef, useState } from "react";

const toBlob = (canvas, type = "image/png", quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality
    );
  });

const downloadBlob = (blob, filename = "meishiki.png") => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 少し待ってから解放（Safari対策）
  setTimeout(() => URL.revokeObjectURL(url), 1200);
};

const nextFrame = () =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

export function useShareImage() {
  const cardRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);

  const capture = useCallback(
    async ({
      scale = 2,
      backgroundColor = null,
      useCORS = true,
      waitForFonts = true,
      // ※ShareCardは display:none だと描けない（画面外配置推奨）
    } = {}) => {
      const el = cardRef.current;
      if (!el) return null;

      setStatus("loading");
      setError("");

      try {
        if (waitForFonts) {
          try {
            await document.fonts?.ready;
          } catch {
            // 古い環境は無視
          }
        }

        // レイアウト確定待ち（文字/余白ズレを減らす）
        await nextFrame();

        const html2canvas = (await import("html2canvas")).default;

        const canvas = await html2canvas(el, {
          scale,
          useCORS,
          backgroundColor,
          logging: false,
          removeContainer: true,
        });

        const blob = await toBlob(canvas, "image/png", 1);

        setStatus("done");
        return { canvas, blob };
      } catch (e) {
        console.error("ShareCard capture failed:", e);
        setStatus("error");
        setError(e?.message || "capture failed");
        return null;
      }
    },
    []
  );

  const download = useCallback(
    async (filename = "meishiki.png", options = {}) => {
      const res = await capture(options);
      if (!res) return false;
      downloadBlob(res.blob, filename);
      return true;
    },
    [capture]
  );

  const share = useCallback(
    async ({
      filename = "meishiki.png",
      title = "MEISHIKI",
      text = "命式メモ（個人情報なし）",
      captureOptions = {},
      // 共有テキストを先にコピーしたい場合は外でやる（ここでは触らない）
    } = {}) => {
      const res = await capture(captureOptions);
      if (!res) return false;

      const file = new File([res.blob], filename, { type: "image/png" });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare({ files: [file] }));

      if (canShareFiles) {
        try {
          await navigator.share({ title, text, files: [file] });
          return true;
        } catch (e) {
          // キャンセルは無視（静かに終わる）
          if (e?.name === "AbortError") return false;
          console.error("share failed:", e);
          // 共有失敗はDLにフォールバック
          downloadBlob(res.blob, filename);
          return false;
        }
      }

      // 非対応環境はDLへ
      downloadBlob(res.blob, filename);
      return false;
    },
    [capture]
  );

  return { cardRef, status, error, reset, capture, download, share };
}