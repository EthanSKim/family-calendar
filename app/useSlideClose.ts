import { useCallback, useEffect, useRef, useState } from "react";

// Lets a popup play its slide-down animation before it is removed.
export function useSlideClose(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timer.current) return; // already closing
    setClosing(true);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timer.current = setTimeout(() => onCloseRef.current(), reduce ? 0 : 240);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { closing, close };
}
