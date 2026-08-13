import { useEffect, useState } from "react";

type Activity = { count: number; label: string; kind: "load" | "save" | "sync" | "upload" };

const EVENT = "lg:db-activity";

export function emitDatabaseActivity(start: boolean, label: string, kind: Activity["kind"] = "load") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { start, label, kind } }));
}

export default function DatabaseActivityOverlay() {
  const [activity, setActivity] = useState<Activity>({ count: 0, label: "", kind: "load" });

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ start: boolean; label: string; kind: Activity["kind"] }>).detail;
      setActivity((current) => ({
        count: Math.max(0, current.count + (detail.start ? 1 : -1)),
        label: detail.start ? detail.label : current.label,
        kind: detail.start ? detail.kind : current.kind,
      }));
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  if (activity.count === 0) return null;

  return (
    <div className="lg-db-activity" role="status" aria-live="polite">
      <div className={`lg-db-activity__icon lg-db-activity__icon--${activity.kind}`}>
        <span>{activity.kind === "save" ? "✓" : activity.kind === "upload" ? "↑" : "↻"}</span>
      </div>
      <div className="lg-db-activity__text">
        <strong>{activity.label}</strong>
        <small>Syncing securely</small>
      </div>
      <div className="lg-db-activity__dots"><i /><i /><i /></div>
      <style>{`
        .lg-db-activity{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483646;display:flex;align-items:center;gap:10px;padding:10px 13px 10px 10px;min-width:210px;border:1px solid rgba(255,255,255,.9);border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 14px 40px rgba(35,29,86,.16);backdrop-filter:blur(16px);transform:translateX(-50%);animation:lg-db-in .2s ease-out both;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
        .lg-db-activity__icon{width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(145deg,#6e64d8,#4c439f);color:#fff;font-size:17px;font-weight:800;box-shadow:0 7px 18px rgba(76,67,159,.25)}
        .lg-db-activity__icon span{display:block;animation:lg-db-spin 1s linear infinite}.lg-db-activity__icon--save span{animation:lg-db-pulse .8s ease-in-out infinite}.lg-db-activity__icon--upload span{animation:lg-db-up .8s ease-in-out infinite}
        .lg-db-activity__text{display:flex;flex-direction:column;gap:2px}.lg-db-activity__text strong{color:#28234d;font-size:12px;line-height:1.2}.lg-db-activity__text small{color:#85809e;font-size:9px;line-height:1.2}
        .lg-db-activity__dots{display:flex;gap:3px;margin-left:auto}.lg-db-activity__dots i{width:4px;height:4px;border-radius:50%;background:#766bd4;animation:lg-db-dot .9s ease-in-out infinite}.lg-db-activity__dots i:nth-child(2){animation-delay:.14s}.lg-db-activity__dots i:nth-child(3){animation-delay:.28s}
        @keyframes lg-db-in{from{opacity:0;transform:translate(-50%,8px) scale(.97)}to{opacity:1;transform:translate(-50%,0) scale(1)}}@keyframes lg-db-spin{to{transform:rotate(360deg)}}@keyframes lg-db-pulse{0%,100%{transform:scale(.8);opacity:.65}50%{transform:scale(1.08);opacity:1}}@keyframes lg-db-up{0%,100%{transform:translateY(3px)}50%{transform:translateY(-3px)}}@keyframes lg-db-dot{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(-3px);opacity:1}}
        @media(prefers-reduced-motion:reduce){.lg-db-activity,.lg-db-activity__icon span,.lg-db-activity__dots i{animation:none}}
      `}</style>
    </div>
  );
}
