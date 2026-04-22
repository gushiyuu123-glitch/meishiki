import { useEffect, useRef, useState } from "react";

export default function useAqReveal(options = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px", ...options }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return [ref, shown];
}