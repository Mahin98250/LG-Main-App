import { useCallback, useEffect, useMemo, useState } from "react";
import { C, addR, delR, gdb, updR } from "@/lg/data";

type Row = Record<string, any> & { id: string | number };
const CLASSES = ["9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "All"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["7:00–8:00 AM", "8:00–9:00 AM", "9:00–10:00 AM", "10:00–11:00 AM", "11:00 AM–12:00 PM", "12:00–1:00 PM", "1:00–2:00 PM", "2:00–3:00 PM", "3:00–4:00 PM", "4:00–5:00 PM"];
const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Computer", "Physics", "Chemistry", "Biology", "History", "Geography", "Sanskrit", "Physical Education"];
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 4px 20px rgba(15,27,61,.07)" };

function Button({ children, onClick, outline = false, color = C.accent, disabled = false }: { children: React.ReactNode; onClick?: () => void; outline?: boolean; color?: string; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} style={{ border: outline ? `1.5px solid ${color}` : 0, background: outline ? "transparent" : color, color: outline ? color : "#fff", borderRadius: 11, padding: "9px 14px", fontWeight: 800, cursor: disabled ? "wait" : "pointer", opacity: disabled ? .65 : 1 }}>{children}</button>;
}
function Select({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return <label style={{ display: "block", flex: "1 1 240px", minWidth: 0 }}><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}{required && <b style={{ color: C.red }}> *</b>}</span><select value={value} required={required} onChange={e => onChange(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text, outline: "none" }}><option value="">Select…</option>{options.map(x => <option key={x} value={x}>{x}</option>)}</select></label>;
}
function Input({ label, value, onChange, placeholder = "", required = false, textarea = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; textarea?: boolean }) {
  return <label style={{ display: "block", flex: "1 1 240px", minWidth: 0 }}><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}{required && <b style={{ color: C.red }}> *</b>}</span>{textarea ? <textarea required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", minHeight: 86, boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text, outline: "none", resize: "vertical" }} /> : <input required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text, outline: "none" }} />}</label>;
}
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,27,61,.6)", display: "grid", placeItems: "center", padding: 16 }}><div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: `min(${wide ? 900 : 720}px,100%)`, maxHeight: "92vh", overflowY: "auto", padding: 26, boxShadow: "0 24px 72px rgba(15,27,61,.25)" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 18, color: C.text }}>{title}</h2><button type="button" onClick={onClose} style={{ border: 0, background: "#F8FAFF", color: C.sub, borderRadius: 9, padding: 8, cursor: "pointer" }}>✕</button></div>{children}</div></div>;
}

export default function BatchesTimetablePage() {
  const [tab, setTab] = useState<"batches" | "timetable">("batches");
  const [batches, setBatches] = useState<Row[]>([]);
  const [tt, setTt] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [teachers, setTeachers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [batchModal, setBatchModal] = useState(false);
  const [ttModal, setTtModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleteBatch, setDeleteBatch] = useState<Row | null>(null);
  const [deleteSlot, setDeleteSlot] = useState<Row | null>(null);
  const blankBatch = { name: "", cls: "10", sec: "A", status: "active", description: "", days: [] as string[], subjects: [] as string[], teacherIds: [] as string[], studentIds: [] as string[] };
  const [form, setForm] = useState(blankBatch);
  const [ttForm, setTtForm] = useState({ cls: "10", sec: "A", subject: "", tid: "", day: "Monday", slot: "8:00–9:00 AM", batchId: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [b, t, s, tc] = await Promise.all([gdb("batches"), gdb("timetable"), gdb("students"), gdb("teachers")]);
      setBatches(b as Row[]); setTt(t as Row[]); setStudents(s as Row[]); setTeachers(tc as Row[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load batches and timetable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const toast = (msg: string) => { setSuccess(msg); window.setTimeout(() => setSuccess(""), 3000); };
  const toggle = (key: "days" | "subjects" | "teacherIds" | "studentIds", value: string) => setForm(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value] }));
  const openAdd = () => { setEditing(null); setForm({ ...blankBatch }); setError(""); setBatchModal(true); };
  const openEdit = (b: Row) => { setEditing(b); setForm({ ...blankBatch, ...b, teacherIds: b.teacherIds ?? b.teacherids ?? [], studentIds: b.studentIds ?? b.studentids ?? [], days: b.days ?? [], subjects: b.subjects ?? [] }); setError(""); setBatchModal(true); };
  const saveBatch = async () => {
    if (!form.name.trim()) { setError("Enter batch name."); return; }
    if (!form.cls) { setError("Select a class."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name: form.name.trim(), cls: form.cls, sec: form.sec || "All", status: form.status || "active", description: form.description.trim(), days: form.days, subjects: form.subjects, teacherIds: form.teacherIds, studentIds: form.studentIds, teacherids: form.teacherIds, studentids: form.studentIds };
      if (editing) await updR("batches", editing.id, payload); else await addR("batches", { ...payload, id: `b${Date.now()}` });
      setBatchModal(false); await load(); toast(editing ? "Batch updated!" : "Batch created!");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save batch."); } finally { setSaving(false); }
  };
  const removeBatch = async () => { if (!deleteBatch) return; try { await delR("batches", deleteBatch.id); setDeleteBatch(null); await load(); toast("Batch deleted"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete batch."); setDeleteBatch(null); } };
  const saveTt = async () => {
    if (!ttForm.subject || !ttForm.tid) { setError("Select subject and teacher."); return; }
    setSaving(true); setError("");
    try {
      const remote = (await gdb("timetable")) as Row[];
      const clash = remote.find(t => t.cls === ttForm.cls && t.sec === ttForm.sec && t.day === ttForm.day && t.slot === ttForm.slot);
      if (clash) { setError(`Conflict! “${clash.subject}” is already scheduled at ${ttForm.day} ${ttForm.slot} for Class ${ttForm.cls}-${ttForm.sec}.`); return; }
      const batch = batches.find(b => b.id === ttForm.batchId);
      await addR("timetable", { id: `tt${Date.now()}`, cls: ttForm.cls, sec: ttForm.sec, subject: ttForm.subject, tid: ttForm.tid, day: ttForm.day, slot: ttForm.slot, batchid: ttForm.batchId || "", batchname: batch?.name || "" });
      setTtModal(false); setTtForm({ cls: "10", sec: "A", subject: "", tid: "", day: "Monday", slot: "8:00–9:00 AM", batchId: "" }); await load(); toast("Slot added to timetable!");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save timetable slot."); } finally { setSaving(false); }
  };
  const removeSlot = async () => { if (!deleteSlot) return; try { await delR("timetable", deleteSlot.id); setDeleteSlot(null); await load(); toast("Timetable slot removed."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove timetable slot."); setDeleteSlot(null); } };
  const teacherName = (id: string) => teachers.find(t => t.id === id)?.name || id || "—";
  const batchName = (r: Row) => r.batchname || batches.find(b => b.id === r.batchid || b.id === r.batchId)?.name || "";
  const classGroups = useMemo(() => [...new Set(tt.map(t => `${t.cls}-${t.sec}`))].sort(), [tt]);
  const dayOrder = new Map(DAYS.map((d, i) => [d, i]));

  return <div style={{ padding: 28, background: "#F7F9FF", minHeight: "100%" }}>
    {success && <div style={{ background: "#DCFCE7", borderRadius: 12, padding: "10px 18px", marginBottom: 16, color: "#16A34A", fontWeight: 700, fontSize: 13 }}>✅ {success}</div>}
    {error && <div style={{ ...card, padding: 14, marginBottom: 16, color: C.red, background: "#FFF7F7" }}>{error}</div>}
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}><button type="button" onClick={() => setTab("batches")} style={{ padding: "9px 20px", borderRadius: 10, border: 0, fontWeight: 700, background: tab === "batches" ? C.accent : "#EEF2FF", color: tab === "batches" ? "#fff" : C.sub }}>👥 Batches ({batches.length})</button><button type="button" onClick={() => setTab("timetable")} style={{ padding: "9px 20px", borderRadius: 10, border: 0, fontWeight: 700, background: tab === "timetable" ? C.accent : "#EEF2FF", color: tab === "timetable" ? "#fff" : C.sub }}>📅 Timetable ({tt.length})</button></div>

    {loading ? <div style={{ ...card, padding: 40, textAlign: "center", color: C.sub }}>Loading batches and timetable…</div> : tab === "batches" ? <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}><Button onClick={openAdd}>👥 + Create Batch</Button></div>
      {batches.length === 0 ? <div style={{ ...card, padding: "60px 40px", textAlign: "center" }}><div style={{ fontSize: 44 }}>👥</div><div style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 6px" }}>No batches yet</div><div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Create batches to organize students and assign timetable slots</div><Button onClick={openAdd}>👥 + Create First Batch</Button></div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {batches.map(b => { const ids = b.studentIds ?? b.studentids ?? []; const tids = b.teacherIds ?? b.teacherids ?? []; const bs = students.filter(s => ids.includes(s.id)); const bt = teachers.filter(t => tids.includes(t.id)); return <div key={String(b.id)} style={{ ...card, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14 }}><div><div style={{ fontWeight: 900, color: C.text, fontSize: 16 }}>{b.name}</div><div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>Class {b.cls}-{b.sec} · {b.status}</div></div><span style={{ background: b.status === "active" ? "#DCFCE7" : "#FEE2E2", color: b.status === "active" ? "#16A34A" : C.red, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{String(b.status || "active")}</span></div>
          {b.description && <div style={{ fontSize: 12, color: C.sub, marginBottom: 12, fontStyle: "italic" }}>{b.description}</div>}
          {Array.isArray(b.days) && b.days.length > 0 && <div style={{ marginBottom: 10 }}><b style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 4 }}>📅 DAYS</b>{b.days.map((d: string) => <span key={d} style={{ display: "inline-block", background: "#EEF2FF", color: C.accent, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, margin: "0 4px 4px 0" }}>{d.slice(0,3)}</span>)}</div>}
          {Array.isArray(b.subjects) && b.subjects.length > 0 && <div style={{ marginBottom: 10 }}><b style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 4 }}>📚 SUBJECTS</b>{b.subjects.map((s: string) => <span key={s} style={{ display: "inline-block", background: "#F0FDF4", color: "#16A34A", padding: "2px 10px", borderRadius: 20, fontSize: 11, margin: "0 4px 4px 0" }}>{s}</span>)}</div>}
          <div style={{ marginBottom: 10 }}><b style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 4 }}>👨‍🏫 TEACHERS ({bt.length})</b>{bt.length ? bt.map(t => <span key={t.id} style={{ display: "inline-block", background: "#FFF7ED", color: "#EA580C", padding: "2px 10px", borderRadius: 20, fontSize: 11, margin: "0 4px 4px 0" }}>{t.name}</span>) : <span style={{ fontSize: 11, color: C.sub }}>No teachers assigned</span>}</div>
          <div style={{ marginBottom: 14 }}><b style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 4 }}>🎓 STUDENTS ({bs.length})</b>{bs.length ? <>{bs.slice(0,5).map(s => <span key={s.id} style={{ display: "inline-block", background: "#EEF2FF", color: C.accent, padding: "2px 10px", borderRadius: 20, fontSize: 11, margin: "0 4px 4px 0" }}>{String(s.name).split(" ")[0]}</span>)}{bs.length > 5 && <span style={{ fontSize: 11, color: C.sub }}>+{bs.length - 5} more</span>}</> : <span style={{ fontSize: 11, color: C.sub }}>No students assigned</span>}</div>
          <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #EEF2FF" }}><Button onClick={() => openEdit(b)} outline>✏️ Edit</Button><Button onClick={() => setDeleteBatch(b)} outline color={C.red}>🗑 Delete</Button></div>
        </div>; })}
      </div>}
    </> : <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}><Button onClick={() => { setError(""); setTtModal(true); }}>📅 + Add Slot</Button></div>
      {tt.length === 0 ? <div style={{ ...card, padding: "60px 40px", textAlign: "center" }}><div style={{ fontSize: 44 }}>📅</div><div style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 6px" }}>No timetable slots yet</div><div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Add class slots and assign teachers to build the timetable</div><Button onClick={() => setTtModal(true)}>📅 + Add First Slot</Button></div> : classGroups.map(cls => { const rows = tt.filter(t => `${t.cls}-${t.sec}` === cls).sort((a,b) => (dayOrder.get(a.day) ?? 99) - (dayOrder.get(b.day) ?? 99) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot)); return <div key={cls} style={{ ...card, padding: 20, marginBottom: 16 }}><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Class {cls}</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: "#F8FAFF" }}>{["Day","Slot","Subject","Teacher","Batch",""] .map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.sub, fontSize: 11 }}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={String(r.id)} style={{ borderTop: `1px solid ${C.border}` }}><td style={{ padding: "10px 12px", fontWeight: 700 }}>{r.day}</td><td style={{ padding: "10px 12px", color: C.sub }}>{r.slot}</td><td style={{ padding: "10px 12px" }}><span style={{ background: "#EEF2FF", color: C.accent, borderRadius: 20, padding: "3px 9px", fontWeight: 700 }}>{r.subject}</span></td><td style={{ padding: "10px 12px" }}>{teacherName(r.tid)}</td><td style={{ padding: "10px 12px", color: C.sub }}>{batchName(r) || "—"}</td><td style={{ padding: "10px 12px" }}><button type="button" onClick={() => setDeleteSlot(r)} style={{ border: 0, background: "#FEE2E2", borderRadius: 7, padding: "4px 9px", color: C.red, cursor: "pointer" }}>🗑</button></td></tr>)}</tbody></table></div></div>; })}
    </>}

    {batchModal && <Modal title={editing ? "✏️ Edit Batch" : "👥 Create Batch"} onClose={() => setBatchModal(false)} wide><div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}><Input label="Batch Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Morning Batch A / Class 10 Elite" required /><Select label="Class" value={form.cls} onChange={v => setForm({ ...form, cls: v })} options={CLASSES} required /><Select label="Section" value={form.sec} onChange={v => setForm({ ...form, sec: v })} options={SECTIONS} /><Select label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={["active","inactive"]} /><Input label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Optional notes about this batch..." textarea /></div>
      <div style={{ marginBottom: 14 }}><b style={{ display: "block", fontSize: 13, marginBottom: 8 }}>📅 Class Days</b>{DAYS.map(d => <button key={d} type="button" onClick={() => toggle("days", d)} style={{ padding: "7px 16px", borderRadius: 10, border: `2px solid ${form.days.includes(d) ? C.accent : C.border}`, background: form.days.includes(d) ? C.accent : "#fff", color: form.days.includes(d) ? "#fff" : C.text, fontWeight: 700, fontSize: 12, cursor: "pointer", margin: "0 6px 6px 0" }}>{d.slice(0,3)}</button>)}</div>
      <div style={{ marginBottom: 14 }}><b style={{ display: "block", fontSize: 13, marginBottom: 8 }}>📚 Subjects</b>{SUBJECTS.map(s => <button key={s} type="button" onClick={() => toggle("subjects", s)} style={{ padding: "5px 13px", borderRadius: 20, border: `2px solid ${form.subjects.includes(s) ? "#22C55E" : C.border}`, background: form.subjects.includes(s) ? "#22C55E" : "#fff", color: form.subjects.includes(s) ? "#fff" : C.text, fontWeight: 600, fontSize: 11, cursor: "pointer", margin: "0 5px 5px 0" }}>{s}</button>)}</div>
      <div style={{ marginBottom: 14 }}><b style={{ display: "block", fontSize: 13, marginBottom: 8 }}>👨‍🏫 Assign Teachers ({form.teacherIds.length} selected)</b>{teachers.length ? teachers.map(t => { const sel = form.teacherIds.includes(t.id); return <button key={t.id} type="button" onClick={() => toggle("teacherIds", t.id)} style={{ padding: "7px 14px", borderRadius: 12, border: `2px solid ${sel ? "#F97316" : C.border}`, background: sel ? "#FFF7ED" : "#fff", color: sel ? "#EA580C" : C.text, fontWeight: 700, fontSize: 12, cursor: "pointer", margin: "0 6px 6px 0" }}>{sel ? "✓ " : ""}{t.name} <small>({t.subject})</small></button>; }) : <span style={{ fontSize: 12, color: C.sub }}>No teachers added yet. Add teachers first.</span>}</div>
      <div style={{ marginBottom: 16 }}><b style={{ display: "block", fontSize: 13, marginBottom: 8 }}>🎓 Assign Students ({form.studentIds.length} selected)</b>{students.length ? <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>{students.filter(s => s.status === "active" || !s.status).map(s => { const sel = form.studentIds.includes(s.id); return <button key={s.id} type="button" onClick={() => toggle("studentIds", s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, borderRadius: 10, cursor: "pointer", background: sel ? "#EEF2FF" : "transparent", textAlign: "left" }}><span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${sel ? C.accent : C.border}`, background: sel ? C.accent : "transparent", color: "#fff", display: "grid", placeItems: "center" }}>{sel ? "✓" : ""}</span><span><b style={{ display: "block", fontSize: 13, color: C.text }}>{s.name}</b><small style={{ color: C.sub }}>{s.sid} · Cl.{s.cls}-{s.sec}</small></span></button>; })}</div> : <span style={{ fontSize: 12, color: C.sub }}>No students added yet. Add students first.</span>}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button onClick={() => setBatchModal(false)} outline color={C.sub}>Cancel</Button><Button onClick={() => void saveBatch()} disabled={saving}>{saving ? "Saving…" : editing ? "Update Batch ✅" : "Create Batch ✅"}</Button></div>
    </Modal>}

    {ttModal && <Modal title="📅 Add Timetable Slot" onClose={() => setTtModal(false)} wide><div style={{ background: "#FFF7ED", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#EA580C" }}>⚠️ Duplicate slot for the same class/day/time is blocked automatically.</div><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}><Select label="Class" value={ttForm.cls} onChange={v => setTtForm({ ...ttForm, cls: v })} options={CLASSES} required /><Select label="Section" value={ttForm.sec} onChange={v => setTtForm({ ...ttForm, sec: v })} options={SECTIONS.slice(0,4)} required /><Select label="Subject" value={ttForm.subject} onChange={v => setTtForm({ ...ttForm, subject: v })} options={SUBJECTS} required /><Select label="Teacher" value={ttForm.tid} onChange={v => setTtForm({ ...ttForm, tid: v })} options={teachers.map(t => t.id)} required /><Select label="Day" value={ttForm.day} onChange={v => setTtForm({ ...ttForm, day: v })} options={DAYS} required /><Select label="Time Slot" value={ttForm.slot} onChange={v => setTtForm({ ...ttForm, slot: v })} options={SLOTS} required /><Select label="Batch (optional)" value={ttForm.batchId} onChange={v => setTtForm({ ...ttForm, batchId: v })} options={batches.map(b => b.id)} /></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}><Button onClick={() => setTtModal(false)} outline color={C.sub}>Cancel</Button><Button onClick={() => void saveTt()} disabled={saving}>{saving ? "Saving…" : "Add Slot ✅"}</Button></div></Modal>}
    {deleteBatch && <Modal title="Are you sure?" onClose={() => setDeleteBatch(null)}><p style={{ color: C.sub }}>Delete this batch? Students will be unassigned.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button onClick={() => setDeleteBatch(null)} outline color={C.sub}>Cancel</Button><Button onClick={() => void removeBatch()} color={C.red}>Delete</Button></div></Modal>}
    {deleteSlot && <Modal title="Are you sure?" onClose={() => setDeleteSlot(null)}><p style={{ color: C.sub }}>Remove this timetable slot?</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button onClick={() => setDeleteSlot(null)} outline color={C.sub}>Cancel</Button><Button onClick={() => void removeSlot()} color={C.red}>Delete</Button></div></Modal>}
  </div>;
}
