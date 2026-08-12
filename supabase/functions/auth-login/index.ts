import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const normalize = (value: string) => String(value || "").trim();
const syntheticEmail = (loginId: string, role: string) => `${({ teacher: "t", student: "s", parent: "p" } as Record<string, string>)[role] || "u"}.${normalize(loginId).toLowerCase().replace(/[^a-z0-9]/g, "")}@learnersguide.in`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !anon || !service) return json({ error: "Authentication service is not configured" }, 500);

    const body = await req.json();
    const loginId = normalize(body.loginId);
    const password = String(body.password || "");
    const role = normalize(body.role).toLowerCase();
    if (!loginId || !password) return json({ error: "Invalid login ID or password." }, 400);
    if (!["admin", "student", "teacher", "parent"].includes(role)) return json({ error: "Invalid account type." }, 400);

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    let email = loginId.toLowerCase();

    if (role !== "admin") {
      const { data: row, error: rowError } = await admin.from("users").select("auth_id,email,phone,role,ref,status").eq("role", role).eq("phone", loginId).limit(1).maybeSingle();
      if (rowError) return json({ error: "Unable to verify login. Please try again." }, 503);
      if (row?.status && ["inactive", "disabled", "suspended", "deleted"].includes(String(row.status).toLowerCase())) return json({ error: "This account is inactive. Please contact the institute administrator." }, 403);
      if (row?.email && String(row.email).includes("@")) email = String(row.email).trim().toLowerCase();
      else if (row?.auth_id) {
        const { data: authData } = await admin.auth.admin.getUserById(String(row.auth_id));
        if (authData.user?.email) email = authData.user.email;
      } else email = syntheticEmail(loginId, role);
    }

    const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) return json({ error: "Invalid login ID or password." }, 401);

    const appRole = data.user.app_metadata?.role;
    if (appRole !== role) {
      await client.auth.signOut();
      return json({ error: "That account is registered under a different role." }, 403);
    }

    return json({ session: data.session, user: data.user });
  } catch (error) {
    console.error("auth-login:", error);
    return json({ error: "Unable to sign in right now. Please try again." }, 500);
  }
});
