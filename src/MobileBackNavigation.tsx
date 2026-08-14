import { useEffect, useRef, useState } from "react";

const KEY = "lg-back-navigation-mode";
type Mode = "arrow" | "swipe";

function canGoBack() {
  return window.history.length > 1;
}

export default function MobileBackNavigation() {
  const [mode, setMode] = useState<Mode>(() => {
    try { return localStorage.getItem(KEY) === "swipe" ? "swipe" : "arrow"; } catch { return "arrow"; }
  });
  const [open, setOpen] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, mode); } catch {}
  }, [mode]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (mode !== "swipe" || e.touches.length !== 1) return;
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (mode !== "swipe" || !start.current || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = Math.abs(t.clientY - start.current.y);
      start.current = null;
      // Deliberately use a center-screen horizontal swipe, not the iOS edge gesture.
      if (start.current === null && dx > 80 && dy < 70 && t.clientX > 90 && canGoBack()) {
        window.history.back();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [mode]);

  const goBack = () => { if (canGoBack()) window.history.back(); };

  return (
    <>
      {mode === "arrow" && canGoBack() && (
        <button
          aria-label="Go back"
          onClick={goBack}
          style={{
            position: "fixed", left: 14, bottom: "calc(18px + env(safe-area-inset-bottom))", zIndex: 900,
            width: 48, height: 48, borderRadius: 24, border: "1px solid rgba(15,27,61,.08)",
            background: "rgba(255,255,255,.94)", color: "#0F1B3D", fontSize: 25, lineHeight: 1,
            boxShadow: "0 8px 28px rgba(15,27,61,.16)", backdropFilter: "blur(12px)", cursor: "pointer",
          }}
        >‹</button>
      )}
      <button
        aria-label="Back navigation options"
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed", right: 14, bottom: "calc(18px + env(safe-area-inset-bottom))", zIndex: 901,
          width: 38, height: 38, borderRadius: 19, border: "1px solid rgba(15,27,61,.08)",
          background: "rgba(255,255,255,.92)", color: "#64748B", fontSize: 15,
          boxShadow: "0 6px 20px rgba(15,27,61,.12)", cursor: "pointer",
        }}
      >↶</button>
      {open && (
        <div style={{ position: "fixed", right: 14, bottom: "calc(64px + env(safe-area-inset-bottom))", zIndex: 902, background: "#fff", borderRadius: 16, padding: 10, boxShadow: "0 14px 40px rgba(15,27,61,.18)", border: "1px solid #E2E8F0", minWidth: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 7 }}>BACK NAVIGATION</div>
          {(["arrow", "swipe"] as Mode[]).map(value => (
            <button key={value} onClick={() => { setMode(value); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderRadius: 10, padding: "9px 10px", background: mode === value ? "#EEF2FF" : "transparent", color: "#0F1B3D", cursor: "pointer", fontWeight: mode === value ? 800 : 600 }}>
              {value === "arrow" ? "← Arrow button" : "↔ Swipe back"}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
