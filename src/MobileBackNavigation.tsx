import { useEffect, useState } from "react";

export function MobileBackNavigation() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [mode] = useState<"swipe">("swipe");

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  }, []);

  useEffect(() => {
    if (mode !== "swipe" || !isTouchDevice) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const canGoBack = () => window.history.length > 1;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking || event.changedTouches.length !== 1) return;
      tracking = false;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (startX < window.innerWidth * 0.85 && dx > 90 && dy < 70 && canGoBack()) {
        window.history.back();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isTouchDevice, mode]);

  return null;
}
