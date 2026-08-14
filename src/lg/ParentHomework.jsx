import React,{useEffect,useState}from"react";
import{C,Card,Sec,Badge}from"@/lg/ui";
import{supabase}from"@/lg/supabase";

const daysLeft=due=>{if(!due)return null;const d=new Date(`${due}T23:59:59`),n=new Date();const diff=Math.ceil((d-n)/86400000);return diff>1?`${diff} days left`:diff===1?"1 day left":diff===0?"Due today":`${Math.abs(diff)} day${Math.abs(diff)===1?"":"s"} overdue`};

async function getPdf(id,filename){
  const{data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError||!session?.access_token)throw new Error("Your session has expired. Please sign in again.");
  const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/homework-file?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${session.access_token}`}});
  if(!res.ok)throw new Error((await res.text())||"Unable to download homework PDF.");
  return{blob:await res.blob(),name:filename||"homework.pdf"};
}

export function ParentHomework({homework}){
  const[selected,setSelected]=useState(null),[busy,setBusy]=useState(""),[error,setError]=useState("");
  useEffect(()=>{setSelected(null);setError("")},[homework]);
  const download=async h=>{try{setBusy(String(h.id));setError("");const{blob,name}=await getPdf(h.id,h.pdfname);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){setError(e instanceof Error?e.message:"Download failed.")}finally{setBusy("")}};
  const open=async h=>{try{setBusy(`open-${h.id}`);setError("");const{blob}=await getPdf(h.id,h.pdfname);const url=URL.createObjectURL(blob);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setError(e instanceof Error?e.message:"Unable to open PDF.")}finally{setBusy("")}};
  if(selected)return <Card style={{marginBottom:14}}><button onClick={()=>setSelected(null)} style={{border:0,background:"none",color:C.accent,fontWeight:800,padding:0,cursor:"pointer"}}>← Back to homework</button><div style={{marginTop:14}}><Badge label={selected.subject||"Subject"}/><h3 style={{margin:"10px 0 6px"}}>{selected.title||selected.desc||"Homework"}</h3><div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>{selected.desc||"No description provided."}</div><div style={{marginTop:14,fontSize:12}}><b>Assigned:</b> {selected.given||selected.created_at?.slice(0,10)||"—"}</div><div style={{fontSize:12,marginTop:5}}><b>Due:</b> {selected.due||"—"}</div>{selected.due&&<div style={{marginTop:9,fontWeight:800,color:selected.due<new Date().toISOString().slice(0,10)?C.red:C.accent}}>{daysLeft(selected.due)}</div>}{selected.pdfname&&<div style={{marginTop:16,padding:12,borderRadius:12,background:"#F8FAFC"}}><div style={{fontWeight:800,fontSize:13}}>📄 {selected.pdfname}</div><div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}><button onClick={()=>void open(selected)} disabled={!!busy} style={{border:0,borderRadius:9,padding:"9px 12px",background:C.accent,color:"#fff",fontWeight:800}}>{busy===`open-${selected.id}`?"Opening…":"Open PDF"}</button><button onClick={()=>void download(selected)} disabled={!!busy} style={{border:0,borderRadius:9,padding:"9px 12px",background:C.text,color:"#fff",fontWeight:800}}>{busy===String(selected.id)?"Downloading…":"Download PDF"}</button></div></div>}{error&&<div style={{marginTop:12,color:C.red,fontSize:12}}>{error}</div>}</Card>;
  return <><Sec title="Homework"/>{!homework.length?<Card>No homework assigned 🎉</Card>:homework.map(h=><Card key={h.id} style={{marginBottom:9,cursor:"pointer"}} onClick={()=>setSelected(h)}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}><div><Badge label={h.subject||"Subject"}/><div style={{fontWeight:800,marginTop:7}}>{h.title||h.desc||"Homework"}</div><div style={{fontSize:11,color:C.sub}}>Due: {h.due||"—"}</div>{h.due&&<div style={{fontSize:11,fontWeight:800,color:h.due<new Date().toISOString().slice(0,10)?C.red:C.accent,marginTop:3}}>{daysLeft(h.due)}</div>}</div>{h.pdfname&&<span style={{fontSize:18}} title="PDF attached">📄</span>}</div></Card>)}{error&&<div style={{color:C.red,fontSize:12,marginTop:8}}>{error}</div>}</>;
}
