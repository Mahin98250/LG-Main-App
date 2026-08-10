import type { ReactNode } from "react";
import { C } from "@/lg/data";

export type AdminPageKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "batches"
  | "attendance"
  | "homework"
  | "examschedule"
  | "results"
  | "materials"
  | "fees"
  | "announcements"
  | "accounts"
  | "marks"
  | "search"
  | "adminmsgs";

type Props = {
  activePage: AdminPageKey;
  onNavigate: (page: AdminPageKey) => void;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const NAV: Array<{ key: AdminPageKey; icon: string; label: string }> = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "students", icon: "🎓", label: "Students" },
  { key: "teachers", icon: "👨‍🏫", label: "Teachers" },
  { key: "batches", icon: "👥", label: "Batches & Timetable" },
  { key: "attendance", icon: "✅", label: "Attendance" },
  { key: "homework", icon: "📝", label: "Homework" },
  { key: "examschedule", icon: "📋", label: "Exam Schedule" },
  { key: "results", icon: "🏆", label: "Student Results" },
  { key: "materials", icon: "📚", label: "Study Materials" },
  { key: "fees", icon: "💰", label: "Fees" },
  { key: "announcements", icon: "📢", label: "Announcements" },
  { key: "accounts", icon: "🔐", label: "User Accounts" },
  { key: "marks", icon: "📊", label: "Marks Overview" },
  { key: "search", icon: "🔍", label: "Search Profiles" },
  { key: "adminmsgs", icon: "✉️", label: "Messages" },
];

export const ADMIN_PAGE_TITLES: Record<AdminPageKey, string> = {
  dashboard: "Dashboard",
  students: "Students",
  teachers: "Teachers",
  batches: "Batches & Timetable",
  attendance: "Attendance",
  homework: "Homework",
  examschedule: "Exam Schedule",
  results: "Student Results",
  materials: "Study Materials",
  fees: "Fees",
  announcements: "Announcements",
  accounts: "User Accounts",
  marks: "Marks Overview",
  search: "Search Profiles",
  adminmsgs: "Messages",
};

export const ADMIN_PAGE_SUBTITLES: Record<AdminPageKey, string> = {
  dashboard: "Full overview of your institute",
  students: "Add, edit, delete students — auto creates login accounts",
  teachers: "Manage teacher accounts and subjects",
  batches: "Create batches, assign timetable slots and teachers",
  attendance: "View all attendance records",
  homework: "Monitor homework assigned by teachers",
  examschedule: "Schedule upcoming exams for classes",
  results: "Enter and manage student exam results",
  materials: "Upload study materials",
  fees: "Track and manage fee payments",
  announcements: "Post announcements to all roles",
  accounts: "Manage authorized user accounts",
  marks: "Analytics of all exam marks",
  search: "Search student or teacher — full profile view",
  adminmsgs: "Send direct messages to teachers or students",
};

function Sidebar({
  activePage,
  onNavigate,
  onLogout,
}: Pick<Props, "activePage" | "onNavigate" | "onLogout">) {
  return (
    <aside
      style={{
        width: 230,
        minHeight: "100vh",
        background: "#0F1B3D",
        display: "flex",
        flexDirection: "column",
        padding: "0 12px 20px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      <div
        style={{
          padding: "20px 8px 16px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg,#4361EE,#7B6FF5)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 17,
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(0,0,0,.3)",
            }}
          >
            LG
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
              Learner&apos;s
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: C.gold,
                marginTop: -3,
              }}
            >
              Guide
            </div>
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(239,68,68,.18)",
            borderRadius: 20,
            padding: "3px 10px",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#EF4444",
            }}
          />
          <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>
            ADMIN PANEL
          </span>
        </div>
      </div>

      <nav
        style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}
        aria-label="Admin navigation"
      >
        {NAV.map((item) => {
          const active = activePage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                marginBottom: 4,
                border: 0,
                borderRadius: 10,
                background: active ? "rgba(67,97,238,.22)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.55)",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ width: 22, fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.08)",
          paddingTop: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: "linear-gradient(135deg,#EF4444,#F97316)",
              display: "grid",
              placeItems: "center",
              fontSize: 16,
            }}
          >
            👑
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              Admin
            </div>
            <div
              style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}
            >
              Full Access
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            background: "rgba(239,68,68,.15)",
            border: "1px solid rgba(239,68,68,.3)",
            color: "#FF8080",
            borderRadius: 12,
            padding: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 28px",
        background: "#fff",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </header>
  );
}

export default function AdminLayout({
  activePage,
  onNavigate,
  onLogout,
  title,
  subtitle,
  children,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Poppins',sans-serif",
      }}
    >
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <TopBar title={title} subtitle={subtitle} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
