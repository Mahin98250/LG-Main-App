import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lg/auth";
import { clearCache, hydrateAll } from "@/lg/data";
import { GLOBAL_CSS, LGLogo } from "@/lg/ui";
import { TeacherApp } from "@/lg/teacher";
import { StudentApp } from "@/lg/student";
import { ParentApp } from "@/lg/parent";

const title = "My Dashboard — Learner's Guide";
const description = "Your Learner's Guide dashboard: classes, attendance, homework, marks and fees.";

export const Route = createFileRoute("/app")({
  ssr: false,
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

type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  ref: string | null;
};

function Splash({ label }: { label: string }) {
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(160deg,#1a1060 0%,#2d1b8e 45%,#0e0a3a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Poppins',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <div className="logo-float"><LGLogo size={72} showText={false} light /></div>
      <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = (await getCurrentUser()) as SessionUser | null;
      if (cancelled) return;
      if (!current) {
        clearCache();
        navigate({ to: "/", replace: true });
        return;
      }

      // Never render a previous user's cached records. Rebuild the mirror from Supabase.
      clearCache();
      try {
        await hydrateAll();
      } catch (error) {
        console.error("Unable to load portal data:", error);
        if (!cancelled) {
          clearCache();
          setReady(false);
        }
        return;
      }
      if (cancelled) return;
      setUser(current);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = async () => {
    clearCache();
    await signOut();
    navigate({ to: "/", replace: true });
  };

  if (!ready || !user) return <Splash label="Loading your classroom…" />;
  if (user.role === "teacher") return <TeacherApp user={user} onLogout={handleLogout} />;
  if (user.role === "student") return <StudentApp user={user} onLogout={handleLogout} />;
  if (user.role === "parent") return <ParentApp user={user} onLogout={handleLogout} />;
  return <Splash label="Unknown role. Please sign in again." />;
}