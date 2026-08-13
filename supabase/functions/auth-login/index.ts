import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const clean=(v:unknown)=>String(v??"").trim();
const key=(v:unknown)=>clean(v).toLowerCase().replace(/[^a-z0-9]/g,"");
const emailFor=(loginId:string,role:string)=>`${({teacher:"t",student:"s",parent:"p"} as Record<string,string>)[role]||"u"}.${key(loginId)}@learnersguide.in`;
const inactive=(v:unknown)=>["inactive","disabled","suspended","deleted"].includes(clean(v).toLowerCase());

async function findAuthByRef(admin:ReturnType<typeof createClient>,ref:string,role:string){
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(error) return null;
  return data.users.find(u=>u.app_metadata?.role===role&&String(u.app_metadata?.ref||"")===String(ref))||null;
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    if(req.method!=="POST") return json({error:"Method not allowed"},405);
    const url=Deno.env.get("SUPABASE_URL")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!url||!anon||!service) return json({error:"Authentication service is not configured"},500);

    const body=await req.json();
    const loginId=clean(body.loginId);
    const password=String(body.password||"");
    const role=clean(body.role).toLowerCase();
    if(!loginId||!password) return json({error:"Invalid login ID or password."},400);
    if(!["student","teacher","parent"].includes(role)) return json({error:"Invalid account type."},400);

    const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
    let email="";
    let authId="";
    let storedPassword="";

    if(role==="teacher"){
      let teacher:any=null;
      for(const column of ["tid","phone","id"]){
        const {data,error}=await admin.from("teachers").select("id,tid,phone,status,pass").eq(column,loginId).limit(1).maybeSingle();
        if(error) return json({error:"Unable to verify login. Please try again."},503);
        if(data){ teacher=data; break; }
      }
      if(teacher){
        if(inactive(teacher.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
        storedPassword=clean(teacher.pass);
        const {data:row,error}=await admin.from("users").select("auth_id,email,status,pass").eq("role","teacher").eq("ref",teacher.id).limit(1).maybeSingle();
        if(error) return json({error:"Unable to verify login. Please try again."},503);
        if(row?.status&&inactive(row.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
        authId=clean(row?.auth_id);
        email=clean(row?.email).includes("@")?clean(row.email).toLowerCase():"";
        if(!storedPassword) storedPassword=clean(row?.pass);
        if(!email&&authId){ const {data:au}=await admin.auth.admin.getUserById(authId); email=au.user?.email||""; }
        if(!email){ const au=await findAuthByRef(admin,String(teacher.id),role); email=au?.email||""; authId=authId||au?.id||""; }
      }
    }else if(role==="student"){
      let student:any=null;
      for(const column of ["sid","id"]){
        const {data,error}=await admin.from("students").select("id,sid,status,pass").eq(column,loginId).limit(1).maybeSingle();
        if(error) return json({error:"Unable to verify login. Please try again."},503);
        if(data){student=data;break;}
      }
      if(student){
        if(inactive(student.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
        storedPassword=clean(student.pass);
        const {data:row,error}=await admin.from("users").select("auth_id,email,status,pass").eq("role","student").eq("ref",student.id).limit(1).maybeSingle();
        if(error) return json({error:"Unable to verify login. Please try again."},503);
        if(row?.status&&inactive(row.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
        authId=clean(row?.auth_id); email=clean(row?.email).includes("@")?clean(row.email).toLowerCase():"";
        if(!storedPassword) storedPassword=clean(row?.pass);
        if(!email&&authId){const {data:au}=await admin.auth.admin.getUserById(authId);email=au.user?.email||"";}
        if(!email){const au=await findAuthByRef(admin,String(student.id),role);email=au?.email||"";authId=authId||au?.id||"";}
      }
    }else{
      const {data:row,error}=await admin.from("users").select("auth_id,email,ref,phone,status,pass").eq("role","parent").eq("phone",loginId).limit(1).maybeSingle();
      if(error) return json({error:"Unable to verify login. Please try again."},503);
      if(row){
        if(row.status&&inactive(row.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
        authId=clean(row.auth_id);email=clean(row.email).includes("@")?clean(row.email).toLowerCase():"";storedPassword=clean(row.pass);
        if(!email&&authId){const {data:au}=await admin.auth.admin.getUserById(authId);email=au.user?.email||"";}
        if(!email&&row.ref){const au=await findAuthByRef(admin,String(row.ref),role);email=au?.email||"";authId=authId||au?.id||"";}
      }
      if(!email){
        const {data:student}=await admin.from("students").select("id,parentphone,status,pass").eq("parentphone",loginId).limit(1).maybeSingle();
        if(student){
          if(inactive(student.status)) return json({error:"This account is inactive. Please contact the institute administrator."},403);
          const au=await findAuthByRef(admin,String(student.id),role);email=au?.email||"";authId=au?.id||"";
        }
      }
    }

    if(!email) email=emailFor(loginId,role);
    const client=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
    let result=await client.auth.signInWithPassword({email,password});

    // Repair an out-of-sync Auth password without changing the user's intended login.
    // Existing institute records already store the password used by the provisioning workflow.
    if((result.error||!result.data.session||!result.data.user)&&storedPassword&&storedPassword===password&&authId){
      const {error:updateError}=await admin.auth.admin.updateUserById(authId,{password});
      if(!updateError) result=await client.auth.signInWithPassword({email,password});
    }

    if(result.error||!result.data.session||!result.data.user) return json({error:"Invalid login ID or password."},401);
    const appRole=result.data.user.app_metadata?.role;
    if(appRole!==role){await client.auth.signOut();return json({error:"That account is registered under a different role."},403);}
    return json({session:result.data.session,user:result.data.user},200);
  }catch(error){
    console.error("auth-login:",error);
    return json({error:"Unable to sign in right now. Please try again."},500);
  }
});
