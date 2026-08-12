import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, signOut } from "@/lg/auth";
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

  const load = useCallback(async () => {
    setReady(false);
    setLoadError(null);
    const current = (await getCurrentUser()) as SessionUser | null;
    if (!current) {
      clearCache();
      navigate({ to: "/", replace: true });
      return;
    }
    clearCache();
    try {
      // Hydrate only the signed-in role's datasets. Optional RLS denials are
      // isolated inside hydrateForRole so one table cannot block the portal.
      await hydrateForRole(current.role);
      setUser(current);
      setReady(true);
    } catch (error) {
      console.error("Unable to load portal data:", error);
      clearCache();
      setLoadError("We could not load your institute data. Please check your connection or contact the administrator.");
    }
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

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

  const handleLogout = async () => {
    clearCache();
    await signOut();
    navigate({ to: "/", replace: true });
  };

  if (loadError) return <Splash label={loadError} action={<button onClick={() => void load()} style={{ border: 0, borderRadius: 12, padding: "11px 18px", background: "#fff", color: "#1a1060", fontWeight: 800, cursor: "pointer" }}>Try again</button>} />;
  if (!ready || !user) return <Splash label="Loading your classroom…" />;
  if (user.role === "teacher") return <><TeacherApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  if (user.role === "student") return <><StudentApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  if (user.role === "parent") return <><ParentApp user={user} onLogout={handleLogout} /><PushNotificationPrompt user={user} /></>;
  return <Splash label="Unknown role. Please sign in again." />;
}
