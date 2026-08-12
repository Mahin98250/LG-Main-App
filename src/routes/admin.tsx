import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lg/auth";
import { AdminLogin } from "@/admin/ReferenceAdminPanel";
import { AdminWithDrive } from "@/admin/AdminWithDrive";

export type AdminRouteUser = { id: string; name: string; phone: string; role: string; ref: string | null };
export const Route = createFileRoute("/admin")({ ssr: false, component: AdminRoute });

function AdminRoute() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminRouteUser | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { let mounted = true; getCurrentUser().then((current) => { if (!mounted) return; if (current?.role === "admin") setUser(current); setChecking(false); }); return () => { mounted = false; }; }, []);
  if (checking) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Poppins,sans-serif" }}>Loading admin portal…</div>;
  if (!user) return <AdminLogin onSuccess={(admin) => setUser(admin)} onForgotPassword={() => navigate({ to: "/reset-password" })} />;
  return <AdminWithDrive user={user} onLogout={async () => { await signOut(); setUser(null); navigate({ to: "/", replace: true }); }} />;
}
