import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const normalize = (v: string) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const authEmail = (role: string, loginId: string) => {
  if (String(loginId || "").includes("@")) return String(loginId).trim().toLowerCase();
  const prefix: Record<string, string> = { teacher: "t", student: "s", parent: "p", admin: "u" };
  return `${prefix[role] || "u"}.${normalize(loginId)}@learnersguide.in`;
};
async function findAuthUser(admin: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;
}
async function getAuthUserSafely(admin: ReturnType<typeof createClient>, id: string | null) {
  if (!id) return null;
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error) {
    if (error.status === 404 || error.code === "user_not_found") return null;
    throw error;
  }
  return data.user || null;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anon || !service) return json({ error: "Supabase environment is not configured" }, 500);
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: callerData, error: callerError } = await caller.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Invalid authorization" }, 401);
    const admin = createClient(url, service);
    const { data: serverCaller, error: serverCallerError } = await admin.auth.admin.getUserById(callerData.user.id);
    if (serverCallerError || serverCaller.user?.app_metadata?.role !== "admin") return json({ error: "Administrator access required" }, 403);
    const body = await req.json();
    const action = String(body.action || ""), role = String(body.role || ""), loginId = String(body.loginId || ""), password = String(body.password || ""), name = String(body.name || "User"), ref = body.ref ? String(body.ref) : null, suppliedAuthId = body.authId ? String(body.authId) : null;
    if (!["student", "parent", "teacher"].includes(role)) return json({ error: "Invalid role" }, 400);
    if (!loginId) return json({ error: "loginId is required" }, 400);
    const email = authEmail(role, loginId), existingByEmail = await findAuthUser(admin, email);
    if (action === "create") {
      if (!password) return json({ error: "Password is required" }, 400);
      if (existingByEmail) {
        const { data, error } = await admin.auth.admin.updateUserById(existingByEmail.id, { password, user_metadata: { ...(existingByEmail.user_metadata || {}), name, phone: loginId }, app_metadata: { ...(existingByEmail.app_metadata || {}), role, ref } });
        if (error) throw error;
        return json({ authId: data.user.id, email: data.user.email, updated: true });
      }
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, phone: loginId }, app_metadata: { role, ref } });
      if (error) throw error;
      return json({ authId: data.user.id, email: data.user.email, created: true });
    }
    if (action === "update") {
      let targetUser = await getAuthUserSafely(admin, suppliedAuthId);
      if (!targetUser) targetUser = existingByEmail;
      if (!targetUser) {
        if (!password) return json({ error: "Authentication account not found. A password is required to recreate it.", code: "AUTH_ACCOUNT_MISSING" }, 404);
        const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, phone: loginId }, app_metadata: { role, ref } });
        if (error) throw error;
        return json({ authId: data.user.id, email: data.user.email, created: true, repaired: true });
      }
      const patch: Record<string, unknown> = { user_metadata: { ...(targetUser.user_metadata || {}), name, phone: loginId }, app_metadata: { ...(targetUser.app_metadata || {}), role, ref } };
      if (password) patch.password = password;
      if (targetUser.email?.toLowerCase() !== email.toLowerCase()) { patch.email = email; patch.email_confirm = true; }
      const { data, error } = await admin.auth.admin.updateUserById(targetUser.id, patch);
      if (error) throw error;
      return json({ authId: data.user.id, email: data.user.email, updated: true, repaired: suppliedAuthId !== data.user.id });
    }
    if (action === "delete") {
      if (!suppliedAuthId) return json({ deleted: false, reason: "No authId supplied" });
      const user = await getAuthUserSafely(admin, suppliedAuthId);
      if (!user) return json({ authId: suppliedAuthId, deleted: true, alreadyMissing: true });
      const { error } = await admin.auth.admin.deleteUser(suppliedAuthId);
      if (error) throw error;
      return json({ authId: suppliedAuthId, deleted: true });
    }
    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Provisioning failed" }, 500);
  }
});
