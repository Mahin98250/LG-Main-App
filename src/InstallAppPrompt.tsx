import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallEvent);
      if (!localStorage.getItem("lg_install_dismissed")) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !event) return null;

  const install = async () => {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem("lg_install_dismissed", "1");
    setVisible(false);
  };

  return (
    <div style={{ position: "fixed", left: 14, right: 14, bottom: "calc(14px + env(safe-area-inset-bottom))", zIndex: 9999, maxWidth: 480, margin: "0 auto", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, boxShadow: "0 16px 45px rgba(15,27,61,.18)", padding: 14, fontFamily: "Poppins,system-ui,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#5B4FE8,#1A1060)", color: "#fff", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0 }}>📚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: "#0F1B3D", fontSize: 14 }}>Install Learner&apos;s Guide</div>
          <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Add it to your home screen like an app.</div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" style={{ border: 0, background: "transparent", color: "#94A3B8", fontSize: 18, cursor: "pointer" }}>×</button>
      </div>
      <button type="button" onClick={() => void install()} style={{ width: "100%", marginTop: 11, border: 0, borderRadius: 11, padding: "10px 14px", background: "linear-gradient(135deg,#5B4FE8,#4361EE)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Install App</button>
    </div>
  );
}
