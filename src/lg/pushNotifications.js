import { useEffect, useState } from "react";
import { supabase } from "@/lg/supabase";

const PUSH_FUNCTION = "web-push";

function supported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext;
}

function base64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function getPublicKey() {
  const { data, error } = await supabase.functions.invoke(PUSH_FUNCTION, { body: { action: "public-key" } });
  if (error) throw error;
  if (!data?.publicKey) throw new Error("Push service is not configured yet.");
  return data.publicKey;
}

export async function enablePushNotifications() {
  if (!supported()) throw new Error("Push notifications are not supported by this browser/device.");
  if (Notification.permission === "denied") throw new Error("Notifications are blocked for this site. Enable them in your browser/device settings.");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const publicKey = await getPublicKey();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToUint8Array(publicKey) });

  const { data, error } = await supabase.functions.invoke(PUSH_FUNCTION, {
    body: { action: "subscribe", subscription: subscription.toJSON() },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Could not enable push notifications.");
  return subscription;
}

export async function disablePushNotifications() {
  if (!supported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await supabase.functions.invoke(PUSH_FUNCTION, { body: { action: "unsubscribe", endpoint: subscription.endpoint } });
  await subscription.unsubscribe();
}

export function PushNotificationPrompt({ user }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || !supported() || Notification.permission === "denied" || Notification.permission === "granted") return;
    setVisible(true);
  }, [user]);

  if (!visible) return null;

  const enable = async () => {
    setBusy(true);
    setMessage("");
    try {
      await enablePushNotifications();
      setVisible(false);
    } catch (error) {
      setMessage(String(error?.message || error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", left: 14, right: 14, bottom: 18, zIndex: 1000, maxWidth: 430, margin: "0 auto", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 14, boxShadow: "0 12px 40px rgba(27,16,96,.22)", fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🔔</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1060" }}>Enable Learner's Guide notifications</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Get important updates even when the app is closed.</div>
        </div>
        <button disabled={busy} onClick={enable} style={{ border: 0, borderRadius: 11, padding: "9px 12px", background: "linear-gradient(135deg,#5B4FE8,#7B6FF5)", color: "#fff", fontWeight: 800, fontSize: 11, cursor: busy ? "wait" : "pointer", whiteSpace: "nowrap" }}>{busy ? "…" : "Enable"}</button>
      </div>
      {message && <div style={{ marginTop: 8, fontSize: 11, color: "#EF4444", lineHeight: 1.4 }}>{message}</div>}
      <button onClick={() => setVisible(false)} style={{ marginTop: 8, background: "transparent", border: 0, color: "#64748B", fontSize: 10, cursor: "pointer" }}>Not now</button>
    </div>
  );
}
