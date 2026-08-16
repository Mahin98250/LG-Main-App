import { useEffect, useState } from "react";

/** Quiet, logo-free launch transition. It never blocks the application workflow. */
export default function StartupMinimal() {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setExiting(true), 220);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`lg-minimal-launch${exiting ? " lg-minimal-launch--exit" : ""}`} aria-hidden="true">
      <div className="lg-minimal-launch__light" />
      <style>{`
        .lg-minimal-launch{position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:#fff;opacity:1;overflow:hidden;transition:opacity 420ms cubic-bezier(.22,1,.36,1)}
        .lg-minimal-launch--exit{opacity:0}
        .lg-minimal-launch__light{position:absolute;width:52vmin;height:52vmin;left:50%;top:46%;border-radius:50%;transform:translate(-50%,-50%) scale(.72);background:radial-gradient(circle,rgba(255,255,255,.98) 0%,rgba(247,249,255,.72) 34%,rgba(255,255,255,0) 72%);filter:blur(18px);animation:lg-minimal-breathe 700ms cubic-bezier(.22,1,.36,1) both}
        @keyframes lg-minimal-breathe{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}55%{opacity:1}100%{opacity:.72;transform:translate(-50%,-50%) scale(1)}}
        @media(prefers-reduced-motion:reduce){.lg-minimal-launch{transition:none}.lg-minimal-launch__light{animation:none}}
      `}</style>
    </div>
  );
}
