import React,{useState,useEffect,useRef}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";
import {PDFViewer,NotifPanel,MessagingPanel} from "@/lg/panels";
import {PTMarks} from "@/lg/marks";

/* ═══════════════════════════════════════════════════════
   PARENT APP
═══════════════════════════════════════════════════════ */
export function PTHome({child,user}){
  const att=lsG("attendance").filter(a=>a.sid===child?.id);
  const rate=att.length?Math.round((att.filter(a=>a.status==="present").length/att.length)*100):0;
  const hw=child?lsG("homework").filter(h=>h.cls===child.cls&&h.sec===child.sec):[];
  const fees=lsG("fees").filter(f=>f.sid===child?.id&&f.status!=="paid");
  const ann=lsG("announcements").filter(a=>a.target==="all").slice(0,2);
  return(
    <div>
      <Card className="fu" style={{marginBottom:16,background:"linear-gradient(135deg,#22C55E,#16A34A)",border:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:13}}>
          <div style={{width:56,height:56,borderRadius:18,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>👦</div>
          <div>
            <div style={{fontSize:19,fontWeight:900,color:"#fff"}}>{child?.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Class {child?.cls}-{child?.sec} · {child?.sid}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:13}}>
          {[[`${rate}%`,"Attendance"],[hw.length,"HW Pending"],[fees.length,"Fee Dues"]].map(([v,l],i)=>(
            <div key={l} style={{flex:1,background:i===2&&fees.length?"rgba(239,68,68,.28)":"rgba(255,255,255,.15)",borderRadius:11,padding:"9px",textAlign:"center"}}>
              <div style={{fontSize:19,fontWeight:900,color:"#fff"}}>{v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.65)"}}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
      <Sec title="Recent Attendance 📋"/>
      {att.slice(-4).reverse().map((a,i)=><Card key={a.id} className={`fu d${i+1}`} style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,color:C.text,fontSize:13}}>{a.date}</div><Badge label={a.status}/>
      </Card>)}
      <Sec title="Announcements 📢"/>
      {ann.map((a,i)=><Card key={a.id} className={`fu d${i+1}`} style={{marginBottom:9,borderLeft:"4px solid #22C55E"}}>
        <div style={{fontWeight:700,color:C.text,fontSize:13,marginBottom:2}}>{a.title}</div>
        <div style={{fontSize:12,color:C.sub}}>{a.desc}</div>
      </Card>)}
    </div>
  );
}

export function PTAttendance({child}){
  const att=lsG("attendance").filter(a=>a.sid===child?.id);
  const rate=att.length?Math.round((att.filter(a=>a.status==="present").length/att.length)*100):0;
  const rc=rate>=85?"#22C55E":rate>=70?"#F59E0B":"#EF4444";
  return(
    <div>
      <Card className="fu" style={{textAlign:"center",marginBottom:16,padding:26}}>
        <div style={{fontSize:13,color:C.sub,marginBottom:6}}>Overall Attendance</div>
        <div style={{fontSize:50,fontWeight:900,color:rc}}>{rate}%</div>
        <div style={{fontSize:12,color:C.sub,marginTop:3}}>{att.filter(a=>a.status==="present").length} present of {att.length} days</div>
        {rate<85&&<div className="tick-pop" style={{marginTop:10,background:"#FEE2E2",borderRadius:9,padding:"8px 12px",fontSize:12,color:"#EF4444",fontWeight:600}}>⚠️ Below 85% — please take note!</div>}
      </Card>
      <Sec title="Attendance Log"/>
      {[...att].reverse().map((a,i)=><Card key={a.id} className={`fu d${i%4+1}`} style={{marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:600,color:C.text,fontSize:13}}>{a.date}</div><Badge label={a.status}/>
      </Card>)}
    </div>
  );
}

export function PTFees({child}){
  const fees=lsG("fees").filter(f=>f.sid===child?.id);
  const total=fees.reduce((s,f)=>s+f.amount,0);
  const paid=fees.filter(f=>f.status==="paid").reduce((s,f)=>s+f.amount,0);
  return(
    <div>
      <Card className="fu" style={{marginBottom:16,background:"linear-gradient(135deg,#22C55E,#16A34A)",border:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>Total</div><div style={{fontSize:26,fontWeight:900,color:"#fff"}}>₹{total.toLocaleString()}</div></div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>Paid</div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>₹{paid.toLocaleString()}</div>
            {total-paid>0&&<div style={{fontSize:11,color:"rgba(255,100,100,.9)",fontWeight:700,marginTop:2}}>⚠️ Due: ₹{(total-paid).toLocaleString()}</div>}
          </div>
        </div>
      </Card>
      <Sec title="Fee Details 💰"/>
      {fees.map((f,i)=><Card key={f.id} className={`fu d${i%3+1}`} style={{marginBottom:9}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{f.desc}</div><div style={{fontSize:11,color:C.sub}}>Due: {f.due}</div>{f.paidOn&&<div style={{fontSize:11,color:"#22C55E"}}>Paid: {f.paidOn}</div>}</div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:C.text,fontSize:15,marginBottom:3}}>₹{f.amount.toLocaleString()}</div><Badge label={f.status}/></div>
        </div>
      </Card>)}
    </div>
  );
}

export function ParentApp({user,onLogout}){
  const [showNotif,setShowNotif]=useState(false);
  const [showMsg,setShowMsg]=useState(false);
  const [tab,setTab]=useState("home");
  const child=lsG("students").find(s=>s.id===user.ref);
  const tabs=[{key:"home",icon:"🏠",label:"Home"},{key:"attendance",icon:"✅",label:"Attend."},{key:"homework",icon:"📝",label:"HW"},{key:"marks",icon:"📊",label:"Marks"},{key:"fees",icon:"💰",label:"Fees"},{key:"news",icon:"📢",label:"News"}];
  const c=()=>{
    if(tab==="home")       return <PTHome child={child} user={user}/>;
    if(tab==="attendance") return <PTAttendance child={child}/>;
    if(tab==="homework")   return <div><Sec title={`${child?.name}'s Homework 📝`}/>{(child?lsG("homework").filter(h=>h.cls===child.cls&&h.sec===child.sec):[]).map((h,i)=><Card key={h.id} className={`fu d${i%3+1}`} style={{marginBottom:11,borderLeft:`4px solid ${C.gold}`}}><Badge label={h.subject}/><div style={{fontWeight:700,color:C.text,fontSize:13,margin:"7px 0 3px"}}>{h.desc}</div><div style={{fontSize:11,color:C.sub}}>Due: <strong style={{color:"#EF4444"}}>{h.due}</strong></div>{h.pdfName&&<PDFViewer pdfData={h.pdfData} pdfName={h.pdfName}/>}</Card>)}</div>;
    if(tab==="fees")       return <PTFees child={child}/>;
    if(tab==="marks")      return <PTMarks child={child}/>;
    if(tab==="news")       return <STAnnouncements/>;
  };
  return(
    <>
      <Shell header={<AppBar name={user.name} role="parent" userId={user.id} onLogout={onLogout}
        onNotif={()=>setShowNotif(true)} onMsg={()=>setShowMsg(true)}/>}
        tabs={tabs} activeTab={tab} setTab={setTab}>{c()}</Shell>
      {showNotif&&<NotifPanel userId={user.id} onClose={()=>setShowNotif(false)}/>}
      {showMsg&&<MessagingPanel user={user} onClose={()=>setShowMsg(false)}/>}
    </>
  );
}
