import { useCallback, useEffect, useMemo, useState } from "react";
import { C, addR, delR, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any> & { id: string | number };
type Kind = "students" | "teachers";
type Form = Record<string, string>;

const DEFAULT_STUDENT_PASSWORD = "1234";
const DEFAULT_TEACHER_PASSWORD = "1234";
const DEFAULT_PARENT_PASSWORD = "parent@1234";
const TEACHER_SUBJECTS = ["Mathematics", "Science", "English", "History", "Geography", "Computer", "Hindi"];
const CLASSES = ["9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 4px 20px rgba(15,27,61,.07)" };

async function provision(role: "student" | "parent" | "teacher", loginId: string, name: string, ref: string, action: "create" | "update" | "delete", authId?: string | null, password?: string) {
  const body: Record<string, unknown> = { action, role, loginId, name, ref };
  if (authId) body.authId = authId;
  if (password) body.password = password;
  const { data, error } = await supabase.functions.invoke("admin-provision-user", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { authId?: string; email?: string; deleted?: boolean; repaired?: boolean };
}

async function nextStudentSid() {
  const rows = (await gdb("students")) as Row[];
  const used = new Set(rows.map((r) => String(r.sid ?? "").trim().toUpperCase()));
  let max = 0;
  for (const row of rows) { const match = String(row.sid ?? "").match(/^LG-?(\d+)$/i); if (match) max = Math.max(max, Number(match[1])); }
  let n = max + 1;
  while (used.has(`LG-${String(n).padStart(3, "0")}`)) n += 1;
  return `LG-${String(n).padStart(3, "0")}`;
}

async function nextTeacherTid() {
  const rows = (await gdb("teachers")) as Row[];
  const used = new Set(rows.map((r) => String(r.tid ?? "").trim().toUpperCase()));
  let max = 0;
  for (const row of rows) { const match = String(row.tid ?? "").match(/^LGT-?(\d+)$/i); if (match) max = Math.max(max, Number(match[1])); }
  let n = max + 1;
  while (used.has(`LGT${String(n).padStart(2, "0")}`)) n += 1;
  return `LGT${String(n).padStart(2, "0")}`;
}

function Input({ label, value, onChange, placeholder, required, type = "text", disabled = false, note }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; disabled?: boolean; note?: string }) {
  return <label style={{ display: "block", minWidth: 0 }}><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</span><input type={type} required={required} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: disabled ? "#F1F5F9" : "#F8FAFF", color: C.text, outline: "none" }} />{note && <span style={{ display: "block", marginTop: 5, fontSize: 10, color: C.sub }}>{note}</span>}</label>;
}
function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return <label style={{ display: "block", minWidth: 0 }}><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</span><select required={required} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text, outline: "none" }}><option value="">Select…</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
function MultiSelect({ label, value, onChange, options }: { label: string; value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  return <div><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}</span><div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: 10, border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF" }}>{options.map((o) => { const checked = value.includes(o); return <button key={o} type="button" onClick={() => onChange(checked ? value.filter((x) => x !== o) : [...value, o])} style={{ border: `1px solid ${checked ? C.accent : C.border}`, borderRadius: 9, padding: "7px 10px", background: checked ? "#EEF2FF" : "#fff", color: checked ? C.accent : C.sub, fontWeight: checked ? 800 : 600, cursor: "pointer", fontSize: 11 }}>{checked ? "✓ " : ""}{o}</button>; })}</div></div>;
}

export default function AdminRecordsPage({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [query, setQuery] = useState(""); const [editing, setEditing] = useState<Row | null>(null); const [form, setForm] = useState<Form>({}); const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]); const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const isStudent = kind === "students";
  const load = useCallback(async () => { setLoading(true); setError(""); try { setRows((await gdb(kind)) as Row[]); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load records."); } finally { setLoading(false); } }, [kind]);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return q ? rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))) : rows; }, [query, rows]);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = async () => { setEditing(null); setError(""); setSuccess(""); setTeacherSubjects([]); setTeacherClasses([]); if (isStudent) setForm({ name: "", sid: await nextStudentSid(), cls: "", sec: "", enroll: new Date().toISOString().slice(0, 10), status: "active", password: DEFAULT_STUDENT_PASSWORD, parentName: "", parentPhone: "" }); else setForm({ name: "", tid: await nextTeacherTid(), phone: "", status: "active", password: DEFAULT_TEACHER_PASSWORD }); };
  const openEdit = (row: Row) => { setEditing(row); setError(""); setSuccess(""); if (isStudent) setForm({ name: String(row.name ?? ""), sid: String(row.sid ?? ""), cls: String(row.cls ?? ""), sec: String(row.sec ?? ""), enroll: String(row.enroll ?? ""), status: String(row.status ?? "active"), password: "", parentName: String(row.parentname ?? row.parentName ?? ""), parentPhone: String(row.parentphone ?? row.parentPhone ?? "") }); else { setTeacherSubjects(String(row.subject ?? "").split(",").map((x) => x.trim()).filter(Boolean)); setTeacherClasses(Array.isArray(row.classes) ? row.classes.map(String) : []); setForm({ name: String(row.name ?? ""), tid: String(row.tid ?? ""), phone: String(row.phone ?? ""), status: String(row.status ?? "active"), password: "" }); } };
  const closeForm = () => { if (!saving) { setForm({}); setEditing(null); setTeacherSubjects([]); setTeacherClasses([]); setError(""); } };

  const save = async () => {
    if (!form.name?.trim()) return setError("Full Name is required.");
    setSaving(true); setError(""); setSuccess("");
    try {
      if (editing) {
        if (isStudent) {
          if (!form.cls || !form.sec || !form.parentName?.trim() || !form.parentPhone?.trim()) throw new Error("Fill all required student and parent fields.");
          await updR("students", editing.id, { name: form.name.trim(), sid: form.sid.trim(), cls: form.cls, sec: form.sec, parentname: form.parentName.trim(), parentphone: form.parentPhone.trim(), parentName: form.parentName.trim(), parentPhone: form.parentPhone.trim(), enroll: form.enroll, status: form.status });
          const users = (await gdb("users")) as Row[]; const su = users.find((u) => String(u.ref) === String(editing.id) && u.role === "student"); const pu = users.find((u) => String(u.ref) === String(editing.id) && u.role === "parent");
          const sa = await provision("student", form.sid.trim(), form.name.trim(), String(editing.id), "update", su?.auth_id ? String(su.auth_id) : null, form.password || undefined);
          const pa = await provision("parent", form.parentPhone.trim(), form.parentName.trim(), String(editing.id), "update", pu?.auth_id ? String(pu.auth_id) : null);
          if (sa.authId) { const p = { name: form.name.trim(), phone: form.sid.trim(), email: sa.email, status: form.status, auth_id: sa.authId }; if (su) await updR("users", su.id, p); else await addR("users", { id: `u-${sa.authId}`, ...p, role: "student", ref: editing.id }); }
          if (pa.authId) { const p = { name: form.parentName.trim(), phone: form.parentPhone.trim(), email: pa.email, status: form.status, auth_id: pa.authId }; if (pu) await updR("users", pu.id, p); else await addR("users", { id: `u-${pa.authId}`, ...p, role: "parent", ref: editing.id }); }
          await updR("students", editing.id, { parent: pa.authId || editing.parent || null }); setSuccess("Student and linked accounts updated successfully.");
        } else {
          if (!form.phone?.trim() || !teacherSubjects.length) throw new Error("Fill Name, Phone, and select at least one Subject.");
          await updR("teachers", editing.id, { name: form.name.trim(), tid: form.tid.trim(), subject: teacherSubjects.join(", "), phone: form.phone.trim(), status: form.status, classes: teacherClasses });
          const users = (await gdb("users")) as Row[]; const u = users.find((x) => String(x.ref) === String(editing.id) && x.role === "teacher"); const a = await provision("teacher", form.phone.trim(), form.name.trim(), String(editing.id), "update", u?.auth_id ? String(u.auth_id) : null, form.password || undefined);
          if (a.authId) { const p = { name: form.name.trim(), phone: form.phone.trim(), email: a.email, status: form.status, auth_id: a.authId }; if (u) await updR("users", u.id, p); else await addR("users", { id: `u-${a.authId}`, ...p, role: "teacher", ref: editing.id }); } setSuccess("Teacher and linked account updated successfully.");
        }
      } else if (isStudent) {
        if (!form.cls || !form.sec || !form.parentName?.trim() || !form.parentPhone?.trim()) throw new Error("Fill all required student and parent fields.");
        const sid = form.sid.trim(); const student = await addR("students", { id: `s-${Date.now()}`, name: form.name.trim(), sid, cls: form.cls, sec: form.sec, parentname: form.parentName.trim(), parentphone: form.parentPhone.trim(), parentName: form.parentName.trim(), parentPhone: form.parentPhone.trim(), enroll: form.enroll, status: form.status || "active" });
        try { const sa = await provision("student", sid, form.name.trim(), String(student.id), "create", null, form.password || DEFAULT_STUDENT_PASSWORD); const pa = await provision("parent", form.parentPhone.trim(), form.parentName.trim(), String(student.id), "create", null, DEFAULT_PARENT_PASSWORD); await updR("students", student.id, { parent: pa.authId || null }); await addR("users", { id: `u-${sa.authId}`, name: form.name.trim(), phone: sid, email: sa.email, role: "student", ref: student.id, status: "active", auth_id: sa.authId }); await addR("users", { id: `u-${pa.authId}`, name: form.parentName.trim(), phone: form.parentPhone.trim(), email: pa.email, role: "parent", ref: student.id, status: "active", auth_id: pa.authId }); setSuccess(`Student ${form.name.trim()} created with SID ${sid}. Credentials are shown only once.`); } catch (e) { await delR("students", student.id); throw new Error(`Account creation failed and the student record was rolled back: ${e instanceof Error ? e.message : "Unknown error"}`); }
      } else {
        if (!form.phone?.trim() || !teacherSubjects.length) throw new Error("Fill Name, Phone, and select at least one Subject.");
        const teacher = await addR("teachers", { id: `t-${Date.now()}`, name: form.name.trim(), tid: form.tid, subject: teacherSubjects.join(", "), phone: form.phone.trim(), classes: teacherClasses, status: "active" });
        try { const a = await provision("teacher", form.phone.trim(), form.name.trim(), String(teacher.id), "create", null, form.password || DEFAULT_TEACHER_PASSWORD); await addR("users", { id: `u-${a.authId}`, name: form.name.trim(), phone: form.phone.trim(), email: a.email, role: "teacher", ref: teacher.id, status: "active", auth_id: a.authId }); setSuccess(`Teacher ${form.name.trim()} created. Credentials are shown only once.`); } catch (e) { await delR("teachers", teacher.id); throw new Error(`Account creation failed and the teacher record was rolled back: ${e instanceof Error ? e.message : "Unknown error"}`); }
      }
      closeForm(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save record."); } finally { setSaving(false); }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(isStudent ? "Delete this student and all linked accounts?" : "Delete this teacher and their account?")) return;
    setSaving(true); setError(""); setSuccess("");
    try { const users = (await gdb("users")) as Row[]; const roles = isStudent ? ["student", "parent"] : ["teacher"]; const linked = users.filter((u) => String(u.ref) === String(row.id) && roles.includes(String(u.role))); for (const u of linked) { try { await provision(u.role, String(u.phone ?? (isStudent ? row.sid : row.tid)), String(u.name ?? row.name ?? "User"), String(row.id), "delete", u.auth_id ? String(u.auth_id) : null); } catch (e) { console.warn("Auth cleanup skipped:", e); } await delR("users", u.id); } await delR(kind, row.id); setRows((r) => r.filter((x) => x.id !== row.id)); setSuccess(isStudent ? "Student and linked accounts deleted." : "Teacher and linked account deleted."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete record."); } finally { setSaving(false); }
  };

  const hasForm = Object.keys(form).length > 0;
  return <div style={{ padding: 28, background: "#F7F9FF", minHeight: "100%" }}>
    {success && <div style={{ ...card, padding: 13, marginBottom: 16, background: "#F0FDF4", color: "#16A34A", fontWeight: 700 }}>{success}</div>}
    {error && <div style={{ ...card, padding: 13, marginBottom: 16, background: "#FFF7F7", color: C.red }}>{error}</div>}
    <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by name or ID…" style={{ flex: "1 1 280px", padding: "11px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#fff" }} /><button type="button" onClick={() => void openNew()} style={{ border: 0, borderRadius: 12, padding: "11px 16px", background: C.accent, color: "#fff", fontWeight: 800 }}>{isStudent ? "🎓 + Add Student" : "👨‍🏫 + Add Teacher"}</button></div>
    <div style={{ ...card, overflow: "hidden" }}>{loading ? <div style={{ padding: 30, color: C.sub }}>Loading records…</div> : !filtered.length ? <div style={{ padding: 45, textAlign: "center", color: C.sub }}>No records found.</div> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: isStudent ? 850 : 780 }}><thead><tr>{(isStudent ? ["SID", "Student Name", "Class", "Parent", "Parent Phone", "Status", "Actions"] : ["Teacher ID", "Name", "Subject", "Phone", "Classes", "Status", "Actions"]).map((h) => <th key={h} style={{ padding: "12px 14px", background: "#F8FAFF", textAlign: "left", fontSize: 12, color: C.sub }}>{h}</th>)}</tr></thead><tbody>{filtered.map((r) => <tr key={String(r.id)} style={{ borderTop: `1px solid ${C.border}` }}>{isStudent ? <><td style={{ padding: 12 }}>{String(r.sid)}</td><td style={{ padding: 12, fontWeight: 700 }}>{String(r.name)}</td><td style={{ padding: 12 }}>{String(r.cls)}-{String(r.sec)}</td><td style={{ padding: 12 }}>{String(r.parentname ?? r.parentName ?? "—")}</td><td style={{ padding: 12 }}>{String(r.parentphone ?? r.parentPhone ?? "—")}</td><td style={{ padding: 12 }}>{String(r.status ?? "active")}</td></> : <><td style={{ padding: 12 }}>{String(r.tid)}</td><td style={{ padding: 12, fontWeight: 700 }}>{String(r.name)}</td><td style={{ padding: 12 }}>{String(r.subject ?? "—")}</td><td style={{ padding: 12 }}>{String(r.phone ?? "—")}</td><td style={{ padding: 12 }}>{Array.isArray(r.classes) ? r.classes.join(", ") : "—"}</td><td style={{ padding: 12 }}>{String(r.status ?? "active")}</td></>}<td style={{ padding: 12, whiteSpace: "nowrap" }}><button type="button" onClick={() => openEdit(r)} style={{ border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, borderRadius: 8, padding: "7px 10px", marginRight: 6 }}>Edit</button><button type="button" disabled={saving} onClick={() => void remove(r)} style={{ border: 0, background: "#FFF1F2", color: C.red, borderRadius: 8, padding: "7px 10px" }}>Delete</button></td></tr>)}</tbody></table></div>}</div>
    {hasForm && <div onClick={closeForm} style={{ position: "fixed", inset: 0, background: "rgba(15,27,61,.6)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}><div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: "min(900px,100%)", maxHeight: "92vh", overflowY: "auto", padding: 26 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0 }}>{editing ? `Edit ${isStudent ? "Student" : "Teacher"}` : `Add New ${isStudent ? "Student" : "Teacher"}`}</h2><button type="button" onClick={closeForm}>✕</button></div>
      {isStudent ? <><div style={{ background: "#F0F9FF", borderRadius: 14, padding: 13, marginBottom: 18, color: "#0284C7", fontSize: 13 }}>🔐 Passwords are managed by Supabase Auth. They are never stored in the database. {editing ? "Leave Student Password blank to keep the current password." : "The default student password is 1234 and the parent password is parent@1234."}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}><Input label="Full Name" value={form.name ?? ""} onChange={(v) => set("name", v)} required /><Input label="SID / Login ID" value={form.sid ?? ""} onChange={(v) => set("sid", v)} disabled required note="Format: LG-001" /><Select label="Class" value={form.cls ?? ""} onChange={(v) => set("cls", v)} options={CLASSES} required /><Select label="Section" value={form.sec ?? ""} onChange={(v) => set("sec", v)} options={SECTIONS} required /><Input label="Enrollment Date" type="date" value={form.enroll ?? ""} onChange={(v) => set("enroll", v)} /><Select label="Status" value={form.status ?? "active"} onChange={(v) => set("status", v)} options={["active", "inactive"]} /><Input label={editing ? "New Student Password (optional)" : "Student Password"} value={form.password ?? ""} onChange={(v) => set("password", v)} placeholder={editing ? "Leave blank to keep current" : DEFAULT_STUDENT_PASSWORD} type="password" required={!editing} /></div><div style={{ marginTop: 18, fontWeight: 800 }}>👨‍👩‍👧 Parent Information</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, marginTop: 12 }}><Input label="Parent / Guardian Name" value={form.parentName ?? ""} onChange={(v) => set("parentName", v)} required /><Input label="Parent Phone (Login)" value={form.parentPhone ?? ""} onChange={(v) => set("parentPhone", v)} required /></div></> : <><div style={{ background: "#F0F9FF", borderRadius: 14, padding: 13, marginBottom: 18, color: "#0284C7", fontSize: 13 }}>🔐 Passwords are managed by Supabase Auth and are never stored in the database. {editing ? "Leave the password blank to keep the current password." : `Default teacher password: ${DEFAULT_TEACHER_PASSWORD}.`}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}><Input label="Full Name" value={form.name ?? ""} onChange={(v) => set("name", v)} required /><Input label="Teacher ID" value={form.tid ?? ""} onChange={(v) => set("tid", v)} disabled required /><Input label="Phone (Login ID)" value={form.phone ?? ""} onChange={(v) => set("phone", v)} required /><Input label={editing ? "New Password (optional)" : "Password"} value={form.password ?? ""} onChange={(v) => set("password", v)} type="password" required={!editing} placeholder={editing ? "Leave blank to keep current" : DEFAULT_TEACHER_PASSWORD} /><Select label="Status" value={form.status ?? "active"} onChange={(v) => set("status", v)} options={["active", "inactive"]} /></div><div style={{ marginTop: 14 }}><MultiSelect label="Subjects" value={teacherSubjects} onChange={setTeacherSubjects} options={TEACHER_SUBJECTS} /></div><div style={{ marginTop: 14 }}><MultiSelect label="Assigned Classes" value={teacherClasses} onChange={setTeacherClasses} options={CLASSES.map((c) => `Class ${c}`)} /></div></>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}><button type="button" onClick={closeForm} style={{ border: `1px solid ${C.sub}`, background: "transparent", borderRadius: 10, padding: "10px 16px" }}>Cancel</button><button type="button" disabled={saving} onClick={() => void save()} style={{ border: 0, background: C.accent, color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 800 }}>{saving ? "Saving…" : editing ? "Save Changes" : isStudent ? "Add Student + Create Accounts" : "Add Teacher + Create Account"}</button></div>
    </div></div>}
  </div>;
}
