import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any>;
type ProfileType = "student" | "teacher" | "parent";

const C = {
  bg: "#F0F4FF", card: "#fff", text: "#0F1B3D", sub: "#64748B", border: "#E2E8F0",
  accent: "#4361EE", green: "#22C55E", red: "#EF4444", amber: "#F59E0B", purple: "#8B5CF6",
};
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 4px 18px rgba(15,27,61,.07)" };
const button = (active = false): React.CSSProperties => ({ border: 0, borderRadius: 10, padding: "9px 13px", background: active ? C.accent : "#EEF2FF", color: active ? "#fff" : C.text, fontWeight: 800, cursor: "pointer" });
const clean = (value: unknown) => String(value ?? "").trim();
const inactive = new Set(["inactive", "disabled", "suspended", "deleted"]);

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div style={{ padding: 12, borderRadius: 12, background: "#F8FAFF", border: `1px solid ${C.border}` }}><div style={{ fontSize: 10, color: C.sub, fontWeight: 800, textTransform: "uppercase" }}>{label}</div><div style={{ marginTop: 4, fontSize: 13, color: C.text, fontWeight: 700, overflowWrap: "anywhere" }}>{value || "—"}</div></div>;
}
function Metric({ label, value, color = C.accent }: { label: string; value: React.ReactNode; color?: string }) {
  return <div style={{ ...card, padding: 16 }}><div style={{ color: C.sub, fontSize: 11, fontWeight: 800 }}>{label}</div><div style={{ color, fontSize: 25, fontWeight: 900, marginTop: 4 }}>{value}</div></div>;
}

export function AdminProfilePage({ onBack }: { onBack?: () => void }) {
  const [type, setType] = useState<ProfileType>("student"), [query, setQuery] = useState("");
  const [students, setStudents] = useState<Row[]>([]), [teachers, setTeachers] = useState<Row[]>([]), [parents, setParents] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(""), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true); setError("");
    try {
      const [studentResult, teacherResult, parentResult] = await Promise.all([
        supabase.from("students").select("id,name,sid,cls,sec,parentname,parentphone,enroll,status").order("name"),
        supabase.from("teachers").select("id,name,tid,subject,phone,classes,status").order("name"),
        supabase.from("users").select("id,name,phone,email,role,ref,status,auth_id,created_at").eq("role", "parent").order("name"),
      ]);
      const first = studentResult.error || teacherResult.error || parentResult.error; if (first) throw first;
      setStudents(studentResult.data || []); setTeachers(teacherResult.data || []); setParents(parentResult.data || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load profiles."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const source = type === "student" ? students : type === "teacher" ? teachers : parents;
  const list = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return source; return source.filter((row) => { const id = type === "student" ? row.sid || row.id : type === "teacher" ? row.tid || row.id : row.phone || row.id; return `${row.name || ""} ${id || ""} ${row.phone || ""} ${row.email || ""} ${row.subject || ""}`.toLowerCase().includes(q); }); }, [query, source, type]);
  useEffect(() => { setSelected(null); setQuery(""); }, [type]);
  return <div style={{ minHeight: "100%", background: C.bg, padding: 26, color: C.text, fontFamily: "Poppins,system-ui,sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}><div><h2 style={{ margin: 0 }}>🔎 User Profiles</h2><div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Live profiles read directly from Supabase. No sample statistics or fallback records.</div></div><div style={{ display: "flex", gap: 8 }}><button style={button()} type="button" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "Refreshing…" : "↻ Refresh"}</button>{onBack && <button style={button()} type="button" onClick={onBack}>← Admin Dashboard</button>}</div></div>
    {error && <div role="alert" style={{ ...card, padding: 13, color: C.red, background: "#FFF7F7", marginBottom: 14, fontSize: 13 }}>{error}</div>}
    <div style={{ ...card, padding: 16 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}><button type="button" style={button(type === "student")} onClick={() => setType("student")}>🎓 Students ({students.length})</button><button type="button" style={button(type === "teacher")} onClick={() => setType("teacher")}>👨‍🏫 Teachers ({teachers.length})</button><button type="button" style={button(type === "parent")} onClick={() => setType("parent")}>👨‍👩‍👧 Parents ({parents.length})</button></div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${type} name, ID, phone or email…`} aria-label={`Search ${type} profiles`} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 11, background: "#F8FAFF", outline: "none" }} />
      {loading ? <div style={{ padding: 30, textAlign: "center", color: C.sub }}>Loading live profiles…</div> : !selected ? (list.length ? <div style={{ marginTop: 8 }}>{list.slice(0, 100).map((row) => { const id = type === "student" ? row.sid || row.id : type === "teacher" ? row.tid || row.id : row.phone || row.id; return <button key={String(row.id)} type="button" onClick={() => setSelected(row)} style={{ width: "100%", textAlign: "left", border: 0, borderTop: `1px solid ${C.border}`, background: "transparent", padding: "13px 4px", cursor: "pointer" }}><b>{row.name || "Unnamed"}</b><div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{type === "student" ? `Student ID ${id} · Class ${row.cls || "—"}-${row.sec || "—"}` : type === "teacher" ? `Teacher ID ${id} · ${row.subject || "—"}` : `Login ID ${id} · ${row.email || "No recovery email"}`}</div></button>; })}{list.length > 100 && <div style={{ padding: 12, color: C.sub, fontSize: 11 }}>Showing the first 100 matches. Refine your search to find the rest.</div>}</div> : <div style={{ padding: 30, textAlign: "center", color: C.sub }}>No matching {type} profiles.</div>) : <ProfileDetail type={type} profile={selected} onBack={() => setSelected(null)} />}
    </div>
  </div>;
}

function ProfileDetail({ type, profile, onBack }: { type: ProfileType; profile: Row; onBack: () => void }) {
  const [attendance, setAttendance] = useState<Row[]>([]), [marks, setMarks] = useState<Row[]>([]), [testResults, setTestResults] = useState<Row[]>([]), [tests, setTests] = useState<Row[]>([]), [homework, setHomework] = useState<Row[]>([]), [fees, setFees] = useState<Row[]>([]);
  const [links, setLinks] = useState<Row[]>([]), [linkedStudents, setLinkedStudents] = useState<Row[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { let live = true; (async () => { setLoading(true); setError(""); try {
    if (type === "parent") {
      const authId = clean(profile.auth_id); const linkResult = authId ? await supabase.from("parent_student_links").select("student_id,status").eq("parent_auth_id", authId) : { data: [], error: null };
      if (linkResult.error) throw linkResult.error; const activeLinks = (linkResult.data || []).filter((x) => clean(x.status).toLowerCase() === "active"); const ids = [...new Set(activeLinks.map((x) => clean(x.student_id)).filter(Boolean))];
      const studentResult = ids.length ? await supabase.from("students").select("id,name,sid,cls,sec,status").in("id", ids) : { data: [], error: null }; if (studentResult.error) throw studentResult.error;
      if (live) { setLinks(activeLinks); setLinkedStudents(studentResult.data || []); }
    } else if (type === "student") {
      const id = clean(profile.id || profile.sid);
      const [a, m, h, f, tr, ts] = await Promise.all([
        supabase.from("attendance").select("id,sid,date,status,by,created_at").eq("sid", id),
        supabase.from("marks").select("id,sid,subject,marks,total,totalMarks,score,exam,date").eq("sid", id),
        supabase.from("homework").select("id,tid,cls,sec,subject,due,created_at").eq("cls", clean(profile.cls)).eq("sec", clean(profile.sec)),
        supabase.from("fees").select("id,sid,amount,status,due,created_at").eq("sid", id),
        supabase.from("test_results").select("id,test_id,student_id,marks,remarks,created_at,updated_at").eq("student_id", id),
        supabase.from("tests").select("id,title,subject,test_date,total_marks,status").order("test_date", { ascending: false }),
      ]);
      const first = a.error || m.error || h.error || f.error || tr.error || ts.error; if (first) throw first;
      if (live) { setAttendance(a.data || []); setMarks(m.data || []); setHomework(h.data || []); setFees(f.data || []); setTestResults(tr.data || []); setTests(ts.data || []); }
    } else {
      const id = clean(profile.tid || profile.id); const [a, m, h] = await Promise.all([
        supabase.from("attendance").select("id,sid,date,status,by,created_at").eq("by", id),
        supabase.from("marks").select("id,sid,subject,marks,total,totalMarks,score,exam,date").eq("tid", id),
        supabase.from("homework").select("id,tid,cls,sec,subject,due,created_at").eq("tid", id),
      ]); const first = a.error || m.error || h.error; if (first) throw first; if (live) { setAttendance(a.data || []); setMarks(m.data || []); setHomework(h.data || []); }
    }
  } catch (e) { if (live) setError(e instanceof Error ? e.message : "Unable to load this profile."); } finally { if (live) setLoading(false); } })(); return () => { live = false; }; }, [profile, type]);

  const status = clean(profile.status) || "active", active = !inactive.has(status.toLowerCase());
  const present = attendance.filter((x) => clean(x.status).toLowerCase() === "present").length;
  const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : null;
  const marksWithTotals = marks.filter((x) => Number.isFinite(Number(x.marks ?? x.score)) && Number(x.total ?? x.totalMarks));
  const oldAverage = marksWithTotals.length ? Math.round(marksWithTotals.reduce((sum, x) => sum + (Number(x.marks ?? x.score) / Number(x.total ?? x.totalMarks)) * 100, 0) / marksWithTotals.length) : null;
  const testRows = testResults.map((r) => { const t = tests.find((x) => String(x.id) === String(r.test_id)); const raw = Number(r.marks); const total = Number(t?.total_marks); const percentage = Number.isFinite(raw) && Number.isFinite(total) && total > 0 ? (raw / total) * 100 : null; return { ...r, test: t, percentage }; }).sort((a,b) => clean(b.test?.test_date || b.created_at).localeCompare(clean(a.test?.test_date || a.created_at)));
  const validTestRows = testRows.filter((r) => r.percentage != null);
  const testAverage = validTestRows.length ? validTestRows.reduce((sum, r) => sum + Number(r.percentage), 0) / validTestRows.length : null;
  const paid = fees.filter((x) => clean(x.status).toLowerCase() === "paid").reduce((n, x) => n + Number(x.amount || 0), 0), pending = fees.filter((x) => clean(x.status).toLowerCase() === "pending").reduce((n, x) => n + Number(x.amount || 0), 0);

  return <div style={{ marginTop: 14 }}><button type="button" style={button()} onClick={onBack}>← Back to profiles</button>
    <div style={{ ...card, padding: 20, marginTop: 14, background: "linear-gradient(135deg,#4361EE,#7B6FF5)", color: "#fff" }}><div style={{ fontSize: 11, opacity: .8, fontWeight: 800 }}>{type.toUpperCase()} PROFILE</div><h2 style={{ margin: "6px 0" }}>{profile.name || "Unnamed"}</h2><div style={{ fontSize: 12, opacity: .9 }}>{type === "student" ? `ID ${profile.sid || profile.id} · Class ${profile.cls || "—"}-${profile.sec || "—"}` : type === "teacher" ? `ID ${profile.tid || profile.id} · ${profile.subject || "—"}` : `Login ID ${profile.phone || profile.id}`}</div></div>
    {error && <div role="alert" style={{ ...card, padding: 12, color: C.red, background: "#FFF7F7", marginTop: 14, fontSize: 12 }}>{error}</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}><Field label="Status" value={<span style={{ color: active ? C.green : C.red }}>{active ? "Active" : status}</span>} /><Field label="Phone / Login ID" value={profile.phone || profile.sid || profile.tid} />{type === "parent" && <Field label="Recovery email" value={profile.email} />}{type === "student" && <Field label="Enrollment" value={profile.enroll} />}{type === "student" && <Field label="Parent" value={profile.parentname ? `${profile.parentname}${profile.parentphone ? ` · ${profile.parentphone}` : ""}` : "—"} />}{type === "teacher" && <Field label="Classes" value={profile.classes} />}</div>
    {loading ? <div style={{ ...card, padding: 28, textAlign: "center", marginTop: 14, color: C.sub }}>Loading live profile activity…</div> : type === "parent" ? <div style={{ ...card, padding: 18, marginTop: 14 }}><h3 style={{ marginTop: 0 }}>Linked students</h3><Metric label="Active links" value={links.length} color={C.green} /><div style={{ marginTop: 12 }}>{linkedStudents.length ? linkedStudents.map((s) => <div key={s.id} style={{ padding: 10, borderTop: `1px solid ${C.border}` }}><b>{s.name || "Unnamed"}</b><div style={{ fontSize: 11, color: C.sub }}>Student ID {s.sid || s.id} · Class {s.cls || "—"}-{s.sec || "—"} · {s.status || "active"}</div></div>) : <div style={{ color: C.sub, fontSize: 13 }}>No active student links are recorded.</div>}</div></div> : <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 14 }}><Metric label="Attendance records" value={attendance.length} /><Metric label="Attendance rate" value={attendanceRate == null ? "—" : `${attendanceRate}%`} color={C.green} /><Metric label="Marks entries" value={marks.length} color={C.purple} />{type === "student" ? <><Metric label="Test results" value={testResults.length} color={C.purple} /><Metric label="Average test percentage" value={testAverage == null ? "—" : `${testAverage.toFixed(2)}%`} color={C.accent} /></> : <Metric label="Homework assigned" value={homework.length} />}{type === "student" && <Metric label="Fee records" value={fees.length} color={C.amber} />}</div>
      {type === "student" && <div style={{ ...card, padding: 18, marginTop: 14 }}><h3 style={{ marginTop: 0 }}>📊 Uploaded Test Results</h3>{testRows.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{["Test","Subject","Marks","Total","Percentage","Remarks","Date"].map((h) => <th key={h} style={{ textAlign: "left", padding: 9, borderBottom: `1px solid ${C.border}`, color: C.sub, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{testRows.map((r,i) => <tr key={r.id || i}><td style={{ padding: 9 }}>{r.test?.title || r.test_id || "—"}</td><td style={{ padding: 9 }}>{r.test?.subject || "—"}</td><td style={{ padding: 9, fontWeight: 800 }}>{Number.isFinite(Number(r.marks)) ? r.marks : "—"}</td><td style={{ padding: 9 }}>{r.test?.total_marks ?? "—"}</td><td style={{ padding: 9, fontWeight: 800, color: r.percentage == null ? C.sub : C.accent }}>{r.percentage == null ? "—" : `${Number(r.percentage).toFixed(2)}%`}</td><td style={{ padding: 9 }}>{r.remarks || "—"}</td><td style={{ padding: 9 }}>{r.test?.test_date || (r.updated_at || r.created_at || "").slice(0,10) || "—"}</td></tr>)}</tbody></table></div> : <div style={{ color: C.sub, fontSize: 13 }}>No uploaded test results are recorded for this student.</div>}</div>}
      {type === "student" && <div style={{ ...card, padding: 18, marginTop: 14 }}><h3 style={{ marginTop: 0 }}>Fee summary</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Paid" value={`₹${paid.toLocaleString("en-IN")}`} /><Field label="Pending" value={`₹${pending.toLocaleString("en-IN")}`} /></div></div>}
      {type === "student" && <div style={{ ...card, padding: 18, marginTop: 14 }}><h3 style={{ marginTop: 0 }}>Exam records</h3>{marks.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{["Exam","Subject","Score","Date"].map((h) => <th key={h} style={{ textAlign: "left", padding: 9, borderBottom: `1px solid ${C.border}`, color: C.sub }}>{h}</th>)}</tr></thead><tbody>{marks.slice().sort((a,b) => clean(b.date).localeCompare(clean(a.date))).map((m,i) => { const raw = Number(m.marks ?? m.score), den = Number(m.total ?? m.totalMarks), percent = Number.isFinite(raw) && den ? Math.round((raw/den)*100) : null; return <tr key={m.id || i}><td style={{ padding: 9 }}>{m.exam || "—"}</td><td>{m.subject || "—"}</td><td>{percent == null ? "—" : `${percent}%`}</td><td>{m.date || "—"}</td></tr>; })}</tbody></table></div> : <div style={{ color: C.sub, fontSize: 13 }}>No exam marks are recorded for this student.</div>}</div>}
      {type === "teacher" && <div style={{ ...card, padding: 18, marginTop: 14 }}><h3 style={{ marginTop: 0 }}>Teaching activity</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Homework" value={homework.length} /><Field label="Marks entered" value={marks.length} /></div>{homework.length ? <div style={{ marginTop: 12 }}>{homework.slice().sort((a,b) => clean(b.created_at).localeCompare(clean(a.created_at))).slice(0,10).map((h,i) => <div key={h.id || i} style={{ padding: 9, borderTop: `1px solid ${C.border}` }}><b>{h.subject || "Homework"}</b><div style={{ fontSize: 11, color: C.sub }}>Class {h.cls || "—"}-{h.sec || "—"} · Due {h.due || "—"}</div></div>)}</div> : <div style={{ marginTop: 12, color: C.sub, fontSize: 13 }}>No homework records are linked to this teacher.</div>}</div>}
    </>}
  </div>;
}