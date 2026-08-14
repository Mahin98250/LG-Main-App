import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !anon || !service) return json({ error: "Homework file service is not configured" }, 500);

    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Missing authorization" }, 401);
    const token = authorization.replace(/^Bearer\s+/i, "");
    const caller = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: callerData, error: callerError } = await caller.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Invalid authorization" }, 401);

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    const id = String(body?.id || "").trim();
    if (!id) return json({ error: "Homework ID is required" }, 400);

    const { data: homework, error: homeworkError } = await admin.from("homework").select("id,batch_id,cls,sec,tid,pdfname,pdfdata,storage_path,file_size,mime_type").eq("id", id).maybeSingle();
    if (homeworkError) return json({ error: "Unable to load homework attachment" }, 500);
    if (!homework) return json({ error: "Homework attachment not found" }, 404);

    const { data: profile } = await admin.auth.admin.getUserById(callerData.user.id);
    const role = String(profile.user?.app_metadata?.role || "");
    const ref = String(profile.user?.app_metadata?.ref || "");
    let allowed = role === "admin";
    if (role === "teacher") allowed = String(homework.tid || "") === ref;
    if (role === "student") {
      const { data: membership } = await admin.from("batch_students").select("batch_id").eq("student_id", ref).eq("batch_id", homework.batch_id).eq("status", "active").is("left_at", null).maybeSingle();
      allowed = Boolean(membership);
    }
    if (role === "parent") {
      const { data: links } = await admin.from("parent_student_links").select("student_id").eq("parent_auth_id", callerData.user.id).eq("status", "active");
      const ids = (links || []).map(x => String(x.student_id));
      if (ids.length) {
        const { data: membership } = await admin.from("batch_students").select("student_id").in("student_id", ids).eq("batch_id", homework.batch_id).eq("status", "active").is("left_at", null).limit(1);
        allowed = Boolean(membership?.length);
      }
    }
    if (!allowed) return json({ error: "You are not allowed to access this homework attachment" }, 403);

    if (homework.storage_path) {
      const { data: file, error: storageError } = await admin.storage.from("homework").download(homework.storage_path);
      if (storageError || !file) return json({ error: "Unable to download homework attachment" }, 502);
      return new Response(file.stream(), { status: 200, headers: { ...cors, "Content-Type": homework.mime_type || "application/pdf", "Content-Disposition": `inline; filename="${String(homework.pdfname || "homework.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_")}"`, "Cache-Control": "private, no-store" } });
    }

    const dataUrl = String(homework.pdfdata || "");
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return json({ error: "This homework does not contain a downloadable attachment" }, 404);
    const encoded = dataUrl.slice(comma + 1);
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Response(bytes, { status: 200, headers: { ...cors, "Content-Type": homework.mime_type || "application/pdf", "Content-Disposition": `inline; filename="${String(homework.pdfname || "homework.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_")}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("homework-file:", error);
    return json({ error: "Unable to retrieve homework attachment" }, 500);
  }
});
