import { useCallback, useEffect, useMemo, useState } from "react";
import { addR, gdb, updR } from "@/lg/data";

const A = { text: "#0F1B3D", sub: "#64748B", border: "#E2E8F0", light: "#F8FAFF", accent: "#4361EE", green: "#16A34A", red: "#EF4444" };
type UserRow = { ref?: string | null; name?: string | null; role?: string | null; phone?: string | null };
type MessageRow = { id?: string; from?: string; to?: string; fromname?: string; toname?: string; text?: string; time?: string; created_at?: string; read?: boolean };
type Props = { user: { id: string; ref: string | null; name: string } };

const roleLabel = (role: string) => role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
const timeNow = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

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
    setLoading(true);
    setError("");
    try {
      const [u, m] = await Promise.all([gdb("users"), gdb("messages")]);
      const nextUsers = (u || []).filter((x: UserRow) => ["teacher", "student", "parent"].includes(String(x.role)) && x.ref);
      setUsers(nextUsers);
      setMessages(m || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const recipients = useMemo(() => [...users].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))), [users]);
  const selected = recipients.find((x) => String(x.ref) === String(to));
  const adminRef = user.ref || user.id;
  const thread = useMemo(() => {
    if (!to) return [];
    return messages
      .filter((m) => (String(m.from) === String(adminRef) && String(m.to) === String(to)) || (String(m.from) === String(to) && String(m.to) === String(adminRef)))
      .sort((a, b) => String(a.created_at || a.time || "").localeCompare(String(b.created_at || b.time || "")));
  }, [messages, to, adminRef]);

  useEffect(() => {
    if (!to) return;
    const incoming = thread.filter((m) => String(m.to) === String(adminRef) && !m.read && m.id);
    if (!incoming.length) return;
    void Promise.all(incoming.map((m) => updR("messages", m.id, { read: true }))).then(() => load()).catch(() => undefined);
  }, [to, thread, adminRef, load]);

  const send = async () => {
    const clean = text.trim();
    if (!to) { setError("Select a recipient first."); return; }
    if (!clean) { setError("Enter a message first."); return; }
    if (clean.length > 2000) { setError("Message is too long. Maximum 2000 characters."); return; }
    setSending(true);
    setError("");
    setNotice("");
    try {
      await addR("messages", {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: adminRef,
        to,
        fromname: user.name || "Admin",
        toname: selected?.name || to,
        text: clean,
        time: timeNow(),
        read: false,
      });
      setText("");
      setNotice(`Message sent to ${selected?.name || "the selected user"}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send the message.");
    } finally {
      setSending(false);
    }
  };

  return <div style={{ padding: 28, background: "#F0F4FF", minHeight: "calc(100vh - 80px)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
      <section style={{ background: "#fff", border: `1px solid ${A.border}`, borderRadius: 20, padding: 22, boxShadow: "0 4px 20px rgba(15,27,61,.07)" }}>
        <h2 style={{ margin: 0, color: A.text, fontSize: 18 }}>Send a Message</h2>
        <p style={{ margin: "6px 0 18px", color: A.sub, fontSize: 12 }}>Direct messages to teachers, students, and parents.</p>
        {error && <div style={{ marginBottom: 12, padding: 11, borderRadius: 10, background: "#FFF1F2", color: A.red, fontSize: 12 }}>{error}</div>}
        {notice && <div style={{ marginBottom: 12, padding: 11, borderRadius: 10, background: "#ECFDF5", color: A.green, fontSize: 12 }}>{notice}</div>}
        <label style={{ display: "block", marginBottom: 6, color: A.sub, fontSize: 12, fontWeight: 750 }}>RECIPIENT</label>
        <select value={to} onChange={(e) => { setTo(e.target.value); setError(""); setNotice(""); }} style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${A.border}`, borderRadius: 11, background: A.light, color: A.text, marginBottom: 14 }}>
          <option value="">Select recipient…</option>
          {recipients.map((r) => <option key={String(r.ref)} value={String(r.ref)}>{r.name || r.ref} · {roleLabel(String(r.role))}{r.phone ? ` · ${r.phone}` : ""}</option>)}
        </select>
        <label style={{ display: "block", marginBottom: 6, color: A.sub, fontSize: 12, fontWeight: 750 }}>MESSAGE</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message…" rows={7} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${A.border}`, borderRadius: 11, background: A.light, color: A.text, resize: "vertical", outline: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ color: A.sub, fontSize: 11 }}>{text.length}/2000</span>
          <button type="button" disabled={sending || loading || !to || !text.trim()} onClick={() => void send()} style={{ border: 0, borderRadius: 11, padding: "10px 17px", background: A.accent, color: "#fff", fontWeight: 800, cursor: sending ? "wait" : "pointer", opacity: sending || loading || !to || !text.trim() ? .6 : 1 }}>{sending ? "Sending…" : "Send Message →"}</button>
        </div>
      </section>

      <section style={{ background: "#fff", border: `1px solid ${A.border}`, borderRadius: 20, padding: 22, boxShadow: "0 4px 20px rgba(15,27,61,.07)", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div><h2 style={{ margin: 0, color: A.text, fontSize: 18 }}>Conversation</h2><p style={{ margin: "5px 0 0", color: A.sub, fontSize: 12 }}>{selected ? `Chat with ${selected.name || selected.ref}` : `${messages.length} total message${messages.length === 1 ? "" : "s"}`}</p></div>
          <button type="button" onClick={() => void load()} style={{ border: `1px solid ${A.border}`, borderRadius: 10, padding: "8px 12px", background: A.light, color: A.text, fontWeight: 750, cursor: "pointer" }}>↻ Refresh</button>
        </div>
        {!to && <div style={{ padding: 55, textAlign: "center", color: A.sub, border: `1px dashed ${A.border}`, borderRadius: 14 }}>Select a recipient to open the conversation.</div>}
        {to && !loading && <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 360, maxHeight: "58vh", overflowY: "auto", padding: 4 }}>
          {thread.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: A.sub, fontSize: 13 }}>No messages with this user yet.<br />Send the first message from the panel on the left.</div>}
          {thread.map((m, i) => {
            const mine = String(m.from) === String(adminRef);
            return <div key={String(m.id || i)} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: mine ? A.accent : A.light, color: mine ? "#fff" : A.text, border: mine ? 0 : `1px solid ${A.border}` }}>
                <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.text || ""}</div>
                <div style={{ fontSize: 10, marginTop: 5, opacity: .7 }}>{m.time || m.created_at || ""}</div>
              </div>
            </div>;
          })}
        </div>}
        {to && loading && <div style={{ padding: 55, textAlign: "center", color: A.sub }}>Loading conversation…</div>}
      </section>
    </div>
    <style>{`@media (max-width: 820px){.admin-message-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
