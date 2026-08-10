import { supabase } from "@/lg/supabase";

/**
 * Auth for Learner's Guide.
 * Passwords are handled only by Supabase Auth.
 * Authorization role/ref are read from server-managed app_metadata so a user
 * cannot promote themselves by editing user_metadata in the browser.
 *
 * Accounts are provisioned by the institute administrator only. Public
 * self-registration is intentionally disabled.
 */
const ACCOUNT_DOMAIN = "learnersguide.in";
const PREFIX = { teacher: "t", student: "s", parent: "p" };

export const normalizeId = (loginId) =>
  String(loginId || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const authEmail = (loginId, role) => {
  if (String(loginId || "").includes("@")) {
    return String(loginId).trim().toLowerCase();
  }
  return `${PREFIX[role] || "u"}.${normalizeId(loginId)}@${ACCOUNT_DOMAIN}`;
};

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

const toUser = async (authUser, requestedRole) => {
  const userMetadata = authUser?.user_metadata || {};
  const appMetadata = authUser?.app_metadata || {};
  const role = appMetadata.role || requestedRole || "";
  const ref = appMetadata.ref || null;

  return {
    id: authUser.id,
    name: userMetadata.name || userMetadata.phone || "User",
    phone: userMetadata.phone || "",
    role,
    ref,
  };
};

export async function signIn(loginId, password, role) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail(loginId, role),
    password,
  });
  if (error) return { user: null, error: error.message };

  const appRole = data.user?.app_metadata?.role;
  if (!appRole) {
    await supabase.auth.signOut();
    return {
      user: null,
      error: "Your account has not been approved by the institute administrator yet.",
    };
  }
  if (appRole !== role) {
    await supabase.auth.signOut();
    return { user: null, error: `That account is registered as a ${appRole}.` };
  }

  const user = await toUser(data.user, role);
  if (role !== "admin" && !user.ref) {
    await supabase.auth.signOut();
    return {
      user: null,
      error:
        "Your account is not linked to an institute profile yet. Please contact the administrator.",
    };
  }
  return { user, error: null };
}

/**
 * Public registration is disabled. New accounts must be created by the
 * institute administrator through the trusted Supabase/Auth administration
 * workflow and then assigned app_metadata.role and app_metadata.ref.
 */
export async function signUp() {
  return {
    user: null,
    needsConfirm: false,
    error:
      "Self-registration is disabled. Please contact your institute administrator for login credentials.",
  };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = await toUser(data.user);
  if (!user.role) return null;
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
