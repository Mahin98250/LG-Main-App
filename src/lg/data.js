import { supabase } from "@/lg/supabase";

/* ═══════════ DESIGN TOKENS ═══════════ */
export const C = {
  bg: "linear-gradient(160deg,#1a1060 0%,#2d1b8e 45%,#0e0a3a 100%)",
  accent: "#5B4FE8",
  gold: "#F5A623",
  green: "#22C55E",
  red: "#EF4444",
  text: "#1a1060",
  sub: "#64748B",
  border: "#E2E8F0",
  light: "#F0F4FF",
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

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const today = () => DAYS[new Date().getDay()];

export const uid = () => "u" + Date.now() + Math.random().toString(36).slice(2, 6);

export const TABLES = [
  "students",
  "teachers",
  "timetable",
  "batches",
  "attendance",
  "homework",
  "materials",
  "announcements",
  "fees",
  "marks",
  "messages",
  "notifications",
  "examschedule",
];

/* ═══════════ REMOTE READS / WRITES ═══════════ */
export const gdb = async (t) => {
  const { data, error } = await supabase.from(t).select("*");
  if (error) {
    console.warn("gdb failed [" + t + "]:", error.message);
    throw error;
  }
  return Array.isArray(data) ? data : [];
};

export const addR = async (t, row) => {
  const payload = { ...row, id: row?.id || uid() };
  const { data, error } = await supabase.from(t).insert(payload).select().maybeSingle();
  if (error) {
    console.warn("addR failed [" + t + "]:", error.message);
    throw error;
  }
  return data && data.id ? data : payload;
};

export const updR = async (t, id, p) => {
  const { error } = await supabase.from(t).update(p).eq("id", id);
  if (error) {
    console.warn("updR failed [" + t + "]:", error.message);
    throw error;
  }
  return true;
};

export const delR = async (t, id) => {
  const { error } = await supabase.from(t).delete().eq("id", id);
  if (error) {
    console.warn("delR failed [" + t + "]:", error.message);
    throw error;
  }
  return true;
};

/** Pull every table the UI reads synchronously from Supabase. */
export const hydrateAll = async () => {
  const entries = await Promise.allSettled(TABLES.map((t) => gdb(t).then((rows) => [t, rows])));
  const result = {};
  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      const [t, rows] = entry.value;
      result[t] = rows;
    } else {
      throw entry.reason;
    }
  }
  return result;
};
