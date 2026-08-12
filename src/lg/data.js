import { supabase } from "@/lg/supabase";

export const C = {
  bg: "linear-gradient(160deg,#1a1060 0%,#2d1b8e 45%,#0e0a3a 100%)",
  sidebar: "#0F1B3D", card: "#FFFFFF", accent: "#5B4FE8", gold: "#F5A623", green: "#22C55E", red: "#EF4444", amber: "#F59E0B", purple: "#8B5CF6", cyan: "#06B6D4", text: "#1a1060", sub: "#64748B", border: "#E2E8F0", light: "#F0F4FF",
};
export const ROLES = [
  { key: "teacher", label: "Teacher", sub: "Manage classes & students", grad: "linear-gradient(135deg,#5B4FE8,#7B6FF5)", color: "#5B4FE8" },
  { key: "student", label: "Student", sub: "View classes & homework", grad: "linear-gradient(135deg,#F5A623,#F97316)", color: "#F5A623" },
  { key: "parent", label: "Parent", sub: "Track your child's progress", grad: "linear-gradient(135deg,#22C55E,#16A34A)", color: "#22C55E" },
];
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const today = () => DAYS[new Date().getDay()];
export const uid = () => "u" + Date.now() + Math.random().toString(36).slice(2, 6);

const hasLS = () => typeof window !== "undefined" && !!window.localStorage;
const lsK = (t) => "lg_" + t;
export const lsG = (t) => { if (!hasLS()) return []; try { return JSON.parse(localStorage.getItem(lsK(t) || "[]")); } catch { return []; } };
export const lsS = (t, v) => { if (!hasLS()) return; try { localStorage.setItem(lsK(t), JSON.stringify(v)); } catch {} };
export const clearCache = () => { if (!hasLS()) return; for (const t of TABLES) { try { localStorage.removeItem(lsK(t)); } catch {} } };
export const TABLES = ["students","teachers","users","timetable","batches","attendance","homework","materials","announcements","fees","marks","messages","notifications","examschedule","subjects","material_folders"];

async function enrichMaterials(rows) {
  const clean = Array.isArray(rows) ? rows : [];
  if (!clean.length) return clean;
  const enriched = [];
  for (const row of clean) {
    let pdfData = null;
    if (row.storage_path) {
      const { data, error } = await supabase.storage.from("materials").createSignedUrl(row.storage_path, 3600, { download: row.name || row.title || "material" });
      if (!error) pdfData = data?.signedUrl || null;
    }
    enriched.push({ ...row, pdfData, pdfName: row.name || row.title || "material" });
  }
  return enriched;
}

export const gdb = async (t) => {
  const { data, error } = await supabase.from(t).select("*");
  if (error) { console.error(`Supabase read failed [${t}]:`, error.message); throw error; }
  let rows = Array.isArray(data) ? data : [];
  if (t === "materials") rows = await enrichMaterials(rows);
  lsS(t, rows);
  return rows;
};

// Only include columns that are actually writable by the legacy learner UI.
// Parent fields are deliberately kept in their database spelling (parentname/
// parentphone). The old camelCase parentName/parentPhone keys caused Postgres
// trigger errors because those columns do not exist in the students table.
const WRITE_COLUMNS = {
  students: new Set(["id","name","sid","cls","sec","parentname","parentphone","parent","enroll","status"]),
  teachers: new Set(["id","name","tid","subject","phone","classes","status"]),
  users: new Set(["id","name","phone","email","role","ref","status","auth_id","created_at"]),
};
const STUDENT_FIELD_ALIASES = { parentName: "parentname", parentPhone: "parentphone" };
const sanitizeWrite = (table, payload) => {
  const allowed = WRITE_COLUMNS[table];
  if (!allowed) return payload;
  const normalized = { ...payload };
  if (table === "students") {
    for (const [from, to] of Object.entries(STUDENT_FIELD_ALIASES)) {
      if (normalized[from] !== undefined && normalized[to] === undefined) normalized[to] = normalized[from];
      delete normalized[from];
    }
  }
  return Object.fromEntries(Object.entries(normalized).filter(([key]) => allowed.has(key)));
};
const upsertLocal = (t, v) => { const c = lsG(t); const i = c.findIndex((x) => x && x.id === v.id); if (i === -1) c.push(v); else c[i] = { ...c[i], ...v }; lsS(t, c); };
export const addR = async (t, row) => {
  const payload = sanitizeWrite(t, row);
  const { data, error } = await supabase.from(t).insert(payload).select().maybeSingle();
  if (error) { console.error(`Supabase insert failed [${t}]:`, error.message); throw error; }
  if (!data) throw new Error("Supabase insert succeeded but returned no row.");
  upsertLocal(t, data); return data;
};
export const updR = async (t, id, p) => {
  const payload = sanitizeWrite(t, p); delete payload.id;
  const { data, error } = await supabase.from(t).update(payload).eq("id", id).select().maybeSingle();
  if (error) { console.error(`Supabase update failed [${t}]:`, error.message); throw error; }
  if (!data) throw new Error("No row was updated. The record may not exist or RLS may have blocked access.");
  upsertLocal(t, data); return data;
};
export const delR = async (t, id) => {
  const { data, error } = await supabase.from(t).delete().eq("id", id).select().maybeSingle();
  if (error) { console.error(`Supabase delete failed [${t}]:`, error.message); throw error; }
  if (!data) throw new Error("No row was deleted. The record may not exist or RLS may have blocked access.");
  lsS(t, lsG(t).filter((r) => r.id !== id)); return data;
};
export const sdb = async (t, nextRows) => {
  const previous = lsG(t);
  const next = Array.isArray(nextRows) ? nextRows : [];
  const nextIds = new Set(next.map((r) => r?.id));
  for (const row of previous) if (row?.id && !nextIds.has(row.id)) await delR(t, row.id);
  lsS(t, next); return next;
};
export const hydrateAll = async () => { await Promise.all(TABLES.map((t) => gdb(t))); };
