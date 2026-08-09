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

/* ═══════════ LOCAL CACHE (offline fallback + instant reads) ═══════════ */
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
    /* quota */
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
  try {
    const { data, error } = await supabase.from(t).select("*");
    if (error) throw error;
    if (Array.isArray(data)) {
      lsS(t, data);
      return data;
    }
    return lsG(t);
  } catch (e) {
    console.warn("gdb fallback [" + t + "]:", e.message);
    return lsG(t);
  }
};

const upsertLocal = (t, v) => {
  const c = lsG(t);
  const i = c.findIndex((x) => x && x.id === v.id);
  if (i === -1) c.push(v);
  else c[i] = { ...c[i], ...v };
  lsS(t, c);
};

export const addR = async (t, row) => {
  const fallback = { ...row, id: row?.id || uid() };
  try {
    const { data, error } = await supabase.from(t).insert(row).select().maybeSingle();
    if (error) throw error;
    const final = data && data.id ? data : fallback;
    upsertLocal(t, final);
    return final;
  } catch (e) {
    upsertLocal(t, fallback);
    console.warn("addR fallback [" + t + "]:", e.message);
    return fallback;
  }
};

export const updR = async (t, id, p) => {
  try {
    const { error } = await supabase.from(t).update(p).eq("id", id);
    if (error) throw error;
  } catch (e) {
    console.warn("updR [" + t + "]:", e.message);
  }
  lsS(
    t,
    lsG(t).map((r) => (r.id === id ? { ...r, ...p } : r)),
  );
};

export const delR = async (t, id) => {
  try {
    const { error } = await supabase.from(t).delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    console.warn("delR [" + t + "]:", e.message);
  }
  lsS(
    t,
    lsG(t).filter((r) => r.id !== id),
  );
};

/** Pull every table the UI reads synchronously into the local cache. */
export const hydrateAll = async () => {
  await Promise.all(TABLES.map((t) => gdb(t)));
};