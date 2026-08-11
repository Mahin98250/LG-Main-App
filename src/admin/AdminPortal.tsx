import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lg/auth";
import { AdminWithDrive } from "./AdminWithDrive";
import { AdminLogin } from "./ReferenceAdminPanel";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  ref: string | null;
};

/**
 * Single source of truth for the admin experience.
 *
 * The old AdminPortal had a second, incomplete navigation implementation which
 * could show placeholder dashboard content for several real admin sections.
 * Keep this compatibility entry point, but delegate to the same full admin
 * panel used by /admin so every entry point has identical functionality.
 */
export default function AdminPortal() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((current) => {
      if (!mounted) return;
      if (current?.role === "admin") setUser(current);
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
    return <AdminLogin onSuccess={(admin) => setUser(admin)} />;
  }

  return <AdminWithDrive user={user} onLogout={handleLogout} />;
}
