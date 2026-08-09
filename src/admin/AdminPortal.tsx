import { useCallback, useState } from "react";
import { supabase } from "@/lg/supabase";
import AdminLogin from "./auth/AdminLogin";
import AdminDashboard from "./dashboard/AdminDashboard";
import AdminLayout, {
  ADMIN_PAGE_SUBTITLES,
  ADMIN_PAGE_TITLES,
  type AdminPageKey,
} from "./AdminLayout";

type AdminPortalProps = {
  initialPage?: AdminPageKey;
};

export default function AdminPortal({ initialPage = "dashboard" }: AdminPortalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<AdminPageKey>(initialPage);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setActivePage("dashboard");
  }, []);

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
  }

  let pageContent: React.ReactNode = <AdminDashboard />;

  switch (activePage) {
    case "dashboard":
    default:
      pageContent = <AdminDashboard />;
      break;
  }

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      title={ADMIN_PAGE_TITLES[activePage]}
      subtitle={ADMIN_PAGE_SUBTITLES[activePage]}
    >
      {pageContent}
    </AdminLayout>
  );
}
