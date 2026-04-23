// src/hooks/useCanvasActive.js
import { useEffect, useRef, useState } from "react";

/**
 * Canvas / heavy effects を「表示中だけ」動かすためのフック
 *
 * - IntersectionObserver で viewport 近辺のみ active
 * - visibilitychange / pagehide で確実に停止
 * - prefers-reduced-motion を尊重（オプションで無効化可）
 * - requestAnimationFrame で更新を合流（無駄な setState を抑制）
 *
 * 互換: 既存の { targetId, rootMargin, threshold } のまま使える
 */
export default function useCanvasActive({
  targetId,
  targetRef, // optional: React ref（優先）
  rootMargin = "240px",
  threshold = 0,
  root = null,

  // options
  disabled = false,
  respectReducedMotion = true,
  freezeOnceVisible = false, // 一度inViewになったらIOを外して軽量化
} = {}) {
  const [active, setActive] = useState(false);

  const inViewRef = useRef(false);
  const visibleRef = useRef(true);
  const reduceRef = useRef(false);
  const frozenRef = useRef(false);

  const rafRef = useRef(0);
  const obsRef = useRef(null);
  const mmRef = useRef(null);

  useEffect(() => {
    // SSRガード
    if (typeof window === "undefined" || typeof document === "undefined") {
      setActive(false);
      return;
    }

    // 初期状態
    visibleRef.current = document.visibilityState === "visible";
    frozenRef.current = false;

    // prefers-reduced-motion（変更追従）
    const mm =
      window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    mmRef.current = mm;

    const syncReduced = () => {
      reduceRef.current = !!mm?.matches;
      scheduleUpdate();
    };
    if (mm && respectReducedMotion) {
      syncReduced();
      mm.addEventListener?.("change", syncReduced);
    } else {
      reduceRef.current = false;
    }

    // target解決（ref優先）
    const target =
      targetRef?.current ??
      (targetId ? document.getElementById(targetId) : null);

    // ターゲット無ければ停止
    if (!target) {
      inViewRef.current = false;
      setActive(false);
      cleanup();
      return;
    }

    // 更新（rAFで合流）
    function computeActive() {
      if (disabled) return false;
      if (respectReducedMotion && reduceRef.current) return false;
      return Boolean(inViewRef.current && visibleRef.current);
    }

    function scheduleUpdate() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setActive(computeActive());
      });
    }

    // visibility（タブ非表示で停止）
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
      scheduleUpdate();
    };

    // pagehide/pageshow（bfcache・iOS対策）
    const onPageHide = () => {
      visibleRef.current = false;
      scheduleUpdate();
    };
    const onPageShow = () => {
      visibleRef.current = document.visibilityState === "visible";
      scheduleUpdate();
    };

    document.addEventListener("visibilitychange", onVis, { passive: true });
    window.addEventListener("pagehide", onPageHide, { passive: true });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    // IntersectionObserver
    const supportsIO = "IntersectionObserver" in window;

    if (supportsIO) {
      const obs = new IntersectionObserver(
        (entries) => {
          const any = entries.some((e) => e.isIntersecting);
          inViewRef.current = any;

          // freezeOnceVisible: 一度見えたら監視を外す（以降は visible だけで制御）
          if (freezeOnceVisible && any && !frozenRef.current) {
            frozenRef.current = true;
            obs.disconnect();
            obsRef.current = null;
            // inViewを固定（trueのまま）
            inViewRef.current = true;
          }

          scheduleUpdate();
        },
        { root, rootMargin, threshold }
      );

      obs.observe(target);
      obsRef.current = obs;
    } else {
      // IO非対応環境：最低限「表示中なら動く」に落とす
      inViewRef.current = true;
      scheduleUpdate();
    }

    // 初回
    scheduleUpdate();

    function cleanup() {
      cancelAnimationFrame(rafRef.current);

      if (obsRef.current) {
        obsRef.current.disconnect();
        obsRef.current = null;
      }

      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);

      if (mmRef.current && respectReducedMotion) {
        mmRef.current.removeEventListener?.("change", syncReduced);
      }
      mmRef.current = null;
    }

    return cleanup;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    targetId,
    targetRef,
    root,
    rootMargin,
    threshold,
    disabled,
    respectReducedMotion,
    freezeOnceVisible,
  ]);

  return active;
}