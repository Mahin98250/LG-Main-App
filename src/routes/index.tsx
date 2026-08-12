import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lg/auth";
import { RoleSelect } from "@/lg/authscreens";

const title = "Learner's Guide — School App for Teachers, Students & Parents";
const description =
  "Learner's Guide connects classrooms: timetables, attendance, homework, notes, marks and fees for teachers, students and parents in one app.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const current = await getCurrentUser();
        if (!mounted) return;

        if (current?.role === "admin") {
          navigate({ to: "/admin", replace: true });
          return;
        }

        if (current?.role === "student" || current?.role === "teacher" || current?.role === "parent") {
          navigate({ to: "/app", replace: true });
          return;
        }
      } catch (error) {
        console.warn("Unable to restore saved login session:", error);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Poppins, sans-serif",
          color: "#1a1060",
          padding: 24,
        }}
      >
        Restoring your saved login…
      </div>
    );
  }

  return (
    <RoleSelect
      onNext={(role: string) => navigate({ to: "/auth", search: { role, mode: "login" } })}
    />
  );
}
