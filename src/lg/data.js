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

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const today = () => DAYS[new Date().getDay()];
export const uid = () => "u" + Date.now() + Math.random().toString(36).slice(2, 6);

/* ═══════════ LOCAL CACHE (MIRROR ONLY — NEVER A SOURCE OF TRUTH) ═══════════ */
const hasLS = () => typeof window !== "undefined" && !!window.localStorage;
const lsK = (t) => "lg_" + t;

export const lsG = (t) => {
  if (!hasLS()) return [];
  try {
    return JSON.parse(localStorage.getItem(lsK(t)) || "[]");
  } catch {
    return [];
  }
};

export const lsS = (t, v) => {
  if (!hasLS()) return;
  try {
    localStorage.setItem(lsK(t), JSON.stringify(v));
  } catch {
    /* cache is optional */
  }
};

export const clearCache = () => {
  if (!hasLS()) return;
  for (const t of TABLES) {
    try {
      localStorage.removeItem(lsK(t));
    } catch {
      /* ignore cache errors */
    }
  }
};

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
    console.error("Supabase read failed [" + t + "]:", error.message);
    throw error;
  }
  const rows = Array.isArray(data) ? data : [];
  lsS(t, rows);
  return rows;
};

const upsertLocal = (t, v) => {
  const c = lsG(t);
  const i = c.findIndex((x) => x && x.id === v.id);
  if (i === -1) c.push(v);
  else c[i] = { ...c[i], ...v };
  lsS(t, c);
};

export const addR = async (t, row) => {
  const { data, error } = await supabase.from(t).insert(row).select().maybeSingle();
  if (error) {
    console.error("Supabase insert failed [" + t + "]:", error.message);
    throw error;
  }
  if (!data) throw new Error("Supabase insert succeeded but returned no row.");
  upsertLocal(t, data);
  return data;
};

export const updR = async (t, id, p) => {
  const { data, error } = await supabase.from(t).update(p).eq("id", id).select().maybeSingle();
  if (error) {
    console.error("Supabase update failed [" + t + "]:", error.message);
    throw error;
  }
  if (!data) throw new Error("No row was updated. The record may not exist or RLS may have blocked access.");
  upsertLocal(t, data);
  return data;
};

export const delR = async (t, id) => {
  const { data, error } = await supabase.from(t).delete().eq("id", id).select().maybeSingle();
  if (error) {
    console.error("Supabase delete failed [" + t + "]:", error.message);
    throw error;
  }
  if (!data) throw new Error("No row was deleted. The record may not exist or RLS may have blocked access.");
  lsS(t, lsG(t).filter((r) => r.id !== id));
  return data;
};

export const hydrateAll = async () => {
  await Promise.all(TABLES.map((t) => gdb(t)));
};
