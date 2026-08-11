import { useCallback, useEffect, useMemo, useState } from "react";
import { C, addR, delR, gdb } from "@/lg/data";

type Exam = Record<string, any> & { id: string };
const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Computer", "Physics", "Chemistry", "Biology", "History", "Geography", "Sanskrit", "Physical Education"];
const CLASSES = ["9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "All"];
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 4px 20px rgba(15,27,61,.07)" };
const subjectTone: Record<string, string> = { Mathematics: "#4361EE", Science: "#22C55E", English: "#F97316", Hindi: "#EC4899", Computer: "#0891B2", Physics: "#F59E0B", Chemistry: "#10B981", Biology: "#6366F1", History: "#8B5CF6", Geography: "#06B6D4", Sanskrit: "#A855F7", "Physical Education": "#14B8A6" };

function Button({ children, onClick, outline = false, color = C.accent, disabled = false }: { children: React.ReactNode; onClick?: () => void; outline?: boolean; color?: string; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} style={{ border: outline ? `1.5px solid ${color}` : 0, background: outline ? "transparent" : color, color: outline ? color : "#fff", borderRadius: 11, padding: "9px 14px", fontWeight: 800, cursor: disabled ? "wait" : "pointer", opacity: disabled ? .65 : 1 }}>{children}</button>;
}
function Field({ label, value, onChange, options, type = "text", placeholder = "", required = false }: { label: string; value: string; onChange: (v: string) => void; options?: string[]; type?: string; placeholder?: string; required?: boolean }) {
  return <label style={{ display: "block", flex: "1 1 230px" }}><span style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub, marginBottom: 6 }}>{label}{required && <b style={{ color: C.red }}> *</b>}</span>{options ? <select value={value} onChange={e => onChange(e.target.value)} required={required} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text }}><option value="">Select…</option>{options.map(o => <option key={o}>{o}</option>)}</select> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", color: C.text }} />}</label>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,27,61,.6)", display: "grid", placeItems: "center", padding: 16 }}><div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, width: "min(860px,100%)", maxHeight: "92vh", overflowY: "auto", padding: 26, boxShadow: "0 24px 72px rgba(15,27,61,.25)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 18, color: C.text }}>{title}</h2><button type="button" onClick={onClose} style={{ border: 0, background: "#F8FAFF", borderRadius: 9, padding: 8, color: C.sub }}>✕</button></div>{children}</div></div>;
}

const initial = { title: "", subject: "", cls: "10", sec: "A", date: "", startTime: "09:00", endTime: "11:00", venue: "Exam Hall", syllabus: "", totalMarks: "100" };

export default function ExamSchedulePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState<Exam | null>(null);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const load = useCallback(async () => { setLoading(true); try { setExams((await gdb("examschedule")) as Exam[]); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load exam schedule."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const upcoming = useMemo(() => exams.filter(e => e.date >= today).sort((a,b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime || a.starttime || "").localeCompare(String(b.startTime || b.starttime || ""))), [exams, today]);
  const past = useMemo(() => exams.filter(e => e.date < today).sort((a,b) => String(b.date).localeCompare(String(a.date))), [exams, today]);
  const set = (key: keyof typeof initial, value: string) => setForm(f => ({ ...f, [key]: value }));
  const save = async () => {
    if (!form.title.trim() || !form.subject || !form.date) { setError("Fill exam title, subject and date."); return; }
    if (form.startTime >= form.endTime) { setError("End time must be later than start time."); return; }
    setSaving(true); setError("");
    try {
      await addR("examschedule", { ...form, title: form.title.trim(), id: `ex${Date.now()}`, createdby: "admin", starttime: form.startTime, endtime: form.endTime, totalmarks: form.totalMarks });
      setForm({ ...initial }); setModal(false); await load(); setSuccess("Exam added successfully."); window.setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save exam."); } finally { setSaving(false); }
  };
  const remove = async () => { if (!confirm) return; try { await delR("examschedule", confirm.id); setConfirm(null); await load(); setSuccess("Exam removed."); window.setTimeout(() => setSuccess(""), 3000); } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove exam."); setConfirm(null); } };
  const displayTime = (e: Exam) => `${e.startTime || e.starttime || "09:00"} – ${e.endTime || e.endtime || "11:00"}`;
  const marks = (e: Exam) => e.totalMarks || e.totalmarks || "100";
  const subjectColor = (s: string) => subjectTone[s] || C.accent;
  const ExamCard = ({ e, pastExam = false }: { e: Exam; pastExam?: boolean }) => <div style={{ ...card, padding: 20, opacity: pastExam ? .78 : 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div style={{ minWidth: 0 }}><span style={{ display: "inline-block", background: `${subjectColor(e.subject)}18`, color: subjectColor(e.subject), padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{e.subject}</span><h3 style={{ margin: "10px 0 4px", color: C.text, fontSize: 16 }}>{e.title}</h3><div style={{ color: C.sub, fontSize: 12 }}>Class {e.cls}-{e.sec}</div></div><button type="button" onClick={() => setConfirm(e)} style={{ border: 0, background: "#FEE2E2", color: C.red, borderRadius: 8, padding: "6px 9px", cursor: "pointer" }}>🗑</button></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginTop: 16 }}><div style={{ background: "#F8FAFF", borderRadius: 11, padding: 10 }}><b style={{ display: "block", fontSize: 10, color: C.sub }}>DATE</b><span style={{ fontSize: 13, fontWeight: 700 }}>📅 {e.date}</span></div><div style={{ background: "#F8FAFF", borderRadius: 11, padding: 10 }}><b style={{ display: "block", fontSize: 10, color: C.sub }}>TIME</b><span style={{ fontSize: 13, fontWeight: 700 }}>⏰ {displayTime(e)}</span></div><div style={{ background: "#F8FAFF", borderRadius: 11, padding: 10 }}><b style={{ display: "block", fontSize: 10, color: C.sub }}>VENUE</b><span style={{ fontSize: 13, fontWeight: 700 }}>📍 {e.venue || "—"}</span></div><div style={{ background: "#F8FAFF", borderRadius: 11, padding: 10 }}><b style={{ display: "block", fontSize: 10, color: C.sub }}>MARKS</b><span style={{ fontSize: 13, fontWeight: 700 }}>💯 {marks(e)}</span></div></div>{e.syllabus && <div style={{ marginTop: 12, padding: 11, background: "#FFF7ED", borderRadius: 11, fontSize: 12, color: C.sub }}><b style={{ color: C.text }}>Syllabus:</b> {e.syllabus}</div>}</div>;

  return <div style={{ padding: 28, background: "#F7F9FF", minHeight: "100%" }}>
    {success && <div style={{ ...card, padding: 12, marginBottom: 16, background: "#F0FDF4", color: "#16A34A", fontWeight: 700 }}>✅ {success}</div>}
    {error && <div style={{ ...card, padding: 12, marginBottom: 16, background: "#FFF7F7", color: C.red }}>{error}</div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22 }}><div><div style={{ fontWeight: 800, color: C.text, fontSize: 18 }}>📋 Exam Schedule</div><div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{upcoming.length} upcoming · {past.length} past</div></div><Button onClick={() => { setError(""); setModal(true); }}>📋 + Add Exam</Button></div>
    {loading ? <div style={{ ...card, padding: 40, textAlign: "center", color: C.sub }}>Loading exam schedule…</div> : exams.length === 0 ? <div style={{ ...card, padding: "60px 40px", textAlign: "center" }}><div style={{ fontSize: 44 }}>📋</div><div style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 6px" }}>No exams scheduled</div><div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Create an exam schedule that students can see in their portal.</div><Button onClick={() => setModal(true)}>📋 + Add First Exam</Button></div> : <><section style={{ marginBottom: 28 }}><h2 style={{ fontSize: 14, color: C.text, margin: "0 0 12px" }}>Upcoming Exams</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14 }}>{upcoming.length ? upcoming.map(e => <ExamCard key={e.id} e={e} />) : <div style={{ ...card, padding: 20, color: C.sub, fontSize: 13 }}>No upcoming exams.</div>}</div></section><section><h2 style={{ fontSize: 14, color: C.sub, margin: "0 0 12px" }}>Past Exams</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14 }}>{past.length ? past.map(e => <ExamCard key={e.id} e={e} pastExam />) : <div style={{ ...card, padding: 20, color: C.sub, fontSize: 13 }}>No past exams.</div>}</div></section></>}

    {modal && <Modal title="📋 Add Exam" onClose={() => setModal(false)}><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}><Field label="Exam Title" value={form.title} onChange={v => set("title", v)} placeholder="e.g. Periodic Test 1" required /><Field label="Subject" value={form.subject} onChange={v => set("subject", v)} options={SUBJECTS} required /><Field label="Class" value={form.cls} onChange={v => set("cls", v)} options={CLASSES} required /><Field label="Section" value={form.sec} onChange={v => set("sec", v)} options={SECTIONS} /><Field label="Date" value={form.date} onChange={v => set("date", v)} type="date" required /><Field label="Start Time" value={form.startTime} onChange={v => set("startTime", v)} type="time" required /><Field label="End Time" value={form.endTime} onChange={v => set("endTime", v)} type="time" required /><Field label="Venue" value={form.venue} onChange={v => set("venue", v)} placeholder="Exam Hall" /><Field label="Total Marks" value={form.totalMarks} onChange={v => set("totalMarks", v)} placeholder="100" /><Field label="Syllabus" value={form.syllabus} onChange={v => set("syllabus", v)} placeholder="Chapters / topics" /></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}><Button onClick={() => setModal(false)} outline color={C.sub}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Add Exam ✅"}</Button></div></Modal>}
    {confirm && <Modal title="Delete exam?" onClose={() => setConfirm(null)}><p style={{ color: C.sub }}>Remove <b>{confirm.title}</b> from the exam schedule? Students will no longer see this scheduled exam.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button onClick={() => setConfirm(null)} outline color={C.sub}>Cancel</Button><Button onClick={() => void remove()} color={C.red}>Delete Exam</Button></div></Modal>}
  </div>;
}
