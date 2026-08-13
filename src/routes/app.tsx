import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getCurrentUser, signOut, onAuthStateChange } from "@/lg/auth";
import { clearCache, gdb, hydrateForRole } from "@/lg/data";
import { GLOBAL_CSS, LGLogo } from "@/lg/ui";
import { TeacherApp } from "@/lg/teacherWorkflows";
import { StudentApp } from "@/lg/student";
import { ParentApp } from "@/lg/parentWorkflows";
import { PushNotificationPrompt } from "@/lg/pushNotifications";

const title = "My Dashboard — Learner's Guide";
const description = "Your Learner's Guide dashboard: classes, attendance, homework, marks and fees.";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});

type SessionUser = { id: string; name: string; phone: string; role: string; ref: string | null };

function Splash({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(160deg,#1a1060 0%,#2d1b8e 45%,#0e0a3a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 28 }}>
      <style>{GLOBAL_CSS}</style>
      <div className="logo-float"><LGLogo size={72} showText={false} light /></div>
      <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>{label}</div>
      {action}
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  const hydrate = useCallback(async (current: SessionUser, preserveVisibleState = false) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (!preserveVisibleState) setReady(false);
    setLoadError(null);
    try {
      await hydrateForRole(current.role);
      setUser(current);
      setReady(true);
      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error("Unable to refresh portal data:", error);
      // Never replace a working portal with empty local state because a
      // background refresh failed. Keep the existing view intact.
      if (!preserveVisibleState) {
        setLoadError("We could not load your institute data. Please check your connection or contact the administrator.");
        setReady(false);
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    const current = (await getCurrentUser()) as SessionUser | null;
    if (!current) {
      clearCache();
      setUser(null);
      setReady(false);
      navigate({ to: "/", replace: true });
      return;
    }
    await hydrate(current);
  }, [hydrate, navigate]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const { data } = onAuthStateChange((event, nextUser) => {
      if (!nextUser) {
        clearCache();
        setUser(null);
        setReady(false);
        navigate({ to: "/", replace: true });
        return;
      }
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        void hydrate(nextUser as SessionUser, event === "TOKEN_REFRESHED");
      }
    });
    return () => { data.subscription.unsubscribe(); };
  }, [hydrate, navigate]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    const syncNotifications = async () => {
      try {
        if (!cancelled) await gdb("notifications");
      } catch (error) {
        console.warn("Notification sync skipped:", error instanceof Error ? error.message : error);
      }
    };
    void syncNotifications();
    const timer = window.setInterval(() => { void syncNotifications(); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [ready, user]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!user || syncingRef.current) return;
      if (Date.now() - lastSyncRef.current < 15000) return;
      void (async () => {
        const current = (await getCurrentUser()) as SessionUser | null;
        if (!current) return;
        await hydrate(current, true);
      })();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [hydrate, user]);

  const handleLogout = async () => {
    clearCache();
    await signOut();
    setUser(null);
    setReady(false);
    navigate({ to: "/", replace: true });
  };

  if (loadError) return <Splash label={loadError} action={<button onClick={() => void load()} style={{ border: 0, borderRadius: 12, padding: "11px 18px", background: "#fff", color: "#1a1060", fontWeight: 800, cursor: "pointer" }}>Try again</button>} />;
  if (!ready || !user) return <Splash label="Loading your classroom…" />;
  if (user.role === "teacher") return <><TeacherApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  if (user.role === "student") return <><StudentApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  if (user.role === "parent") return <><ParentApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  return <Splash label="Unknown role. Please sign in again." />;
}
