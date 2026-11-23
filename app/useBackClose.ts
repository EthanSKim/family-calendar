import { useEffect, useRef } from "react";

// Makes the phone's Back gesture/button close a popup instead of leaving the app.
// While the popup is open we add one history entry; Back removes it (and closes the popup).
export function useBackClose(onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const marker = useRef(`popup-${Math.random().toString(36).slice(2)}`);
  const alive = useRef(false);

  useEffect(() => {
    const id = marker.current;
    alive.current = true;
    if (window.history.state?.popup !== id) {
      // keep Next.js's own history data and just add our marker
      window.history.pushState({ ...window.history.state, popup: id }, "");
    }
    let byBack = false;
    const onPop = () => {
      byBack = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      alive.current = false;
      if (byBack) return; // Back already removed our history entry
      // Closed with ✕ / tapping outside / Esc: remove the extra entry. Waiting a tick keeps
      // React's dev-mode double mount from undoing it.
      setTimeout(() => {
        if (!alive.current && window.history.state?.popup === id)
          window.history.back();
      }, 0);
    };
  }, []);
}
