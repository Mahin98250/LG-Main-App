import type { ReactNode } from "react";
import { C } from "@/lg/data";
import { LGLogo } from "@/lg/ui";

export type AdminPageKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "batches"
  | "attendance"
  | "homework"
  | "examschedule"
  | "materials"
  | "fees"
  | "announcements"
  | "accounts"
  | "search";

type Props = { activePage: AdminPageKey; onNavigate: (page: AdminPageKey) => void; onLogout: () => void; title: string; subtitle?: string; children: ReactNode };

const NAV: Array<{ key: AdminPageKey; icon: string; label: string }> = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "students", icon: "🎓", label: "Students" },
  { key: "teachers", icon: "👨‍🏫", label: "Teachers" },
  { key: "batches", icon: "👥", label: "Batches & Timetable" },
  { key: "attendance", icon: "✅", label: "Attendance" },
  { key: "homework", icon: "📝", label: "Homework" },
  { key: "examschedule", icon: "📋", label: "Exam Schedule" },
  { key: "materials", icon: "📚", label: "Study Materials" },
  { key: "fees", icon: "💰", label: "Fees" },
  { key: "announcements", icon: "📢", label: "Announcements" },
  { key: "accounts", icon: "🔐", label: "User Accounts" },
  { key: "search", icon: "🔍", label: "Search Profiles" },
];

const ADMIN_CSS = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}body{font-family:'Poppins',sans-serif;background:${C.bg}}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#4361EE33;border-radius:6px}::placeholder{color:#94A3B8}input,select,textarea{font-family:'Poppins',sans-serif}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideR{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}@keyframes zoomIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}.fu{animation:fadeUp .45s cubic-bezier(.34,1.4,.64,1) both}.fi{animation:fadeIn .35s ease both}.sr{animation:slideR .4s cubic-bezier(.34,1.4,.64,1) both}.zi{animation:zoomIn .4s cubic-bezier(.34,1.56,.64,1) both}.d1{animation-delay:.05s}.d2{animation-delay:.10s}.d3{animation-delay:.15s}.d4{animation-delay:.20s}.d5{animation-delay:.25s}.d6{animation-delay:.30s}.btn{transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease,filter .15s ease;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 8px 24px rgba(67,97,238,.18);filter:brightness(1.06)}.btn:active{transform:scale(.94);filter:brightness(.94)}.nav-item{transition:all .2s cubic-bezier(.34,1.56,.64,1);cursor:pointer;border-radius:12px;-webkit-tap-highlight-color:transparent}.nav-item:hover{background:rgba(255,255,255,.08)!important;transform:translateX(4px)}.nav-item.active{background:${C.accent}!important;box-shadow:0 6px 20px rgba(67,97,238,.35)}`;

function Sidebar({ activePage, onNavigate, onLogout }: Pick<Props, "activePage" | "onNavigate" | "onLogout">) {
  return <aside style={{ width: 230, minHeight: "100vh", background: C.sidebar, display: "flex", flexDirection: "column", padding: "0 12px 20px", flexShrink: 0, position: "sticky", top: 0 }}>
    <div style={{ padding: "20px 8px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, flexShrink: 0 }}><LGLogo size={32} showText={false} /></div><div><div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Learner&apos;s</div><div style={{ fontSize: 16, fontWeight: 900, color: C.gold, marginTop: -3 }}>Guide</div></div></div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.18)", borderRadius: 20, padding: "3px 10px" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>ADMIN PANEL</span></div>
    </div>
    <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }} aria-label="Admin navigation">{NAV.map(item => <button key={item.key} type="button" className={`nav-item${activePage === item.key ? " active" : ""}`} onClick={() => onNavigate(item.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 4, border: 0, background: activePage === item.key ? C.accent : "transparent", color: activePage === item.key ? "#fff" : "rgba(255,255,255,.55)", fontWeight: activePage === item.key ? 700 : 500, fontSize: 14, textAlign: "left" }}><span style={{ width: 22, fontSize: 18 }}>{item.icon}</span>{item.label}</button>)}</nav>
    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 8 }}><div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#EF4444,#F97316)", display: "grid", placeItems: "center", fontSize: 16 }}>👑</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Admin</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Full Access</div></div></div><button type="button" onClick={onLogout} className="btn" style={{ width: "100%", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", color: "#FF8080", borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 700 }}>🚪 Logout</button></div>
  </aside>;
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) { return <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", background: "#fff", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}><div><div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{title}</div>{subtitle && <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{subtitle}</div>}</div></header>; }

export default function AdminLayout({ activePage, onNavigate, onLogout, title, subtitle, children }: Props) { return <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Poppins',sans-serif" }}><style>{ADMIN_CSS}</style><Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout}/><div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}><TopBar title={title} subtitle={subtitle}/><main style={{ flex: 1, overflowY: "auto" }}>{children}</main></div></div>; }
