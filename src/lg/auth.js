import { supabase } from "@/lg/supabase";

/**
 * Auth for Learner's Guide.
 * Passwords are handled only by Supabase Auth.
 * Authorization role/ref are read from server-managed app_metadata.
 */
const ACCOUNT_DOMAIN = "learnersguide.in";
const PREFIX = { teacher: "t", student: "s", parent: "p" };
const ADMIN_EMAIL = "admin@school.com";

export const normalizeId = (loginId) =>
  String(loginId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  if (role === "admin") return ADMIN_EMAIL;
  return `${PREFIX[role] || "u"}.${normalizeId(loginId)}@${ACCOUNT_DOMAIN}`;
};

export const resolveRef = async (role, loginId) => {
  const raw = String(loginId || "").trim();
  if (!raw) return null;
  const table = role === "teacher" ? "teachers" : "students";
  const field = role === "teacher" ? "phone" : role === "student" ? "sid" : "parentphone";
  const { data, error } = await supabase.from(table).select("id").eq(field, raw).limit(1).maybeSingle();
  if (error) console.warn(`Could not resolve ${role} reference:`, error.message);
  return data?.id || null;
};

const toUser = async (authUser, requestedRole) => {
  const userMetadata = authUser?.user_metadata || {};
  const appMetadata = authUser?.app_metadata || {};
  return {
    id: authUser.id,
    name: userMetadata.name || userMetadata.phone || "User",
    phone: userMetadata.phone || "",
    role: appMetadata.role || requestedRole || "",
    ref: appMetadata.ref || null,
  };
};

export async function signIn(loginId, password, role) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail(loginId, role), password });
  if (error) return { user: null, error: error.message };
  const appRole = data.user?.app_metadata?.role;
  if (!appRole) {
    await supabase.auth.signOut();
    return { user: null, error: "Your account has not been approved by the institute administrator yet." };
  }
  if (appRole !== role) {
    await supabase.auth.signOut();
    return { user: null, error: `That account is registered as a ${appRole}.` };
  }
  const user = await toUser(data.user, role);
  if (role !== "admin" && !user.ref) {
    await supabase.auth.signOut();
    return { user: null, error: "Your account is not linked to an institute profile yet. Please contact the administrator." };
  }
  return { user, error: null };
}

export async function signUp() {
  return { user: null, needsConfirm: false, error: "Self-registration is disabled. Please contact your institute administrator for login credentials." };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = await toUser(data.user);
  return user.role ? user : null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
