import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { gdb, C } from "@/lg/data";

type Student = {
  id: string | number;
  name?: string;
  cls?: string;
  sec?: string;
  sid?: string;
  status?: string;
};

type Teacher = { id: string | number; name?: string };
type Attendance = { id: string | number; status?: string };
type Fee = { id: string | number; status?: string; amount?: number | string };
type Announcement = { id: string | number; title?: string; target?: string; date?: string };
type Homework = { id: string | number };

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 4px 20px rgba(15,27,61,.07)",
  border: "1px solid #EEF2FF",
};

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ color: C.text, fontSize: 30, lineHeight: 1, fontWeight: 850 }}>
            {value}
          </div>
          {sub && <div style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>{sub}</div>}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: `${color}18`,
            color,
            fontSize: 21,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label?: string }) {
  const value = label || "—";
  const lower = value.toLowerCase();
  const color =
    lower === "active" || lower === "paid" || lower === "present"
      ? C.green
      : lower === "overdue"
        ? C.red
        : C.gold;

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 8px",
        borderRadius: 999,
        background: `${color}18`,
        color,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "capitalize",
      }}
    >
      {value}
    </span>
  );
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [studentRows, teacherRows, attendanceRows, feeRows, announcementRows, homeworkRows] =
          await Promise.all([
            gdb("students"),
            gdb("teachers"),
            gdb("attendance"),
            gdb("fees"),
            gdb("announcements"),
            gdb("homework"),
          ]);
        if (!mounted) return;
        setStudents(studentRows || []);
        setTeachers(teacherRows || []);
        setAttendance(attendanceRows || []);
        setFees(feeRows || []);
        setAnnouncements(announcementRows || []);
        setHomework(homeworkRows || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const present = attendance.filter((a) => a.status?.toLowerCase() === "present").length;
    const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
    const pending = fees.filter((f) => f.status?.toLowerCase() !== "paid");
    const pendingAmount = pending.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const paidAmount = fees
      .filter((f) => f.status?.toLowerCase() === "paid")
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const pendingAmountByStatus = (status: string) =>
      fees
        .filter((f) => f.status?.toLowerCase() === status)
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { present, attendanceRate, pending, pendingAmount, paidAmount, pendingAmountByStatus };
  }, [attendance, fees]);

  return (
    <div
      style={{
        padding: 28,
        overflowY: "auto",
        minHeight: "100%",
        background: "#F7F9FF",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 850 }}>
          Institute Overview
        </h2>
        <p style={{ margin: "6px 0 0", color: C.sub, fontSize: 13 }}>
          A live overview of your institute.
        </p>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 18,
            borderColor: `${C.red}55`,
            color: C.red,
            background: "#FFF7F7",
          }}
        >
          <strong>Unable to load dashboard data.</strong>
          <div style={{ fontSize: 12, marginTop: 5 }}>{error}</div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <StatCard
          icon="🎓"
          label="Total Students"
          value={loading ? "—" : students.length}
          color={C.accent}
          sub={`${students.filter((s) => s.status?.toLowerCase() === "active").length} active`}
        />
        <StatCard
          icon="👨‍🏫"
          label="Teachers"
          value={loading ? "—" : teachers.length}
          color="#8B5CF6"
          sub="All registered"
        />
        <StatCard
          icon="✅"
          label="Attendance Rate"
          value={loading ? "—" : `${metrics.attendanceRate}%`}
          color={C.green}
          sub={`${metrics.present}/${attendance.length} records`}
        />
        <StatCard
          icon="💰"
          label="Pending Fees"
          value={loading ? "—" : metrics.pending.length}
          color={C.red}
          sub={`₹${metrics.pendingAmount.toLocaleString("en-IN")}`}
        />
        <StatCard
          icon="📝"
          label="Active Homework"
          value={loading ? "—" : homework.length}
          color={C.gold}
        />
        <StatCard
          icon="📢"
          label="Announcements"
          value={loading ? "—" : announcements.length}
          color="#06B6D4"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 15, marginBottom: 4 }}>
            Attendance Overview 📊
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 18 }}>
            Based on live attendance records
          </div>
          <div
            style={{
              height: 14,
              borderRadius: 999,
              background: "#EEF2FF",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${metrics.attendanceRate}%`,
                height: "100%",
                background: `linear-gradient(90deg,${C.accent},#7B91F5)`,
                borderRadius: 999,
                transition: "width .4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontSize: 12,
              color: C.sub,
            }}
          >
            <span>Present: {metrics.present}</span>
            <strong style={{ color: C.accent }}>{metrics.attendanceRate}%</strong>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 15, marginBottom: 14 }}>
            Fee Collection 💰
          </div>
          {[
            ["Collected", C.green, metrics.paidAmount],
            ["Pending", C.gold, metrics.pendingAmountByStatus("pending")],
            ["Overdue", C.red, metrics.pendingAmountByStatus("overdue")],
          ].map(([label, color, value]) => (
            <div
              key={String(label)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: String(color),
                  }}
                />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: String(color) }}>
                ₹{Number(value).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 15, marginBottom: 12 }}>
            Recent Students 🎓
          </div>
          {students.slice(0, 4).map((student) => (
            <div
              key={student.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: `${C.accent}18`,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  color: C.accent,
                  fontSize: 14,
                }}
              >
                {(student.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: C.text,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {student.name || "Unnamed student"}
                </div>
                <div style={{ fontSize: 11, color: C.sub }}>
                  Class {student.cls || "—"}-{student.sec || "—"} · {student.sid || "—"}
                </div>
              </div>
              <Badge label={student.status} />
            </div>
          ))}
          {!loading && students.length === 0 && (
            <div style={{ color: C.sub, fontSize: 13, padding: "14px 0" }}>
              No students found.
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 15, marginBottom: 12 }}>
            Latest Announcements 📢
          </div>
          {announcements.slice(0, 4).map((announcement) => (
            <div
              key={announcement.id}
              style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}
            >
              <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 5 }}>
                {announcement.title || "Untitled announcement"}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge label={announcement.target} />
                <span style={{ fontSize: 11, color: C.sub }}>{announcement.date || ""}</span>
              </div>
            </div>
          ))}
          {!loading && announcements.length === 0 && (
            <div style={{ color: C.sub, fontSize: 13, padding: "14px 0" }}>
              No announcements yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
