import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  return (
    <RoleSelect onNext={(role: string) => navigate({ to: "/auth", search: { role, mode: "login" } })} />
  );
}
