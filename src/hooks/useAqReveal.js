// src/hooks/useAqReveal.js
import { useEffect, useRef, useState } from "react";

/**
 * useAqReveal
 *
 * MEISHIKI / aq-fade 用の安定版Revealフック。
 *
 * - IntersectionObserverで表示判定
 * - すでに画面付近にある場合は即表示
 * - prefers-reduced-motion時は即表示
 * - IO非対応でも即表示
 * - 事故防止のfallback付き
 */
export default function useAqReveal(options = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    const {
      threshold = 0.12,
      rootMargin = "0px 0px -8% 0px",
      once = true,
      disabled = false,
      respectReducedMotion = true,
    } = options;

    if (typeof window === "undefined" || typeof document === "undefined") {
      setShown(true);
      return undefined;
    }

    const reduce = Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    );

    if (disabled || (respectReducedMotion && reduce)) {
      setShown(true);
      return undefined;
    }

    // IntersectionObserver非対応なら即表示
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return undefined;
    }

    let raf = 0;
    let fallbackTimer = 0;
    let observer = null;

    const show = () => {
      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        setShown(true);

        if (once && observer) {
          observer.disconnect();
          observer = null;
        }
      });
    };

    // 初回安全判定：
    // すでに画面付近にいる場合、IO待ちせず出す
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const alreadyNear =
      rect.top < vh * 0.96 &&
      rect.bottom > vh * -0.12;

    if (alreadyNear) {
      show();
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show();
          return;
        }

        if (!once) {
          setShown(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);

    // 最終保険：
    // IOが何らかの理由で発火しない場合でも、完全消失を防ぐ
    fallbackTimer = window.setTimeout(() => {
      const current = ref.current;
      if (!current) return;

      const r = current.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement.clientHeight;

      if (r.top < h * 1.15 && r.bottom > h * -0.2) {
        show();
      }
    }, 180);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallbackTimer);

      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }, [options]);

  return [ref, shown];
}