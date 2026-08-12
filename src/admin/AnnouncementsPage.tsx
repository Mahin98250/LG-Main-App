import { useEffect, useMemo, useState } from "react";
import { addR, delR, gdb, updR } from "@/lg/data";

type Row = Record<string, any> & { id?: string };

const targetLabels: Record<string, string> = {
  all: "Everyone",
  students: "Students",
  parents: "Parents",
  teachers: "Teachers",
};

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ title: "", desc: "", date: new Date().toISOString().slice(0, 10), target: "all" });

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [announcements, batchRows] = await Promise.all([gdb("announcements"), gdb("batches")]);
      setRows(Array.isArray(announcements) ? announcements : []);
      setBatches(Array.isArray(batchRows) ? batchRows.filter((b: Row) => String(b.status ?? "active") === "active") : []);
    } catch (e: any) {
      setError(e?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const targetOptions = useMemo(() => [
    ["all", "Everyone"],
    ["students", "All Students"],
    ["parents", "All Parents"],
    ["teachers", "All Teachers"],
    ...batches.map((b) => [`batch:${b.id}`, `Batch: ${b.name || `${b.cls || ""}${b.sec ? `-${b.sec}` : ""}`}`]),
  ], [batches]);

  const openNew = () => {
    setEditing({});
    setForm({ title: "", desc: "", date: new Date().toISOString().slice(0, 10), target: "all" });
    setError("");
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({ title: String(row.title || ""), desc: String(row.desc || ""), date: String(row.date || new Date().toISOString().slice(0, 10)), target: String(row.target || "all") });
    setError("");
  };

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { title: form.title.trim(), desc: form.desc.trim(), date: form.date || null, target: form.target || "all" };
      if (editing?.id) await updR("announcements", editing.id, payload);
      else await addR("announcements", { id: `ann${Date.now()}`, ...payload });
      setEditing(null);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!row.id || !window.confirm(`Delete “${row.title || "this announcement"}”?`)) return;
    setError("");
    try { await delR("announcements", row.id); await refresh(); }
    catch (e: any) { setError(e?.message || "Unable to delete announcement."); }
  };

  const labelFor = (target: string) => target.startsWith("batch:")
    ? `Batch: ${batches.find((b) => String(b.id) === target.slice(6))?.name || target.slice(6)}`
    : targetLabels[target] || target;

  return <div style={{ padding: 28, background: "#F0F4FF", minHeight: "100%", fontFamily: "Poppins,system-ui,sans-serif", color: "#0F1B3D" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div><h2 style={{ margin: 0 }}>Announcements</h2><p style={{ margin: "5px 0 0", color: "#64748B", fontSize: 13 }}>Publish notices to the exact audience that should receive them.</p></div>
      <button type="button" onClick={openNew} style={{ border: 0, borderRadius: 12, padding: "11px 16px", background: "#4361EE", color: "#fff", fontWeight: 800, cursor: "pointer" }}>＋ New Announcement</button>
    </div>
    {error && <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 12, padding: 12, marginBottom: 16 }}>{error}</div>}
    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "auto" }}>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading…</div> : rows.length === 0 ? <div style={{ padding: 50, textAlign: "center", color: "#64748B" }}>No announcements yet.</div> : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ background: "#F8FAFF" }}><th style={{ padding: 13, textAlign: "left" }}>Title</th><th style={{ padding: 13, textAlign: "left" }}>Audience</th><th style={{ padding: 13, textAlign: "left" }}>Date</th><th style={{ padding: 13, textAlign: "right" }}>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} style={{ borderTop: "1px solid #E2E8F0" }}><td style={{ padding: 13 }}><b>{row.title}</b>{row.desc && <div style={{ color: "#64748B", marginTop: 3, maxWidth: 520 }}>{row.desc}</div>}</td><td style={{ padding: 13 }}>{labelFor(String(row.target || "all"))}</td><td style={{ padding: 13 }}>{row.date || "—"}</td><td style={{ padding: 13, textAlign: "right" }}><button type="button" onClick={() => openEdit(row)} style={{ marginRight: 8, border: "1px solid #CBD5E1", background: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer" }}>Edit</button><button type="button" onClick={() => void remove(row)} style={{ border: 0, background: "#FEF2F2", color: "#B91C1C", borderRadius: 9, padding: "7px 10px", cursor: "pointer" }}>Delete</button></td></tr>)}</tbody></table>}
    </div>
    {editing && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(15,27,61,.55)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }} onMouseDown={() => !saving && setEditing(null)}><div onMouseDown={(e) => e.stopPropagation()} style={{ width: "min(620px,100%)", background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.2)" }}><h3 style={{ marginTop: 0 }}>{editing.id ? "Edit Announcement" : "New Announcement"}</h3><label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" style={{ width: "100%", padding: 11, border: "1px solid #CBD5E1", borderRadius: 10, marginBottom: 14 }} /><label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>Message</label><textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Write the announcement…" style={{ width: "100%", minHeight: 110, padding: 11, border: "1px solid #CBD5E1", borderRadius: 10, marginBottom: 14, resize: "vertical" }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: "100%", padding: 11, border: "1px solid #CBD5E1", borderRadius: 10 }} /></div><div><label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>Audience</label><select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} style={{ width: "100%", padding: 11, border: "1px solid #CBD5E1", borderRadius: 10, background: "#fff" }}>{targetOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}><button type="button" disabled={saving} onClick={() => setEditing(null)} style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Cancel</button><button type="button" disabled={saving} onClick={() => void save()} style={{ border: 0, background: "#4361EE", color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>{saving ? "Saving…" : "Save Announcement"}</button></div></div></div>}
  </div>;
}
