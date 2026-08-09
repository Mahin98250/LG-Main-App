import { supabase } from "@/lg/supabase";

/**
 * Auth for Learner's Guide.
 *
 * Passwords are handled only by Supabase Auth. Application data is resolved
 * from Supabase and is never required to be present in localStorage during
 * authentication.
 */
const ACCOUNT_DOMAIN = "learnersguide.in";
const PREFIX = { teacher: "t", student: "s", parent: "p" };

export const normalizeId = (loginId) =>
  String(loginId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  return `${PREFIX[role] || "u"}.${normalizeId(loginId)}@${ACCOUNT_DOMAIN}`;
};

/** Resolve the application row belonging to the authenticated account. */
export const resolveRef = async (role, loginId) => {
  const raw = String(loginId || "").trim();
  if (!raw) return null;

  const normalized = normalizeId(raw);

  if (role === "teacher") {
    const { data, error } = await supabase
      .from("teachers")
      .select("id")
      .or(`phone.eq.${raw},phone.eq.${normalized}`)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("Could not resolve teacher reference:", error.message);
      return null;
    }
    return data?.id || null;
  }

  if (role === "student") {
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .or(`phone.eq.${raw},sid.eq.${raw},roll.eq.${raw}`)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("Could not resolve student reference:", error.message);
      return null;
    }
    return data?.id || null;
  }

  if (role === "parent") {
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .or(`pphone.eq.${raw},parentPhone.eq.${raw},phone.eq.${raw}`)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("Could not resolve parent reference:", error.message);
      return null;
    }
    return data?.id || null;
  }

  return null;
};

const toUser = async (authUser, role) => {
  const m = authUser?.user_metadata || {};
  const r = role || m.role;
  const ref = m.ref || (await resolveRef(r, m.loginId || m.phone));

  return {
    id: authUser.id,
    name: m.name || m.phone || "User",
    phone: m.phone || "",
    role: r,
    ref: ref || null,
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

  return { user: await toUser(data.user, role), error: null };
}

export async function signUp({ name, phone, password, role }) {
  const email = authEmail(phone, role);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: { name, phone, role, loginId: phone },
    },
  });

  if (error) {
    const msg = /rate limit/i.test(error.message)
      ? "Too many sign-ups from this school right now. Please try again in a few minutes."
      : error.message;
    return { user: null, needsConfirm: false, error: msg };
  }

  if (!data.user || !data.session) {
    return { user: null, needsConfirm: true, error: null };
  }

  return { user: await toUser(data.user, role), needsConfirm: false, error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return await toUser(data.user);
}

export async function signOut() {
  await supabase.auth.signOut();
}