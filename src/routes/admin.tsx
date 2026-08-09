import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lg/supabase";
import { getCurrentUser, signIn, signOut } from "@/lg/auth";
import { GLOBAL_CSS, LGLogo } from "@/lg/ui";

export const Route = createFileRoute("/admin")({ ssr: false, component: AdminRoute });

type User = { id: string; name: string; phone: string; role: string; ref: string | null };
type Student = { id: string; name: string; sid: string; cls: string; sec: string; parentname?: string; parentphone?: string; status?: string };
type Teacher = { id: string; name: string; tid: string; subject?: string; phone: string; status?: string };
type Announcement = { id: string; title: string; desc?: string; target?: string; date?: string };

const css = `
.admin-wrap{min-height:100vh;background:#f6f7fb;color:#172033;font-family:'Poppins',sans-serif}
.admin-shell{display:grid;grid-template-columns:250px 1fr;min-height:100vh}
.admin-side{background:linear-gradient(160deg,#1a1060,#2d1b8e);color:#fff;padding:24px 16px;position:sticky;top:0;height:100vh;box-sizing:border-box}
.admin-brand{display:flex;align-items:center;gap:10px;padding:8px 10px 28px}.admin-brand b{font-size:15px}.admin-nav{display:grid;gap:7px}.admin-nav button{border:0;background:transparent;color:rgba(255,255,255,.68);padding:12px 13px;border-radius:12px;text-align:left;font:600 13px Poppins;cursor:pointer}.admin-nav button.active,.admin-nav button:hover{background:rgba(255,255,255,.12);color:#fff}
.admin-main{padding:28px;max-width:1400px;width:100%;box-sizing:border-box}.admin-top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}.admin-title{font-size:26px;font-weight:900}.admin-sub{color:#64748b;font-size:13px;margin-top:3px}.admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.stat{background:#fff;border:1px solid #e8eaf2;border-radius:18px;padding:18px;box-shadow:0 6px 24px rgba(27,16,96,.05)}.stat small{color:#64748b;font-weight:600}.stat strong{display:block;font-size:28px;margin-top:7px}.panel{background:#fff;border:1px solid #e8eaf2;border-radius:18px;padding:18px;box-shadow:0 6px 24px rgba(27,16,96,.05);margin-bottom:16px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.panel-head h2{font-size:16px;margin:0}.table-wrap{overflow:auto}.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{text-align:left;padding:11px 9px;border-bottom:1px solid #eef0f5;white-space:nowrap}.table th{font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:.5px}.pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#5145cd;font-size:10px;font-weight:800}.btn{border:0;border-radius:11px;padding:10px 13px;font:700 12px Poppins;cursor:pointer}.btn-primary{background:#5b4fe8;color:#fff}.btn-danger{background:#fee2e2;color:#b91c1c}.btn-ghost{background:#f3f5fa;color:#334155}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field label{display:block;font-size:11px;font-weight:800;color:#64748b;margin:0 0 5px}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;border:1px solid #dfe3ec;border-radius:11px;padding:10px 11px;font:500 12px Poppins;outline:none;background:#fff}.field textarea{min-height:90px;resize:vertical}.field input:focus,.field select:focus,.field textarea:focus{border-color:#5b4fe8;box-shadow:0 0 0 3px #5b4fe811}.span-2{grid-column:1/-1}.notice{padding:11px 13px;border-radius:11px;background:#f0fdf4;color:#166534;font-size:12px;margin-bottom:14px}.error{padding:11px 13px;border-radius:11px;background:#fef2f2;color:#b91c1c;font-size:12px;margin-bottom:14px}
@media(max-width:900px){.admin-shell{grid-template-columns:1fr}.admin-side{position:relative;height:auto;padding:14px}.admin-brand{padding:4px 8px 12px}.admin-nav{display:flex;overflow:auto}.admin-nav button{white-space:nowrap}.admin-main{padding:18px}.admin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.admin-grid,.form-grid{grid-template-columns:1fr}.admin-top{align-items:flex-start;flex-direction:column}.admin-title{font-size:22px}}
`;

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("admin@school.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email || !password) return setError("Enter your admin email and password.");
    setLoading(true); setError("");
    const result = await signIn(email, password, "admin");
    setLoading(false);
    if (result.user?.role === "admin") return onSuccess();
    setError(result.error || "Administrator access was not granted.");
  };
  return <div className="admin-wrap" style={{display:"grid",placeItems:"center",padding:20}}><style>{GLOBAL_CSS + css}</style><div className="panel" style={{width:"100%",maxWidth:420,padding:28}}>
    <div style={{display:"flex",justifyContent:"center",marginBottom:15}}><LGLogo size={70} showText={false}/></div>
    <div style={{textAlign:"center",marginBottom:22}}><div className="admin-title">Admin Portal</div><div className="admin-sub">Learner's Guide administration</div></div>
    {error && <div className="error">{error}</div>}
    <div className="form-grid"><div className="field span-2"><label>ADMIN EMAIL</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></div><div className="field span-2"><label>PASSWORD</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" onKeyDown={e=>e.key==='Enter'&&submit()}/></div></div>
    <button className="btn btn-primary" style={{width:"100%",marginTop:16}} onClick={submit} disabled={loading}>{loading?"Signing in…":"Sign in as Administrator"}</button>
  </div></div>;
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab,setTab]=useState("overview");
  const [students,setStudents]=useState<Student[]>([]);
  const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [ann,setAnn]=useState<Announcement[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [showStudent,setShowStudent]=useState(false);
  const [showTeacher,setShowTeacher]=useState(false);
  const [showAnnouncement,setShowAnnouncement]=useState(false);
  const [studentForm,setStudentForm]=useState({name:"",sid:"",cls:"",sec:"",parentname:"",parentphone:""});
  const [teacherForm,setTeacherForm]=useState({name:"",tid:"",subject:"",phone:""});
  const [announcementForm,setAnnouncementForm]=useState({title:"",desc:"",target:"all"});

  const load=async()=>{setLoading(true);setError("");const [s,t,a]=await Promise.all([supabase.from("students").select("*").order("created_at",{ascending:false}),supabase.from("teachers").select("*").order("created_at",{ascending:false}),supabase.from("announcements").select("*").order("created_at",{ascending:false})]);const first=s.error||t.error||a.error;if(first)setError(first.message);else{setStudents(s.data||[]);setTeachers(t.data||[]);setAnn(a.data||[])}setLoading(false)};
  useEffect(()=>{load()},[]);
  const counts=useMemo(()=>({students:students.length,teachers:teachers.length,active:students.filter(s=>s.status!=="inactive").length,ann:ann.length}),[students,teachers,ann]);
  const saveStudent=async()=>{if(!studentForm.name||!studentForm.sid||!studentForm.cls||!studentForm.sec)return setError("Student name, SID, class and section are required.");const {error:e}=await supabase.from("students").insert({id:`s${Date.now()}`,...studentForm,status:"active"});if(e)setError(e.message);else{setNotice("Student profile created.");setShowStudent(false);setStudentForm({name:"",sid:"",cls:"",sec:"",parentname:"",parentphone:""});load()}};
  const saveTeacher=async()=>{if(!teacherForm.name||!teacherForm.tid||!teacherForm.phone)return setError("Teacher name, teacher ID and phone are required.");const {error:e}=await supabase.from("teachers").insert({id:`t${Date.now()}`,...teacherForm,classes:[],status:"active"});if(e)setError(e.message);else{setNotice("Teacher profile created.");setShowTeacher(false);setTeacherForm({name:"",tid:"",subject:"",phone:""});load()}};
  const saveAnnouncement=async()=>{if(!announcementForm.title)return setError("Announcement title is required.");const {error:e}=await supabase.from("announcements").insert({id:`a${Date.now()}`,...announcementForm,date:new Date().toLocaleDateString("en-IN")});if(e)setError(e.message);else{setNotice("Announcement published.");setShowAnnouncement(false);setAnnouncementForm({title:"",desc:"",target:"all"});load()}};
  const removeStudent=async(id:string)=>{if(!confirm("Delete this student profile?"))return;const {error:e}=await supabase.from("students").delete().eq("id",id);if(e)setError(e.message);else load()};
  const removeTeacher=async(id:string)=>{if(!confirm("Delete this teacher profile?"))return;const {error:e}=await supabase.from("teachers").delete().eq("id",id);if(e)setError(e.message);else load()};
  const nav=[['overview','Overview'],['students','Students'],['teachers','Teachers'],['announcements','Announcements']];
  return <div className="admin-wrap"><style>{GLOBAL_CSS+css}</style><div className="admin-shell">
    <aside className="admin-side"><div className="admin-brand"><LGLogo size={42} showText={false} light/><b>Learner's Guide<br/><span style={{opacity:.5,fontSize:10}}>ADMIN CONSOLE</span></b></div><div className="admin-nav">{nav.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{key==='overview'?'⌂':key==='students'?'🎓':key==='teachers'?'👨‍🏫':'📢'} &nbsp;{label}</button>)}</div><button className="btn btn-ghost" style={{width:'100%',marginTop:28}} onClick={onLogout}>Sign out</button></aside>
    <main className="admin-main"><div className="admin-top"><div><div className="admin-title">{nav.find(n=>n[0]===tab)?.[1]}</div><div className="admin-sub">Signed in as administrator · {user.name}</div></div><button className="btn btn-ghost" onClick={load}>↻ Refresh</button></div>
    {notice&&<div className="notice" onClick={()=>setNotice("")}>{notice}</div>}{error&&<div className="error" onClick={()=>setError("")}>{error}</div>}
    {tab==='overview'&&<><div className="admin-grid"><div className="stat"><small>Total Students</small><strong>{counts.students}</strong></div><div className="stat"><small>Active Students</small><strong>{counts.active}</strong></div><div className="stat"><small>Teachers</small><strong>{counts.teachers}</strong></div><div className="stat"><small>Announcements</small><strong>{counts.ann}</strong></div></div><div className="panel"><div className="panel-head"><h2>Quick actions</h2></div><div style={{display:'flex',flexWrap:'wrap',gap:9}}><button className="btn btn-primary" onClick={()=>setShowStudent(true)}>+ Add Student</button><button className="btn btn-primary" onClick={()=>setShowTeacher(true)}>+ Add Teacher</button><button className="btn btn-primary" onClick={()=>setShowAnnouncement(true)}>+ Announcement</button></div></div><div className="panel"><div className="panel-head"><h2>Recent students</h2></div><StudentTable rows={students.slice(0,8)} onDelete={removeStudent}/></div></>}
    {tab==='students'&&<div className="panel"><div className="panel-head"><h2>Students</h2><button className="btn btn-primary" onClick={()=>setShowStudent(true)}>+ Add Student</button></div><StudentTable rows={students} onDelete={removeStudent}/></div>}
    {tab==='teachers'&&<div className="panel"><div className="panel-head"><h2>Teachers</h2><button className="btn btn-primary" onClick={()=>setShowTeacher(true)}>+ Add Teacher</button></div><TeacherTable rows={teachers} onDelete={removeTeacher}/></div>}
    {tab==='announcements'&&<div className="panel"><div className="panel-head"><h2>Announcements</h2><button className="btn btn-primary" onClick={()=>setShowAnnouncement(true)}>+ Publish</button></div><AnnouncementTable rows={ann}/></div>}
    {showStudent&&<Modal title="Add Student" onClose={()=>setShowStudent(false)}><div className="form-grid">{Object.entries(studentForm).map(([k,v])=><div className="field" key={k}><label>{k.toUpperCase()}</label><input value={v} onChange={e=>setStudentForm({...studentForm,[k]:e.target.value})}/></div>)}</div><button className="btn btn-primary" style={{marginTop:14}} onClick={saveStudent}>Create profile</button></Modal>}
    {showTeacher&&<Modal title="Add Teacher" onClose={()=>setShowTeacher(false)}><div className="form-grid">{Object.entries(teacherForm).map(([k,v])=><div className="field" key={k}><label>{k.toUpperCase()}</label><input value={v} onChange={e=>setTeacherForm({...teacherForm,[k]:e.target.value})}/></div>)}</div><button className="btn btn-primary" style={{marginTop:14}} onClick={saveTeacher}>Create profile</button></Modal>}
    {showAnnouncement&&<Modal title="Publish Announcement" onClose={()=>setShowAnnouncement(false)}><div className="form-grid"><div className="field span-2"><label>TITLE</label><input value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm,title:e.target.value})}/></div><div className="field span-2"><label>MESSAGE</label><textarea value={announcementForm.desc} onChange={e=>setAnnouncementForm({...announcementForm,desc:e.target.value})}/></div><div className="field"><label>TARGET</label><select value={announcementForm.target} onChange={e=>setAnnouncementForm({...announcementForm,target:e.target.value})}><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option></select></div></div><button className="btn btn-primary" style={{marginTop:14}} onClick={saveAnnouncement}>Publish</button></Modal>}
    </main></div></div>;
}

function StudentTable({rows,onDelete}:{rows:Student[];onDelete:(id:string)=>void}){return <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>SID</th><th>Class</th><th>Section</th><th>Parent</th><th>Status</th><th/></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.sid}</td><td>{s.cls}</td><td>{s.sec}</td><td>{s.parentname||'—'}</td><td><span className="pill">{s.status||'active'}</span></td><td><button className="btn btn-danger" onClick={()=>onDelete(s.id)}>Delete</button></td></tr>)}{!rows.length&&<tr><td colSpan={7} style={{textAlign:'center',padding:30,color:'#64748b'}}>No students found.</td></tr>}</tbody></table></div>}
function TeacherTable({rows,onDelete}:{rows:Teacher[];onDelete:(id:string)=>void}){return <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>TID</th><th>Subject</th><th>Phone</th><th>Status</th><th/></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td><b>{t.name}</b></td><td>{t.tid}</td><td>{t.subject||'—'}</td><td>{t.phone}</td><td><span className="pill">{t.status||'active'}</span></td><td><button className="btn btn-danger" onClick={()=>onDelete(t.id)}>Delete</button></td></tr>)}{!rows.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:30,color:'#64748b'}}>No teachers found.</td></tr>}</tbody></table></div>}
function AnnouncementTable({rows}:{rows:Announcement[]}){return <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Message</th><th>Target</th><th>Date</th></tr></thead><tbody>{rows.map(a=><tr key={a.id}><td><b>{a.title}</b></td><td style={{whiteSpace:'normal',minWidth:260}}>{a.desc||'—'}</td><td><span className="pill">{a.target||'all'}</span></td><td>{a.date||'—'}</td></tr>)}{!rows.length&&<tr><td colSpan={4} style={{textAlign:'center',padding:30,color:'#64748b'}}>No announcements found.</td></tr>}</tbody></table></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,.5)',display:'grid',placeItems:'center',padding:18}}><div className="panel" style={{width:'100%',maxWidth:620,maxHeight:'90vh',overflow:'auto'}}><div className="panel-head"><h2>{title}</h2><button className="btn btn-ghost" onClick={onClose}>✕</button></div>{children}</div></div>}

function AdminRoute(){const navigate=useNavigate();const [user,setUser]=useState<User|null>(null);const [checking,setChecking]=useState(true);useEffect(()=>{getCurrentUser().then(u=>{if(u?.role==='admin')setUser(u);setChecking(false)})},[]);if(checking)return <div style={{padding:40,textAlign:'center'}}>Loading admin portal…</div>;if(!user)return <Login onSuccess={async()=>{const u=await getCurrentUser();if(u?.role==='admin')setUser(u);else navigate({to:'/'});}}/>;return <Dashboard user={user} onLogout={async()=>{await signOut();navigate({to:'/',replace:true})}}/>}
