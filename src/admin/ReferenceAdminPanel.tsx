import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { addR, delR, gdb } from "@/lg/data";
import { signIn } from "@/lg/auth";
import { LGLogo } from "@/lg/ui";

const A = {
  bg: "#F0F4FF",
  sidebar: "#0F1B3D",
  card: "#FFFFFF",
  accent: "#4361EE",
  gold: "#F5A623",
  green: "#22C55E",
  red: "#EF4444",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  text: "#0F1B3D",
  sub: "#64748B",
  border: "#E2E8F0",
  light: "#F8FAFF",
};

type PageKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "batches"
  | "attendance"
  | "homework"
  | "examschedule"
  | "results"
  | "materials"
  | "fees"
  | "announcements"
  | "accounts"
  | "marks"
  | "search"
  | "adminmsgs";

type Row = Record<string, unknown> & { id?: string | number };
type AdminUser = { id: string; name: string; phone: string; role: string; ref: string | null };

type Props = { user: AdminUser; onLogout: () => void };

const NAV: Array<{ key: PageKey; icon: string; label: string }> = [
  ["dashboard", "🏠", "Dashboard"],
  ["students", "🎓", "Students"],
  ["teachers", "👨‍🏫", "Teachers"],
  ["batches", "👥", "Batches & Timetable"],
  ["attendance", "✅", "Attendance"],
  ["homework", "📝", "Homework"],
  ["examschedule", "📋", "Exam Schedule"],
  ["results", "🏆", "Student Results"],
  ["materials", "📚", "Study Materials"],
  ["fees", "💰", "Fees"],
  ["announcements", "📢", "Announcements"],
  ["accounts", "🔐", "User Accounts"],
  ["marks", "📊", "Marks Overview"],
  ["search", "🔍", "Search Profiles"],
  ["adminmsgs", "✉️", "Messages"],
];

const META: Record<PageKey, { title: string; subtitle: string; table?: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Full overview of your institute" },
  students: { title: "Students", subtitle: "Add, edit, delete students — auto creates login accounts", table: "students" },
  teachers: { title: "Teachers", subtitle: "Manage teacher accounts and subjects", table: "teachers" },
  batches: { title: "Batches & Timetable", subtitle: "Create batches, assign timetable slots and teachers", table: "batches" },
  attendance: { title: "Attendance", subtitle: "View all attendance records", table: "attendance" },
  homework: { title: "Homework", subtitle: "Monitor homework assigned by teachers", table: "homework" },
  examschedule: { title: "Exam Schedule", subtitle: "Schedule upcoming exams for classes", table: "examschedule" },
  results: { title: "Student Results", subtitle: "Enter and manage student exam results", table: "marks" },
  materials: { title: "Study Materials", subtitle: "Upload and manage study materials", table: "materials" },
  fees: { title: "Fees", subtitle: "Track and manage fee payments", table: "fees" },
  announcements: { title: "Announcements", subtitle: "Post announcements to all roles", table: "announcements" },
  accounts: { title: "User Accounts", subtitle: "View authorized login accounts", table: "users" },
  marks: { title: "Marks Overview", subtitle: "Analytics of all exam marks", table: "marks" },
  search: { title: "Search Profiles", subtitle: "Search student or teacher — full profile view" },
  adminmsgs: { title: "Messages", subtitle: "Send direct messages to teachers or students", table: "messages" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box} body{font-family:'Poppins',sans-serif;background:${A.bg}}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#4361EE33;border-radius:6px}
button,input,select,textarea{font-family:'Poppins',sans-serif}.admin-ref{min-height:100vh;background:${A.bg};color:${A.text};font-family:'Poppins',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes zoomIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.fu{animation:fadeUp .45s cubic-bezier(.34,1.4,.64,1) both}.zi{animation:zoomIn .3s cubic-bezier(.34,1.56,.64,1) both}
.nav-ref{transition:all .2s cubic-bezier(.34,1.56,.64,1);cursor:pointer;border-radius:12px}.nav-ref:hover{background:rgba(255,255,255,.08)!important;transform:translateX(4px)}.nav-ref.active{background:${A.accent}!important;box-shadow:0 6px 20px rgba(67,97,238,.35)}
.card-ref{background:#fff;border-radius:20px;padding:24px;box-shadow:0 4px 20px rgba(15,27,61,.07);border:1px solid #EEF2FF}.card-hover{transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease}.card-hover:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(15,27,61,.1)}
.stat-ref{transition:transform .22s cubic-bezier(.34,1.56,.64,1)}.stat-ref:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 14px 40px rgba(15,27,61,.12)!important}
.row-ref:hover{background:#F8FAFF}.btn-ref{border:0;border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;transition:.18s;display:inline-flex;align-items:center;gap:7px}.btn-ref:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(67,97,238,.18)}
.badge-ref{display:inline-block;padding:3px 11px;border-radius:20px;font-size:12px;font-weight:700}.modal-ref{position:fixed;inset:0;background:rgba(15,27,61,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}.modal-box-ref{background:#fff;border-radius:22px;padding:28px;width:100%;max-width:620px;max-height:92vh;overflow:auto;box-shadow:0 24px 72px rgba(15,27,61,.18)}
@media(max-width:900px){.admin-ref-shell{display:block!important}.admin-ref-side{position:relative!important;width:100%!important;min-height:auto!important}.admin-ref-nav{display:flex!important;overflow-x:auto}.admin-ref-main{min-width:0!important}.admin-ref-grid{grid-template-columns:1fr!important}.admin-ref-side-bottom{display:none!important}}
`;

function Badge({ value }: { value: unknown }) {
  const text = String(value ?? "—");
  const colors: Record<string, string> = { active: A.green, paid: A.green, present: A.green, pending: A.amber, overdue: A.red, absent: A.red, teacher: A.purple, student: A.accent, parent: A.green, admin: A.red };
  const color = colors[text.toLowerCase()] || A.sub;
  return <span className="badge-ref" style={{ background: `${color}18`, color }}>{text.toUpperCase()}</span>;
}

function Stat({ icon, label, value, color, sub, delay }: { icon: string; label: string; value: string | number; color: string; sub?: string; delay: string }) {
  return <div className={`card-ref stat-ref fu ${delay}`} style={{ padding: "20px 22px" }}><div style={{ width: 48, height: 48, borderRadius: 15, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>{icon}</div><div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 13, color: A.sub, marginTop: 4 }}>{label}</div>{sub && <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 3 }}>{sub}</div>}</div>;
}

function Sidebar({ page, setPage, onLogout }: { page: PageKey; setPage: (p: PageKey) => void; onLogout: () => void }) {
  return <aside className="admin-ref-side" style={{ width: 230, minHeight: "100vh", background: A.sidebar, display: "flex", flexDirection: "column", padding: "0 12px 20px", flexShrink: 0, position: "sticky", top: 0 }}>
    <div style={{ padding: "20px 8px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", display: "grid", placeItems: "center", overflow: "hidden", padding: 4, boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}><LGLogo size={32} showText={false} /></div><div><div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: -.3 }}>Learner&apos;s</div><div style={{ fontSize: 16, fontWeight: 900, color: A.gold, letterSpacing: -.3, marginTop: -3 }}>Guide</div></div></div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.18)", borderRadius: 20, padding: "3px 10px" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: A.red, animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: 11, color: A.red, fontWeight: 700 }}>ADMIN PANEL</span></div>
    </div>
    <nav className="admin-ref-nav" style={{ flex: 1, padding: "16px 0", overflowY: "auto" }} aria-label="Admin navigation">{NAV.map(([key, icon, label]) => <button key={key} type="button" className={`nav-ref${page === key ? " active" : ""}`} onClick={() => setPage(key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 4, border: 0, background: page === key ? A.accent : "transparent", color: page === key ? "#fff" : "rgba(255,255,255,.55)", fontWeight: page === key ? 700 : 500, fontSize: 14, textAlign: "left" }}><span style={{ width: 22, fontSize: 18 }}>{icon}</span>{label}</button>)}</nav>
    <div className="admin-ref-side-bottom" style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 8 }}><div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#EF4444,#F97316)", display: "grid", placeItems: "center" }}>👑</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Admin</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Full Access</div></div></div><button className="btn-ref" onClick={onLogout} style={{ width: "100%", justifyContent: "center", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", color: "#FF8080" }}>🚪 Logout</button></div>
  </aside>;
}

function TopBar({ meta, onRefresh }: { meta: { title: string; subtitle: string }; onRefresh: () => void }) {
  return <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", background: "#fff", borderBottom: `1px solid ${A.border}`, flexShrink: 0 }}><div><div style={{ fontSize: 20, fontWeight: 800 }}>{meta.title}</div><div style={{ fontSize: 13, color: A.sub, marginTop: 2 }}>{meta.subtitle}</div></div><button className="btn-ref" onClick={onRefresh} style={{ background: A.light, color: A.accent }}>↻ Refresh</button></header>;
}

function DataTable({ rows, table }: { rows: Row[]; table: string }) {
  const cols = useMemo(() => {
    const keys = new Set<string>();
    rows.slice(0, 8).forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    return [...keys].filter((k) => !["created_at", "updated_at"].includes(k)).slice(0, 7);
  }, [rows]);
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead><tr style={{ background: A.light }}>{(cols.length ? cols : ["id"]).map((k) => <th key={k} style={{ textAlign: "left", padding: "12px 16px", color: A.sub, fontWeight: 700, fontSize: 12, borderBottom: `2px solid ${A.border}`, whiteSpace: "nowrap", textTransform: "capitalize" }}>{k.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={String(row.id ?? i)} className="row-ref" style={{ borderBottom: `1px solid ${A.border}` }}>{(cols.length ? cols : ["id"]).map((k) => <td key={k} style={{ padding: "12px 16px", color: A.text, verticalAlign: "middle", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k === "status" || k === "role" || k === "target" ? <Badge value={row[k]} /> : String(row[k] ?? "—")}</td>)}</tr>) : <tr><td colSpan={Math.max(1, cols.length)} style={{ textAlign: "center", padding: 40, color: A.sub }}>No records found.</td></tr>}</tbody></table></div>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-ref" onClick={onClose}><div className="modal-box-ref zi" onClick={(e) => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}><div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div><button className="btn-ref" onClick={onClose} style={{ background: A.light, color: A.sub, padding: 8 }}>✕</button></div>{children}</div></div>; }

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) { return <label style={{ display: "block", marginBottom: 14 }}><span style={{ display: "block", fontSize: 12, fontWeight: 700, color: A.sub, marginBottom: 6 }}>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: `1.5px solid ${A.border}`, background: A.light, color: A.text, fontSize: 14, outline: "none" }} /></label>; }

function DashboardPage({ rows, onNavigate }: { rows: Record<string, Row[]>; onNavigate: (p: PageKey) => void }) {
  const students = rows.students || [], teachers = rows.teachers || [], attendance = rows.attendance || [], fees = rows.fees || [], homework = rows.homework || [], announcements = rows.announcements || [];
  const present = attendance.filter((a) => String(a.status).toLowerCase() === "present").length;
  const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const pending = fees.filter((f) => String(f.status).toLowerCase() !== "paid");
  const amount = (status: string) => fees.filter((f) => String(f.status).toLowerCase() === status).reduce((s, f) => s + Number(f.amount || 0), 0);
  return <div style={{ padding: 28 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16, marginBottom: 24 }}>
      <Stat icon="🎓" label="Total Students" value={students.length} color={A.accent} sub={`${students.filter((s) => String(s.status).toLowerCase() === "active").length} active`} delay="d1" />
      <Stat icon="👨‍🏫" label="Teachers" value={teachers.length} color={A.purple} sub="All active" delay="d2" />
      <Stat icon="✅" label="Attendance Rate" value={`${rate}%`} color={A.green} sub={`${present}/${attendance.length} records`} delay="d3" />
      <Stat icon="💰" label="Pending Fees" value={pending.length} color={A.red} sub={`₹${pending.reduce((s, f) => s + Number(f.amount || 0), 0).toLocaleString("en-IN")}`} delay="d4" />
      <Stat icon="📝" label="Active Homework" value={homework.length} color={A.gold} delay="d5" />
      <Stat icon="📢" label="Announcements" value={announcements.length} color={A.cyan} delay="d6" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20, marginBottom: 20 }}>
      <div className="card-ref fu d2"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Weekly Attendance Trend 📊</div><div style={{ fontSize: 12, color: A.sub, marginBottom: 18 }}>This week's presence rate</div><div style={{ height: 110, display: "flex", alignItems: "flex-end", gap: 10 }}>{["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => { const v = Math.max(0, Math.min(100, rate + [ -5, 2, -2, 5, 0 ][i])); return <div key={d} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 11, color: A.accent, fontWeight: 700 }}>{v}%</div><div style={{ height: 72, marginTop: 5, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: `${Math.max(4, v)}%`, background: `linear-gradient(180deg,${A.accent},#7B91F5)`, borderRadius: "6px 6px 0 0" }} /></div><div style={{ fontSize: 11, color: A.sub, marginTop: 5 }}>{d}</div></div>; })}</div></div>
      <div className="card-ref fu d3"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Fee Collection 💰</div>{[["Collected", A.green, amount("paid")],["Pending", A.amber, amount("pending")],["Overdue", A.red, amount("overdue")]].map(([l,c,v]) => <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${A.border}` }}><span style={{ color: A.text, fontWeight: 600 }}>{l}</span><b style={{ color: String(c) }}>₹{Number(v).toLocaleString("en-IN")}</b></div>)}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
      <div className="card-ref fu d4"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Recent Students 🎓</div>{students.slice(0, 4).map((s) => <div key={String(s.id)} className="row-ref" onClick={() => onNavigate("students")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${A.border}`, cursor: "pointer" }}><div style={{ width: 36, height: 36, borderRadius: 11, background: `${A.accent}18`, display: "grid", placeItems: "center", fontWeight: 800, color: A.accent }}>{String(s.name || "?")[0].toUpperCase()}</div><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{String(s.name || "Unnamed")}</b><div style={{ fontSize: 11, color: A.sub }}>Class {String(s.cls || "—")}-{String(s.sec || "—")} · {String(s.sid || "—")}</div></div><Badge value={s.status || "active"} /></div>)}{!students.length && <div style={{ color: A.sub }}>No students found.</div>}</div>
      <div className="card-ref fu d5"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Latest Announcements 📢</div>{announcements.slice(0, 4).map((a) => <div key={String(a.id)} style={{ padding: "10px 0", borderBottom: `1px solid ${A.border}` }}><b style={{ fontSize: 13 }}>{String(a.title || "Untitled")}</b><div style={{ marginTop: 4 }}><Badge value={a.target || "all"} /> <span style={{ fontSize: 11, color: A.sub }}>{String(a.date || "")}</span></div></div>)}{!announcements.length && <div style={{ color: A.sub }}>No announcements yet.</div>}</div>
    </div>
  </div>;
}

function CrudPage({ page, rows, reload }: { page: PageKey; rows: Row[]; reload: () => void }) {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [idValue, setIdValue] = useState("");
  const [extra, setExtra] = useState("");
  const table = META[page].table!;
  const canAdd = ["students", "teachers", "announcements"].includes(page);
  const add = async () => {
    if (!name) return;
    const row: Row = { id: `${page[0]}${Date.now()}`, name };
    if (page === "students") Object.assign(row, { sid: idValue, cls: extra, status: "active" });
    if (page === "teachers") Object.assign(row, { tid: idValue, subject: extra, status: "active" });
    if (page === "announcements") Object.assign(row, { title: name, desc: extra, target: "all", date: new Date().toLocaleDateString("en-IN") });
    await addR(table, row);
    setModal(false); setName(""); setIdValue(""); setExtra(""); reload();
  };
  const remove = async (id: string | number | undefined) => { if (!id || !confirm("Delete this record?")) return; await delR(table, id); reload(); };
  return <div style={{ padding: 28 }}><div className="card-ref"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontSize: 16, fontWeight: 800 }}>{META[page].title}</div>{canAdd && <button className="btn-ref" onClick={() => setModal(true)} style={{ background: A.accent, color: "#fff" }}>＋ Add {page === "students" ? "Student" : page === "teachers" ? "Teacher" : "Announcement"}</button>}</div><DataTable rows={rows} table={table}/>{page !== "batches" && rows.length > 0 && canAdd && <div style={{ marginTop: 12, fontSize: 11, color: A.sub }}>Records are stored in Supabase and mirrored locally by the app.</div>}</div>{modal && <Modal title={`Add ${page === "students" ? "Student" : page === "teachers" ? "Teacher" : "Announcement"}`} onClose={() => setModal(false)}><Field label={page === "announcements" ? "TITLE" : "NAME"} value={name} onChange={setName}/>{page !== "announcements" && <Field label={page === "students" ? "SID" : "TEACHER ID"} value={idValue} onChange={setIdValue}/>}<Field label={page === "announcements" ? "MESSAGE" : page === "students" ? "CLASS" : "SUBJECT"} value={extra} onChange={setExtra}/><button className="btn-ref" onClick={add} style={{ background: A.accent, color: "#fff" }}>Create</button></Modal>}</div>;
}

export function ReferenceAdminPanel({ user, onLogout }: Props) {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const tables = page === "dashboard" ? ["students", "teachers", "attendance", "fees", "homework", "announcements"] : META[page].table ? [META[page].table!] : ["students", "teachers"];
      const pairs = await Promise.all(tables.map(async (t) => [t, await gdb(t)] as const));
      setData((old) => ({ ...old, ...Object.fromEntries(pairs) }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load data."); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const rows = META[page].table ? data[META[page].table!] || [] : [];
  const filteredSearch = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [...(data.students || []), ...(data.teachers || [])];
    return [...(data.students || []), ...(data.teachers || [])].filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [data.students, data.teachers, search]);

  const meta = META[page];
  return <div className="admin-ref"><style>{CSS}</style><div className="admin-ref-shell" style={{ display: "flex", minHeight: "100vh" }}><Sidebar page={page} setPage={setPage} onLogout={onLogout}/><div className="admin-ref-main" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}><TopBar meta={meta} onRefresh={load}/>{error && <div style={{ margin: "16px 28px 0", padding: "12px 16px", background: "#FEF2F2", color: A.red, borderRadius: 12, fontSize: 13 }}>{error}</div>}{loading && <div style={{ padding: "10px 28px", color: A.sub, fontSize: 12 }}>Syncing with Supabase…</div>}{page === "dashboard" ? <DashboardPage rows={data} onNavigate={setPage}/> : page === "search" ? <div style={{ padding: 28 }}><div className="card-ref"><Field label="SEARCH STUDENT OR TEACHER" value={search} onChange={setSearch}/><DataTable rows={filteredSearch} table="profiles"/></div></div> : <CrudPage page={page} rows={rows} reload={load}/>}</div></div></div>;
}

export function AdminLogin({ onSuccess }: { onSuccess: (user: AdminUser) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => { if (!email || !password) return setError("Enter your administrator email and password."); setLoading(true); setError(""); const result = await signIn(email, password, "admin"); setLoading(false); if (result.user?.role === "admin") onSuccess(result.user as AdminUser); else setError(result.error || "Administrator access was not granted."); };
  return <div className="admin-ref" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "linear-gradient(160deg,#0d1f4e 0%,#122466 50%,#0a1835 100%)" }}><style>{CSS}</style><div className="zi" style={{ width: "100%", maxWidth: 420 }}><div style={{ textAlign: "center", marginBottom: 28 }}><div style={{ display: "inline-flex", width: 76, height: 76, borderRadius: 20, background: "#fff", alignItems: "center", justifyContent: "center", padding: 6, boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}><LGLogo size={64} showText={false}/></div><div style={{ color: "#fff", fontSize: 25, fontWeight: 900, marginTop: 12 }}>Learner&apos;s Guide</div><div style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 4 }}>Administrator access</div></div><div className="card-ref" style={{ padding: 28 }}><Field label="ADMIN EMAIL" value={email} onChange={setEmail} type="email"/><Field label="PASSWORD" value={password} onChange={setPassword} type="password"/><button className="btn-ref" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center", background: A.accent, color: "#fff", opacity: loading ? .7 : 1 }}>{loading ? "Signing in…" : "Sign in as Administrator"}</button>{error && <div style={{ marginTop: 14, padding: 11, borderRadius: 11, background: "#FEF2F2", color: A.red, fontSize: 12 }}>{error}</div>}</div></div></div>;
}
