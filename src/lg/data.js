import { supabase } from "@/lg/supabase";

/* ═══════════ DESIGN TOKENS ═══════════ */
export const C = {
  bg: "#F0F4FF",
  sidebar: "#0F1B3D",
  card: "#FFFFFF",
  accent: "#4361EE",
  gold: "#F5A623",
  green: "#22C55E",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  text: "#0F1B3D",
  sub: "#64748B",
  border: "#E2E8F0",
  light: "#F8FAFF",
};

export const ROLES = [
  {
    key: "teacher",
    label: "Teacher",
    sub: "Manage classes & students",
    grad: "linear-gradient(135deg,#5B4FE8,#7B6FF5)",
    color: "#5B4FE8",
  },
  {
    key: "student",
    label: "Student",
    sub: "View classes & homework",
    grad: "linear-gradient(135deg,#F5A623,#F97316)",
    color: "#F5A623",
  },
  {
    key: "parent",
    label: "Parent",
    sub: "Track your child's progress",
    grad: "linear-gradient(135deg,#22C55E,#16A34A)",
    color: "#22C55E",
  },
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
