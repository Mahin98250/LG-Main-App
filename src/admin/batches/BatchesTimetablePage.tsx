import { useCallback, useEffect, useMemo, useState } from "react";
import { C, addR, delR, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any> & { id?: string | number };
const CLASSES = ["9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECTS: Record<string, string[]> = {
  "9": ["Science", "English", "Maths", "Social Studies"],
  "10": ["Science", "English", "Maths", "Social Studies"],
  "11": ["Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Informatics Practices", "Entrepreneurship", "Physical Education"],
  "12": ["Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Informatics Practices", "Entrepreneurship", "Physical Education"],
};
const css = `*{box-sizing:border-box}.bt{padding:28px;background:#F7F9FF;min-height:100%}.btcard{background:#fff;border:1px solid ${C.border};border-radius:18px;box-shadow:0 4px 20px rgba(15,27,61,.07)}.btbtn{border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}.btfield{display:block}.btfield span{display:block;font-size:12px;font-weight:750;color:${C.sub};margin-bottom:6px}.btfield input,.btfield select,.btfield textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid ${C.border};border-radius:10px;background:#F8FAFF}.bttable{width:100%;border-collapse:collapse}.bttable th{background:#F8FAFF;color:${C.sub};text-align:left;padding:12px;font-size:12px}.bttable td{padding:12px;border-top:1px solid ${C.border};font-size:13px}.btday{display:flex;gap:8px;flex-wrap:wrap}.btday label{border:1px solid ${C.border};border-radius:10px;padding:8px 10px;font-size:12px;cursor:pointer}.btday input{margin-right:6px}.btmodal{position:fixed;inset:0;background:rgba(15,27,61,.58);z-index:100;display:grid;place-items:center;padding:16px}.btbox{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:24px}.btgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:700px){.bt{padding:16px}.btgrid{grid-template-columns:1fr}}`;

function Button({ children, onClick, outline = false, color = C.accent, disabled = false }: { children: React.ReactNode; onClick?: () => void; outline?: boolean; color?: string; disabled?: boolean }) {
  return <button type="button" className="btbtn" disabled={disabled} onClick={onClick} style={{ background: outline ? "transparent" : color, color: outline ? color : "#fff", border: outline ? `1.5px solid ${color}` : 0, opacity: disabled ? .6 : 1 }}>{children}</button>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="btmodal" onClick={onClose}><div className="btbox" onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, color: C.text }}>{title}</h2><button type="button" onClick={onClose} style={{ border: 0, background: "#F1F5F9", borderRadius: 9, padding: 8, cursor: "pointer" }}>✕</button></div>{children}</div></div>;
}
function Field({ label, value, onChange, options, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; options?: string[]; type?: string; placeholder?: string }) {
  return <label className="btfield"><span>{label}</span>{options ? <select value={value} onChange={e => onChange(e.target.value)}><option value="">Select…</option>{options.map(x => <option key={x} value={x}>{x}</option>)}</select> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}</label>;
}

export default function BatchesTimetablePage() {
  const [tab, setTab] = useState<"batches" | "timetable">("batches");
  const [batches, setBatches] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [memberships, setMemberships] = useState<Row[]>([]);
  const [teachers, setTeachers] = useState<Row[]>([]);
  const [timetable, setTimetable] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [batchModal, setBatchModal] = useState(false);
  const [studentModal, setStudentModal] = useState<Row | null>(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Row | null>(null);
  const [deleteBatch, setDeleteBatch] = useState<Row | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<Row | null>(null);
  const [query, setQuery] = useState("");
  const [batchForm, setBatchForm] = useState({ name: "", cls: "", sec: "", capacity: "", status: "active", description: "" });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ batchId: "", teacherId: "", subject: "", days: [] as string[], start: "17:00", end: "18:00", room: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [b, s, m, t, tt] = await Promise.all([gdb("batches"), gdb("students"), gdb("batch_students"), gdb("teachers"), gdb("timetable_entries")]);
      setBatches(b as Row[]); setStudents(s as Row[]); setMemberships(m as Row[]); setTeachers(t as Row[]); setTimetable(tt as Row[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load batches and timetable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const activeMemberships = useMemo(() => memberships.filter(m => String(m.status ?? "active") === "active"), [memberships]);
  const filteredBatches = useMemo(() => { const q = query.trim().toLowerCase(); return q ? batches.filter(b => `${b.name} ${b.cls} ${b.sec}`.toLowerCase().includes(q)) : batches; }, [batches, query]);
  const batchName = (id: any) => batches.find(b => String(b.id) === String(id))?.name ?? "Unknown batch";
  const teacherName = (id: any) => teachers.find(t => String(t.id) === String(id))?.name ?? "Unknown teacher";
  const classSubjects = (batchId: string) => SUBJECTS[String(batches.find(b => String(b.id) === batchId)?.cls ?? "")] ?? [];

  const saveBatch = async () => {
    if (!batchForm.name.trim() || !batchForm.cls) { setError("Batch Name and Class are required."); return; }
    const capacity = batchForm.capacity.trim() ? Number(batchForm.capacity) : null;
    if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) { setError("Capacity must be a positive whole number."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name: batchForm.name.trim(), code: batchForm.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, ""), cls: batchForm.cls, sec: batchForm.sec || "All", capacity, status: batchForm.status || "active", description: batchForm.description.trim() };
      if (editingBatch) await updR("batches", editingBatch.id, payload); else await addR("batches", { id: `batch-${Date.now()}`, ...payload });
      setBatchModal(false); await load(); setSuccess(editingBatch ? "Batch updated successfully." : "Batch created successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save batch."); }
    finally { setSaving(false); }
  };
  const openBatch = (b?: Row) => { setEditingBatch(b ?? null); setBatchForm(b ? { name: String(b.name ?? ""), cls: String(b.cls ?? ""), sec: String(b.sec ?? ""), capacity: b.capacity == null ? "" : String(b.capacity), status: String(b.status ?? "active"), description: String(b.description ?? "") } : { name: "", cls: "", sec: "", capacity: "", status: "active", description: "" }); setError(""); setBatchModal(true); };

  const openStudents = (b: Row) => { setError(""); setStudentModal(b); setSelectedStudents(activeMemberships.filter(m => String(m.batch_id) === String(b.id)).map(m => String(m.student_id))); };
  const saveStudents = async () => {
    if (!studentModal) return;
    const batchId = String(studentModal.id); const current = activeMemberships.filter(m => String(m.batch_id) === batchId); const currentIds = new Set(current.map(m => String(m.student_id))); const selected = new Set(selectedStudents); const additions = selectedStudents.filter(id => !currentIds.has(id)); const removals = current.filter(m => !selected.has(String(m.student_id))); const cap = studentModal.capacity == null ? null : Number(studentModal.capacity);
    if (cap !== null && selectedStudents.length > cap) { setError(`Capacity is ${cap}; you selected ${selectedStudents.length}.`); return; }
    setSaving(true); setError("");
    try {
      for (const m of removals) { const { error: e } = await supabase.from("batch_students").delete().eq("batch_id", batchId).eq("student_id", String(m.student_id)); if (e) throw e; }
      for (const id of additions) await addR("batch_students", { batch_id: batchId, student_id: id, status: "active" });
      setStudentModal(null); await load(); setSuccess("Batch students updated successfully.");
    } catch (e) { await load(); setError(e instanceof Error ? e.message : "Unable to update students. A student may already belong to another active batch."); }
    finally { setSaving(false); }
  };
  const removeBatch = async () => { if (!deleteBatch) return; setSaving(true); try { await delR("batches", deleteBatch.id); setDeleteBatch(null); await load(); setSuccess("Batch deleted. Student accounts were kept."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete batch."); } finally { setSaving(false); } };

  const saveSchedule = async () => {
    if (!scheduleForm.batchId || !scheduleForm.teacherId || !scheduleForm.subject || !scheduleForm.days.length || !scheduleForm.start || !scheduleForm.end) { setError("Select batch, teacher, subject, at least one day, start time and end time."); return; }
    if (scheduleForm.end <= scheduleForm.start) { setError("End time must be after start time."); return; }
    setSaving(true); setError("");
    try {
      for (const day of scheduleForm.days) {
        const dayNo = DAYS.indexOf(day) + 1;
        const { error: e } = await supabase.from("timetable_entries").insert({ id: `tt-${Date.now()}-${dayNo}-${Math.random().toString(36).slice(2,7)}`, batch_id: scheduleForm.batchId, teacher_id: scheduleForm.teacherId, subject_name: scheduleForm.subject, day_of_week: dayNo, start_time: scheduleForm.start, end_time: scheduleForm.end, room_id: scheduleForm.room || null, status: "active" });
        if (e) throw e;
      }
      setScheduleModal(false); await load(); setSuccess("Timetable schedule added successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save timetable. The teacher may already have an overlapping class."); }
    finally { setSaving(false); }
  };
  const removeSchedule = async () => { if (!deleteSchedule) return; setSaving(true); try { await delR("timetable_entries", deleteSchedule.id); setDeleteSchedule(null); await load(); setSuccess("Timetable entry deleted."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete timetable entry."); } finally { setSaving(false); } };

  return <><style>{css}</style><div className="bt">
    {error && <div className="btcard" style={{ padding: 12, marginBottom: 14, color: C.red, background: "#FFF7F7" }}>⚠️ {error}</div>}
    {success && <div className="btcard" style={{ padding: 12, marginBottom: 14, color: "#15803D", background: "#F0FDF4" }}>✅ {success}</div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}><div><h1 style={{ margin: 0, color: C.text, fontSize: 24 }}>Batches & Timetable</h1><p style={{ margin: "5px 0 0", color: C.sub, fontSize: 13 }}>Batches contain students. Timetable assigns teachers, subjects, days and times.</p></div><Button onClick={load} outline>↻ Refresh</Button></div>
    <div className="btcard" style={{ display: "flex", gap: 6, padding: 7, marginBottom: 18 }}><button type="button" className="btbtn" onClick={() => setTab("batches")} style={{ background: tab === "batches" ? C.accent : "transparent", color: tab === "batches" ? "#fff" : C.sub }}>👥 Batches</button><button type="button" className="btbtn" onClick={() => setTab("timetable")} style={{ background: tab === "timetable" ? C.accent : "transparent", color: tab === "timetable" ? "#fff" : C.sub }}>🗓️ Timetable</button></div>
    {loading ? <div className="btcard" style={{ padding: 45, textAlign: "center", color: C.sub }}>Loading…</div> : tab === "batches" ? <>
      <div className="btcard" style={{ padding: 14, marginBottom: 16 }}><div style={{ display: "flex", gap: 10 }}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search batch name, class or section…" style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px" }} /><Button onClick={() => openBatch()}>+ Create Batch</Button></div></div>
      {filteredBatches.length === 0 ? <div className="btcard" style={{ padding: 50, textAlign: "center" }}><div style={{ fontSize: 40 }}>👥</div><h3>No batches yet</h3><p style={{ color: C.sub }}>Create your first batch, then add students.</p><Button onClick={() => openBatch()}>+ Create Batch</Button></div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 16 }}>{filteredBatches.map(b => { const count = activeMemberships.filter(m => String(m.batch_id) === String(b.id)).length; return <div key={String(b.id)} className="btcard" style={{ padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><h3 style={{ margin: 0, color: C.text }}>{b.name}</h3><div style={{ color: C.sub, fontSize: 12, marginTop: 5 }}>Class {b.cls}{b.sec && b.sec !== "All" ? ` · Section ${b.sec}` : ""}</div></div><span style={{ fontSize: 10, fontWeight: 800, color: b.status === "active" ? "#15803D" : C.red }}>{String(b.status ?? "active").toUpperCase()}</span></div><div style={{ margin: "18px 0", padding: 14, background: "#F8FAFF", borderRadius: 12 }}><div style={{ fontSize: 26, fontWeight: 900, color: C.accent }}>{count}{b.capacity != null && <span style={{ fontSize: 14, color: C.sub }}> / {b.capacity}</span>}</div><div style={{ fontSize: 11, color: C.sub }}>students in this batch</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Button onClick={() => openStudents(b)}>👥 Students</Button><Button outline onClick={() => openBatch(b)}>Edit</Button><Button outline color={C.red} onClick={() => setDeleteBatch(b)}>Delete</Button></div></div>; })}</div>}
    </> : <>
      <div className="btcard" style={{ padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}><div><b style={{ color: C.text }}>Weekly timetable</b><div style={{ color: C.sub, fontSize: 12 }}>Only overlapping schedules for the same teacher are rejected.</div></div><Button onClick={() => { setError(""); setScheduleForm({ batchId: "", teacherId: "", subject: "", days: [], start: "17:00", end: "18:00", room: "" }); setScheduleModal(true); }}>+ Add Schedule</Button></div>
      <div className="btcard" style={{ overflow: "auto" }}><table className="bttable"><thead><tr><th>Batch</th><th>Subject</th><th>Teacher</th><th>Day</th><th>Time</th><th>Room</th><th></th></tr></thead><tbody>{timetable.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 45, color: C.sub }}>No timetable entries yet. Click <b>+ Add Schedule</b>.</td></tr> : timetable.map(x => <tr key={String(x.id)}><td>{batchName(x.batch_id)}</td><td>{x.subject_name}</td><td>{teacherName(x.teacher_id)}</td><td>{DAYS[(Number(x.day_of_week) || 1) - 1] ?? "—"}</td><td>{String(x.start_time).slice(0,5)}–{String(x.end_time).slice(0,5)}</td><td>{x.room_id ?? "—"}</td><td><Button outline color={C.red} onClick={() => setDeleteSchedule(x)}>Delete</Button></td></tr>)}</tbody></table></div>
    </>}

    {batchModal && <Modal title={editingBatch ? "Edit Batch" : "Create Batch"} onClose={() => !saving && setBatchModal(false)}><div className="btgrid"><Field label="Batch Name" value={batchForm.name} onChange={v => setBatchForm(f => ({ ...f, name: v }))} placeholder="10 Morning"/><Field label="Class" value={batchForm.cls} onChange={v => setBatchForm(f => ({ ...f, cls: v }))} options={CLASSES}/><Field label="Section (optional)" value={batchForm.sec} onChange={v => setBatchForm(f => ({ ...f, sec: v }))} options={SECTIONS}/><Field label="Capacity (optional)" value={batchForm.capacity} onChange={v => setBatchForm(f => ({ ...f, capacity: v }))} type="number" placeholder="30"/><Field label="Status" value={batchForm.status} onChange={v => setBatchForm(f => ({ ...f, status: v }))} options={["active", "inactive"]/><label className="btfield" style={{ gridColumn: "1/-1" }}><span>Description</span><textarea value={batchForm.description} onChange={e => setBatchForm(f => ({ ...f, description: e.target.value }))} /></label></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}><Button outline onClick={() => setBatchModal(false)}>Cancel</Button><Button disabled={saving} onClick={() => void saveBatch()}>{saving ? "Saving…" : editingBatch ? "Save Changes" : "Create Batch"}</Button></div></Modal>}
    {studentModal && <Modal title={`Students — ${studentModal.name}`} onClose={() => !saving && setStudentModal(null)}><p style={{ color: C.sub, fontSize: 13 }}>Select the students who belong to this batch. A student can have only one active batch.</p><div style={{ maxHeight: 430, overflow: "auto", border: `1px solid ${C.border}`, borderRadius: 12 }}>{students.filter(s => String(s.status ?? "active") === "active").map(s => { const checked = selectedStudents.includes(String(s.id)); const other = activeMemberships.find(m => String(m.student_id) === String(s.id) && String(m.batch_id) !== String(studentModal.id)); return <label key={String(s.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: 11, borderBottom: `1px solid ${C.border}`, opacity: other ? .5 : 1 }}><input type="checkbox" checked={checked} disabled={!!other} onChange={() => setSelectedStudents(x => checked ? x.filter(id => id !== String(s.id)) : [...x, String(s.id)])}/><span><b>{s.name}</b><small style={{ display: "block", color: C.sub }}>{s.sid ?? s.id} · Class {s.cls}-{s.sec}{other ? " · Already in another batch" : ""}</small></span></label>; })}</div><div style={{ marginTop: 12, color: C.sub, fontSize: 12 }}>{selectedStudents.length} selected</div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><Button outline onClick={() => setStudentModal(null)}>Cancel</Button><Button disabled={saving} onClick={() => void saveStudents()}>{saving ? "Saving…" : "Save Students"}</Button></div></Modal>}
    {scheduleModal && <Modal title="Add Timetable Schedule" onClose={() => !saving && setScheduleModal(false)}><div className="btgrid"><Field label="Batch" value={scheduleForm.batchId} onChange={v => setScheduleForm(f => ({ ...f, batchId: v, subject: "" }))} options={batches.filter(b => String(b.status ?? "active") === "active").map(b => `${b.id}::${b.name}`)}/><Field label="Teacher" value={scheduleForm.teacherId} onChange={v => setScheduleForm(f => ({ ...f, teacherId: v }))} options={teachers.filter(t => String(t.status ?? "active") === "active").map(t => String(t.id))}/><Field label="Subject" value={scheduleForm.subject} onChange={v => setScheduleForm(f => ({ ...f, subject: v }))} options={scheduleForm.batchId ? classSubjects(scheduleForm.batchId.split("::")[0]) : []}/><Field label="Room (optional)" value={scheduleForm.room} onChange={v => setScheduleForm(f => ({ ...f, room: v }))} options={["Room 1", "Room 2", "Cabin"]}/><Field label="Start Time" value={scheduleForm.start} onChange={v => setScheduleForm(f => ({ ...f, start: v }))} type="time"/><Field label="End Time" value={scheduleForm.end} onChange={v => setScheduleForm(f => ({ ...f, end: v }))} type="time"/></div><div style={{ marginTop: 14 }}><div style={{ fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 7 }}>Days</div><div className="btday">{DAYS.map(day => <label key={day}><input type="checkbox" checked={scheduleForm.days.includes(day)} onChange={e => setScheduleForm(f => ({ ...f, days: e.target.checked ? [...f.days, day] : f.days.filter(d => d !== day) }))}/>{day}</label>)}</div></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}><Button outline onClick={() => setScheduleModal(false)}>Cancel</Button><Button disabled={saving} onClick={() => void saveSchedule()}>{saving ? "Saving…" : "Save Schedule"}</Button></div></Modal>}
    {deleteBatch && <Modal title="Delete Batch" onClose={() => !saving && setDeleteBatch(null)}><p style={{ color: C.sub }}>Delete <b>{deleteBatch.name}</b>? Students will not be deleted.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Button outline onClick={() => setDeleteBatch(null)}>Cancel</Button><Button color={C.red} disabled={saving} onClick={() => void removeBatch()}>Delete Batch</Button></div></Modal>}
    {deleteSchedule && <Modal title="Delete Schedule" onClose={() => !saving && setDeleteSchedule(null)}><p style={{ color: C.sub }}>Delete this timetable entry?</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Button outline onClick={() => setDeleteSchedule(null)}>Cancel</Button><Button color={C.red} disabled={saving} onClick={() => void removeSchedule()}>Delete</Button></div></Modal>}
  </div></>;
}
