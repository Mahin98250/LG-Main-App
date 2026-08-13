export const attendanceDayName = (date = new Date()) => date.toLocaleDateString("en-US", { weekday: "long" });

export const parseTimeToMinutes = (value) => {
  if (value == null) return null;
  const raw = String(value).trim().toUpperCase();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) return null;
  const meridiem = m[3];
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "AM" && hour === 12) hour = 0;
    if (meridiem === "PM" && hour !== 12) hour += 12;
  } else if (hour > 23) {
    return null;
  }
  return hour * 60 + minute;
};

export const parseSlotRange = (slot) => {
  if (!slot) return null;
  const raw = String(slot).replace(/[–—]/g, "-").trim();
  const parts = raw.split(/\s*-\s*/);
  if (parts.length !== 2) return null;
  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
};

export const timetableEntryRange = (entry) => {
  if (!entry) return null;
  if (entry.start_time != null && entry.end_time != null) {
    const start = parseTimeToMinutes(String(entry.start_time).slice(0, 5));
    const end = parseTimeToMinutes(String(entry.end_time).slice(0, 5));
    if (start != null && end != null && end > start) return { start, end };
  }
  return parseSlotRange(entry.slot);
};

export const isSameLocalDay = (entry, date = new Date()) => {
  if (entry?.day) return String(entry.day).toLowerCase() === attendanceDayName(date).toLowerCase();
  const day = Number(entry?.day_of_week);
  if (!Number.isInteger(day)) return false;
  return day === date.getDay();
};

export const isLectureActive = (entry, date = new Date()) => {
  if (!isSameLocalDay(entry, date)) return false;
  const range = timetableEntryRange(entry);
  if (!range) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= range.start && minutes < range.end;
};

export const upcomingLectureMinutes = (entry, date = new Date()) => {
  if (!isSameLocalDay(entry, date)) return null;
  const range = timetableEntryRange(entry);
  if (!range) return null;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return range.start - minutes;
};

export const attendanceRecordId = (studentId, dateISO, timetableEntryId) =>
  `att-${String(dateISO)}-${String(timetableEntryId)}-${String(studentId)}`;
