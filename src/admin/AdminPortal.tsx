import { useCallback, useState } from "react";
import { supabase } from "@/lg/supabase";
import AdminLogin from "./auth/AdminLogin";
import AdminDashboard from "./dashboard/AdminDashboard";
import AdminRecordsPage from "./records/AdminRecordsPage";
import TeacherRecordsPage from "./records/TeacherRecordsPage";
import BatchesTimetablePage from "./batches/BatchesTimetablePage";
import ExamSchedulePage from "./examschedule/ExamSchedulePage";
import StudentResultsPage from "./results/StudentResultsPage";
import AdminLayout, { ADMIN_PAGE_SUBTITLES, ADMIN_PAGE_TITLES, type AdminPageKey } from "./AdminLayout";

type AdminPortalProps = { initialPage?: AdminPageKey };

export default function AdminPortal({ initialPage = "dashboard" }: AdminPortalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<AdminPageKey>(initialPage);
  const handleAuthenticated = useCallback(() => setAuthenticated(true), []);
  const handleLogout = useCallback(async () => { await supabase.auth.signOut(); setAuthenticated(false); setActivePage("dashboard"); }, []);
  if (!authenticated) return <AdminLogin onAuthenticated={handleAuthenticated} />;
  let pageContent;
  if (activePage === "students") pageContent = <AdminRecordsPage kind="students" />;
  else if (activePage === "teachers") pageContent = <TeacherRecordsPage />;
  else if (activePage === "batches") pageContent = <BatchesTimetablePage />;
  else if (activePage === "examschedule") pageContent = <ExamSchedulePage />;
  else if (activePage === "results") pageContent = <StudentResultsPage />;
  else pageContent = <AdminDashboard />;
  return <AdminLayout activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} title={ADMIN_PAGE_TITLES[activePage]} subtitle={ADMIN_PAGE_SUBTITLES[activePage]}>{pageContent}</AdminLayout>;
}
