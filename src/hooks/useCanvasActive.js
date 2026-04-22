// src/hooks/useCanvasActive.js
import { useEffect, useState } from "react";

export default function useCanvasActive({
  targetId,
  rootMargin = "240px",
  threshold = 0,
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      setActive(false);
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      setActive(false);
      return;
    }

    let inView = false;
    let visible = document.visibilityState === "visible";

    const update = () => setActive(Boolean(inView && visible));

    const obs = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        update();
      },
      { root: null, rootMargin, threshold }
    );

    const onVis = () => {
      visible = document.visibilityState === "visible";
      update();
    };

    obs.observe(target);
    document.addEventListener("visibilitychange", onVis, { passive: true });
    update();

    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [targetId, rootMargin, threshold]);

  return active;
}