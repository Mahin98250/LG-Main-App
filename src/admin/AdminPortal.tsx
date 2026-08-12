import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lg/auth";
import { AdminWithDrive } from "./AdminWithDrive";
import AdminLogin from "./auth/AdminLogin";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  ref: string | null;
};

/**
 * Single source of truth for the admin experience.
 * The login gate must use the Supabase Auth-backed admin login so the browser
 * session used by the admin UI is the same session used by RLS-protected writes.
 */
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
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Poppins, system-ui, sans-serif",
          color: "#0F1B3D",
        }}
      >
        Loading admin portal…
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onAuthenticated={() => void refreshUser()} />;
  }

  return <AdminWithDrive user={user} onLogout={handleLogout} />;
}
