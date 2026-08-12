import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PasswordRecovery } from "@/lg/PasswordRecovery";

const title = "Reset Password — Learner's Guide";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title }, { name: "robots", content: "noindex" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  return <PasswordRecovery onBack={() => navigate({ to: "/" })} />;
}
