import { AdminDashboardAnalytics } from "@/admin/AdminAnalytics";

type View =
  | "dashboard"
  | "profiles"
  | "students"
  | "teachers"
  | "batches"
  | "announcements"
  | "homework"
  | "drive"
  | "recovery";

const NAV: Array<[View, string, string]> = [
  ["dashboard", "🏠", "Dashboard"],
  ["students", "🎓", "Students"],
  ["teachers", "👨‍🏫", "Teachers"],
  ["batches", "👥", "Batches & Timetable"],
  ["profiles", "🔎", "Search Profiles"],
  ["homework", "📝", "Homework"],
  ["drive", "📚", "Study Materials"],
  ["announcements", "📢", "Announcements"],
  ["recovery", "🔐", "User Accounts"],
];

export function AdminDashboardShell({ onNavigate, onLogout }: { onNavigate: (view: View) => void; onLogout: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F4FF", color: "#0F1B3D", fontFamily: "Poppins,system-ui,sans-serif", display: "flex" }}>
      <aside style={{ width: 252, minHeight: "100vh", background: "#0F1B3D", color: "#fff", padding: "22px 14px", position: "sticky", top: 0, alignSelf: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 22px", borderBottom: "1px solid #ffffff14" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "grid", placeItems: "center", fontSize: 22 }}>🎓</div>
          <div><b style={{ display: "block", fontSize: 17 }}>Learner's</b><b style={{ color: "#F5A623", fontSize: 17 }}>Guide</b></div>
        </div>
        <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 900, padding: "14px 10px 8px" }}>● ADMIN PANEL</div>
        <nav>
          {NAV.map(([view, icon, label]) => (
            <button key={view} type="button" onClick={() => onNavigate(view)} style={{ width: "100%", border: 0, background: view === "dashboard" ? "#4361EE" : "transparent", color: "#fff", padding: "12px 13px", margin: "3px 0", borderRadius: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontWeight: view === "dashboard" ? 800 : 600 }}>
              <span style={{ width: 22, textAlign: "center" }}>{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <button type="button" onClick={onLogout} style={{ width: "100%", marginTop: 18, border: "1px solid #ef444466", background: "#ef44441a", color: "#fecaca", padding: "12px 13px", borderRadius: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontWeight: 800 }}>
          <span style={{ width: 22, textAlign: "center" }}>↪</span><span>Logout</span>
        </button>
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>
        <AdminDashboardAnalytics onBack={() => onNavigate("dashboard")} />
      </main>
    </div>
  );
}
