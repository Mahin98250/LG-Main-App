import { supabase } from "@/lg/supabase";

/**
 * Production authentication for Learner's Guide.
 * Passwords are handled only by Supabase Auth.
 * Role/ref are read from server-managed app_metadata.
 * Profile existence and active status are re-checked after every login.
 */
const ACCOUNT_DOMAIN = "learnersguide.in";
const PREFIX = { teacher: "t", student: "s", parent: "p" };
const ADMIN_EMAIL = "admin@school.com";

export const normalizeId = (loginId) => String(loginId || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  if (role === "admin") return ADMIN_EMAIL;
  return `${PREFIX[role] || "u"}.${normalizeId(loginId)}@${ACCOUNT_DOMAIN}`;
};

const profileConfig = {
  student: { table: "students", statusField: "status" },
  teacher: { table: "teachers", statusField: "status" },
};

const inactiveStatuses = ["inactive", "disabled", "suspended", "deleted"];

const toUser = (authUser, requestedRole) => {
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

const validateProfile = async (user, role) => {
  if (role === "admin") return { ok: true, error: null };
  if (!user.ref) return { ok: false, error: "Your account is not linked to an institute profile yet. Please contact the administrator." };

  // Parents are linked to students through the authoritative parent_student_links
  // table. Do not rely only on the legacy users.ref value: older parent accounts
  // may contain a differently formatted/stale student reference.
  if (role === "parent") {
    const { data: links, error: linkError } = await supabase
      .from("parent_student_links")
      .select("student_id,status")
      .eq("parent_auth_id", user.id)
      .eq("status", "active");
    if (linkError) return { ok: false, error: "We could not verify your parent profile. Please try again." };
    if (!links?.length) return { ok: false, error: "Your parent account is not linked to an active student. Please contact the administrator." };

    const studentIds = [...new Set(links.map((link) => String(link.student_id || "")).filter(Boolean))];
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("id,status")
      .in("id", studentIds);
    if (studentError) return { ok: false, error: "We could not verify your linked student profile. Please try again." };
    const activeStudent = (students || []).find((student) => !inactiveStatuses.includes(String(student.status || "active").toLowerCase()));
    if (!activeStudent) return { ok: false, error: "Your linked student account is inactive. Please contact the institute administrator." };
    return { ok: true, error: null };
  }

  const config = profileConfig[role];
  if (!config) return { ok: false, error: "This account type is not supported." };
  const { data, error } = await supabase
    .from(config.table)
    .select(`id,${config.statusField}`)
    .eq("id", user.ref)
    .maybeSingle();
  if (error) return { ok: false, error: "We could not verify your institute profile. Please try again." };
  if (!data) return { ok: false, error: "Your institute profile no longer exists. Please contact the administrator." };
  const status = String(data[config.statusField] || "active").toLowerCase();
  if (inactiveStatuses.includes(status)) return { ok: false, error: "This account is inactive. Please contact the institute administrator." };
  return { ok: true, error: null };
};

async function signInViaGateway(loginId, password, role) {
  const { data, error } = await supabase.functions.invoke("auth-login", {
    body: { loginId, password, role },
  });

  if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
    // Supabase FunctionsError can contain the useful server response in context,
    // but never expose raw server internals to the user.
    const serverMessage = typeof data?.error === "string" ? data.error : "";
    return {
      user: null,
      error: serverMessage || error?.message || "Invalid login ID or password.",
    };
  }

  const session = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };

  // A previous role/session can be left in the browser's persistent storage.
  // Clear only the local session before installing the freshly authenticated one.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  let { data: sessionData, error: sessionError } = await supabase.auth.setSession(session);

  // Retry once after clearing local auth state. This handles stale/rotated refresh
  // tokens without asking the user to manually clear browser storage.
  if (sessionError || !sessionData.user) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    const retry = await supabase.auth.setSession(session);
    sessionData = retry.data;
    sessionError = retry.error;
  }

  if (sessionError || !sessionData.user) {
    return { user: null, error: "Unable to establish a secure session. Please try again." };
  }
  return { user: sessionData.user, error: null };
}

async function signInAdminDirectly(loginId, password) {
  // Admin login does not depend on the auth-login Edge Function.
  const email = authEmail(loginId, "admin");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid admin login ID or password." };
  return { user: data.user, error: null };
}

export async function signIn(loginId, password, role) {
  const cleanLogin = String(loginId || "").trim();
  if (!cleanLogin || !password) return { user: null, error: "Enter your login ID and password." };
  if (!["admin", "student", "teacher", "parent"].includes(role)) return { user: null, error: "Please select a valid account type." };

  let authResult;
  try {
    authResult = role === "admin"
      ? await signInAdminDirectly(cleanLogin, password)
      : await signInViaGateway(cleanLogin, password, role);
  } catch {
    authResult = { user: null, error: "Unable to sign in right now. Please try again." };
  }
  if (!authResult.user) return authResult;

  const appRole = authResult.user.app_metadata?.role;
  if (!appRole) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return { user: null, error: "Your account has not been approved by the institute administrator yet." };
  }
  if (appRole !== role) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return { user: null, error: `That account is registered as a ${appRole}.` };
  }

  const user = toUser(authResult.user, role);
  const profileCheck = await validateProfile(user, role);
  if (!profileCheck.ok) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return { user: null, error: profileCheck.error };
  }
  return { user, error: null };
}

export async function signUp() {
  return { user: null, needsConfirm: false, error: "Self-registration is disabled. Please contact your institute administrator for login credentials." };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = toUser(data.user);
  if (!user.role) return null;
  const profileCheck = await validateProfile(user, user.role);
  if (!profileCheck.ok) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return null;
  }
  return user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session?.user ? toUser(session.user) : null));
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
