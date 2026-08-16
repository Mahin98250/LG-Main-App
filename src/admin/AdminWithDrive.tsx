import { useEffect, useState } from "react";
import { ReferenceAdminPanel } from "@/admin/ReferenceAdminPanel";
import { MaterialsDrive } from "@/admin/MaterialsDrive";
import AdminRecordsPage from "@/admin/records/AdminRecordsPage";
import BatchesTimetablePage from "@/admin/batches/BatchesTimetablePage";
import AnnouncementsPage from "@/admin/AnnouncementsPage";
import RecoverySettingsPage from "@/admin/RecoverySettingsPage";
import HomeworkPage from "@/admin/HomeworkPage";
import { AdminErrorBoundary } from "@/admin/AdminErrorBoundary";
import { AdminDashboardShell } from "@/admin/AdminDashboardShell";
import { AdminProfileAnalytics } from "@/admin/AdminAnalytics";
import { FEATURE_FLAGS } from "@/lg/featureFlags";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  ref: string | null;
};

type View =
  | "panel"
  | "drive"
  | "dashboard"
  | "profiles"
  | "students"
  | "teachers"
  | "batches"
  | "announcements"
  | "homework"
  | "recovery";

const Header = ({ title, onBack, onLogout }: { title: string; onBack: () => void; onLogout: () => void }) => (
  <div
    style={{
      padding: "12px 18px",
      background: "#0F1B3D",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <button
      type="button"
      onClick={onBack}
      style={{
        border: 0,
        borderRadius: 10,
        padding: "9px 13px",
        background: "#4361EE",
        color: "#fff",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      ← Admin Dashboard
    </button>
    <span style={{ color: "#fff", fontWeight: 800, flex: 1 }}>{title}</span>
    <button
      type="button"
      onClick={onLogout}
      style={{
        border: "1px solid #ef444466",
        borderRadius: 10,
        padding: "9px 13px",
        background: "#ef44441a",
        color: "#fecaca",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      ↪ Logout
    </button>
  </div>
);

function SafeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <AdminErrorBoundary section={title}>{children}</AdminErrorBoundary>;
}

function useRemovedFeatureGuard(view: View) {
  useEffect(() => {
    if (view !== "panel") return;
    const prune = () => {
      const blocked: string[] = [];
      if (!FEATURE_FLAGS.messaging) blocked.push("Messages");
      if (!FEATURE_FLAGS.marks) blocked.push("Marks Overview");
      if (!FEATURE_FLAGS.studentResults) blocked.push("Student Results");
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const text = (button.textContent || "").trim();
        if (blocked.some((label) => text === label || text.endsWith(label))) {
          button.remove();
        }
      });
    };
    prune();
    const observer = new MutationObserver(prune);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [view]);
}

export function AdminWithDrive({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  useRemovedFeatureGuard(view);

  useEffect(() => {
    if (view !== "panel") return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = (button.textContent || "").trim();
      if (text === "🏠 Dashboard" || text === "Dashboard") {
        event.preventDefault();
        event.stopPropagation();
        setView("dashboard");
        return;
      }
      if (text.includes("Search Profiles")) {
        event.preventDefault();
        event.stopPropagation();
        setView("profiles");
        return;
      }
      if (text.includes("Study Materials")) {
        event.preventDefault();
        event.stopPropagation();
        setView("drive");
        return;
      }
      if (text === "🎓 Students" || text === "Students") {
        event.preventDefault();
        event.stopPropagation();
        setView("students");
        return;
      }
      if (text === "👨‍🏫 Teachers" || text === "Teachers") {
        event.preventDefault();
        event.stopPropagation();
        setView("teachers");
        return;
      }
      if (text.includes("Batches & Timetable")) {
        event.preventDefault();
        event.stopPropagation();
        setView("batches");
        return;
      }
      if (text.includes("Announcements")) {
        event.preventDefault();
        event.stopPropagation();
        setView("announcements");
        return;
      }
      if (text.includes("Homework")) {
        event.preventDefault();
        event.stopPropagation();
        setView("homework");
        return;
      }
      if (text.includes("User Accounts")) {
        event.preventDefault();
        event.stopPropagation();
        setView("recovery");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [view]);

  if (view === "dashboard") {
    return (
      <SafeSection title="Dashboard Analytics">
        <AdminDashboardShell onNavigate={(next) => setView(next)} onLogout={onLogout} />
      </SafeSection>
    );
  }

  if (view === "profiles") {
    return (
      <SafeSection title="Profile Analytics">
        <AdminProfileAnalytics onBack={() => setView("dashboard")} />
      </SafeSection>
    );
  }

  if (view === "drive") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title="Study Materials · Drive" onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title="Study Materials">
          <MaterialsDrive />
        </SafeSection>
      </div>
    );
  }

  if (view === "students" || view === "teachers") {
    const label = view === "students" ? "Students" : "Teachers";
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title={`${label} · Production Management`} onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title={label}>
          <AdminRecordsPage kind={view} />
        </SafeSection>
      </div>
    );
  }

  if (view === "batches") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title="Batches & Timetable" onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title="Batches & Timetable">
          <BatchesTimetablePage />
        </SafeSection>
      </div>
    );
  }

  if (view === "announcements") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title="Announcements" onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title="Announcements">
          <AnnouncementsPage />
        </SafeSection>
      </div>
    );
  }

  if (view === "homework") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title="Homework · Production Management" onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title="Homework">
          <HomeworkPage />
        </SafeSection>
      </div>
    );
  }

  if (view === "recovery") {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4FF" }}>
        <Header title="Password Recovery · Account Security" onBack={() => setView("dashboard")} onLogout={onLogout} />
        <SafeSection title="User Accounts">
          <RecoverySettingsPage />
        </SafeSection>
      </div>
    );
  }

  return <ReferenceAdminPanel user={user} onLogout={onLogout} />;
}
