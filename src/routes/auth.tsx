import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginScreen, SignupScreen } from "@/lg/authscreens";

const title = "Sign in — Learner's Guide";
const description =
  "Log in or create your Learner's Guide account as a teacher, student or parent.";

type AuthSearch = { role: string; mode: "login" | "signup" };

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    role: ["teacher", "student", "parent"].includes(String(search["role"]))
      ? String(search["role"])
      : "student",
    mode: search["mode"] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role, mode } = Route.useSearch();
  const navigate = useNavigate();

  const goHome = () => navigate({ to: "/" });
  const onLogin = () => navigate({ to: "/app", replace: true });
  const switchMode = () =>
    navigate({ to: "/auth", search: { role, mode: mode === "login" ? "signup" : "login" } });

  return mode === "signup" ? (
    <SignupScreen role={role} onBack={goHome} onSwitch={switchMode} onLogin={onLogin} />
  ) : (
    <LoginScreen role={role} onBack={goHome} onSwitch={switchMode} onLogin={onLogin} />
  );
}
