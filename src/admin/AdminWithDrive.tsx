import { useEffect, useState } from "react";
import { ReferenceAdminPanel } from "@/admin/ReferenceAdminPanel";
import { MaterialsDrive } from "@/admin/MaterialsDrive";
import AdminRecordsPage from "@/admin/records/AdminRecordsPage";
import BatchesTimetablePage from "@/admin/batches/BatchesTimetablePage";
import AnnouncementsPage from "@/admin/AnnouncementsPage";

type AdminUser = { id: string; name: string; phone: string; role: string; ref: string | null };
type View = "panel" | "drive" | "students" | "teachers" | "batches" | "announcements";

export function AdminWithDrive({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [view, setView] = useState<View>("panel");

  useEffect(() => {
    if (view !== "panel") return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = (button.textContent || "").trim();
      if (text.includes("Study Materials")) { event.preventDefault(); event.stopPropagation(); setView("drive"); return; }
      if (text === "🎓 Students" || text === "Students") { event.preventDefault(); event.stopPropagation(); setView("students"); return; }
      if (text === "👨‍🏫 Teachers" || text === "Teachers") { event.preventDefault(); event.stopPropagation(); setView("teachers"); return; }
      if (text.includes("Batches & Timetable")) { event.preventDefault(); event.stopPropagation(); setView("batches"); return; }
      if (text.includes("Announcements")) { event.preventDefault(); event.stopPropagation(); setView("announcements"); }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [view]);

  if (view === "drive") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}><button type="button" onClick={() => setView("panel")} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button><span style={{ color: "#fff", fontWeight: 800 }}>Study Materials · Drive</span></div><MaterialsDrive /></div>;
  if (view === "students" || view === "teachers") { const label = view === "students" ? "Students" : "Teachers"; return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}><button type="button" onClick={() => setView("panel")} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button><span style={{ color: "#fff", fontWeight: 800 }}>{label} · Production Management</span></div><AdminRecordsPage kind={view} /></div>; }
  if (view === "batches") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}><button type="button" onClick={() => setView("panel")} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button><span style={{ color: "#fff", fontWeight: 800 }}>Batches & Timetable</span></div><BatchesTimetablePage /></div>;
  if (view === "announcements") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}><button type="button" onClick={() => setView("panel")} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button><span style={{ color: "#fff", fontWeight: 800 }}>Announcements</span></div><AnnouncementsPage /></div>;
  return <ReferenceAdminPanel user={user} onLogout={onLogout} />;
}
