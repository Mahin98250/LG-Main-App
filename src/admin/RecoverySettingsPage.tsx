import { useCallback, useEffect, useMemo, useState } from "react";
import { C, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any> & { id: string | number };
type Role = "student" | "parent" | "teacher";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const syntheticEmail = (value: unknown) => String(value || "").trim().toLowerCase().endsWith("@learnersguide.in");
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 4px 20px rgba(15,27,61,.07)" };

async function getFunctionErrorMessage(error: any) {
  if (error?.context && typeof error.context.json === "function") {
    try {
      const body = await error.context.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch { /* response may already be consumed */ }
  }
  return error?.message || "Authentication service failed.";
}

async function saveRecoveryEmail(row: Row, email: string) {
  const role = String(row.role) as Role;
  const body = {
    action: "update",
    role,
    loginId: String(row.phone || ""),
    name: String(row.name || "User"),
    ref: String(row.ref || ""),
    authId: String(row.auth_id || ""),
    recoveryEmail: email.trim().toLowerCase(),
  };
  const { data, error } = await supabase.functions.invoke("admin-provision-user", { body });
  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(String(data.error));
  if (!data?.authId) throw new Error("Authentication account was not updated.");
  return data as { authId: string; email?: string };
}

export default function RecoverySettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const users = (await gdb("users")) as Row[];
      const accountRows = users
        .filter((row) => ["student", "parent", "teacher"].includes(String(row.role)))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setRows(accountRows);
      setDrafts(Object.fromEntries(accountRows.map((row) => [String(row.id), syntheticEmail(row.email) ? "" : String(row.email || "")])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load user accounts from Supabase.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "all" && String(row.role) !== roleFilter) return false;
      if (!q) return true;
      return [row.name, row.phone, row.email, row.role, row.ref].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [rows, query, roleFilter]);

  const save = async (row: Row) => {
    const id = String(row.id);
    const email = String(drafts[id] || "").trim().toLowerCase();
    setError(""); setSuccess("");
    if (!isEmail(email)) { setError("Enter a valid recovery email address for this account."); return; }
    setSavingId(id);
    try {
      const result = await saveRecoveryEmail(row, email);
      await updR("users", row.id, { email: result.email || email, auth_id: result.authId });
      setRows((current) => current.map((item) => String(item.id) === id ? { ...item, email: result.email || email, auth_id: result.authId } : item));
      setDrafts((current) => ({ ...current, [id]: result.email || email }));
      setSuccess(`Recovery email verified and saved for ${row.name || "this account"}. Reset links will be sent only to this address.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save recovery email. The account was not changed.");
    } finally { setSavingId(null); }
  };

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, row: Row) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    if (savingId !== String(row.id)) void save(row);
  };

  const roleLabel = (role: string) => role === "student" ? "Student" : role === "parent" ? "Parent" : "Teacher";
  const identifierLabel = (role: string) => role === "student" ? "SID" : "Phone";

  return <div style={{ padding: 28, overflowY: "auto", background: "#F7F9FF", minHeight: "100%" }}>
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ margin: 0, color: C.text, fontSize: 22 }}>User Accounts & Recovery</h2>
      <p style={{ margin: "5px 0 0", color: C.sub, fontSize: 13 }}>Manage the verified recovery email attached to each real Student, Parent, and Teacher Supabase Auth account. Passwords are never displayed or stored here.</p>
    </div>
    {success && <div role="status" style={{ background: "#DCFCE7", borderRadius: 14, padding: "12px 18px", marginBottom: 16, color: "#15803D", fontWeight: 700, fontSize: 13 }}>✅ {success}</div>}
    {error && <div role="alert" style={{ ...card, padding: 13, marginBottom: 16, background: "#FFF7F7", color: C.red, fontSize: 13, fontWeight: 650 }}>⚠️ {error}</div>}
    <div style={{ ...card, padding: 16, marginBottom: 18, background: "#F8FAFF" }}>
      <b style={{ color: C.text }}>Secure password recovery</b>
      <div style={{ marginTop: 6, color: C.sub, fontSize: 12, lineHeight: 1.6 }}>A student starts recovery with their SID. A parent or teacher starts with their registered phone number. If the identifier matches an active account with a verified recovery email here, Supabase sends the reset link to that email. The email address is never revealed on the public recovery screen.</div>
    </div>
    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
      {(["all", "student", "parent", "teacher"] as const).map((role) => <button key={role} type="button" onClick={() => setRoleFilter(role)} style={{ border: `1px solid ${roleFilter === role ? C.accent : C.border}`, background: roleFilter === role ? `${C.accent}12` : "#fff", color: roleFilter === role ? C.accent : C.sub, borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{role === "all" ? "All" : roleLabel(role)}</button>)}
    </div>
    <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search name, SID, phone, email…" aria-label="Search user accounts" style={{ flex: 1, minWidth: 240, padding: "11px 15px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#fff", outline: "none" }} />
      <button type="button" onClick={() => void load()} disabled={loading} style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>{loading ? "Loading…" : "Refresh"}</button>
    </div>
    <div style={card}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}><thead><tr>{["Account", "Role", "Identifier", "Recovery status", "Recovery email", "Action"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "12px 14px", background: "#F8FAFF", color: C.sub, fontSize: 12 }}>{heading}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.sub }}>Loading real accounts from Supabase…</td></tr> : filtered.length ? filtered.map((row) => {
        const id = String(row.id); const hasRecovery = Boolean(row.email && !syntheticEmail(row.email) && isEmail(String(row.email))); const role = String(row.role);
        return <tr key={id}>
          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 750 }}>{String(row.name || "User")}</td>
          <td style={{ padding: "12px 14px", fontSize: 12 }}>{roleLabel(role)}</td>
          <td style={{ padding: "12px 14px", fontSize: 12, fontFamily: "monospace" }}>{identifierLabel(role)}: {String(role === "student" ? row.ref || row.phone || "—" : row.phone || "—")}</td>
          <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 800, color: hasRecovery ? "#15803D" : C.red }}>{hasRecovery ? "✓ Verified" : "Not configured"}</td>
          <td style={{ padding: "12px 14px", minWidth: 290 }}><input type="email" value={drafts[id] ?? ""} onChange={(e) => setDrafts((current) => ({ ...current, [id]: e.target.value }))} onKeyDown={(e) => handleEmailKeyDown(e, row)} placeholder={hasRecovery ? "Recovery email" : "Add recovery email"} aria-label={`Recovery email for ${String(row.name || "User")}`} style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: "#F8FAFF", outline: "none" }} /></td>
          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}><button type="button" onClick={() => void save(row)} disabled={savingId === id} style={{ border: 0, borderRadius: 9, padding: "9px 12px", background: C.accent, color: "#fff", fontWeight: 800, cursor: savingId === id ? "wait" : "pointer", opacity: savingId === id ? .7 : 1 }}>{savingId === id ? "Saving…" : hasRecovery ? "Update email" : "Save & verify"}</button></td>
        </tr>;
      }) : <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.sub }}>No accounts found.</td></tr>}
    </tbody></table></div></div>
  </div>;
}
