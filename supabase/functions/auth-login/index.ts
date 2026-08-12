import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const normalize=(value:string)=>String(value||"").trim();
const normalizeKey=(value:string)=>normalize(value).toLowerCase().replace(/[^a-z0-9]/g,"");
const syntheticEmail=(loginId:string,role:string)=>`${({teacher:"t",student:"s",parent:"p"} as Record<string,string>)[role]||"u"}.${normalizeKey(loginId)}@learnersguide.in`;

async function emailFromAuthRef(admin:ReturnType<typeof createClient>,ref:string,role:string){
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(error)return "";
  const user=data.users.find(u=>u.app_metadata?.role===role&&String(u.app_metadata?.ref||"")===String(ref));
  return user?.email||"";
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    if(req.method!=="POST")return json({error:"Method not allowed"},405);
    const url=Deno.env.get("SUPABASE_URL")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!url||!anon||!service)return json({error:"Authentication service is not configured"},500);
    const body=await req.json();
    const loginId=normalize(body.loginId);
    const password=String(body.password||"");
    const role=normalize(body.role).toLowerCase();
    if(!loginId||!password)return json({error:"Invalid login ID or password."},400);
    if(!["student","teacher","parent"].includes(role))return json({error:"Invalid account type."},400);

    const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
    let email="";

    if(role==="student"){
      const {data:student,error}=await admin.from("students").select("id,sid,status").or(`sid.eq.${loginId},id.eq.${loginId}`).limit(1).maybeSingle();
      if(error)return json({error:"Unable to verify login. Please try again."},503);
      if(student){
        if(["inactive","disabled","suspended","deleted"].includes(String(student.status||"").toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
        const {data:row}=await admin.from("users").select("auth_id,email,status").eq("role","student").eq("ref",student.id).limit(1).maybeSingle();
        if(row?.status&&["inactive","disabled","suspended","deleted"].includes(String(row.status).toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
        email=row?.email&&String(row.email).includes("@")?String(row.email).trim().toLowerCase():"";
        if(!email&&row?.auth_id){const {data:au}=await admin.auth.admin.getUserById(String(row.auth_id));email=au.user?.email||"";}
        if(!email)email=await emailFromAuthRef(admin,String(student.id),"student");
      }
    }else if(role==="teacher"){
      const {data:teacher,error}=await admin.from("teachers").select("id,tid,phone,status").or(`tid.eq.${loginId},phone.eq.${loginId},id.eq.${loginId}`).limit(1).maybeSingle();
      if(error)return json({error:"Unable to verify login. Please try again."},503);
      if(teacher){
        if(["inactive","disabled","suspended","deleted"].includes(String(teacher.status||"").toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
        const {data:row}=await admin.from("users").select("auth_id,email,status").eq("role","teacher").eq("ref",teacher.id).limit(1).maybeSingle();
        if(row?.status&&["inactive","disabled","suspended","deleted"].includes(String(row.status).toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
        email=row?.email&&String(row.email).includes("@")?String(row.email).trim().toLowerCase():"";
        if(!email&&row?.auth_id){const {data:au}=await admin.auth.admin.getUserById(String(row.auth_id));email=au.user?.email||"";}
        if(!email)email=await emailFromAuthRef(admin,String(teacher.id),"teacher");
      }
    }else{
      const {data:row,error}=await admin.from("users").select("auth_id,email,ref,phone,status").eq("role","parent").eq("phone",loginId).limit(1).maybeSingle();
      if(error)return json({error:"Unable to verify login. Please try again."},503);
      if(row){
        if(["inactive","disabled","suspended","deleted"].includes(String(row.status||"").toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
        email=row.email&&String(row.email).includes("@")==true?String(row.email).trim().toLowerCase():"";
        if(!email&&row.auth_id){const {data:au}=await admin.auth.admin.getUserById(String(row.auth_id));email=au.user?.email||"";}
        if(!email&&row.ref)email=await emailFromAuthRef(admin,String(row.ref),"parent");
      }
      // Compatibility path for parent accounts created from the student profile
      // before a users-table row was available. The password is still checked by
      // Supabase Auth and the resulting app_metadata role/ref is validated below.
      if(!email){
        const {data:student}=await admin.from("students").select("id,parentphone,status").eq("parentphone",loginId).limit(1).maybeSingle();
        if(student){
          if(["inactive","disabled","suspended","deleted"].includes(String(student.status||"").toLowerCase()))return json({error:"This account is inactive. Please contact the institute administrator."},403);
          email=await emailFromAuthRef(admin,String(student.id),"parent");
        }
      }
    }

    if(!email)email=syntheticEmail(loginId,role);
    const client=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error||!data.session||!data.user)return json({error:"Invalid login ID or password."},401);
    const appRole=data.user.app_metadata?.role;
    if(appRole!==role){await client.auth.signOut();return json({error:"That account is registered under a different role."},403);}
    return json({session:data.session,user:data.user});
  }catch(error){console.error("auth-login:",error);return json({error:"Unable to sign in right now. Please try again."},500)}
});
