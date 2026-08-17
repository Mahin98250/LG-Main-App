import { useCallback, useEffect, useState } from "react";
import { clearCache } from "@/lg/data";
import { getCurrentUser, signOut } from "@/lg/auth";
import { supabase } from "@/lg/supabase";
import { AdminWithDrive } from "./AdminWithDrive";
import AdminLogin from "./auth/AdminLogin";

type AdminUser = { id: string; name: string; phone: string; role: string; ref: string | null };

/** Single source of truth for the admin experience. */
export default function AdminPortal() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = await getCurrentUser();
    setUser(current?.role === "admin" ? current : null);
    setChecking(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((current) => {
      if (!mounted) return;
      setUser(current?.role === "admin" ? current : null);
      setChecking(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.warn("Remote admin logout failed; clearing local session:", error);
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    } finally {
      setUser(null);
      clearCache();
      const base = import.meta.env.BASE_URL || "/";
      const homeUrl = new URL(base.endsWith("/") ? base : `${base}/`, window.location.origin).href;
      window.location.replace(homeUrl);
    }
  }, []);

  const handleForgotPassword = useCallback(() => {
    const base = import.meta.env.BASE_URL || "/";
    const root = `${window.location.origin}${base.endsWith("/") ? base : `${base}/`}`;
    window.location.assign(new URL("reset-password", root).href);
  }, []);

  if (checking) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Poppins, system-ui, sans-serif", color: "#0F1B3D" }}>Loading admin portal…</div>;
  if (!user) return <AdminLogin onAuthenticated={() => void refreshUser()} onForgotPassword={handleForgotPassword} />;
  return <AdminWithDrive user={user} onLogout={handleLogout} />;
}
