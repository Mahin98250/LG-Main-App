import { useCallback, useEffect, useMemo, useState } from "react";
import { addR, gdb } from "@/lg/data";

const A = { text: "#0F1B3D", sub: "#64748B", border: "#E2E8F0", light: "#F8FAFF", accent: "#4361EE", red: "#EF4444" };
type UserRow = { ref?: string | null; name?: string | null; role?: string | null; phone?: string | null };
type MessageRow = { id?: string; from?: string; to?: string; fromname?: string; text?: string; time?: string; created_at?: string };
type Props = { user: { ref: string | null; name: string } };
const roleLabel = (role: string) => role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

export default function AdminMessagesPage({ user }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [u, m] = await Promise.all([gdb("users"), gdb("messages")]);
      setUsers((u || []).filter((x: UserRow) => ["teacher", "student", "parent"].includes(String(x.role))));
      setMessages(m || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load messages."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const recipients = useMemo(() => users.filter((x) => x.ref), [users]);
  const selected = recipients.find((x) => String(x.ref) === String(to));
  const send = async () => {
    const clean = text.trim();
    if (!to) return setError("Select a recipient first.");
    if (!clean) return setError("Enter a message first.");
    if (!user.ref) return setError("Your admin account is missing a reference ID.");
    setSending(true); setError(""); setNotice("");
    try {
      await addR("messages", { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, from: user.ref, to, fromname: user.name || "Admin", text: clean, time: new Date().toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, day: "2-digit", month: "short", year: "numeric" }) });
      setText(""); setNotice(`Message sent to ${selected?.name || "the selected user"}.`); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send the message."); }
    finally { setSending(false); }
  };
  return <div style={{ padding: 28, background: "#F0F4FF", minHeight: "calc(100vh - 80px)" }}>
    <div className="admin-message-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 18, alignItems: "start" }}>
      <section style={{ background: "#fff", border: `1px solid ${A.border}`, borderRadius: 20, padding: 22, boxShadow: "0 4px 20px rgba(15,27,61,.07)" }}>
        <h2 style={{ margin: 0, color: A.text, fontSize: 18 }}>Send a Message</h2><p style={{ margin: "6px 0 18px", color: A.sub, fontSize: 12 }}>Send a direct message to a teacher, student, or parent.</p>
        {error && <div style={{ marginBottom: 12, padding: 11, borderRadius: 10, background: "#FFF1F2", color: A.red, fontSize: 12 }}>{error}</div>}
        {notice && <div style={{ marginBottom: 12, padding: 11, borderRadius: 10, background: "#ECFDF5", color: "#15803D", fontSize: 12 }}>{notice}</div>}
        <label style={{ display: "block", marginBottom: 6, color: A.sub, fontSize: 12, fontWeight: 750 }}>RECIPIENT</label>
        <select value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${A.border}`, borderRadius: 11, background: A.light, color: A.text, marginBottom: 14 }}><option value="">Select recipient…</option>{recipients.map((r) => <option key={String(r.ref)} value={String(r.ref)}>{r.name || r.ref} · {roleLabel(String(r.role))}{r.phone ? ` · ${r.phone}` : ""}</option>)}</select>
        <label style={{ display: "block", marginBottom: 6, color: A.sub, fontSize: 12, fontWeight: 750 }}>MESSAGE</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message…" rows={6} maxLength={2000} style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${A.border}`, borderRadius: 11, background: A.light, color: A.text, resize: "vertical", outline: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}><span style={{ color: A.sub, fontSize: 11 }}>{text.length}/2000</span><button type="button" disabled={sending || loading} onClick={() => void send()} style={{ border: 0, borderRadius: 11, padding: "10px 17px", background: A.accent, color: "#fff", fontWeight: 800, cursor: sending ? "wait" : "pointer", opacity: sending ? .65 : 1 }}>{sending ? "Sending…" : "Send Message →"}</button></div>
      </section>
      <section style={{ background: "#fff", border: `1px solid ${A.border}`, borderRadius: 20, padding: 22, boxShadow: "0 4px 20px rgba(15,27,61,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}><div><h2 style={{ margin: 0, color: A.text, fontSize: 18 }}>Message History</h2><p style={{ margin: "5px 0 0", color: A.sub, fontSize: 12 }}>{messages.length} message{messages.length === 1 ? "" : "s"}</p></div><button type="button" onClick={() => void load()} style={{ border: `1px solid ${A.border}`, borderRadius: 10, padding: "8px 12px", background: A.light, color: A.text, fontWeight: 750, cursor: "pointer" }}>↻ Refresh</button></div>
        {loading ? <div style={{ padding: 30, textAlign: "center", color: A.sub }}>Loading messages…</div> : messages.length === 0 ? <div style={{ padding: 35, textAlign: "center", color: A.sub }}>No messages yet.</div> : <div style={{ display: "grid", gap: 10, maxHeight: "65vh", overflowY: "auto" }}>{[...messages].sort((a, b) => String(b.created_at || b.time || "").localeCompare(String(a.created_at || a.time || ""))).map((m, i) => { const recipient = users.find((u) => String(u.ref) === String(m.to)); return <div key={String(m.id || i)} style={{ padding: 14, border: `1px solid ${A.border}`, borderRadius: 14, background: A.light }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}><strong style={{ color: A.text }}>{m.fromname || "Admin"}</strong><span style={{ color: A.sub, fontSize: 11 }}>{m.time || m.created_at || ""}</span></div><div style={{ color: A.sub, fontSize: 11, marginBottom: 6 }}>To: <b style={{ color: A.text }}>{recipient?.name || m.to || "Unknown recipient"}</b></div><div style={{ color: A.text, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.text || ""}</div></div>; })}</div>}
      </section>
    </div>
  </div>;
}
