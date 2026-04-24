// src/hooks/useCanvasActive.js
import { useEffect, useRef, useState } from "react";

/**
 * Canvas / heavy effects を「表示中だけ」動かすためのフック
 *
 * - IntersectionObserver で viewport 近辺のみ active
 * - visibilitychange / pagehide / pageshow で停止・復帰
 * - prefers-reduced-motion を尊重
 * - rAF で setState を合流して無駄更新を抑制
 * - targetRef 優先、targetId 互換
 */
export default function useCanvasActive({
  targetId,
  targetRef,
  rootMargin = "240px",
  threshold = 0,
  root = null,

  disabled = false,
  respectReducedMotion = true,
  freezeOnceVisible = false,
} = {}) {
  const [active, setActive] = useState(false);

  const inViewRef = useRef(false);
  const visibleRef = useRef(true);
  const reduceRef = useRef(false);
  const frozenRef = useRef(false);
  const mountedRef = useRef(false);

  const rafRef = useRef(0);
  const observerRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      setActive(false);
      return undefined;
    }

    mountedRef.current = true;
    visibleRef.current = document.visibilityState === "visible";
    inViewRef.current = false;
    frozenRef.current = false;

    const computeActive = () => {
      if (disabled) return false;
      if (respectReducedMotion && reduceRef.current) return false;

      return Boolean(inViewRef.current && visibleRef.current);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!mountedRef.current) return;

        const next = computeActive();

        setActive((prev) => {
          if (prev === next) return prev;
          return next;
        });
      });
    };

    const stop = () => {
      cancelAnimationFrame(rafRef.current);

      if (!mountedRef.current) return;

      setActive((prev) => {
        if (prev === false) return prev;
        return false;
      });
    };

    const disconnectObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
      scheduleUpdate();
    };

    const onPageHide = () => {
      visibleRef.current = false;
      scheduleUpdate();
    };

    const onPageShow = () => {
      visibleRef.current = document.visibilityState === "visible";
      scheduleUpdate();
    };

    const syncReducedMotion = () => {
      const media = mediaRef.current;
      reduceRef.current = Boolean(media?.matches);
      scheduleUpdate();
    };

    const addMediaListener = (media) => {
      if (!media) return;

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", syncReducedMotion);
        return;
      }

      // 古いSafari対策
      media.addListener?.(syncReducedMotion);
    };

    const removeMediaListener = (media) => {
      if (!media) return;

      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", syncReducedMotion);
        return;
      }

      // 古いSafari対策
      media.removeListener?.(syncReducedMotion);
    };

    const cleanup = () => {
      mountedRef.current = false;

      cancelAnimationFrame(rafRef.current);
      disconnectObserver();

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);

      if (mediaRef.current && respectReducedMotion) {
        removeMediaListener(mediaRef.current);
      }

      mediaRef.current = null;
    };

    // prefers-reduced-motion
    const media =
      window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;

    mediaRef.current = media;

    if (media && respectReducedMotion) {
      reduceRef.current = Boolean(media.matches);
      addMediaListener(media);
    } else {
      reduceRef.current = false;
    }

    // target 解決：ref優先
    const target =
      targetRef?.current ??
      (targetId ? document.getElementById(targetId) : null);

    if (!target || disabled) {
      inViewRef.current = false;
      stop();

      // targetが無い場合でも、media listenerなどは貼った可能性があるのでcleanup
      cleanup();
      return undefined;
    }

    document.addEventListener("visibilitychange", onVisibilityChange, {
      passive: true,
    });
    window.addEventListener("pagehide", onPageHide, { passive: true });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const isIntersecting = entries.some((entry) => entry.isIntersecting);

          inViewRef.current = isIntersecting;

          if (freezeOnceVisible && isIntersecting && !frozenRef.current) {
            frozenRef.current = true;
            inViewRef.current = true;

            disconnectObserver();
          }

          scheduleUpdate();
        },
        {
          root,
          rootMargin,
          threshold,
        }
      );

      observer.observe(target);
      observerRef.current = observer;
    } else {
      // IntersectionObserver 非対応環境では、表示タブ中だけ動かす
      inViewRef.current = true;
      scheduleUpdate();
    }

    scheduleUpdate();

    return cleanup;
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