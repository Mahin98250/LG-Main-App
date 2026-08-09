import { supabase } from "@/lg/supabase";

/**
 * Auth for Learner's Guide.
 * Passwords are handled only by Supabase Auth.
 * Application references are resolved from Supabase, not localStorage.
 */
const ACCOUNT_DOMAIN = "learnersguide.in";
const PREFIX = { teacher: "t", student: "s", parent: "p" };

export const normalizeId = (loginId) =>
  String(loginId || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  return `${PREFIX[role] || "u"}.${normalizeId(loginId)}@${ACCOUNT_DOMAIN}`;
};

/** Resolve the application row belonging to the authenticated account. */
export const resolveRef = async (role, loginId) => {
  const raw = String(loginId || "").trim();
  if (!raw) return null;

  if (role === "teacher") {
    const { data, error } = await supabase
      .from("teachers")
      .select("id")
      .eq("phone", raw)
      .limit(1)
      .maybeSingle();
    if (error) console.warn("Could not resolve teacher reference:", error.message);
    return data?.id || null;
  }

  if (role === "student") {
    // Student login uses the SID shown in the current login UI.
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("sid", raw)
      .limit(1)
      .maybeSingle();
    if (error) console.warn("Could not resolve student reference:", error.message);
    return data?.id || null;
  }

  if (role === "parent") {
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("parentphone", raw)
      .limit(1)
      .maybeSingle();
    if (error) console.warn("Could not resolve parent reference:", error.message);
    return data?.id || null;
  }

  return null;
};

const toUser = async (authUser, role) => {
  const metadata = authUser?.user_metadata || {};
  const resolvedRole = role || metadata.role;
  const ref = metadata.ref || (await resolveRef(resolvedRole, metadata.loginId || metadata.phone));

  return {
    id: authUser.id,
    name: metadata.name || metadata.phone || "User",
    phone: metadata.phone || "",
    role: resolvedRole,
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

  const user = await toUser(data.user, role);
  if (role !== "admin" && !user.ref) {
    await supabase.auth.signOut();
    return { user: null, error: "Your account is not linked to an institute profile yet. Please contact the administrator." };
  }
  return { user, error: null };
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

  if (!data.user || !data.session) return { user: null, needsConfirm: true, error: null };

  const user = await toUser(data.user, role);
  if (role !== "admin" && !user.ref) {
    await supabase.auth.signOut();
    return { user: null, needsConfirm: false, error: "Account created, but no institute profile is linked yet. Please ask the administrator to link your account." };
  }
  return { user, needsConfirm: false, error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return await toUser(data.user);
}

export async function signOut() {
  await supabase.auth.signOut();
}