import React,{useState,useEffect,useRef}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";
import {PDFUpload,PDFViewer,NotifPanel,MessagingPanel} from "@/lg/panels";
import {THMarks,THAnalytics} from "@/lg/marks";

/* ═══════════════════════════════════════════════════════
   TEACHER APP
═══════════════════════════════════════════════════════ */
export function THHome({teacher}){
  const slots=lsG("timetable").filter(tt=>tt.tid===teacher?.id&&tt.day===today());
  const hw=lsG("homework").filter(h=>h.tid===teacher?.id);
  const ann=lsG("announcements").slice(0,3);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {[[slots.length,"Today's Classes","📅",C.accent],[hw.length,"Active HW","📝",C.gold],[lsG("students").length,"Students","🎓",C.green]].map(([v,l,ic,c],i)=>(
          <div key={l} className={`fu card-lift d${i+1}`}
            style={{flex:1,background:"#fff",borderRadius:18,padding:16,
              boxShadow:"0 3px 14px rgba(27,16,96,.07)",border:"1px solid #EEF2FF",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
            <div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div>
            <div style={{fontSize:11,color:C.sub,marginTop:2,lineHeight:1.3}}>{l}</div>
          </div>
        ))}
      </div>
      <Sec title={`Today – ${today()} 📅`}/>
      {slots.length===0
        ?<Card style={{marginBottom:14,textAlign:"center",padding:24}}><div style={{fontSize:28,marginBottom:6}}>🎉</div><div style={{color:C.sub,fontSize:13}}>No classes today!</div></Card>
        :slots.map((s,i)=><Card key={s.id} className={`fu d${i+1}`} style={{marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:44,height:44,borderRadius:14,background:C.accent+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📖</div>
          <div><div style={{fontWeight:700,color:C.text,fontSize:14}}>{s.subject}</div><div style={{fontSize:12,color:C.sub}}>Class {s.cls}-{s.sec} · {s.slot}</div></div>
        </Card>)
      }
      <Sec title="Announcements 📢"/>
      {ann.map((a,i)=><Card key={a.id} className={`fu d${i+1}`} style={{marginBottom:10,borderLeft:`4px solid ${C.accent}`}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:3}}>{a.title}</div>
        <div style={{fontSize:12,color:C.sub}}>{a.desc}</div>
      </Card>)}
    </div>
  );
}

export function THSchedule({teacher}){
  const slots=lsG("timetable").filter(tt=>tt.tid===teacher?.id);
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday"];
  return(
    <div>
      <Sec title="Weekly Schedule 📅"/>
      {days.map((day,di)=>{
        const ds=slots.filter(s=>s.day===day);const isTod=day===today();
        return(
          <div key={day} className={`fu d${di%4+1}`} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:800,color:isTod?C.accent:C.sub,
              padding:"5px 12px",background:isTod?C.accent+"12":"#F1F5F9",
              borderRadius:8,display:"inline-flex",alignItems:"center",gap:6,marginBottom:8}}>
              {day}{isTod&&<span style={{background:C.accent,color:"#fff",padding:"2px 8px",borderRadius:10,fontSize:10}}>TODAY</span>}
            </div>
            {ds.length===0?<div style={{fontSize:12,color:C.sub,paddingLeft:8,opacity:.6}}>No classes</div>
              :ds.map(s=><Card key={s.id} style={{marginBottom:8,display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:C.accent}}/>
                <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{s.subject}</div><div style={{fontSize:11,color:C.sub}}>Class {s.cls}-{s.sec} · {s.slot}</div></div>
              </Card>)
            }
          </div>
        );
      })}
    </div>
  );
}

export function THAttendance({teacher}){
  const students=lsG("students");
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [marks,setMarks]=useState(()=>{const m={};students.forEach(s=>m[s.id]="present");return m;});
  const [saved,setSaved]=useState(false);
  useEffect(()=>{
    const m={};
    students.forEach(s=>m[s.id]=lsG("attendance").find(a=>a.sid===s.id&&a.date===date)?.status||"present");
    setMarks(m);
  },[date]);
  const save= async()=>{
    for(const s of students){
      const ex=lsG("attendance").find(a=>a.sid===s.id&&a.date===date);
      if(ex) await updR("attendance",ex.id,{status:marks[s.id]});
      else await addR("attendance",{sid:s.id,date,status:marks[s.id],by:teacher?.id});
    }
    setSaved(true);setTimeout(()=>setSaved(false),2500);
  };
  const stC={present:"#22C55E",absent:"#EF4444",leave:"#F59E0B"};
  return(
    <div>
      <Sec title="Mark Attendance ✅"/>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:7}}>Select Date</div>      
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}                          
          style={{width:"100%",padding:"11px 13px",borderRadius:11,                                      
            border:`1.5px solid ${C.border}`,background:C.light,                
            color:C.text,fontSize:14,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
      </Card>                                 
      {students.map((s,si)=>(
        <Card key={s.id} className={`fu d${si%3+1}`} style={{marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{s.name}</div><div style={{fontSize:11,color:C.sub}}>Cl. {s.cls}-{s.sec}</div></div>
            <div style={{display:"flex",gap:6}}>
              {["present","absent","leave"].map(st=>(
                <button key={st} onClick={()=>setMarks({...marks,[s.id]:st})}
                  className={`att-btn${marks[s.id]===st?" sel":""}`}
                  style={{padding:"5px 10px",borderRadius:9,border:"none",cursor:"pointer",
                    fontSize:11,fontWeight:700,
                    background:marks[s.id]===st?stC[st]:"#F1F5F9",
                    color:marks[s.id]===st?"#fff":"#64748B",
                    boxShadow:marks[s.id]===st?`0 4px 12px ${stC[st]}44`:"none"}}>
                  {st.charAt(0).toUpperCase()+st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ))}
      {saved&&<div className="success-flash tick-pop" style={{textAlign:"center",color:"#22C55E",
        fontWeight:800,marginBottom:10,fontSize:15,padding:10,borderRadius:12}}>✅ Saved!</div>}
      <GBtn ch="Save Attendance ✓" onClick={save} style={{marginTop:4}}/>
    </div>
  );
}

export function THHomework({teacher}){
  const [hw,setHw]=useState(lsG("homework").filter(h=>h.tid===teacher?.id));
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({cls:"10",sec:"A",subject:"",desc:"",
    given:new Date().toISOString().split("T")[0],due:"",pdfName:null,pdfData:null});
  const ref=()=>setHw(lsG("homework").filter(h=>h.tid===teacher?.id));
  const save= async()=>{
    if(!form.subject||!form.desc||!form.due)return;
    await addR("homework",{...form,tid:teacher?.id});ref();setModal(false);
    setForm({cls:"10",sec:"A",subject:"",desc:"",given:new Date().toISOString().split("T")[0],due:"",pdfName:null,pdfData:null});
    // Notify students
    lsG("students").filter(s=>s.cls===form.cls&&s.sec===form.sec).forEach(s=>{
      const u=lsG("users").find(u=>u.ref===s.id);
      if(u)addR("notifications",{title:"New homework",desc:form.subject+": "+form.desc+" — Due "+form.due,time:form.given,type:"homework",read:false,uid:u.id});
    });
  };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <SBtn ch="+ Assign HW" onClick={()=>setModal(true)}/>
      </div>
      <Sec title={`Homework (${hw.length}) 📝`}/>
      {hw.map((h,i)=>(
        <Card key={h.id} className={`fu d${i%3+1}`} style={{marginBottom:11}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:5}}><Badge label={h.subject}/><span style={{fontSize:11,color:C.sub}}>Cl.{h.cls}-{h.sec}</span></div>
              <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:3}}>{h.desc}</div>
              <div style={{fontSize:11,color:C.sub}}>Due: <span style={{color:"#EF4444",fontWeight:700}}>{h.due}</span></div>
              {h.pdfName&&<PDFViewer pdfData={h.pdfData} pdfName={h.pdfName}/>}
            </div>
            <button onClick={()=>{sdb("homework",lsG("homework").filter(x=>x.id!==h.id));ref();}}
              className="del-btn"
              style={{background:"#FEE2E2",border:"none",borderRadius:9,
                padding:"5px 9px",color:"#EF4444",fontSize:16,marginLeft:8,cursor:"pointer"}}>🗑</button>
          </div>
        </Card>
      ))}
      {hw.length===0&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>📝</div><div style={{color:C.sub,fontSize:13}}>No homework assigned yet</div></Card>}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:200,
          display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'Poppins',sans-serif"}}>
          <div className="modal-sheet" style={{background:"#fff",borderRadius:"22px 22px 0 0",
            padding:"26px 22px 38px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:17,fontWeight:800,color:C.text}}>Assign Homework</div>
              <button onClick={()=>setModal(false)} className="pressable"
                style={{background:C.light,border:"none",borderRadius:9,padding:"5px 11px",fontSize:17,cursor:"pointer"}}>✕</button>
            </div>
            {[["cls","Class",["9","10","11","12"]],["sec","Section",["A","B","C"]],["subject","Subject",null]].map(([k,l,opts])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>{l}</div>
                {opts?<select value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
                  style={{width:"100%",padding:"11px 13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}>
                  {opts.map(o=><option key={o}>{o}</option>)}</select>
                :<input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}
                  style={{width:"100%",padding:"11px 13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>}
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Description</div>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={3}
                placeholder="What to do…"
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif",resize:"vertical"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Due Date</div>
              <input type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.light,color:C.text,fontSize:14,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
            </div>
            <PDFUpload onFile={(n,d)=>setForm({...form,pdfName:n,pdfData:d})} label="Attach Question PDF (optional)"/>
            <GBtn ch="Assign ✓" onClick={save}/>
          </div>
        </div>
      )}
    </div>
  );
}

export function THMaterials({teacher}){
  const [mats,setMats]=useState(lsG("materials").filter(m=>m.tid===teacher?.id));
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({cls:"10",sec:"A",subject:"",title:"",desc:"",pdfName:null,pdfData:null});
  const ref=()=>setMats(lsG("materials").filter(m=>m.tid===teacher?.id));
  const sc={"Mathematics":"#5B4FE8","Science":"#22C55E","English":"#F97316","History":"#8B5CF6","Geography":"#06B6D4"};
  const save= async()=>{
    if(!form.subject||!form.title)return;
    await addR("materials",{...form,date:new Date().toISOString().split("T")[0],tid:teacher?.id});
    ref();setModal(false);
    setForm({cls:"10",sec:"A",subject:"",title:"",desc:"",pdfName:null,pdfData:null});
  };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <SBtn ch="+ Upload" onClick={()=>setModal(true)} color="linear-gradient(135deg,#22C55E,#16A34A)"/>
      </div>
      <Sec title="Study Materials 📚"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        {mats.map((m,i)=>{const c=sc[m.subject]||C.accent;return(
          <Card key={m.id} className={`fu d${i%4+1} card-lift`} style={{padding:15}}>
            <div style={{width:42,height:42,borderRadius:13,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,marginBottom:9}}>📄</div>
            <div style={{fontWeight:700,color:C.text,fontSize:12,marginBottom:3,lineHeight:1.3}}>{m.title}</div>
            <div style={{fontSize:11,color:C.sub,marginBottom:7}}>{m.desc}</div>
            <Badge label={m.subject}/>
            {m.pdfName&&<PDFViewer pdfData={m.pdfData} pdfName={m.pdfName}/>}
          </Card>
        );})}
      </div>
      {mats.length===0&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>📚</div><div style={{color:C.sub,fontSize:13}}>No materials yet</div></Card>}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:200,
          display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'Poppins',sans-serif"}}>
          <div className="modal-sheet" style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"26px 22px 38px",width:"100%",maxWidth:430}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <div style={{fontSize:17,fontWeight:800,color:C.text}}>Upload Material</div>
              <button onClick={()=>setModal(false)} className="pressable" style={{background:C.light,border:"none",borderRadius:9,padding:"5px 11px",fontSize:17,cursor:"pointer"}}>✕</button>
            </div>
            {[["title","Title"],["subject","Subject"],["desc","Description"],["cls","Class"],["sec","Section"]].map(([k,l])=>(
              <div key={k} style={{marginBottom:11}}>
                <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>{l}</div>
                <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}
                  style={{width:"100%",padding:"11px 13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
              </div>
            ))}
            <PDFUpload onFile={(n,d)=>setForm({...form,pdfName:n,pdfData:d})} label="Attach Notes PDF (optional)"/>
            <GBtn ch="Upload ✓" onClick={save} color="linear-gradient(135deg,#22C55E,#16A34A)"/>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeacherApp({user,onLogout}){
  const [showNotif,setShowNotif]=useState(false);
  const [showChat,setShowChat]=useState(false);
  const [showMsg,setShowMsg]=useState(false);
  const [tab,setTab]=useState("home");
  const teacher=lsG("teachers").find(t=>t.id===user.ref);
  const tabs=[{key:"home",icon:"🏠",label:"Home"},{key:"schedule",icon:"📅",label:"Schedule"},{key:"attendance",icon:"✅",label:"Attend."},{key:"homework",icon:"📝",label:"HW"},{key:"materials",icon:"📚",label:"Notes"},{key:"marks",icon:"📊",label:"Marks"},{key:"analytics",icon:"📈",label:"Analytics"}];
  const c=()=>{
    if(tab==="home")       return <THHome teacher={teacher}/>;
    if(tab==="schedule")   return <THSchedule teacher={teacher}/>;
    if(tab==="attendance") return <THAttendance teacher={teacher}/>;
    if(tab==="homework")   return <THHomework teacher={teacher}/>;
    if(tab==="materials")  return <THMaterials teacher={teacher}/>;
    if(tab==="marks")      return <THMarks teacher={teacher}/>;
    if(tab==="analytics")  return <THAnalytics teacher={teacher}/>;
  };
  return(
    <>
      <Shell header={<AppBar name={user.name} role="teacher" userId={user.id} onLogout={onLogout}
        onNotif={()=>setShowNotif(true)} onChat={()=>setShowChat(true)} onMsg={()=>setShowMsg(true)}/>}
        tabs={tabs} activeTab={tab} setTab={setTab}>{c()}</Shell>
      {showNotif&&<NotifPanel userId={user.id} onClose={()=>setShowNotif(false)}/>}
      {showChat&&<AIChatBot user={user} onClose={()=>setShowChat(false)}/>}
      {showMsg&&<MessagingPanel user={user} onClose={()=>setShowMsg(false)}/>}
    </>
  );
}
