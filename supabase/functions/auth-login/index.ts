import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (v: unknown) => String(v ?? "").trim();
const key = (v: unknown) => clean(v).toLowerCase().replace(/[^a-z0-9]/g, "");
const inactive = (v: unknown) => ["inactive", "disabled", "suspended", "deleted"].includes(clean(v).toLowerCase());
const prefix: Record<string, string> = { teacher: "t", student: "s", parent: "p" };
const emailFor = (loginId: string, role: string) => {
  const value = clean(loginId);
  if (value.includes("@")) return value.toLowerCase();
  return `${prefix[role] || "u"}.${key(value)}@learnersguide.in`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !anon || !service) return json({ error: "Authentication service is not configured" }, 500);

    const body = await req.json();
    const loginId = clean(body.loginId);
    const password = String(body.password || "");
    const role = clean(body.role).toLowerCase();
    if (!loginId || !password) return json({ error: "Invalid login ID or password." }, 400);
    if (!["student", "teacher", "parent"].includes(role)) return json({ error: "Invalid account type." }, 400);

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    let email = emailFor(loginId, role);
    let authId = "";
    let profileId = "";
    let profileStatus = "active";

    // Resolve the institute profile first. Never read legacy plaintext password columns.
    // Supabase Auth is the only password authority.
    if (role === "teacher") {
      let teacher: any = null;
      for (const column of ["tid", "phone", "id"]) {
        const { data, error } = await admin
          .from("teachers")
          .select("id,tid,phone,status")
          .eq(column, loginId)
          .limit(1)
          .maybeSingle();
        if (error) return json({ error: "Unable to verify login. Please try again." }, 503);
        if (data) { teacher = data; break; }
      }
      if (!teacher) return json({ error: "Invalid login ID or password." }, 401);
      if (inactive(teacher.status)) return json({ error: "This account is inactive. Please contact the institute administrator." }, 403);
      profileId = String(teacher.id);
      profileStatus = clean(teacher.status || "active");
    } else if (role === "student") {
      let student: any = null;
      for (const column of ["sid", "id"]) {
        const { data, error } = await admin
          .from("students")
          .select("id,sid,status")
          .eq(column, loginId)
          .limit(1)
          .maybeSingle();
        if (error) return json({ error: "Unable to verify login. Please try again." }, 503);
        if (data) { student = data; break; }
      }
      if (!student) return json({ error: "Invalid login ID or password." }, 401);
      if (inactive(student.status)) return json({ error: "This account is inactive. Please contact the institute administrator." }, 403);
      profileId = String(student.id);
      profileStatus = clean(student.status || "active");
    } else {
      const { data: parent, error: parentError } = await admin
        .from("users")
        .select("auth_id,email,ref,phone,status")
        .eq("role", "parent")
        .eq("phone", loginId)
        .limit(1)
        .maybeSingle();
      if (parentError) return json({ error: "Unable to verify login. Please try again." }, 503);
      if (!parent) return json({ error: "Invalid login ID or password." }, 401);
      if (inactive(parent.status)) return json({ error: "This account is inactive. Please contact the institute administrator." }, 403);
      authId = clean(parent.auth_id);
      if (clean(parent.email).includes("@")) email = clean(parent.email).toLowerCase();
      profileId = clean(parent.ref);
      profileStatus = clean(parent.status || "active");
    }

    // Resolve the application user by role + profile reference. This is the canonical
    // link between the institute record and Supabase Auth account.
    if (!authId && profileId) {
      const { data: appUser, error: appUserError } = await admin
        .from("users")
        .select("auth_id,email,status,role,ref")
        .eq("role", role)
        .eq("ref", profileId)
        .limit(1)
        .maybeSingle();
      if (appUserError) return json({ error: "Unable to verify login. Please try again." }, 503);
      if (appUser) {
        if (inactive(appUser.status)) return json({ error: "This account is inactive. Please contact the institute administrator." }, 403);
        authId = clean(appUser.auth_id);
        if (clean(appUser.email).includes("@")) email = clean(appUser.email).toLowerCase();
      }
    }

    // If a users row has no auth_id/email, find the Auth user by role/ref metadata.
    if (authId) {
      const { data: authData, error: authLookupError } = await admin.auth.admin.getUserById(authId);
      if (authLookupError || !authData.user) return json({ error: "Your authentication account is missing. Please contact the institute administrator." }, 401);
      if (authData.user.email) email = authData.user.email.toLowerCase();
    } else if (profileId) {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) return json({ error: "Unable to verify login. Please try again." }, 503);
      const authUser = users.users.find(
        (u) => u.app_metadata?.role === role && String(u.app_metadata?.ref || "") === String(profileId),
      );
      if (authUser) {
        authId = authUser.id;
        if (authUser.email) email = authUser.email.toLowerCase();
      }
    }

    if (!email) return json({ error: "Your authentication account is not configured. Please contact the institute administrator." }, 401);

    const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      console.error("auth-login invalid credentials", { role, loginId, authId, error: error?.message });
      return json({ error: "Invalid login ID or password." }, 401);
    }

    const appRole = data.user.app_metadata?.role;
    if (appRole !== role) {
      await client.auth.signOut();
      return json({ error: "That account is registered under a different role." }, 403);
    }

    return json({ session: data.session, user: data.user }, 200);
  } catch (error) {
    console.error("auth-login:", error);
    return json({ error: "Unable to sign in right now. Please try again." }, 500);
  }
});
