import React,{useEffect,useState}from"react";
import {C,lsG,gdb,addR}from"@/lg/data";
import {supabase}from"@/lg/supabase";
import {Badge,Card,Sec,Shell,AppBar}from"@/lg/ui";
import {NotifPanel,MessagingPanel,PDFViewer}from"@/lg/panels";
import {STMarks}from"@/lg/marks";
import {STHome,STTimetable}from"@/lg/student";

export function STAttendance({student}){const rows=lsG("attendance").filter(a=>String(a.sid)===String(student?.id));const present=rows.filter(a=>a.status==="present").length;const absent=rows.filter(a=>a.status==="absent").length;const leave=rows.filter(a=>a.status==="leave").length;const rate=rows.length?Math.round(present/rows.length*100):0;return <div><Card style={{textAlign:"center",padding:24,marginBottom:16}}><div style={{fontSize:34,fontWeight:900,color:rate>=75?C.green:C.red}}>{rate}%</div><div style={{fontSize:12,color:C.sub}}>Attendance</div><div style={{display:"flex",justifyContent:"center",gap:24,marginTop:16}}><div>✅ {present}<div style={{fontSize:10,color:C.sub}}>Present</div></div><div>❌ {absent}<div style={{fontSize:10,color:C.sub}}>Absent</div></div><div>🟡 {leave}<div style={{fontSize:10,color:C.sub}}>Leave</div></div></div></Card><Sec title="Attendance Log 📋"/>{rows.length?rows.slice().reverse().map(a=><Card key={a.id} style={{marginBottom:8,display:"flex",justifyContent:"space-between"}}><span>{a.date}</span><Badge label={a.status}/></Card>):<Card style={{textAlign:"center",padding:24,color:C.sub}}>No attendance records yet.</Card>}</div>}

export function STHomework({student}){const rows=student?lsG("homework").filter(h=>String(h.cls)===String(student.cls)&&String(h.sec)===String(student.sec)):[];return <div><Sec title={`Homework (${rows.length}) 📝`}/>{rows.length?rows.map(h=><Card key={h.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><Badge label={h.subject}/><span style={{fontSize:11,color:C.sub}}>Due: {h.due}</span></div><div style={{fontWeight:700,color:C.text,marginTop:8}}>{h.desc}</div>{h.pdfName&&<PDFViewer pdfData={h.pdfData} pdfName={h.pdfName}/>}</Card>):<Card style={{textAlign:"center",padding:28,color:C.sub}}>No homework right now 🎉</Card>}</div>}

export function STMaterials({student}){
  const [folders,setFolders]=useState([]);
  const [rows,setRows]=useState([]);
  const [current,setCurrent]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      setLoading(true);setError("");
      const [f,m]=await Promise.all([
        supabase.from("material_folders").select("id,name,parent_id,created_at").order("name"),
        supabase.from("materials").select("id,title,name,folder_id,batch_id,storage_path,file_size,mime_type,pdfdata,pdfname,desc,subject,created_at").order("created_at",{ascending:false}),
      ]);
      if(cancelled)return;
      if(f.error||m.error){setError(f.error?.message||m.error?.message||"Unable to load study materials");setFolders([]);setRows([]);setLoading(false);return;}
      setFolders(f.data||[]);setRows(m.data||[]);setLoading(false);
    };
    void load();
    return()=>{cancelled=true};
  },[]);

  const visibleFolders=folders.filter(f=>f.parent_id===(current?.id??null));
  const visibleFiles=rows.filter(m=>m.folder_id===(current?.id??null));
  const breadcrumbs=[];
  let id=current?.id;
  while(id){const folder=folders.find(f=>f.id===id);if(!folder)break;breadcrumbs.unshift(folder);id=folder.parent_id||null;}

  const download=async(file)=>{
    if(file.storage_path){
      const {data,error:e}=await supabase.storage.from("materials").download(file.storage_path);
      if(e){setError(e.message);return;}
      const url=URL.createObjectURL(data);const a=document.createElement("a");a.href=url;a.download=file.name||file.title||"material";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if(file.pdfdata){const a=document.createElement("a");a.href=file.pdfdata;a.download=file.pdfname||file.name||file.title||"material";document.body.appendChild(a);a.click();a.remove();}
  };

  return <div>
    <Sec title="Study Materials 📚"/>
    {error&&<Card style={{color:C.red,marginBottom:10}}>{error}</Card>}
    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:12}}>
      <button onClick={()=>setCurrent(null)} style={{border:0,background:"transparent",color:C.accent,fontWeight:800,cursor:"pointer",padding:"4px 2px"}}>📚 Study Materials</button>
      {breadcrumbs.map(f=><React.Fragment key={f.id}><span style={{color:C.sub}}>›</span><button onClick={()=>setCurrent(f)} style={{border:0,background:"transparent",color:C.accent,fontWeight:800,cursor:"pointer",padding:"4px 2px"}}>{f.name}</button></React.Fragment>)}
    </div>
    {loading?<Card style={{textAlign:"center",padding:28,color:C.sub}}>Loading materials…</Card>:<>
      {visibleFolders.map(folder=><Card key={folder.id} onClick={()=>setCurrent(folder)} style={{marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:30}}>📁</div><div><div style={{fontWeight:900,color:C.text}}>{folder.name}</div><div style={{fontSize:11,color:C.sub}}>Open folder</div></div><div style={{marginLeft:"auto",color:C.sub,fontSize:20}}>›</div></Card>)}
      {visibleFiles.map(file=><Card key={file.id} style={{marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:28}}>{file.mime_type?.includes("pdf")?"📄":"📎"}</div><div style={{minWidth:0,flex:1}}><div style={{fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.title||file.name||"Material"}</div><div style={{fontSize:11,color:C.sub,marginTop:3}}>{file.subject||""}{file.desc?` · ${file.desc}`:""}</div></div><button onClick={()=>void download(file)} style={{border:0,borderRadius:10,padding:"9px 12px",background:C.accent,color:"#fff",fontWeight:800,cursor:"pointer"}}>Download</button></div>{file.pdfdata&&<div style={{marginTop:10}}><PDFViewer pdfData={file.pdfdata} pdfName={file.pdfname||file.name}/></div>}</Card>)}
      {!visibleFolders.length&&!visibleFiles.length&&<Card style={{textAlign:"center",padding:28,color:C.sub}}>{current?"This folder is empty.":"No study materials yet."}</Card>}
    </>}
  </div>;
}

export function STFees({student}){const rows=lsG("fees").filter(f=>String(f.sid)===String(student?.id));const total=rows.reduce((s,f)=>s+Number(f.amount||0),0);const paid=rows.filter(f=>f.status==="paid").reduce((s,f)=>s+Number(f.amount||0),0);return <div><Card style={{marginBottom:16}}><div style={{fontSize:12,color:C.sub}}>Total Fees</div><div style={{fontSize:26,fontWeight:900,color:C.text}}>₹{total.toLocaleString()}</div><div style={{fontSize:12,color:C.green}}>Paid ₹{paid.toLocaleString()} · Pending ₹{(total-paid).toLocaleString()}</div></Card><Sec title="Fee Records 💰"/>{rows.length?rows.map(f=><Card key={f.id} style={{marginBottom:9,display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:700,color:C.text}}>{f.desc}</div><div style={{fontSize:11,color:C.sub}}>Due: {f.due}</div></div><div style={{textAlign:"right"}}>₹{Number(f.amount||0).toLocaleString()}<div><Badge label={f.status}/></div></div></Card>):<Card style={{textAlign:"center",padding:24,color:C.sub}}>No fee records yet.</Card>}</div>}

export function STExamSchedule({student}){const [rows,setRows]=useState(()=>lsG("examschedule"));useEffect(()=>{void gdb("examschedule").then(d=>setRows(Array.isArray(d)?d:[])).catch(()=>{})},[]);const today=new Date().toISOString().slice(0,10);const mine=rows.filter(e=>(!e.cls||String(e.cls)===String(student?.cls))&&(!e.sec||String(e.sec)===String(student?.sec)));const upcoming=mine.filter(e=>String(e.date)>=today).sort((a,b)=>String(a.date).localeCompare(String(b.date)));return <div><Sec title={`Upcoming Exams 📋 (${upcoming.length})`}/>{upcoming.length?upcoming.map(e=><Card key={e.id} style={{marginBottom:10}}><div style={{fontWeight:800,color:C.text}}>{e.title||e.subject}</div><div style={{fontSize:11,color:C.sub,marginTop:5}}>{e.date} · {e.startTime||""}{e.endTime?`–${e.endTime}`:""}{e.venue?` · ${e.venue}`:""}</div><div style={{fontSize:11,color:C.accent,marginTop:4}}>Marks: {e.totalMarks??"—"}</div></Card>):<Card style={{textAlign:"center",padding:28,color:C.sub}}>No upcoming exams.</Card>}</div>}

export function STAnnouncements(){const rows=lsG("announcements");return <div><Sec title="Announcements 📢"/>{rows.length?rows.map(a=><Card key={a.id} style={{marginBottom:10}}><div style={{fontWeight:800,color:C.text}}>{a.title}</div><div style={{fontSize:12,color:C.sub,marginTop:5}}>{a.desc}</div><div style={{fontSize:10,color:C.sub,marginTop:7}}>{a.date}</div></Card>):<Card style={{textAlign:"center",padding:24,color:C.sub}}>No announcements.</Card>}</div>}

export function StudentApp({user,onLogout}){const [tab,setTab]=useState("home");const [showNotif,setShowNotif]=useState(false);const [showMsg,setShowMsg]=useState(false);const student=lsG("students").find(s=>String(s.id)===String(user.ref));const tabs=[{key:"home",icon:"🏠",label:"Home"},{key:"timetable",icon:"📅",label:"Schedule"},{key:"materials",icon:"📚",label:"Materials"},{key:"homework",icon:"📝",label:"HW"},{key:"exams",icon:"📋",label:"Exams"},{key:"attendance",icon:"✅",label:"Attend."},{key:"marks",icon:"📊",label:"Marks"},{key:"fees",icon:"💰",label:"Fees"}];const content=tab==="home"?<STHome student={student}/>:tab==="timetable"?<STTimetable student={student}/>:tab==="materials"?<STMaterials student={student}/>:tab==="homework"?<STHomework student={student}/>:tab==="exams"?<STExamSchedule student={student}/>:tab==="attendance"?<STAttendance student={student}/>:tab==="marks"?<STMarks student={student}/>:<STFees student={student}/>;return <><Shell header={<AppBar name={user.name} role="student" userId={user.id} onLogout={onLogout} onNotif={()=>setShowNotif(true)} onMsg={()=>setShowMsg(true)}/>} tabs={tabs} activeTab={tab} setTab={setTab}>{content}</Shell>{showNotif&&<NotifPanel userId={user.id} onClose={()=>setShowNotif(false)}/>} {showMsg&&<MessagingPanel user={user} onClose={()=>setShowMsg(false)}/>}</>}
