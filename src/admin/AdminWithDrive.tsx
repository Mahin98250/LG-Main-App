import { useEffect, useState } from "react";
import { ReferenceAdminPanel, type AdminUser } from "@/admin/ReferenceAdminPanel";
import { MaterialsDrive } from "@/admin/MaterialsDrive";

export function AdminWithDrive({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [drive, setDrive] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      if ((button.textContent || "").trim().includes("Study Materials")) {
        event.preventDefault();
        event.stopPropagation();
        setDrive(true);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (drive) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDrive(false)} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button>
          <span style={{ color: "#fff", fontWeight: 800 }}>Study Materials · Drive</span>
        </div>
        <MaterialsDrive />
      </div>
    );
  }

  return <ReferenceAdminPanel user={user} onLogout={onLogout} />;
}
