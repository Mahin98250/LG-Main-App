import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { C, addR, delR, gdb, updR } from "@/lg/data";
import AdminDashboard from "@/admin/dashboard/AdminDashboard";
import AdminRecordsPage from "@/admin/records/AdminRecordsPage";
import BatchesTimetablePage from "@/admin/batches/BatchesTimetablePage";
import HomeworkPage from "@/admin/HomeworkPage";
import ExamSchedulePage from "@/admin/examschedule/ExamSchedulePage";
import StudentResultsPage from "@/admin/results/StudentResultsPage";
import MaterialsDrive from "@/admin/MaterialsDrive";
import AnnouncementsPage from "@/admin/AnnouncementsPage";
import AdminMessagesPage from "@/admin/AdminMessagesPage";
import { AdminErrorBoundary } from "@/admin/AdminErrorBoundary";

type AdminUser = { id: string; name: string; phone: string; role: string; ref: string | null };
type View = "dashboard" | "students" | "teachers" | "batches" | "attendance" | "homework" | "examschedule" | "results" | "materials" | "fees" | "announcements" | "accounts" | "marks" | "search" | "messages";
type Row = Record<string, any> & { id?: string | number };

const NAV: Array<[View, string, string]> = [
  ["dashboard", "🏠", "Dashboard"], ["students", "🎓", "Students"], ["teachers", "👨‍🏫", "Teachers"],
  ["batches", "👥", "Batches & Timetable"], ["attendance", "✅", "Attendance"], ["homework", "📝", "Homework"],
  ["examschedule", "📋", "Exam Schedule"], ["results", "🏆", "Student Results"], ["materials", "📚", "Study Materials"],
  ["fees", "💰", "Fees"], ["announcements", "📢", "Announcements"], ["accounts", "🔐", "User Accounts"],
  ["marks", "📊", "Marks Overview"], ["search", "🔍", "Search Profiles"], ["messages", "✉️", "Messages"],
];

const META: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Full overview of your institute" },
  students: { title: "Students", subtitle: "Manage students and linked login accounts" },
  teachers: { title: "Teachers", subtitle: "Manage teachers, subjects and login accounts" },
  batches: { title: "Batches & Timetable", subtitle: "Manage batches, memberships and schedules" },
  attendance: { title: "Attendance", subtitle: "Review and correct attendance records" },
  homework: { title: "Homework", subtitle: "Assign homework and monitor submissions" },
  examschedule: { title: "Exam Schedule", subtitle: "Create and manage upcoming exams" },
  results: { title: "Student Results", subtitle: "Enter and manage student examination results" },
  materials: { title: "Study Materials", subtitle: "Upload and manage learning resources" },
  fees: { title: "Fees", subtitle: "Track fee payments and outstanding balances" },
  announcements: { title: "Announcements", subtitle: "Publish announcements to the correct audience" },
  accounts: { title: "User Accounts", subtitle: "View account status without exposing passwords" },
  marks: { title: "Marks Overview", subtitle: "Review performance analytics" },
  search: { title: "Search Profiles", subtitle: "Search student and teacher profiles" },
  messages: { title: "Messages", subtitle: "Send direct messages to teachers, students and parents" },
};

const buttonStyle = (active = false) => ({
  width: "100%", border: 0, borderRadius: 11, padding: "10px 12px", margin: "2px 0",
  background: active ? C.accent : "transparent", color: active ? "#fff" : "#ffffffb5",
  display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left" as const,
  fontWeight: active ? 800 : 650, fontSize: 13,
});

function Button({ children, onClick, color = C.accent, outline = false, disabled = false }: { children: ReactNode; onClick?: () => void; color?: string; outline?: boolean; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} style={{ border: outline ? `1.5px solid ${color}` : 0, borderRadius: 10, padding: "9px 13px", background: outline ? "transparent" : color, color: outline ? color : "#fff", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .6 : 1 }}>{children}</button>;
}

function Field({ label, value, onChange, type = "text", options, placeholder = "", required = false }: { label: string; value: any; onChange: (v: string) => void; type?: string; options?: Array<{ value: string; label: string }>; placeholder?: string; required?: boolean }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 750, color: C.sub }}><span>{label}{required && <b style={{ color: C.red }}> *</b>}</span>{options ? <select value={value ?? ""} onChange={e => onChange(e.target.value)} style={inputStyle}><option value="">Select…</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : type === "textarea" ? <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} /> : <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={inputStyle} />}</label>;
}

const inputStyle = { display: "block", width: "100%", boxSizing: "border-box" as const, marginTop: 6, padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, background: "#F8FAFF", color: C.text, outline: "none" };

function Card({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) { return <section style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 4px 20px rgba(15,27,61,.06)", ...style }}>{children}</section>; }

function Table({ rows, columns, actions }: { rows: Row[]; columns: Array<{ key: string; label: string; render?: (row: Row) => ReactNode }>; actions?: (row: Row) => ReactNode }) {
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{columns.map(c => <th key={c.key} style={{ padding: "11px 13px", background: "#F8FAFF", color: C.sub, textAlign: "left", whiteSpace: "nowrap" }}>{c.label}</th>)}{actions && <th style={{ padding: "11px 13px", background: "#F8FAFF", color: C.sub, textAlign: "left" }}>Actions</th>}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={String(r.id ?? i)}>{columns.map(c => <td key={c.key} style={{ padding: "11px 13px", borderTop: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{c.render ? c.render(r) : String(r[c.key] ?? "—")}</td>)}{actions && <td style={{ padding: "11px 13px", borderTop: `1px solid ${C.border}` }}>{actions(r)}</td>}</tr>) : <tr><td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 38, textAlign: "center", color: C.sub }}>No records found.</td></tr>}</tbody></table></div>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,27,61,.62)", display: "grid", placeItems: "center", padding: 16 }}><div onClick={e => e.stopPropagation()} style={{ width: "min(720px,100%)", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: 20, padding: 24 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19 }}>{title}</h2><button type="button" onClick={onClose} style={{ border: 0, borderRadius: 9, padding: 8, background: "#F1F5F9", cursor: "pointer" }}>✕</button></div>{children}</div></div>;
}

function ErrorBox({ error }: { error: string }) { return error ? <div style={{ marginBottom: 14, padding: 11, borderRadius: 11, background: "#FFF1F2", color: C.red, border: `1px solid ${C.red}33`, fontSize: 12 }}>{error}</div> : null; }

function PageHeader({ view, onRefresh }: { view: View; onRefresh?: () => void }) { return <div style={{ padding: "18px 24px", background: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div><h1 style={{ margin: 0, fontSize: 20, color: C.text }}>{META[view].title}</h1><div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{META[view].subtitle}</div></div>{onRefresh && <Button outline onClick={onRefresh}>↻ Refresh</Button>}</div>; }

function AttendancePage() {
  const [rows, setRows] = useState<Row[]>([]); const [students, setStudents] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [modal, setModal] = useState(false); const [editing, setEditing] = useState<Row | null>(null); const [form, setForm] = useState({ sid: "", date: new Date().toISOString().slice(0, 10), status: "present", note: "" });
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [a, s] = await Promise.all([gdb("attendance"), gdb("students")]); setRows(a || []); setStudents(s || []); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load attendance."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const studentOptions = useMemo(() => students.map(s => ({ value: String(s.id), label: `${s.name || "Unnamed"} · ${s.sid || s.id}` })), [students]);
  const studentName = (sid: any) => students.find(s => String(s.id) === String(sid) || String(s.sid) === String(sid))?.name || String(sid || "Unknown");
  const save = async () => { if (!form.sid || !form.date || !form.status) { setError("Student, date and status are required."); return; } try { const payload = { sid: form.sid, date: form.date, status: form.status, note: form.note.trim() }; if (editing) await updR("attendance", editing.id, payload); else await addR("attendance", { id: `att-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ...payload, by: "admin" }); setModal(false); setEditing(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save attendance."); } };
  const remove = async (id: any) => { if (!window.confirm("Delete this attendance record?")) return; try { await delR("attendance", id); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete attendance."); } };
  return <div style={{ padding: 24 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}><div style={{ color: C.sub, fontSize: 12 }}>{rows.length} attendance records</div><Button onClick={() => { setEditing(null); setForm({ sid: "", date: new Date().toISOString().slice(0,10), status: "present", note: "" }); setModal(true); }}>＋ Mark Attendance</Button></div><ErrorBox error={error}/><Card>{loading ? <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Loading attendance…</div> : <Table rows={rows} columns={[{ key: "sid", label: "Student", render: r => studentName(r.sid) }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: r => <b style={{ color: String(r.status).toLowerCase() === "present" ? C.green : C.red }}>{String(r.status || "—").toUpperCase()}</b> }, { key: "by", label: "Marked By" }, { key: "note", label: "Note" }]} actions={r => <div style={{ display: "flex", gap: 6 }}><Button outline onClick={() => { setEditing(r); setForm({ sid: String(r.sid || ""), date: String(r.date || ""), status: String(r.status || "present"), note: String(r.note || "") }); setModal(true); }}>Edit</Button><Button color={C.red} onClick={() => void remove(r.id)}>Delete</Button></div>}/>}</Card>{modal && <Modal title={editing ? "Edit Attendance" : "Mark Attendance"} onClose={() => setModal(false)}><div style={{ display: "grid", gap: 12 }}><Field label="Student" value={form.sid} onChange={v => setForm({ ...form, sid: v })} options={studentOptions} required/><Field label="Date" value={form.date} onChange={v => setForm({ ...form, date: v })} type="date" required/><Field label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={["present","absent","leave"].map(v => ({ value:v,label:v }))}/><Field label="Note" value={form.note} onChange={v => setForm({ ...form, note:v })} type="textarea"/><div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}><Button outline onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => void save()}>Save</Button></div></div></Modal>}</div>;
}

function FeesPage() {
  const [rows, setRows] = useState<Row[]>([]); const [students, setStudents] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [modal, setModal] = useState(false); const [editing, setEditing] = useState<Row | null>(null); const [form, setForm] = useState({ sid: "", desc: "", amount: "", due: "", status: "pending" });
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [f,s] = await Promise.all([gdb("fees"), gdb("students")]); setRows(f || []); setStudents(s || []); } catch(e) { setError(e instanceof Error ? e.message : "Unable to load fees."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const opts = useMemo(() => students.map(s => ({ value: String(s.id), label: `${s.name || "Unnamed"} · ${s.sid || s.id}` })), [students]);
  const name = (sid:any) => students.find(s => String(s.id)===String(sid) || String(s.sid)===String(sid))?.name || String(sid || "Unknown");
  const save = async () => { const amount=Number(form.amount); if(!form.sid || !form.desc.trim() || !Number.isFinite(amount) || amount<0 || !form.due) { setError("Student, description, valid amount and due date are required."); return; } try { const p={ sid:form.sid, desc:form.desc.trim(), amount, due:form.due, status:form.status }; if(editing) await updR("fees",editing.id,p); else await addR("fees",{id:`fee-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,...p}); setModal(false); setEditing(null); await load(); } catch(e){setError(e instanceof Error?e.message:"Unable to save fee record.");} };
  const remove=async(id:any)=>{if(!window.confirm("Delete this fee record?"))return;try{await delR("fees",id);await load();}catch(e){setError(e instanceof Error?e.message:"Unable to delete fee record.");}};
  const totals=useMemo(()=>({paid:rows.filter(r=>r.status==="paid").reduce((n,r)=>n+Number(r.amount||0),0),pending:rows.filter(r=>r.status==="pending").reduce((n,r)=>n+Number(r.amount||0),0),overdue:rows.filter(r=>r.status==="overdue").reduce((n,r)=>n+Number(r.amount||0),0)}),[rows]);
  return <div style={{padding:24}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:14}}>{[["Collected",totals.paid,C.green],["Pending",totals.pending,C.amber],["Overdue",totals.overdue,C.red]].map(([l,v,c])=><Card key={String(l)} style={{padding:16}}><div style={{fontSize:11,color:C.sub}}>{l}</div><b style={{fontSize:22,color:String(c)}}>₹{Number(v).toLocaleString("en-IN")}</b></Card>)}</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><Button onClick={()=>{setEditing(null);setForm({sid:"",desc:"",amount:"",due:"",status:"pending"});setModal(true);}}>＋ Add Fee</Button></div><ErrorBox error={error}/><Card>{loading?<div style={{padding:40,textAlign:"center",color:C.sub}}>Loading fees…</div>:<Table rows={rows} columns={[{key:"sid",label:"Student",render:r=>name(r.sid)},{key:"desc",label:"Description"},{key:"amount",label:"Amount",render:r=>`₹${Number(r.amount||0).toLocaleString("en-IN")}`},{key:"due",label:"Due Date"},{key:"status",label:"Status",render:r=><b style={{color:r.status==="paid"?C.green:r.status==="overdue"?C.red:C.amber}}>{String(r.status||"").toUpperCase()}</b>}]} actions={r=><div style={{display:"flex",gap:6}}><Button outline onClick={()=>{setEditing(r);setForm({sid:String(r.sid||""),desc:String(r.desc||""),amount:String(r.amount||""),due:String(r.due||""),status:String(r.status||"pending")});setModal(true);}}>Edit</Button><Button color={C.red} onClick={()=>void remove(r.id)}>Delete</Button></div>}/>}</Card>{modal&&<Modal title={editing?"Edit Fee":"Add Fee"} onClose={()=>setModal(false)}><div style={{display:"grid",gap:12}}><Field label="Student" value={form.sid} onChange={v=>setForm({...form,sid:v})} options={opts} required/><Field label="Description" value={form.desc} onChange={v=>setForm({...form,desc:v})} required/><Field label="Amount" value={form.amount} onChange={v=>setForm({...form,amount:v})} type="number" required/><Field label="Due Date" value={form.due} onChange={v=>setForm({...form,due:v})} type="date" required/><Field label="Status" value={form.status} onChange={v=>setForm({...form,status:v})} options={["pending","paid","overdue"].map(v=>({value:v,label:v}))}/><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Button outline onClick={()=>setModal(false)}>Cancel</Button><Button onClick={()=>void save()}>Save</Button></div></div></Modal>}</div>;
}

function AccountsPage() {
  const [rows,setRows]=useState<Row[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{setRows((await gdb("users")).filter((r:Row)=>r.role!=="admin"));}catch(e){setError(e instanceof Error?e.message:"Unable to load accounts.");}finally{setLoading(false);}},[]);useEffect(()=>{void load();},[load]);
  const toggle=async(r:Row)=>{try{await updR("users",r.id,{status:r.status==="active"?"inactive":"active"});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to update account.");}};
  return <div style={{padding:24}}><ErrorBox error={error}/><Card>{loading?<div style={{padding:40,textAlign:"center",color:C.sub}}>Loading accounts…</div>:<Table rows={rows} columns={[{key:"name",label:"Name"},{key:"role",label:"Role",render:r=><b>{String(r.role||"").toUpperCase()}</b>},{key:"phone",label:"Login ID"},{key:"status",label:"Status",render:r=><b style={{color:r.status==="active"?C.green:C.red}}>{String(r.status||"active").toUpperCase()}</b>},{key:"auth_id",label:"Auth",render:r=>r.auth_id?"Linked":"Needs repair"}]} actions={r=><Button outline color={r.status==="active"?C.red:C.green} onClick={()=>void toggle(r)}>{r.status==="active"?"Disable":"Activate"}</Button>}/>}</Card><p style={{fontSize:11,color:C.sub,marginTop:10}}>Passwords are intentionally never displayed in the admin portal.</p></div>;
}

function MarksPage() {
  const [rows,setRows]=useState<Row[]>([]);const[students,setStudents]=useState<Row[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{const[m,s]=await Promise.all([gdb("marks"),gdb("students")]);setRows(m||[]);setStudents(s||[]);}catch(e){setError(e instanceof Error?e.message:"Unable to load marks.");}finally{setLoading(false);}},[]);useEffect(()=>{void load();},[load]);
  const pct=(r:Row)=>Math.round(Number(r.marks||0)/Math.max(1,Number(r.total||100))*100);const student=(id:any)=>students.find(s=>String(s.id)===String(id)||String(s.sid)===String(id))?.name||String(id||"Unknown");const avg=rows.length?Math.round(rows.reduce((n,r)=>n+pct(r),0)/rows.length):0;
  return <div style={{padding:24}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:14}}><Card style={{padding:16}}><div style={{fontSize:11,color:C.sub}}>Entries</div><b style={{fontSize:26}}>{rows.length}</b></Card><Card style={{padding:16}}><div style={{fontSize:11,color:C.sub}}>Average Score</div><b style={{fontSize:26,color:C.accent}}>{avg}%</b></Card><Card style={{padding:16}}><div style={{fontSize:11,color:C.sub}}>Above 80%</div><b style={{fontSize:26,color:C.green}}>{rows.filter(r=>pct(r)>=80).length}</b></Card></div><ErrorBox error={error}/><Card>{loading?<div style={{padding:40,textAlign:"center",color:C.sub}}>Loading marks…</div>:<Table rows={rows} columns={[{key:"sid",label:"Student",render:r=>student(r.sid)},{key:"subject",label:"Subject"},{key:"exam",label:"Exam"},{key:"marks",label:"Marks",render:r=>`${r.marks||0}/${r.total||100}`},{key:"score",label:"Score",render:r=><b style={{color:pct(r)>=80?C.green:pct(r)>=60?C.amber:C.red}}>{pct(r)}%</b>},{key:"date",label:"Date"}]}/>}</Card></div>;
}

function SearchPage() {
  const [students,setStudents]=useState<Row[]>([]);const[teachers,setTeachers]=useState<Row[]>([]);const[q,setQ]=useState("");const[type,setType]=useState<"student"|"teacher">("student");const[loading,setLoading]=useState(true);const[error,setError]=useState("");
  useEffect(()=>{Promise.all([gdb("students"),gdb("teachers")]).then(([s,t])=>{setStudents(s||[]);setTeachers(t||[]);}).catch(e=>setError(e instanceof Error?e.message:"Unable to load profiles.")).finally(()=>setLoading(false));},[]);
  const list=(type==="student"?students:teachers).filter(r=>`${r.name||""} ${type==="student"?r.sid||"":r.tid||""} ${r.phone||""}`.toLowerCase().includes(q.toLowerCase()));
  return <div style={{padding:24}}><Card style={{padding:18,marginBottom:14}}><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><Button outline={type!=="student"} onClick={()=>setType("student")}>🎓 Students</Button><Button outline={type!=="teacher"} onClick={()=>setType("teacher")}>👨‍🏫 Teachers</Button></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, ID or phone…" style={inputStyle}/></Card><ErrorBox error={error}/>{loading?<div style={{padding:40,textAlign:"center",color:C.sub}}>Loading profiles…</div>:<Card><Table rows={list} columns={type==="student"?[{key:"sid",label:"ID"},{key:"name",label:"Name"},{key:"cls",label:"Class",render:r=>`${r.cls||"—"}-${r.sec||"—"}`},{key:"parentname",label:"Parent"},{key:"parentphone",label:"Parent Phone"},{key:"status",label:"Status"}]:[{key:"tid",label:"ID"},{key:"name",label:"Name"},{key:"subject",label:"Subject"},{key:"phone",label:"Phone"},{key:"status",label:"Status"}]}/>}</Card>}</div>;
}

export function AdminWithDrive({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [view,setView]=useState<View>("dashboard");
  const refresh=()=>window.dispatchEvent(new Event("lg-admin-refresh"));
  const content = view === "dashboard" ? <AdminDashboard /> : view === "students" ? <AdminRecordsPage kind="students" /> : view === "teachers" ? <AdminRecordsPage kind="teachers" /> : view === "batches" ? <BatchesTimetablePage /> : view === "attendance" ? <AttendancePage /> : view === "homework" ? <HomeworkPage /> : view === "examschedule" ? <ExamSchedulePage /> : view === "results" ? <StudentResultsPage /> : view === "materials" ? <MaterialsDrive /> : view === "fees" ? <FeesPage /> : view === "announcements" ? <AnnouncementsPage /> : view === "accounts" ? <AccountsPage /> : view === "marks" ? <MarksPage /> : view === "search" ? <SearchPage /> : <AdminMessagesPage user={{ ...user, ref: user.ref || user.id }} />;
  return <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"Poppins,system-ui,sans-serif", display:"flex" }}>
    <aside style={{ width:235, minHeight:"100vh", background:C.sidebar, padding:"0 11px 16px", position:"sticky", top:0, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"20px 8px 16px", borderBottom:"1px solid #ffffff12", marginBottom:10 }}><div style={{ color:"#fff",fontWeight:900,fontSize:18 }}>Learner's <span style={{color:C.gold}}>Guide</span></div><div style={{marginTop:8,color:C.red,fontSize:11,fontWeight:800}}>🔴 ADMIN PANEL · FULL ACCESS</div></div>
      <nav style={{ flex:1, overflowY:"auto" }}>{NAV.map(([key,icon,label])=><button key={key} type="button" onClick={()=>setView(key)} style={buttonStyle(view===key)}><span style={{fontSize:17}}>{icon}</span>{label}</button>)}</nav>
      <div style={{ borderTop:"1px solid #ffffff12", paddingTop:12, marginTop:8 }}><div style={{color:"#fff",fontSize:12,fontWeight:750,padding:"7px 8px 10px"}}>👑 {user.name || "Administrator"}<span style={{display:"block",color:"#ffffff75",fontWeight:500,marginTop:2}}>Administrator</span></div><Button color="#8f2020" onClick={onLogout}>🚪 Logout</Button></div>
    </aside>
    <main style={{ flex:1, minWidth:0, minHeight:"100vh", overflowY:"auto" }}><PageHeader view={view} onRefresh={refresh}/><AdminErrorBoundary section={META[view].title}>{content}</AdminErrorBoundary></main>
  </div>;
}
