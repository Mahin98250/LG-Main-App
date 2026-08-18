import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any>;
type FeeStatus = "pending" | "paid" | "overdue";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 18,
  boxShadow: "0 4px 18px rgba(15,27,61,.06)",
};
const button = (color = "#4361EE"): React.CSSProperties => ({
  border: 0,
  borderRadius: 10,
  padding: "10px 14px",
  background: color,
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
});
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  background: "#F8FAFF",
};

function Status({ value }: { value: string }) {
  const color = value === "paid" ? "#16A34A" : value === "overdue" ? "#DC2626" : "#D97706";
  return <span style={{ padding: "4px 9px", borderRadius: 999, background: `${color}18`, color, fontSize: 11, fontWeight: 800 }}>{value.toUpperCase()}</span>;
}

export default function FeesManagementPage() {
  const [fees, setFees] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | FeeStatus>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ sid: "", desc: "", amount: "", due: "", status: "pending" as FeeStatus, paidon: "" });

  const load = useCallback(async () => {
    setError("");
    try {
      const [{ data: feeRows, error: feeError }, { data: studentRows, error: studentError }] = await Promise.all([
        supabase.from("fees").select("id,sid,desc,amount,due,status,paidon,created_at").order("due", { ascending: true }),
        supabase.from("students").select("id,name,sid,cls,sec,status").order("name", { ascending: true }),
      ]);
      if (feeError) throw feeError;
      if (studentError) throw studentError;
      setFees(feeRows || []);
      setStudents(studentRows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load fee records.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const studentById = useMemo(() => new Map(students.map((s) => [String(s.id), s])), [students]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fees.filter((fee) => {
      const student = studentById.get(String(fee.sid));
      const haystack = `${student?.name || ""} ${student?.sid || fee.sid || ""} ${fee.desc || ""}`.toLowerCase();
      return (!q || haystack.includes(q)) && (status === "all" || String(fee.status || "pending").toLowerCase() === status);
    });
  }, [fees, query, status, studentById]);

  const totals = useMemo(() => {
    const amount = (s: string) => fees.filter((f) => String(f.status || "pending").toLowerCase() === s).reduce((n, f) => n + Number(f.amount || 0), 0);
    return {
      billed: fees.reduce((n, f) => n + Number(f.amount || 0), 0),
      paid: amount("paid"),
      pending: amount("pending"),
      overdue: amount("overdue"),
    };
  }, [fees]);

  const reset = () => {
    setEditing(null);
    setForm({ sid: "", desc: "", amount: "", due: "", status: "pending", paidon: "" });
    setOpen(false);
  };

  const save = async () => {
    if (!form.sid || !form.desc.trim() || !form.amount || Number(form.amount) < 0 || !form.due) {
      setError("Student, fee description, amount and due date are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        sid: form.sid,
        desc: form.desc.trim(),
        amount: Number(form.amount),
        due: form.due,
        status: form.status,
        paidon: form.status === "paid" ? (form.paidon || new Date().toISOString().slice(0, 10)) : null,
      };
      if (editing) {
        const { error: updateError } = await supabase.from("fees").update(payload).eq("id", editing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("fees").insert({ id: `fee-${Date.now()}`, ...payload });
        if (insertError) throw insertError;
      }
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save fee record.");
    } finally {
      setBusy(false);
    }
  };

  const edit = (fee: Row) => {
    setEditing(fee);
    setForm({ sid: String(fee.sid || ""), desc: String(fee.desc || ""), amount: String(fee.amount ?? ""), due: String(fee.due || ""), status: (String(fee.status || "pending").toLowerCase() as FeeStatus), paidon: String(fee.paidon || "") });
    setOpen(true);
  };

  const markPaid = async (fee: Row) => {
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.from("fees").update({ status: "paid", paidon: new Date().toISOString().slice(0, 10) }).eq("id", fee.id);
      if (updateError) throw updateError;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to mark fee as paid.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (fee: Row) => {
    if (!window.confirm("Delete this fee record permanently?")) return;
    setBusy(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("fees").delete().eq("id", fee.id);
      if (deleteError) throw deleteError;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete fee record.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", padding: 24, color: "#0F1B3D", fontFamily: "Poppins,system-ui,sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div><h2 style={{ margin: 0 }}>💰 Fees Management</h2><div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>Create, edit, collect, track and remove student fee records from the live Supabase database.</div></div>
        <button type="button" style={button()} onClick={() => { reset(); setOpen(true); }}>＋ Add Fee</button>
      </div>

      {error && <div role="alert" style={{ ...card, padding: 12, marginBottom: 14, color: "#B91C1C", background: "#FEF2F2" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 }}>
        {[["Total Billed", totals.billed, "#4361EE"], ["Collected", totals.paid, "#16A34A"], ["Pending", totals.pending, "#D97706"], ["Overdue", totals.overdue, "#DC2626"]].map(([label, value, color]) => <div key={String(label)} style={{ ...card, padding: 16 }}><div style={{ fontSize: 11, color: "#64748B", fontWeight: 800 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 900, color: String(color), marginTop: 4 }}>₹{Number(value).toLocaleString("en-IN")}</div></div>)}
      </div>

      <div style={{ ...card, padding: 14, marginBottom: 14, display: "flex", gap: 9, flexWrap: "wrap" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, SID or fee description…" style={{ ...input, flex: "1 1 260px" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value as "all" | FeeStatus)} style={{ ...input, width: 150 }}><option value="all">All statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select>
        <button type="button" style={button("#64748B")} onClick={() => void load()}>↻ Refresh</button>
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{["Student","Class","Description","Amount","Due","Status","Paid On","Actions"].map((h) => <th key={h} style={{ textAlign: "left", padding: 11, background: "#F8FAFF", color: "#64748B", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{visible.length ? visible.map((fee) => { const s = studentById.get(String(fee.sid)); return <tr key={String(fee.id)}><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}><b>{s?.name || "Unknown student"}</b><div style={{ color: "#64748B", fontSize: 10 }}>{s?.sid || fee.sid || "—"}</div></td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}>{s?.cls || "—"}{s?.sec ? `-${s.sec}` : ""}</td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}>{fee.desc || "Fee"}</td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0", fontWeight: 800 }}>₹{Number(fee.amount || 0).toLocaleString("en-IN")}</td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}>{fee.due || "—"}</td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}><Status value={String(fee.status || "pending")} /></td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0" }}>{fee.paidon || "—"}</td><td style={{ padding: 11, borderTop: "1px solid #E2E8F0", whiteSpace: "nowrap" }}><button type="button" style={{ ...button("#4361EE"), padding: "7px 9px", marginRight: 5 }} onClick={() => edit(fee)}>Edit</button>{String(fee.status).toLowerCase() !== "paid" && <button type="button" disabled={busy} style={{ ...button("#16A34A"), padding: "7px 9px", marginRight: 5 }} onClick={() => void markPaid(fee)}>Paid</button>}<button type="button" disabled={busy} style={{ ...button("#DC2626"), padding: "7px 9px" }} onClick={() => void remove(fee)}>Delete</button></td></tr>; }) : <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No fee records found.</td></tr>}</tbody></table></div>
      </div>

      {open && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,27,61,.5)", display: "grid", placeItems: "center", padding: 16 }} onClick={reset}><div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(560px,100%)", padding: 22, maxHeight: "90vh", overflowY: "auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3 style={{ margin: 0 }}>{editing ? "Edit Fee" : "Add Fee"}</h3><button type="button" onClick={reset} style={{ border: 0, borderRadius: 9, padding: 8, cursor: "pointer" }}>✕</button></div><div style={{ display: "grid", gap: 12, marginTop: 16 }}><label style={{ fontSize: 12, fontWeight: 800 }}>Student<select value={form.sid} onChange={(e) => setForm({ ...form, sid: e.target.value })} style={{ ...input, marginTop: 5 }}><option value="">Select student…</option>{students.map((s) => <option key={String(s.id)} value={String(s.id)}>{s.name} · {s.sid} · Class {s.cls || "—"}{s.sec ? `-${s.sec}` : ""}</option>)}</select></label><label style={{ fontSize: 12, fontWeight: 800 }}>Fee Description<input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Tuition Fee - August" style={{ ...input, marginTop: 5 }} /></label><label style={{ fontSize: 12, fontWeight: 800 }}>Amount<input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...input, marginTop: 5 }} /></label><label style={{ fontSize: 12, fontWeight: 800 }}>Due Date<input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} style={{ ...input, marginTop: 5 }} /></label><label style={{ fontSize: 12, fontWeight: 800 }}>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FeeStatus })} style={{ ...input, marginTop: 5 }}><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>{form.status === "paid" && <label style={{ fontSize: 12, fontWeight: 800 }}>Paid Date<input type="date" value={form.paidon} onChange={(e) => setForm({ ...form, paidon: e.target.value })} style={{ ...input, marginTop: 5 }} /></label>}</div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button type="button" style={button("#64748B")} onClick={reset}>Cancel</button><button type="button" style={button()} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : editing ? "Save Changes" : "Create Fee"}</button></div></div></div>}
    </div>
  );
}
