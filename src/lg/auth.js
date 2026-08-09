import { supabase } from "@/lg/supabase";
import { lsG } from "@/lg/data";

/**
 * Auth for Learner's Guide.
 *
 * Accounts live in the auth service (passwords hashed, never stored in a
 * table). Users sign in with the phone number / roll number they already
 * know, which is mapped to a stable internal address for the auth service.
 * Name, phone and role live in the account's own metadata.
 */
const DOMAINS = { teacher: "teacher.lg.app", student: "student.lg.app", parent: "parent.lg.app" };

export const normalizeId = (loginId) => String(loginId || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  return `${normalizeId(loginId)}@${DOMAINS[role] || "lg.app"}`;
};

/** Link an account to its students/teachers row so the app can scope data. */
export const resolveRef = (role, phone) => {
  const p = normalizeId(phone);
  if (role === "teacher") {
    const t = lsG("teachers").find((x) => normalizeId(x.phone) === p);
    return t ? t.id : null;
  }
  const students = lsG("students");
  if (role === "student") {
    const s = students.find(
      (x) => normalizeId(x.phone) === p || normalizeId(x.sid) === p || normalizeId(x.roll) === p,
    );
    return s ? s.id : null;
  }
  const s = students.find(
    (x) => normalizeId(x.pphone) === p || normalizeId(x.parentPhone) === p || normalizeId(x.phone) === p,
  );
  return s ? s.id : null;
};

const toUser = (authUser, role) => {
  const m = authUser?.user_metadata || {};
  const r = role || m.role;
  return {
    id: authUser.id,
    name: m.name || m.phone || "User",
    phone: m.phone || "",
    role: r,
    ref: m.ref || resolveRef(r, m.loginId || m.phone),
  };
};

export async function signIn(loginId, password, role) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail(loginId, role),
    password,
  });
  if (error) return { user: null, error: error.message };
  const metaRole = data.user?.user_metadata?.role;
  if (metaRole && metaRole !== role) {
    await supabase.auth.signOut();
    return { user: null, error: `That account is registered as a ${metaRole}.` };
  }
  return { user: toUser(data.user, role), error: null };
}

export async function signUp({ name, phone, password, role }) {
  const email = authEmail(phone, role);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: { name, phone, role, loginId: phone, ref: resolveRef(role, phone) },
    },
  });
  if (error) return { user: null, needsConfirm: false, error: error.message };
  if (!data.session) return { user: null, needsConfirm: true, error: null };
  return { user: toUser(data.user, role), needsConfirm: false, error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return toUser(data.user);
}

export async function signOut() {
  await supabase.auth.signOut();
}