import { useEffect, useState } from "react";

/** Fast, non-blocking launch animation for installed/mobile launches. */
export default function StartupSplashFast() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), 360);
    const hideTimer = window.setTimeout(() => setVisible(false), 560);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`lg-splash${exiting ? " lg-splash-exit" : ""}`} aria-hidden="true">
      <div className="lg-splash-orb lg-splash-orb-a" />
      <div className="lg-splash-orb lg-splash-orb-b" />
      <div className="lg-splash-logo">
        <span className="lg-splash-book lg-splash-book-a" />
        <span className="lg-splash-book lg-splash-book-b" />
        <span className="lg-splash-person" />
        <span className="lg-splash-head" />
      </div>
      <div className="lg-splash-title">Learner&apos;s Guide</div>
      <div className="lg-splash-dots"><i /><i /><i /></div>
      <style>{`
        .lg-splash{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;align-content:center;gap:10px;overflow:hidden;background:linear-gradient(145deg,#fbfcff,#eef1ff);opacity:1;transition:opacity 180ms ease,transform 180ms ease}
        .lg-splash-exit{opacity:0;transform:scale(1.025);pointer-events:none}
        .lg-splash-logo{position:relative;width:94px;height:94px;border-radius:28px;background:linear-gradient(145deg,#fff,#eef0ff);box-shadow:0 18px 45px rgba(54,42,128,.16);animation:lg-pop 460ms cubic-bezier(.2,.8,.2,1) both}
        .lg-splash-book{position:absolute;top:22px;width:37px;height:47px;background:linear-gradient(155deg,#7167d8,#5047a8);border-radius:6px 10px 6px 7px}
        .lg-splash-book-a{left:20px;transform:skewY(8deg) rotate(-2deg)}.lg-splash-book-b{right:20px;transform:skewY(-8deg) rotate(2deg);filter:brightness(.92)}
        .lg-splash-person{position:absolute;z-index:2;bottom:14px;left:33px;width:27px;height:44px;border-radius:20px 20px 9px 9px;background:linear-gradient(#27224e 0 34%,#5d55b8 35%)}
        .lg-splash-head{position:absolute;z-index:3;top:32px;left:37px;width:20px;height:20px;border-radius:50%;background:#27224e;animation:lg-bob 520ms ease-in-out infinite alternate}
        .lg-splash-title{color:#27224e;font:700 20px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.25px;animation:lg-rise 460ms 60ms cubic-bezier(.2,.8,.2,1) both}
        .lg-splash-dots{display:flex;gap:5px}.lg-splash-dots i{width:5px;height:5px;border-radius:50%;background:#8d83f2;animation:lg-dot 480ms ease-in-out infinite alternate}.lg-splash-dots i:nth-child(2){animation-delay:90ms}.lg-splash-dots i:nth-child(3){animation-delay:180ms}
        .lg-splash-orb{position:absolute;width:180px;height:180px;border-radius:50%;filter:blur(45px);opacity:.25}.lg-splash-orb-a{top:12%;left:5%;background:#7767d8}.lg-splash-orb-b{right:2%;bottom:8%;background:#5cadde}
        @keyframes lg-pop{from{opacity:0;transform:translateY(8px) scale(.82)}to{opacity:1;transform:none}}@keyframes lg-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes lg-bob{to{transform:translateY(-2px)}}@keyframes lg-dot{to{opacity:.35;transform:translateY(-2px) scale(1.15)}}
        @media(prefers-reduced-motion:reduce){.lg-splash-logo,.lg-splash-title,.lg-splash-head,.lg-splash-dots i{animation:none}}
      `}</style>
    </div>
  );
}
