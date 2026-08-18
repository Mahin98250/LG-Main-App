import { useCallback, useEffect, useMemo, useState } from "react";
import { addR, gdb, updR } from "@/lg/data";
import { supabase } from "@/lg/supabase";

type Row = Record<string, any> & { id: string | number };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #D8E0EE",
  borderRadius: 18,
  boxShadow: "0 4px 20px rgba(15,27,61,.07)",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  boxSizing: "border-box",
  padding: "11px 13px",
  border: "1.5px solid #B8C4D6",
  borderRadius: 10,
  background: "#fff",
  color: "#0F1B3D",
  outline: "none",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 7,
  color: "#0F1B3D",
  fontSize: 13,
  fontWeight: 800,
};

const btn = (background: string, color = "#fff"): React.CSSProperties => ({
  border: 0,
  borderRadius: 11,
  padding: "10px 14px",
  background,
  color,
  fontWeight: 800,
  cursor: "pointer",
});

const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "9": ["English", "Science", "Maths", "Social Studies"],
  "10": ["English", "Science", "Maths", "Social Studies"],
  "11": [
    "Accountancy",
    "Business Studies",
    "Economics",
    "Applied Mathematics",
    "Informatics Practices",
    "Entrepreneurship",
    "Physical Education",
  ],
  "12": [
    "Accountancy",
    "Business Studies",
    "Economics",
    "Applied Mathematics",
    "Informatics Practices",
    "Entrepreneurship",
    "Physical Education",
  ],
};

async function ensureAdmin() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("Administrator session is required. Please sign in again.");
  }
  if (data.session.user.app_metadata?.role !== "admin") {
    throw new Error("Administrator access is required.");
  }
  return data.session;
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>
        {label}
        {required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
    </label>
  );
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
  const [form, setForm] = useState({
    title: "",
    description: "",
    batch_id: "",
    subject: "",
    test_date: new Date().toISOString().slice(0, 10),
    total_marks: "100",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await ensureAdmin();
      const [ts, bs, ss] = await Promise.all([
        gdb("tests"),
        gdb("batches"),
        gdb("students"),
      ]);
      setTests(
        (ts as Row[]).sort((a, b) =>
          String(b.test_date).localeCompare(String(a.test_date)),
        ),
      );
      setBatches((bs as Row[]).filter((b) => String(b.status ?? "active") === "active"));
      setStudents(ss as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBatch = useMemo(
    () => batches.find((x) => String(x.id) === String(form.batch_id)),
    [batches, form.batch_id],
  );

  const subjectsForBatch = useMemo(() => {
    const cls = String(selectedBatch?.cls ?? "").trim();
    return SUBJECTS_BY_CLASS[cls] ?? [];
  }, [selectedBatch]);

  const batchStudents = useMemo(() => {
    if (!selectedTest) return [];
    const b = batches.find((x) => String(x.id) === String(selectedTest.batch_id));
    const ids = Array.isArray(b?.studentids)
      ? b.studentids
      : Array.isArray(b?.studentIds)
        ? b.studentIds
        : [];
    const byIds = ids.length
      ? students.filter((s) => ids.map(String).includes(String(s.id)))
      : students.filter(
          (s) => String(s.cls) === String(b?.cls) && String(s.sec) === String(b?.sec),
        );
    return byIds.sort((a, b) =>
      String(a.sid).localeCompare(String(b.sid), undefined, { numeric: true }),
    );
  }, [selectedTest, batches, students]);

  const openResults = async (test: Row) => {
    setSelectedTest(test);
    setError("");
    setSuccess("");
    try {
      const rs = await gdb("test_results");
      setResults(
        (rs as Row[]).filter((r) => String(r.test_id) === String(test.id)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load results.");
    }
  };

  const saveTest = async () => {
    if (
      !form.title.trim() ||
      !form.batch_id ||
      !form.subject ||
      !form.test_date ||
      Number(form.total_marks) <= 0
    ) {
      setError("Fill Test Name, Batch, Subject, Date and Total Marks.");
      return;
    }

    if (!subjectsForBatch.includes(form.subject)) {
      setError("Please select a valid subject for the selected batch/class.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const session = await ensureAdmin();
      await addR("tests", {
        id: `test-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim() || null,
        batch_id: form.batch_id,
        subject: form.subject,
        test_date: form.test_date,
        total_marks: Number(form.total_marks),
        status: "scheduled",
        created_by: session.user.id,
      });
      setSuccess("Test created successfully.");
      setForm({
        title: "",
        description: "",
        batch_id: "",
        subject: "",
        test_date: new Date().toISOString().slice(0, 10),
        total_marks: "100",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create test.");
    } finally {
      setSaving(false);
    }
  };

  const saveResult = async (student: Row, value: string, remarks: string) => {
    if (!selectedTest || value === "") return;
    const marks = Number(value);
    if (
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > Number(selectedTest.total_marks)
    ) {
      setError(
        `Marks for ${student.name} must be between 0 and ${selectedTest.total_marks}.`,
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const existing = results.find(
        (r) => String(r.student_id) === String(student.id),
      );
      const payload = {
        test_id: String(selectedTest.id),
        student_id: String(student.id),
        marks,
        remarks: remarks.trim() || null,
      };
      if (existing) {
        await updR("test_results", existing.id, payload);
        setResults((prev) =>
          prev.map((r) => (r.id === existing.id ? { ...r, ...payload } : r)),
        );
      } else {
        const row = await addR("test_results", {
          id: `result-${Date.now()}-${student.id}`,
          ...payload,
        });
        setResults((prev) => [...prev, row as Row]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 22,
        background: "#F0F4FF",
        color: "#0F1B3D",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Tests & Results</h1>
        <p style={{ margin: "6px 0", color: "#64748B" }}>
          Create tests for a batch and enter results student-by-student.
        </p>
      </div>

      {error && (
        <div
          style={{
            ...card,
            padding: 13,
            marginBottom: 12,
            color: "#B91C1C",
            background: "#FEF2F2",
            borderColor: "#FECACA",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            ...card,
            padding: 13,
            marginBottom: 12,
            color: "#166534",
            background: "#F0FDF4",
            borderColor: "#BBF7D0",
          }}
        >
          {success}
        </div>
      )}

      <div style={{ ...card, padding: 20, marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 18px", fontSize: 17 }}>Create Test</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          <Field label="Test Name" required>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Unit Test 1"
              style={fieldStyle}
              required
            />
          </Field>

          <Field label="Batch" required>
            <select
              value={form.batch_id}
              onChange={(e) =>
                setForm({ ...form, batch_id: e.target.value, subject: "" })
              }
              style={fieldStyle}
              required
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={String(b.id)} value={String(b.id)}>
                  {b.name} — Class {b.cls}{b.sec ? `-${b.sec}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject" required>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              style={fieldStyle}
              disabled={!form.batch_id}
              required
            >
              <option value="">
                {form.batch_id ? "Select subject…" : "Select batch first…"}
              </option>
              {subjectsForBatch.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Test Date" required>
            <input
              type="date"
              value={form.test_date}
              onChange={(e) => setForm({ ...form, test_date: e.target.value })}
              style={fieldStyle}
              required
            />
          </Field>

          <Field label="Total Marks" required>
            <input
              type="number"
              min="1"
              step="1"
              value={form.total_marks}
              onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              style={fieldStyle}
              required
            />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional instructions or syllabus"
              style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }}
            />
          </Field>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void saveTest()}
          style={{
            ...btn("#4361EE"),
            marginTop: 4,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "➕ Create Test"}
        </button>
      </div>

      <div style={{ ...card, padding: 20 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Scheduled Tests</h2>
        {loading ? (
          <p style={{ color: "#64748B" }}>Loading…</p>
        ) : tests.length === 0 ? (
          <p style={{ color: "#64748B" }}>No tests created yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Test", "Batch", "Subject", "Date", "Total", "Status", "Action"].map(
                    (x) => (
                      <th
                        key={x}
                        style={{
                          textAlign: "left",
                          padding: 10,
                          borderBottom: "1px solid #E2E8F0",
                          whiteSpace: "nowrap",
                          color: "#64748B",
                          fontSize: 12,
                        }}
                      >
                        {x}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => {
                  const b = batches.find(
                    (x) => String(x.id) === String(t.batch_id),
                  );
                  return (
                    <tr key={String(t.id)}>
                      <td style={{ padding: 10 }}>{t.title}</td>
                      <td style={{ padding: 10 }}>
                        {b?.name || t.batch_id}
                      </td>
                      <td style={{ padding: 10 }}>{t.subject}</td>
                      <td style={{ padding: 10 }}>{t.test_date}</td>
                      <td style={{ padding: 10 }}>{t.total_marks}</td>
                      <td style={{ padding: 10 }}>{t.status}</td>
                      <td style={{ padding: 10 }}>
                        <button
                          type="button"
                          onClick={() => void openResults(t)}
                          style={btn("#8B5CF6")}
                        >
                          Enter Results
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTest && (
        <div style={{ ...card, padding: 20, marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 17 }}>
                {selectedTest.title} — Results
              </h2>
              <p style={{ margin: "5px 0", color: "#64748B" }}>
                {selectedTest.subject} · Total {selectedTest.total_marks}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTest(null)}
              style={btn("#64748B")}
            >
              Close
            </button>
          </div>
          {batchStudents.length === 0 ? (
            <p style={{ color: "#64748B" }}>No students found for this batch.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Roll", "Student", "Marks", "Remarks", "Save"].map((x) => (
                      <th key={x} style={{ textAlign: "left", padding: 10 }}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batchStudents.map((s) => {
                    const r = results.find(
                      (x) => String(x.student_id) === String(s.id),
                    );
                    return (
                      <tr key={String(s.id)}>
                        <td style={{ padding: 10 }}>{s.sid}</td>
                        <td style={{ padding: 10 }}>{s.name}</td>
                        <td style={{ padding: 10 }}>
                          <input
                            id={`marks-${s.id}`}
                            defaultValue={r?.marks ?? ""}
                            type="number"
                            min="0"
                            max={selectedTest.total_marks}
                            style={{ ...fieldStyle, width: 110, minHeight: 40 }}
                          />
                        </td>
                        <td style={{ padding: 10 }}>
                          <input
                            id={`remarks-${s.id}`}
                            defaultValue={r?.remarks ?? ""}
                            placeholder="Optional"
                            style={{ ...fieldStyle, minHeight: 40 }}
                          />
                        </td>
                        <td style={{ padding: 10, textAlign: "center" }}>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              const m =
                                (document.getElementById(
                                  `marks-${s.id}`,
                                ) as HTMLInputElement)?.value || "";
                              const q =
                                (document.getElementById(
                                  `remarks-${s.id}`,
                                ) as HTMLInputElement)?.value || "";
                              void saveResult(s, m, q);
                            }}
                            style={{ ...btn("#22C55E"), opacity: saving ? 0.6 : 1 }}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
