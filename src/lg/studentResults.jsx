import { useEffect, useState } from "react";
import { C } from "@/lg/data";
import { supabase } from "@/lg/supabase";
import { Card, Sec } from "@/lg/ui";

export function STExams({ student }) {
  const [schedule, setSchedule] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const cls = String(student?.cls || "");
        const sec = String(student?.sec || "");
        const [scheduleResult, testsResult] = await Promise.all([
          supabase.from("examschedule").select("id,title,subject,cls,sec,date,starttime,endtime,venue,syllabus,totalmarks,createdby,startTime,endTime,totalMarks").eq("cls", cls).order("date", { ascending: true }),
          supabase.rpc("get_student_tests"),
        ]);
        if (scheduleResult.error) throw scheduleResult.error;
        if (testsResult.error) throw testsResult.error;
        const filteredSchedule = (scheduleResult.data || []).filter((r) => !r.sec || String(r.sec) === sec || String(r.sec) === "All");
        if (live) { setSchedule(filteredSchedule); setTests(testsResult.data || []); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Unable to load exams and tests.");
      } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [student?.id, student?.sid, student?.cls, student?.sec]);

  const rows = [
    ...schedule.map((e) => ({ kind: "schedule", id: `schedule-${e.id}`, title: e.title || "Exam", subject: e.subject, date: e.date, total: e.totalMarks ?? e.totalmarks, time: `${e.startTime || e.starttime || "—"}${(e.endTime || e.endtime) ? ` – ${e.endTime || e.endtime}` : ""}`, venue: e.venue, syllabus: e.syllabus })),
    ...tests.map((t) => ({ kind: "test", id: `test-${t.id}`, title: t.title || "Test", subject: t.subject, date: t.test_date, total: t.total_marks, time: "", venue: "", syllabus: t.description })),
  ].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  return <div>
    {error && <Card style={{ color: C.red, marginBottom: 12, background: "#FEF2F2" }}>{error}</Card>}
    <Sec title="Exams & Tests 📋" />
    {loading ? <Card style={{ padding: 28, textAlign: "center", color: C.sub }}>Loading exams and tests…</Card> : rows.length ? rows.map((r) => <Card key={r.id} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div><div style={{ fontWeight: 900 }}>{r.title}</div><div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{r.subject || "—"} · {r.kind === "test" ? "Test" : "Exam"}</div></div>
        <div style={{ fontWeight: 900, color: C.accent, whiteSpace: "nowrap" }}>{r.date || "—"}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, fontSize: 11, color: C.sub }}>
        {r.time && <span>🕒 {r.time}</span>}{r.venue && <span>📍 {r.venue}</span><span>💯 Total {r.total ?? "—"}</span>
      </div>
      {r.syllabus && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: C.light, fontSize: 12 }}>{r.syllabus}</div>}
    </Card>) : <Card style={{ padding: 28, textAlign: "center", color: C.sub }}>No exams or tests are scheduled for your current class/batch.</Card>}
  </div>;
}

export function STResults({ student }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true); setError("");
      try {
        if (!student?.id && !student?.sid) { setRows([]); return; }
        const { data, error: resultError } = await supabase.rpc("get_student_test_results");
        if (resultError) throw resultError;
        const mapped = (data || []).map((r) => {
          const marks = Number(r.marks);
          const total = Number(r.test_total_marks);
          const percentage = Number.isFinite(marks) && Number.isFinite(total) && total > 0 ? (marks / total) * 100 : null;
          return {
            ...r,
            test: { id: r.test_id, title: r.test_title, subject: r.test_subject, test_date: r.test_date, total_marks: r.test_total_marks, status: r.test_status },
            percentage,
          };
        });
        if (live) setRows(mapped);
      } catch (e) {
        if (live) { setError(e instanceof Error ? e.message : "Unable to load results."); setRows([]); }
      } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [student?.id, student?.sid]);

  const valid = rows.filter((r) => r.percentage != null);
  const average = valid.length ? valid.reduce((sum, r) => sum + Number(r.percentage), 0) / valid.length : null;

  return <div>
    {error && <Card style={{ color: C.red, marginBottom: 12, background: "#FEF2F2" }}>{error}</Card>}
    <Card style={{ textAlign: "center", padding: 22, marginBottom: 16, background: "linear-gradient(135deg,#4361EE,#7B6FF5)", border: 0, color: "#fff" }}>
      <div style={{ fontSize: 12, opacity: .8 }}>Average Score</div>
      <div style={{ fontSize: 44, fontWeight: 900 }}>{average == null ? "—" : `${average.toFixed(2)}%`}</div>
      <div style={{ fontSize: 11, opacity: .8 }}>{rows.length} published result{rows.length === 1 ? "" : "s"}</div>
    </Card>
    <Sec title="My Results 📊" />
    {loading ? <Card style={{ padding: 28, textAlign: "center", color: C.sub }}>Loading results…</Card> : rows.length ? rows.map((r) => <Card key={r.id} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div><div style={{ fontWeight: 900 }}>{r.test?.title || "Test"}</div><div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{r.test?.subject || "—"} · {r.test?.test_date || "—"}</div></div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{r.percentage == null ? "—" : `${r.percentage.toFixed(2)}%`}</div>
      </div>
      <div style={{ marginTop: 10, fontWeight: 800 }}>Score: {r.marks ?? "—"} / {r.test?.total_marks ?? "—"}</div>
      {r.remarks && <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Remarks: {r.remarks}</div>}
    </Card>) : <Card style={{ padding: 28, textAlign: "center", color: C.sub }}>No published results are available for you yet.</Card>}
  </div>;
}
