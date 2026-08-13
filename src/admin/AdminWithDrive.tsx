import { useEffect, useState } from "react";
import { ReferenceAdminPanel } from "@/admin/ReferenceAdminPanel";
import { MaterialsDrive } from "@/admin/MaterialsDrive";
import AdminRecordsPage from "@/admin/records/AdminRecordsPage";
import BatchesTimetablePage from "@/admin/batches/BatchesTimetablePage";
import AnnouncementsPage from "@/admin/AnnouncementsPage";
import RecoverySettingsPage from "@/admin/RecoverySettingsPage";
import HomeworkPage from "@/admin/HomeworkPage";
import AdminMessagesPage from "@/admin/AdminMessagesPage";
import { AdminErrorBoundary } from "@/admin/AdminErrorBoundary";

type AdminUser = { id: string; name: string; phone: string; role: string; ref: string | null };
type View = "panel" | "drive" | "students" | "teachers" | "batches" | "announcements" | "homework" | "recovery" | "messages";
const Header = ({ title, onBack }: { title: string; onBack: () => void }) => <div style={{ padding: "12px 18px", background: "#0F1B3D", display: "flex", alignItems: "center", gap: 12 }}><button type="button" onClick={onBack} style={{ border: 0, borderRadius: 10, padding: "9px 13px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>← Admin Panel</button><span style={{ color: "#fff", fontWeight: 800 }}>{title}</span></div>;
function SafeSection({ title, children }: { title: string; children: React.ReactNode }) { return <AdminErrorBoundary section={title}>{children}</AdminErrorBoundary>; }
export function AdminWithDrive({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [view, setView] = useState<View>("panel");
  useEffect(() => { if (view !== "panel") return; const onClick = (event: MouseEvent) => { const target = event.target as HTMLElement | null; const button = target?.closest("button"); if (!button) return; const text = (button.textContent || "").trim(); if (text.includes("Study Materials")) { event.preventDefault(); event.stopPropagation(); setView("drive"); return; } if (text === "🎓 Students" || text === "Students") { event.preventDefault(); event.stopPropagation(); setView("students"); return; } if (text === "👨‍🏫 Teachers" || text === "Teachers") { event.preventDefault(); event.stopPropagation(); setView("teachers"); return; } if (text.includes("Batches & Timetable")) { event.preventDefault(); event.stopPropagation(); setView("batches"); return; } if (text.includes("Announcements")) { event.preventDefault(); event.stopPropagation(); setView("announcements"); return; } if (text.includes("Homework")) { event.preventDefault(); event.stopPropagation(); setView("homework"); return; } if (text.includes("User Accounts")) { event.preventDefault(); event.stopPropagation(); setView("recovery"); return; } if (text === "✉️ Messages" || text === "Messages") { event.preventDefault(); event.stopPropagation(); setView("messages"); } }; document.addEventListener("click", onClick, true); return () => document.removeEventListener("click", onClick, true); }, [view]);
  if (view === "drive") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Study Materials · Drive" onBack={() => setView("panel")} /><SafeSection title="Study Materials"><MaterialsDrive /></SafeSection></div>;
  if (view === "students" || view === "teachers") { const label = view === "students" ? "Students" : "Teachers"; return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title={`${label} · Production Management`} onBack={() => setView("panel")} /><SafeSection title={label}><AdminRecordsPage kind={view} /></SafeSection></div>; }
  if (view === "batches") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Batches & Timetable" onBack={() => setView("panel")} /><SafeSection title="Batches & Timetable"><BatchesTimetablePage /></SafeSection></div>;
  if (view === "announcements") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Announcements" onBack={() => setView("panel")} /><SafeSection title="Announcements"><AnnouncementsPage /></SafeSection></div>;
  if (view === "homework") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Homework · Production Management" onBack={() => setView("panel")} /><SafeSection title="Homework"><HomeworkPage /></SafeSection></div>;
  if (view === "recovery") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Password Recovery · Account Security" onBack={() => setView("panel")} /><SafeSection title="User Accounts"><RecoverySettingsPage /></SafeSection></div>;
  if (view === "messages") return <div style={{ minHeight: "100vh", background: "#F0F4FF" }}><Header title="Messages · Direct Communication" onBack={() => setView("panel")} /><SafeSection title="Messages"><AdminMessagesPage user={user} /></SafeSection></div>;
  return <ReferenceAdminPanel user={user} onLogout={onLogout} />;
}
