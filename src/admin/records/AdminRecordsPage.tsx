import { useCallback, useEffect, useMemo, useState } from "react";
import { C, addR, delR, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, unknown> & { id: string | number };
type Kind = "students" | "teachers";
type Props = { kind: Kind };

const DEFAULT_STUDENT_PASSWORD = "1234";
const DEFAULT_TEACHER_PASSWORD = "1234";
const DEFAULT_PARENT_PASSWORD = "parent@1234";

const fields: Record<Kind, Array<{ key: string; label: string; placeholder: string }>> = {
  students: [
    { key: "name", label: "Name", placeholder: "Student name" },
    { key: "cls", label: "Class", placeholder: "10" },
    { key: "sec", label: "Section", placeholder: "A" },
    { key: "parentname", label: "Parent Name", placeholder: "Parent name" },
    { key: "parentphone", label: "Parent Phone", placeholder: "9876543210" },
    { key: "status", label: "Status", placeholder: "active" },
  ],
  teachers: [
    { key: "name", label: "Name", placeholder: "Teacher name" },
    { key: "subject", label: "Subject", placeholder: "Mathematics" },
    { key: "phone", label: "Phone / Login", placeholder: "9876543210" },
    { key: "status", label: "Status", placeholder: "active" },
  ],
};

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 18,
  boxShadow: "0 4px 20px rgba(15,27,61,.06)",
};

async function provision(role: "student" | "parent" | "teacher", loginId: string, password: string, name: string, ref: string) {
  const { data, error } = await supabase.functions.invoke("admin-provision-user", {
    body: { action: "create", role, loginId, password, name, ref },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { authId: string; email: string };
}

async function nextStudentSid() {
  const rows = (await gdb("students")) as Row[];
  let max = 0;
  for (const row of rows) {
    const match = String(row.sid ?? "").match(/^LG(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `LG${String(max + 1).padStart(3, "0")}`;
}

async function nextTeacherTid() {
  const rows = (await gdb("teachers")) as Row[];
  let max = 0;
  for (const row of rows) {
    const match = String(row.tid ?? "").match(/^LGT(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `LGT${String(max + 1).padStart(2, "0")}`;
}

export default function AdminRecordsPage({ kind }: Props) {
  const config = fields[kind];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows((await gdb(kind)) as Row[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => config.some((field) => String(row[field.key] ?? "").toLowerCase().includes(q)));
  }, [config, query, rows]);

  const openNew = () => {
    setEditing(null);
    setError("");
    setSuccess("");
    setForm(Object.fromEntries(config.map((field) => [field.key, field.key === "status" ? "active" : ""])));
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setError("");
    setSuccess("");
    setForm(Object.fromEntries(config.map((field) => [field.key, String(row[field.key] ?? "")] )));
  };

  const save = async () => {
    if (!form.name?.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (editing) {
        const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== ""));
        await updR(kind, editing.id, payload);
        setSuccess("Record updated successfully.");
      } else if (kind === "students") {
        if (!form.parentphone?.trim()) throw new Error("Parent phone is required so the parent login can be created.");
        const sid = await nextStudentSid();
        const student = await addR("students", {
          id: `s-${Date.now()}`,
          name: form.name.trim(),
          sid,
          cls: form.cls.trim(),
          sec: form.sec.trim(),
          parentname: form.parentname.trim(),
          parentphone: form.parentphone.trim(),
          parent: null,
          enroll: new Date().toISOString().slice(0, 10),
          status: form.status.trim() || "active",
        });
        try {
          const studentAuth = await provision("student", sid, DEFAULT_STUDENT_PASSWORD, student.name as string, String(student.id));
          const parentAuth = await provision("parent", form.parentphone.trim(), DEFAULT_PARENT_PASSWORD, form.parentname.trim() || "Parent", String(student.id));
          await updR("students", student.id, { parent: parentAuth.authId });
          await addR("users", { id: `u-${studentAuth.authId}`, name: student.name, phone: sid, email: studentAuth.email, role: "student", ref: student.id, status: "active", pass: DEFAULT_STUDENT_PASSWORD, auth_id: studentAuth.authId });
          await addR("users", { id: `u-${parentAuth.authId}`, name: form.parentname.trim() || "Parent", phone: form.parentphone.trim(), email: parentAuth.email, role: "parent", ref: student.id, status: "active", pass: DEFAULT_PARENT_PASSWORD, auth_id: parentAuth.authId });
          setSuccess(`${sid} created. Student password: ${DEFAULT_STUDENT_PASSWORD} · Parent password: ${DEFAULT_PARENT_PASSWORD}`);
        } catch (accountError) {
          await delR("students", student.id);
          throw new Error(`Account creation failed, so the student was rolled back: ${accountError instanceof Error ? accountError.message : "Unknown error"}`);
        }
      } else {
        const tid = await nextTeacherTid();
        const teacher = await addR("teachers", {
          id: `t-${Date.now()}`,
          name: form.name.trim(),
          tid,
          subject: form.subject.trim(),
          phone: form.phone.trim(),
          classes: [],
          status: form.status.trim() || "active",
        });
        try {
          const auth = await provision("teacher", form.phone.trim() || tid, DEFAULT_TEACHER_PASSWORD, teacher.name as string, String(teacher.id));
          await addR("users", { id: `u-${auth.authId}`, name: teacher.name, phone: form.phone.trim(), email: auth.email, role: "teacher", ref: teacher.id, status: "active", pass: DEFAULT_TEACHER_PASSWORD, auth_id: auth.authId });
          setSuccess(`${tid} created. Default password: ${DEFAULT_TEACHER_PASSWORD}`);
        } catch (accountError) {
          await delR("teachers", teacher.id);
          throw new Error(`Account creation failed, so the teacher was rolled back: ${accountError instanceof Error ? accountError.message : "Unknown error"}`);
        }
      }
      setForm({});
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete ${String(row.name || "this record")}?`)) return;
    setError("");
    setSuccess("");
    try {
      await delR(kind, row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSuccess("Record deleted from Supabase.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete record.");
    }
  };

  return (
    <div style={{ padding: 28, background: "#F7F9FF", minHeight: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 18 }}>
        <div><h2 style={{ margin: 0, color: C.text, fontSize: 24 }}>{kind === "students" ? "Students" : "Teachers"}</h2><p style={{ margin: "5px 0 0", color: C.sub, fontSize: 13 }}>{rows.length} records from Supabase</p></div>
        <button type="button" onClick={openNew} style={{ border: 0, borderRadius: 12, padding: "11px 16px", background: C.accent, color: "#fff", fontWeight: 800, cursor: "pointer" }}>+ Add {kind === "students" ? "Student" : "Teacher"}</button>
      </div>
      {error && <div style={{ ...card, padding: 14, marginBottom: 16, color: C.red, background: "#FFF7F7" }}>{error}</div>}
      {success && <div style={{ ...card, padding: 14, marginBottom: 16, color: "#15803D", background: "#F0FDF4" }}>{success}</div>}
      <div style={{ ...card, padding: 16, marginBottom: 16 }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind}...`} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 13px", outline: "none" }} /></div>
      {(editing || Object.keys(form).length > 0) && <div style={{ ...card, padding: 20, marginBottom: 18 }}>
        <div style={{ fontWeight: 800, color: C.text, marginBottom: 6 }}>{editing ? "Edit record" : `Add ${kind === "students" ? "Student" : "Teacher"}`}</div>
        {!editing && <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>{kind === "students" ? `SID and both login accounts are automatic. Student password: ${DEFAULT_STUDENT_PASSWORD}; parent password: ${DEFAULT_PARENT_PASSWORD}.` : `Teacher ID and login account are automatic. Default password: ${DEFAULT_TEACHER_PASSWORD}.`}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {config.map((field) => <label key={field.key} style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{field.label}<input value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} style={{ width: "100%", boxSizing: "border-box", marginTop: 6, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 11px" }} /></label>)}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}><button type="button" onClick={() => { setForm({}); setEditing(null); }} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", background: "#fff", cursor: "pointer" }}>Cancel</button><button type="button" onClick={() => void save()} disabled={saving} style={{ border: 0, borderRadius: 10, padding: "9px 16px", background: C.accent, color: "#fff", fontWeight: 800, cursor: "pointer" }}>{saving ? "Creating accounts..." : "Save"}</button></div>
      </div>}
      <div style={{ ...card, overflowX: "auto" }}>
        {loading ? <div style={{ padding: 24, color: C.sub }}>Loading records...</div> : filtered.length === 0 ? <div style={{ padding: 24, color: C.sub }}>No records found.</div> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}><thead><tr>{config.map((field) => <th key={field.key} style={{ textAlign: "left", padding: 13, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.border}` }}>{field.label}</th>)}<th style={{ padding: 13, textAlign: "right", fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.border}` }}>Actions</th></tr></thead><tbody>{filtered.map((row) => <tr key={String(row.id)}>{config.map((field) => <td key={field.key} style={{ padding: 13, fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}>{String(row[field.key] ?? "—")}</td>)}<td style={{ padding: 13, textAlign: "right", whiteSpace: "nowrap" }}><button type="button" onClick={() => openEdit(row)} style={{ border: 0, background: "#EEF2FF", color: C.accent, borderRadius: 8, padding: "7px 10px", cursor: "pointer", marginRight: 6 }}>Edit</button><button type="button" onClick={() => void remove(row)} style={{ border: 0, background: "#FFF1F2", color: C.red, borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>Delete</button></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
