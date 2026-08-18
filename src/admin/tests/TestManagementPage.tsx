import { useCallback, useEffect, useMemo, useState } from "react";
import { addR, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any> & { id: string | number };

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, boxShadow: "0 4px 20px rgba(15,27,61,.07)" };
const btn = (background: string, color = "#fff"): React.CSSProperties => ({ border: 0, borderRadius: 11, padding: "10px 14px", background, color, fontWeight: 800, cursor: "pointer" });

async function ensureAdmin() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Administrator session is required. Please sign in again.");
  if (data.session.user.app_metadata?.role !== "admin") throw new Error("Administrator access is required.");
  return data.session;
}

export default function TestManagementPage() {
  const [tests, setTests] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [selectedTest, setSelectedTest] = useState<Row | null>(null);
  const [results, setResults] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ title: "", description: "", batch_id: "", subject: "", test_date: new Date().toISOString().slice(0, 10), total_marks: "100" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      await ensureAdmin();
      const [ts, bs, ss] = await Promise.all([gdb("tests"), gdb("batches"), gdb("students")]);
      setTests((ts as Row[]).sort((a,b) => String(b.test_date).localeCompare(String(a.test_date))));
      setBatches(bs as Row[]); setStudents(ss as Row[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load tests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const batchStudents = useMemo(() => {
    if (!selectedTest) return [];
    const b = batches.find(x => String(x.id) === String(selectedTest.batch_id));
    const ids = Array.isArray(b?.studentids) ? b.studentids : Array.isArray(b?.studentIds) ? b.studentIds : [];
    const byIds = ids.length ? students.filter(s => ids.map(String).includes(String(s.id))) : students.filter(s => String(s.cls) === String(b?.cls) && String(s.sec) === String(b?.sec));
    return byIds.sort((a,b) => String(a.sid).localeCompare(String(b.sid), undefined, { numeric: true }));
  }, [selectedTest, batches, students]);

  const openResults = async (test: Row) => {
    setSelectedTest(test); setError(""); setSuccess("");
    try { const rs = await gdb("test_results"); setResults((rs as Row[]).filter(r => String(r.test_id) === String(test.id))); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load results."); }
  };

  const saveTest = async () => {
    if (!form.title.trim() || !form.batch_id || !form.subject.trim() || !form.test_date || Number(form.total_marks) <= 0) { setError("Fill Test Name, Batch, Subject, Date and Total Marks."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const session = await ensureAdmin();
      await addR("tests", { id: `test-${Date.now()}`, title: form.title.trim(), description: form.description.trim() || null, batch_id: form.batch_id, subject: form.subject.trim(), test_date: form.test_date, total_marks: Number(form.total_marks), status: "scheduled", created_by: session.user.id });
      setSuccess("Test created successfully. Students in the batch have been notified.");
      setForm({ title: "", description: "", batch_id: "", subject: "", test_date: new Date().toISOString().slice(0, 10), total_marks: "100" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create test."); }
    finally { setSaving(false); }
  };

  const saveResult = async (student: Row, value: string, remarks: string) => {
    if (!selectedTest || value === "") return;
    const marks = Number(value);
    if (!Number.isFinite(marks) || marks < 0 || marks > Number(selectedTest.total_marks)) { setError(`Marks for ${student.name} must be between 0 and ${selectedTest.total_marks}.`); return; }
    setSaving(true); setError("");
    try {
      const existing = results.find(r => String(r.student_id) === String(student.id));
      const payload = { test_id: String(selectedTest.id), student_id: String(student.id), marks, remarks: remarks.trim() || null };
      if (existing) { await updR("test_results", existing.id, payload); setResults(prev => prev.map(r => r.id === existing.id ? { ...r, ...payload } : r)); }
      else { const row = await addR("test_results", { id: `result-${Date.now()}-${student.id}`, ...payload }); setResults(prev => [...prev, row as Row]); }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save result."); }
    finally { setSaving(false); }
  };

  return <div style={{ minHeight: "100%", padding: 22, background: "#F0F4FF", color: "#0F1B3D" }}>
    <div style={{ marginBottom: 18 }}><h1 style={{ margin: 0, fontSize: 24 }}>Tests & Results</h1><p style={{ margin: "6px 0", color: "#64748B" }}>Create tests for a batch, notify students, and enter results student-by-student.</p></div>
    {error && <div style={{ ...card, padding: 12, marginBottom: 12, color: "#B91C1C", background: "#FEF2F2" }}>{error}</div>}
    {success && <div style={{ ...card, padding: 12, marginBottom: 12, color: "#166534", background: "#F0FDF4" }}>{success}</div>}
    <div style={{ ...card, padding: 20, marginBottom: 18 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Create Test</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
        <label>Test Name<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Unit Test 1" /></label>
        <label>Batch<select value={form.batch_id} onChange={e=>setForm({...form,batch_id:e.target.value})}><option value="">Select batch…</option>{batches.map(b=><option key={String(b.id)} value={String(b.id)}>{b.name} {b.cls ? `· Class ${b.cls}${b.sec ? `-${b.sec}` : ""}` : ""}</option>)}</select></label>
        <label>Subject<input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Mathematics" /></label>
        <label>Test Date<input type="date" value={form.test_date} onChange={e=>setForm({...form,test_date:e.target.value})} /></label>
        <label>Total Marks<input type="number" min="1" value={form.total_marks} onChange={e=>setForm({...form,total_marks:e.target.value})} /></label>
      </div>
      <label style={{display:"block",marginTop:12}}>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional instructions or syllabus" style={{width:"100%",minHeight:70,marginTop:6,padding:10,border:"1px solid #E2E8F0",borderRadius:10}} /></label>
      <button disabled={saving} onClick={saveTest} style={{...btn("#4361EE"),marginTop:12,opacity:saving?.6:1}}>➕ Create Test & Notify Students</button>
    </div>
    <div style={{ ...card, padding: 20 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Scheduled Tests</h2>
      {loading ? <p>Loading…</p> : tests.length === 0 ? <p style={{color:"#64748B"}}>No tests created yet.</p> : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Test","Batch","Subject","Date","Total","Status","Action"].map(x=><th key={x} style={{textAlign:"left",padding:10,borderBottom:"1px solid #E2E8F0",whiteSpace:"nowrap"}}>{x}</th>)}</tr></thead><tbody>{tests.map(t=>{const b=batches.find(x=>String(x.id)===String(t.batch_id)); return <tr key={String(t.id)}><td style={{padding:10}}>{t.title}</td><td style={{padding:10}}>{b?.name || t.batch_id}</td><td style={{padding:10}}>{t.subject}</td><td style={{padding:10}}>{t.test_date}</td><td style={{padding:10}}>{t.total_marks}</td><td style={{padding:10}}>{t.status}</td><td style={{padding:10}}><button onClick={()=>openResults(t)} style={btn("#8B5CF6")}>Enter Results</button></td></tr>})}</tbody></table></div>}
    </div>
    {selectedTest && <div style={{...card,padding:20,marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:14}}><div><h2 style={{margin:0,fontSize:17}}>{selectedTest.title} — Results</h2><p style={{margin:"5px 0",color:"#64748B"}}>{selectedTest.subject} · Total {selectedTest.total_marks}</p></div><button onClick={()=>setSelectedTest(null)} style={btn("#64748B")}>Close</button></div>{batchStudents.length===0?<p style={{color:"#64748B"}}>No students found for this batch.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:10}}>Roll</th><th style={{textAlign:"left",padding:10}}>Student</th><th style={{textAlign:"left",padding:10}}>Marks</th><th style={{textAlign:"left",padding:10}}>Remarks</th><th style={{padding:10}}>Save</th></tr></thead><tbody>{batchStudents.map(s=>{const r=results.find(x=>String(x.student_id)===String(s.id)); return <tr key={String(s.id)}><td style={{padding:10}}>{s.sid}</td><td style={{padding:10}}>{s.name}</td><td style={{padding:10}}><input id={`marks-${s.id}`} defaultValue={r?.marks ?? ""} type="number" min="0" max={selectedTest.total_marks} style={{width:100,padding:8}} /></td><td style={{padding:10}}><input id={`remarks-${s.id}`} defaultValue={r?.remarks ?? ""} placeholder="Optional" style={{padding:8}} /></td><td style={{padding:10,textAlign:"center"}}><button disabled={saving} onClick={()=>{const m=(document.getElementById(`marks-${s.id}`) as HTMLInputElement)?.value || ""; const q=(document.getElementById(`remarks-${s.id}`) as HTMLInputElement)?.value || ""; void saveResult(s,m,q)}} style={btn("#22C55E")}>Save</button></td></tr>})}</tbody></table></div>}</div>}
  </div>;
}
