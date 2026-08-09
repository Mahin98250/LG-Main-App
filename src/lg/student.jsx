import React,{useState,useEffect,useRef}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";
import {PDFViewer,NotifPanel,MessagingPanel} from "@/lg/panels";
import {STMarks} from "@/lg/marks";

/* ═══════════════════════════════════════════════════════
   STUDENT APP
═══════════════════════════════════════════════════════ */
export function STHome({student}){
  const att=lsG("attendance").filter(a=>a.sid===student?.id);
  const rate=att.length?Math.round((att.filter(a=>a.status==="present").length/att.length)*100):0;
  const hw=student?lsG("homework").filter(h=>h.cls===student.cls&&h.sec===student.sec):[];
  const slots=student?lsG("timetable").filter(tt=>tt.cls===student.cls&&tt.sec===student.sec&&tt.day===today()):[];
  const ann=lsG("announcements").filter(a=>a.target==="all").slice(0,2);
  return(
    <div>
      <div className="fu" style={{background:`linear-gradient(135deg,#5B4FE8,#7B6FF5)`,borderRadius:20,padding:"18px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-18,right:-18,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
        <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{student?.name}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginTop:2}}>Class {student?.cls}-{student?.sec} · {student?.sid}</div>
        <div style={{display:"flex",gap:12,marginTop:14}}>
          {[[`${rate}%`,"Attendance"],[hw.length,"Homework"],[slots.length,"Today"]].map(([v,l])=>(
            <div key={l} className="pressable" style={{background:"rgba(255,255,255,.18)",borderRadius:11,padding:"8px 14px",cursor:"default"}}>
              <div style={{fontSize:17,fontWeight:900,color:"#fff"}}>{v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.65)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <Sec title={`Today – ${today()} 📖`}/>
      {slots.length===0?<Card style={{marginBottom:14,textAlign:"center",padding:22}}><div style={{color:C.sub,fontSize:13}}>No classes today 🎉</div></Card>
        :slots.map((s,i)=><Card key={s.id} className={`fu d${i+1}`} style={{marginBottom:9,display:"flex",gap:11,alignItems:"center"}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.accent+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>📚</div>
          <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{s.subject}</div><div style={{fontSize:11,color:C.sub}}>{s.slot}</div></div>
        </Card>)
      }
      <Sec title="Homework Due 📝"/>
      {hw.slice(0,2).map((h,i)=><Card key={h.id} className={`fu d${i+1}`} style={{marginBottom:9,borderLeft:`4px solid ${C.gold}`}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{h.subject}</div>
        <div style={{fontSize:12,color:C.sub,marginBottom:3}}>{h.desc}</div>
        <div style={{fontSize:11}}>Due: <span style={{color:"#EF4444",fontWeight:700}}>{h.due}</span></div>
      </Card>)}
      {hw.length===0&&<Card style={{marginBottom:14,textAlign:"center",padding:20}}><div style={{color:C.sub,fontSize:13}}>No pending homework 🎉</div></Card>}
      <Sec title="Announcements 📢"/>
      {ann.map((a,i)=><Card key={a.id} className={`fu d${i+1}`} style={{marginBottom:9}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{a.title}</div>
        <div style={{fontSize:12,color:C.sub}}>{a.desc}</div>
      </Card>)}
    </div>
  );
}

export function STTimetable({student}){
  const slots=student?lsG("timetable").filter(tt=>tt.cls===student.cls&&tt.sec===student.sec):[];
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const em={"Mathematics":"🔢","Science":"🔬","English":"📖","History":"🏛","Geography":"🌍"};
  return(
    <div>
      <Sec title="My Timetable 📅"/>
      {days.map((day,di)=>{
        const ds=slots.filter(s=>s.day===day);const it=day===today();
        return(
          <div key={day} className={`fu d${di%4+1}`} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:800,color:it?C.accent:C.sub,marginBottom:7,display:"flex",alignItems:"center",gap:7}}>
              <span style={{padding:"4px 11px",background:it?C.accent+"15":"#F1F5F9",borderRadius:8}}>{day}</span>
              {it&&<span className="tick-pop" style={{fontSize:10,background:C.accent,color:"#fff",padding:"3px 9px",borderRadius:20}}>TODAY</span>}
            </div>
            {ds.length===0?<div style={{fontSize:12,color:C.sub,paddingLeft:10,opacity:.6}}>No classes</div>
              :ds.map(s=><Card key={s.id} style={{marginBottom:8,display:"flex",gap:11,alignItems:"center",borderLeft:it?`3px solid ${C.accent}`:undefined}}>
                <div style={{width:38,height:38,borderRadius:11,background:C.accent+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{em[s.subject]||"📚"}</div>
                <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{s.subject}</div><div style={{fontSize:11,color:C.sub}}>{s.slot}</div></div>
              </Card>)
            }
          </div>
        );
      })}
    </div>
  );
}

export function STAttendance({student}){
  const att=lsG("attendance").filter(a=>a.sid===student?.id);
  const present=att.filter(a=>a.status==="present").length;
  const rate=att.length?Math.round((present/att.length)*100):0;
  const rc=rate>=85?"#22C55E":rate>=70?"#F59E0B":"#EF4444";
  return(
    <div>
      <Card className="fu" style={{textAlign:"center",marginBottom:16,padding:"24px 18px"}}>
        <div style={{width:100,height:100,borderRadius:"50%",border:`7px solid ${rc}`,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          margin:"0 auto 12px",animation:"glow 2.5s ease-in-out infinite"}}>
          <div style={{fontSize:26,fontWeight:900,color:rc}}>{rate}%</div>
          <div style={{fontSize:10,color:C.sub}}>Attendance</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:18}}>
          {[["✅",present,"#22C55E","Present"],["❌",att.filter(a=>a.status==="absent").length,"#EF4444","Absent"],["🟡",att.filter(a=>a.status==="leave").length,"#F59E0B","Leave"]].map(([ic,v,c,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:17}}>{ic}</div>
              <div style={{fontSize:19,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:C.sub}}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
      <Sec title="Attendance Log 📋"/>
      {[...att].reverse().map((a,i)=><Card key={a.id} className={`fu d${i%4+1}`} style={{marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.date}</div><Badge label={a.status}/>
      </Card>)}
    </div>
  );
}

export function STHomework({student}){
  const hw=student?lsG("homework").filter(h=>h.cls===student.cls&&h.sec===student.sec):[];
  return(
    <div>
      <Sec title={`Homework (${hw.length}) 📝`}/>
      {hw.map((h,i)=>{
        const dl=Math.ceil((new Date(h.due)-new Date())/(1000*60*60*24));const urg=dl<=2;
        return(
          <Card key={h.id} className={`fu d${i%3+1} card-lift`} style={{marginBottom:11,borderLeft:`4px solid ${urg?"#EF4444":C.gold}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <Badge label={h.subject}/>
              <span style={{fontSize:11,background:urg?"#FEE2E2":"#FEF3C7",color:urg?"#EF4444":"#D97706",padding:"3px 9px",borderRadius:20,fontWeight:700}}>
                {dl<=0?"Overdue":dl===1?"Tomorrow":`${dl}d left`}
              </span>
            </div>
            <div style={{fontWeight:700,color:C.text,fontSize:13,margin:"6px 0 3px"}}>{h.desc}</div>
            <div style={{fontSize:11,color:C.sub}}>Due: <strong style={{color:"#EF4444"}}>{h.due}</strong></div>
            {h.pdfName&&<PDFViewer pdfData={h.pdfData} pdfName={h.pdfName}/>}
          </Card>
        );
      })}
      {hw.length===0&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>🎉</div><div style={{color:C.sub,fontSize:13}}>No homework!</div></Card>}
    </div>
  );
}

export function STMaterials({student}){
  const mats=student?lsG("materials").filter(m=>m.cls===student.cls&&m.sec===student.sec):[];
  const sc={"Mathematics":"#5B4FE8","Science":"#22C55E","English":"#F97316","History":"#8B5CF6","Geography":"#06B6D4"};
  return(
    <div>
      <Sec title="Study Materials 📚"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        {mats.map((m,i)=>{const c=sc[m.subject]||C.accent;return(
          <Card key={m.id} className={`fu d${i%4+1} card-lift`} style={{padding:15}}>
            <div style={{width:40,height:40,borderRadius:12,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:8}}>📄</div>
            <div style={{fontWeight:700,color:C.text,fontSize:12,marginBottom:2,lineHeight:1.3}}>{m.title}</div>
            <div style={{fontSize:11,color:C.sub,marginBottom:6}}>{m.desc}</div>
            <Badge label={m.subject}/>
            {m.pdfName&&<PDFViewer pdfData={m.pdfData} pdfName={m.pdfName}/>}
          </Card>
        );})}
      </div>
      {mats.length===0&&<Card style={{textAlign:"center",padding:28,gridColumn:"1/-1"}}><div style={{color:C.sub,fontSize:13}}>No materials yet</div></Card>}
    </div>
  );
}

export function STFees({student}){
  const fees=lsG("fees").filter(f=>f.sid===student?.id);
  const total=fees.reduce((s,f)=>s+f.amount,0);
  const paid=fees.filter(f=>f.status==="paid").reduce((s,f)=>s+f.amount,0);
  return(
    <div>
      <Card className="fu" style={{marginBottom:16,background:`linear-gradient(135deg,#5B4FE8,#7B6FF5)`,border:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>Total Fees</div><div style={{fontSize:26,fontWeight:900,color:"#fff"}}>₹{total.toLocaleString()}</div></div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>Paid</div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>₹{paid.toLocaleString()}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:2}}>Pending: ₹{(total-paid).toLocaleString()}</div>
          </div>
        </div>
      </Card>
      <Sec title="Fee Records 💰"/>
      {fees.map((f,i)=><Card key={f.id} className={`fu d${i%3+1}`} style={{marginBottom:9}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{f.desc}</div><div style={{fontSize:11,color:C.sub}}>Due: {f.due}</div>{f.paidOn&&<div style={{fontSize:11,color:"#22C55E"}}>Paid: {f.paidOn}</div>}</div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:C.text,fontSize:15,marginBottom:3}}>₹{f.amount.toLocaleString()}</div><Badge label={f.status}/></div>
        </div>
      </Card>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STUDENT EXAM SCHEDULE VIEW
══════════════════════════════════════════════════════════════ */
export function STExamSchedule({student}){
  const [exams,setExams]=useState(lsG("examschedule"));
  useEffect(()=>{gdb("examschedule").then(d=>{if(Array.isArray(d))setExams(d);});},[]);

  const myExams=exams.filter(e=>(!e.cls||e.cls===student?.cls)&&(!e.sec||e.sec===student?.sec||e.sec==="A"));
  const today=new Date().toISOString().split("T")[0];
  const upcoming=myExams.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  const past=myExams.filter(e=>e.date<today).sort((a,b)=>b.date.localeCompare(a.date));
  const sC={"Mathematics":"#4361EE","Science":"#22C55E","English":"#F97316","Hindi":"#EC4899","Computer":"#0891B2","Physics":"#F59E0B","Chemistry":"#10B981","Biology":"#6366F1"};

  return(
    <div>
      <Sec title={"Upcoming Exams 📋 ("+(upcoming.length)+")"}/>
      {upcoming.length===0&&<Card style={{textAlign:"center",padding:28,marginBottom:14}}><div style={{fontSize:24,marginBottom:6}}>🎉</div><div style={{color:C.sub,fontSize:13}}>No upcoming exams</div></Card>}
      {upcoming.map((e,i)=>{
        const c=sC[e.subject]||C.accent;
        const dl=Math.ceil((new Date(e.date)-new Date())/(1000*60*60*24));
        return(
          <Card key={e.id} className={"fu d"+(i%3+1)+" card-lift"} style={{marginBottom:11,borderLeft:"4px solid "+c}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:44,height:44,borderRadius:13,background:c+"15",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:900,color:c}}>{new Date(e.date).getDate()}</div>
                <div style={{fontSize:9,color:c,fontWeight:700}}>{new Date(e.date).toLocaleDateString("en-IN",{month:"short"})}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{fontWeight:800,color:C.text,fontSize:14}}>{e.title}</div>
                  {dl<=3&&dl>=0&&<span style={{background:"#FEE2E2",color:C.red,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:16}}>{dl===0?"TODAY":dl+"d left"}</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Badge label={e.subject}/>
                  <span style={{fontSize:11,color:C.sub}}>🕐 {e.startTime}–{e.endTime}</span>
                  <span style={{fontSize:11,color:C.sub}}>📍 {e.venue}</span>
                  <span style={{fontSize:11,color:C.accent,fontWeight:700}}>Marks: {e.totalMarks}</span>
                </div>
                {e.syllabus&&<div style={{fontSize:11,color:C.sub,marginTop:4,fontStyle:"italic"}}>📖 {e.syllabus}</div>}
              </div>
            </div>
          </Card>
        );
      })}
      {past.length>0&&(
        <>
          <Sec title={"Past Exams ✅ ("+(past.length)+")"}/>
          {past.slice(0,5).map((e,i)=>(
            <Card key={e.id} style={{marginBottom:8,opacity:.75,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>{e.title}</div>
                <div style={{fontSize:11,color:C.sub}}>{e.subject} · {e.date}</div>
              </div>
              <span style={{fontSize:11,background:"#DCFCE7",color:"#16A34A",padding:"3px 10px",borderRadius:20,fontWeight:700}}>Done ✅</span>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}


export function STAnnouncements(){
  return(
    <div>
      <Sec title="Announcements 📢"/>
      {lsG("announcements").map((a,i)=><Card key={a.id} className={`fu d${i%3+1} card-lift`} style={{marginBottom:11,borderLeft:`4px solid ${C.accent}`}}>
        <div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:4}}>{a.title}</div>
        <div style={{fontSize:12,color:C.sub,lineHeight:1.5,marginBottom:7}}>{a.desc}</div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:C.sub}}>{a.date}</span>
          <span style={{fontSize:11,background:C.accent+"15",color:C.accent,padding:"2px 9px",borderRadius:20,fontWeight:700}}>{a.target.toUpperCase()}</span>
        </div>
      </Card>)}
    </div>
  );
}

export function StudentApp({user,onLogout}){
  const [showNotif,setShowNotif]=useState(false);
  const [showChat,setShowChat]=useState(false);
  const [showMsg,setShowMsg]=useState(false);
  const [tab,setTab]=useState("home");
  const student=lsG("students").find(s=>s.id===user.ref);
  const tabs=[{key:"home",icon:"🏠",label:"Home"},{key:"timetable",icon:"📅",label:"Schedule"},{key:"homework",icon:"📝",label:"HW"},{key:"exams",icon:"📋",label:"Exams"},{key:"attendance",icon:"✅",label:"Attend."},{key:"marks",icon:"📊",label:"Marks"},{key:"fees",icon:"💰",label:"Fees"}];
  const c=()=>{
    if(tab==="home")       return <STHome student={student}/>;
    if(tab==="timetable")  return <STTimetable student={student}/>;
    if(tab==="homework")   return <STHomework student={student}/>;
    if(tab==="attendance") return <STAttendance student={student}/>;
    if(tab==="materials")  return <STMaterials student={student}/>;
    if(tab==="fees")       return <STFees student={student}/>;
    if(tab==="marks")      return <STMarks student={student}/>;
    if(tab==="exams")      return <STExamSchedule student={student}/>;
  };
  return(
    <>
      <Shell header={<AppBar name={user.name} role="student" userId={user.id} onLogout={onLogout}
        onNotif={()=>setShowNotif(true)} onChat={()=>setShowChat(true)} onMsg={()=>setShowMsg(true)}/>}
        tabs={tabs} activeTab={tab} setTab={setTab}>{c()}</Shell>
      {showNotif&&<NotifPanel userId={user.id} onClose={()=>setShowNotif(false)}/>}
      {showChat&&<AIChatBot user={user} onClose={()=>setShowChat(false)}/>}
      {showMsg&&<MessagingPanel user={user} onClose={()=>setShowMsg(false)}/>}
    </>
  );
}
