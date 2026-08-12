import { supabase } from "@/lg/supabase";

export const C={bg:"linear-gradient(160deg,#1a1060 0%,#2d1b8e 45%,#0e0a3a 100%)",sidebar:"#0F1B3D",card:"#FFFFFF",accent:"#5B4FE8",gold:"#F5A623",green:"#22C55E",red:"#EF4444",amber:"#F59E0B",purple:"#8B5CF6",cyan:"#06B6D4",text:"#1a1060",sub:"#64748B",border:"#E2E8F0",light:"#F0F4FF"};
export const ROLES=[{key:"teacher",label:"Teacher",sub:"Manage classes & students",grad:"linear-gradient(135deg,#5B4FE8,#7B6FF5)",color:"#5B4FE8"},{key:"student",label:"Student",sub:"View classes & homework",grad:"linear-gradient(135deg,#F5A623,#F97316)",color:"#F5A623"},{key:"parent",label:"Parent",sub:"Track your child's progress",grad:"linear-gradient(135deg,#22C55E,#16A34A)",color:"#22C55E"}];
export const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const today=()=>DAYS[new Date().getDay()];
export const uid=()=>"u"+Date.now()+Math.random().toString(36).slice(2,6);
export const SUBJECTS_BY_CLASS={"9":["Science","English","Maths","Social Studies"],"10":["Science","English","Maths","Social Studies"],"11":["Accountancy","Business Studies","Economics","Applied Mathematics","Informatics Practices","Entrepreneurship","Physical Education"],"12":["Accountancy","Business Studies","Economics","Applied Mathematics","Informatics Practices","Entrepreneurship","Physical Education"]};
export const ALL_SUBJECTS=[...new Set(Object.values(SUBJECTS_BY_CLASS).flat())];
export const subjectsForClasses=(classes=[])=>[...new Set(classes.map(String).flatMap(cls=>SUBJECTS_BY_CLASS[cls]||[]))];
const hasLS=()=>typeof window!=="undefined"&&!!window.localStorage;
const lsK=t=>"lg_"+t;
export const lsG=t=>{if(!hasLS())return[];try{return JSON.parse(localStorage.getItem(lsK(t))||"[]")}catch{return[]}};
export const lsS=(t,v)=>{if(!hasLS())return;try{localStorage.setItem(lsK(t),JSON.stringify(v))}catch{}};
export const TABLES=["students","teachers","users","timetable","timetable_entries","batches","batch_students","batch_teachers","attendance","homework","materials","announcements","fees","marks","messages","notifications","examschedule","subjects","material_folders","academic_years","rooms"];
export const clearCache=()=>{if(!hasLS())return;for(const t of TABLES){try{localStorage.removeItem(lsK(t))}catch{}}};

async function enrichMaterials(rows){const clean=Array.isArray(rows)?rows:[];if(!clean.length)return clean;const enriched=[];for(const row of clean){let pdfData=null;if(row.storage_path){const{data,error}=await supabase.storage.from("materials").createSignedUrl(row.storage_path,3600,{download:row.name||row.title||"material"});if(!error)pdfData=data?.signedUrl||null}enriched.push({...row,pdfData,pdfName:row.name||row.title||"material"})}return enriched}
const normalizeStudentRead=row=>({...row,parentName:row.parentname??row.parentName??"",parentPhone:row.parentphone??row.parentPhone??""});

async function enrichStudentsWithBatch(rows){
 const clean=Array.isArray(rows)?rows:[];
 if(!clean.length)return clean.map(normalizeStudentRead);
 const studentIds=clean.map(s=>s?.id).filter(Boolean).map(String);
 const{data:members,error}=await supabase.from("batch_students").select("batch_id,student_id,status").in("student_id",studentIds).eq("status","active");
 if(error){console.warn("Unable to load student batch memberships:",error.message);return clean.map(normalizeStudentRead)}
 const activeByStudent=new Map((members||[]).map(m=>[String(m.student_id),m]));
 const batchIds=[...new Set((members||[]).map(m=>m.batch_id).filter(Boolean).map(String))];
 let batches=[];
 if(batchIds.length){const{data,error:batchError}=await supabase.from("batches").select("id,name,cls,sec,status").in("id",batchIds);if(!batchError)batches=data||[];else console.warn("Unable to load student batch details:",batchError.message)}
 const byBatch=new Map(batches.map(b=>[String(b.id),b]));
 return clean.map(raw=>{const row=normalizeStudentRead(raw);const membership=activeByStudent.get(String(row.id));const batch=membership?byBatch.get(String(membership.batch_id)):null;return{...row,batch_id:membership?.batch_id??row.batch_id??null,batchId:membership?.batch_id??row.batchId??null,batchName:batch?.name??row.batchName??"",batchClass:batch?.cls??row.batchClass??row.cls??"",batchSection:batch?.sec??row.batchSection??row.sec??""}});
}

async function scopeMaterials(rows){const clean=Array.isArray(rows)?rows:[];const{data:authData}=await supabase.auth.getUser();const user=authData?.user;const role=String(user?.app_metadata?.role||"");const ref=user?.app_metadata?.ref?String(user.app_metadata.ref):"";if(!user||!role||role==="admin")return clean;if(role==="teacher")return clean.filter(m=>!m.tid||String(m.tid)===ref);if(role==="student"||role==="parent"){if(!ref)return[];const{data:student,error}=await supabase.from("students").select("cls,sec").eq("id",ref).maybeSingle();if(error||!student)return[];return clean.filter(m=>(m.cls==null||String(m.cls)===String(student.cls))&&(m.sec==null||String(m.sec)===String(student.sec)))}return[]}

async function loadTimetable(){
 const{data:entries,error}=await supabase.from("timetable_entries").select("*").eq("status","active");
 if(error){console.error("Supabase read failed [timetable_entries]:",error.message);throw error}
 let rows=Array.isArray(entries)?entries:[];
 const{data:authData}=await supabase.auth.getUser();
 const user=authData?.user;
 const role=String(user?.app_metadata?.role||"");
 const ref=user?.app_metadata?.ref?String(user.app_metadata.ref):"";
 // Student/parent timetable visibility is determined by the student's active batch,
 // not by class/section. This prevents Batch 10-A from seeing Batch 10-B classes.
 if((role==="student"||role==="parent")&&ref){
   const{data:membership,error:membershipError}=await supabase.from("batch_students").select("batch_id").eq("student_id",ref).eq("status","active").limit(1).maybeSingle();
   if(membershipError)throw membershipError;
   const batchId=membership?.batch_id?String(membership.batch_id):"";
   rows=batchId?rows.filter(r=>String(r.batch_id)===batchId):[];
 }
 // Teachers only receive their own scheduled entries. Admins receive everything.
 if(role==="teacher"&&ref)rows=rows.filter(r=>String(r.teacher_id)===ref);
 if(!rows.length){lsS("timetable",[]);return[]}
 const batchIds=[...new Set(rows.map(r=>r.batch_id).filter(Boolean).map(String))];
 let batches=[];
 if(batchIds.length){const{data,error:batchError}=await supabase.from("batches").select("id,cls,sec,name,status").in("id",batchIds);if(batchError)throw batchError;batches=data||[]}
 const teacherIds=[...new Set(rows.map(r=>r.teacher_id).filter(Boolean).map(String))];
 let teachers=[];
 if(teacherIds.length){const{data,error:teacherError}=await supabase.from("teachers").select("id,name,tid").in("id",teacherIds);if(!teacherError)teachers=data||[]}
 const byBatch=new Map(batches.map(b=>[String(b.id),b]));
 const byTeacher=new Map(teachers.map(t=>[String(t.id),t]));
 const mapped=rows.map(r=>{const b=byBatch.get(String(r.batch_id));const teacher=byTeacher.get(String(r.teacher_id));const day=DAYS[Math.max(0,Math.min(6,Number(r.day_of_week||1)))];return{...r,tid:r.teacher_id,teacher_id:r.teacher_id,batchId:r.batch_id,cls:b?.cls??"",sec:b?.sec??"",batchName:b?.name??"",subject:r.subject_name,teacherName:teacher?.name??"",teacherTid:teacher?.tid??"",day,slot:`${String(r.start_time||"").slice(0,5)}–${String(r.end_time||"").slice(0,5)}`}});
 lsS("timetable",mapped);return mapped;
}

export const gdb=async t=>{
 if(t==="timetable")return loadTimetable();
 const{data,error}=await supabase.from(t).select("*");
 if(error){console.error(`Supabase read failed [${t}]:`,error.message);throw error}
 let rows=Array.isArray(data)?data:[];
 if(t==="students")rows=await enrichStudentsWithBatch(rows);
 if(t==="materials")rows=await scopeMaterials(rows);
 if(t==="materials")rows=await enrichMaterials(rows);
 lsS(t,rows);return rows;
};
const WRITE_COLUMNS={students:new Set(["id","name","sid","cls","sec","parentname","parentphone","parent","enroll","status"]),teachers:new Set(["id","name","tid","subject","phone","classes","status"]),users:new Set(["id","name","phone","email","role","ref","status","auth_id","created_at"])};
const STUDENT_FIELD_ALIASES={parentName:"parentname",parentPhone:"parentphone"};
const sanitizeWrite=(table,payload)=>{const allowed=WRITE_COLUMNS[table];if(!allowed)return payload;const normalized={...payload};if(table==="students"){for(const[from,to]of Object.entries(STUDENT_FIELD_ALIASES)){if(normalized[from]!==undefined&&normalized[to]===undefined)normalized[to]=normalized[from];delete normalized[from]}}return Object.fromEntries(Object.entries(normalized).filter(([key])=>allowed.has(key)))};
const upsertLocal=(t,v)=>{const c=lsG(t);const i=c.findIndex(x=>x&&x.id===v.id);if(i===-1)c.push(v);else c[i]={...c[i],...v};lsS(t,c)};
export const addR=async(t,row)=>{const payload=sanitizeWrite(t,row);const{data,error}=await supabase.from(t).insert(payload).select().maybeSingle();if(error){console.error(`Supabase insert failed [${t}]:`,error.message);throw error}if(!data)throw new Error("Supabase insert succeeded but returned no row.");upsertLocal(t,data);return data};
export const updR=async(t,id,p)=>{const payload=sanitizeWrite(t,p);delete payload.id;const{data,error}=await supabase.from(t).update(payload).eq("id",id).select().maybeSingle();if(error){console.error(`Supabase update failed [${t}]:`,error.message);throw error}if(!data)throw new Error("No row was updated. The record may not exist or RLS may have blocked access.");upsertLocal(t,data);return data};
export const delR=async(t,id)=>{const{data,error}=await supabase.from(t).delete().eq("id",id).select().maybeSingle();if(error){console.error(`Supabase delete failed [${t}]:`,error.message);throw error}if(!data)throw new Error("No row was deleted. The record may not exist or RLS may have blocked access.");lsS(t,lsG(t).filter(r=>r.id!==id));return data};
export const sdb=async(t,nextRows)=>{const previous=lsG(t);const next=Array.isArray(nextRows)?nextRows:[];const nextIds=new Set(next.map(r=>r?.id));for(const row of previous)if(row?.id&&!nextIds.has(row.id))await delR(t,row.id);lsS(t,next);return next};
export const hydrateAll=async()=>{await Promise.all(TABLES.map(t=>gdb(t)))};