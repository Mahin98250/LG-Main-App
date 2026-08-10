import React,{useState,useEffect,useCallback,useRef}from"react";
import { supabase, SB_URL, SB_KEY } from "@/lg/supabase";
import { signIn, signOut, getCurrentUser } from "@/lg/auth";

/* ══════════════════════════════════════════════════════════════
   SUPABASE DATA LAYER — DATABASE IS THE SOURCE OF TRUTH
══════════════════════════════════════════════════════════════ */
const lsK=t=>"lg_"+t;
const lsG=t=>{try{return JSON.parse(localStorage.getItem(lsK(t))||"[]");}catch{return[];}};
const lsS=(t,v)=>{try{localStorage.setItem(lsK(t),JSON.stringify(v));}catch{}};
const sbQ=async(path,opts={})=>{
  const method=opts.method||"GET";
  const prefer=opts.prefer!==undefined?opts.prefer:"return=representation";
  const {data:{session}}=await supabase.auth.getSession();
  const headers={"apikey":SB_KEY};
  headers["Authorization"]="Bearer "+(session?.access_token||SB_KEY);
  if(prefer)headers["Prefer"]=prefer;
  if(method!=="GET"&&method!=="DELETE")headers["Content-Type"]="application/json";
  const cfg={method,headers};
  if(opts.body)cfg.body=opts.body;
  const r=await fetch(SB_URL+"/rest/v1/"+path,cfg);
  if(!r.ok){const txt=await r.text();throw new Error("SB "+r.status+": "+txt);}
  const txt=await r.text();return txt?JSON.parse(txt):[];
};
const uid=()=>"u"+Date.now()+Math.random().toString(36).slice(2,6);
const TABLES=["users","students","teachers","timetable","batches","attendance","homework","materials","announcements","fees","marks","messages","notifications","examschedule"];
const gdb=async(t,f="")=>{const d=await sbQ(t+"?order=created_at.asc"+(f?"&"+f:""));if(Array.isArray(d)){lsS(t,d);return d;}return[];};
const addR=async(t,row)=>{const s=await sbQ(t,{method:"POST",body:JSON.stringify(row)});const r=Array.isArray(s)?s[0]:s;if(!r)throw new Error("Supabase insert returned no row.");lsS(t,[...lsG(t).filter(x=>x?.id!==r.id),r]);return r;};
const updR=async(t,id,p)=>{const s=await sbQ(t+"?id=eq."+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(p)});const r=Array.isArray(s)?s[0]:s;if(!r)throw new Error("Supabase update returned no row.");lsS(t,lsG(t).map(x=>x?.id===id?r:x));return r;};
const delR=async(t,id)=>{await sbQ(t+"?id=eq."+encodeURIComponent(id),{method:"DELETE",prefer:""});lsS(t,lsG(t).filter(x=>x?.id!==id));};
const provisionAccount=async({action,role,loginId,password,name,ref,authId})=>{const {data,error}=await supabase.functions.invoke("admin-provision-user",{body:{action,role,loginId,password,name,ref,authId}});if(error)throw error;if(data?.error)throw new Error(data.error);return data;};
const hydrateAll=async()=>{for(const t of TABLES){try{await gdb(t);}catch(e){console.warn("hydrate",t,e?.message||e);}}};
const getSession=()=>{try{const s=localStorage.getItem("session_user");return s?JSON.parse(s):null;}catch{return null;}};
const clearSession=()=>localStorage.removeItem("session_user");
const initDB=()=>{};

