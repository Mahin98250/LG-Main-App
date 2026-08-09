import React,{useState,useEffect,useRef}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";

/* ═══════════════════════════════════════════════════════
   PDF UPLOAD + VIEWER HELPERS
═══════════════════════════════════════════════════════ */
export function PDFUpload({onFile, label="Attach PDF (optional)"}){
  const ref=useRef(null);
  const [fileName,setFileName]=useState("");
  const handle=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    /* no size limit */
    const reader=new FileReader();
    reader.onload=()=>{setFileName(file.name);onFile(file.name,reader.result);};
    reader.readAsDataURL(file);
  };
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>{label}</div>
      <div onClick={()=>ref.current&&ref.current.click()} className="pressable"
        style={{padding:"11px 14px",borderRadius:11,
          border:"2px dashed "+(fileName?"#22C55E":C.border),
          background:fileName?"#F0FDF4":C.light,cursor:"pointer",
          display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{fileName?"📄":"📎"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:fileName?"#22C55E":C.text}}>
            {fileName||"Click to upload PDF"}
          </div>
          {!fileName&&<div style={{fontSize:11,color:C.sub,marginTop:2}}>PDF only (any size)</div>}
          {fileName&&<div style={{fontSize:11,color:"#22C55E",marginTop:2}}>✓ Attached</div>}
        </div>
        {fileName&&<span className="pressable"
          onClick={e=>{e.stopPropagation();setFileName("");onFile(null,null);}}
          style={{fontSize:18,color:C.red,padding:4}}>✕</span>}
      </div>
      <input ref={ref} type="file" accept=".pdf,application/pdf" onChange={handle} style={{display:"none"}}/>
    </div>
  );
}

export function PDFViewer({pdfData,pdfName}){
  if(!pdfData)return null;
  return(
    <a href={pdfData} download={pdfName} className="pressable"
      style={{display:"inline-flex",alignItems:"center",gap:7,marginTop:8,
        background:"linear-gradient(135deg,#EF4444,#F97316)",
        color:"#fff",padding:"7px 14px",borderRadius:10,fontSize:12,fontWeight:700,
        textDecoration:"none",boxShadow:"0 4px 12px rgba(239,68,68,.3)"}}>
      📄 Download {pdfName||"PDF"}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════════ */
export function NotifPanel({userId,onClose}){
  const [notifs,setNotifs]=useState(()=>lsG("notifications").filter(n=>n.uid===userId));
  const unread=notifs.filter(n=>!n.read).length;
  const refresh=()=>setNotifs(lsG("notifications").filter(n=>n.uid===userId));
  const markOne=async(id)=>{try{await updR("notifications",id,{read:true});await refresh();}catch(e){console.error("markOne",e);}};
  const markAll=async()=>{try{for(const n of notifs)await updR("notifications",n.id,{read:true});await refresh();}catch(e){console.error("markAll",e);}};
  const TC={attendance:"#22C55E",homework:"#F5A623",fee:"#EF4444",message:"#5B4FE8",marks:"#8B5CF6"};
  const TI={attendance:"✅",homework:"📝",fee:"💰",message:"💬",marks:"📊"};
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",justifyContent:"flex-end"}} onClick={onClose}>
      <div className="notif-panel" onClick={e=>e.stopPropagation()}
        style={{width:310,background:"#fff",height:"100vh",overflowY:"auto",
          boxShadow:"-8px 0 40px rgba(27,16,96,.18)",fontFamily:"'Poppins',sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#5B4FE8,#7B6FF5)",padding:"52px 20px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>🔔 Notifications</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,width:32,height:32,color:"#fff",fontSize:15,cursor:"pointer"}}>✕</button>
          </div>
          {unread>0&&<div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:5}}>
            {unread} unread ·{" "}
            <span onClick={markAll} style={{cursor:"pointer",textDecoration:"underline",fontWeight:700}}>Mark all read</span>
          </div>}
        </div>
        <div style={{padding:"12px 14px"}}>
          {notifs.length===0&&<div style={{textAlign:"center",padding:40,color:C.sub,fontSize:13}}>All caught up! 🎉</div>}
          {notifs.map(n=>(
            <div key={n.id} onClick={()=>markOne(n.id)} className="card-lift"
              style={{padding:14,borderRadius:14,marginBottom:10,cursor:"pointer",
                background:n.read?"#fff":"#F0F4FF",
                border:"1px solid "+(n.read?"#EEF2FF":(TC[n.type]||C.accent)+"33"),
                borderLeft:"4px solid "+(TC[n.type]||C.accent)}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:36,height:36,borderRadius:11,
                  background:(TC[n.type]||C.accent)+"18",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>
                  {TI[n.type]||"📌"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>
                    {n.title}
                    {!n.read&&<span style={{display:"inline-block",width:7,height:7,
                      borderRadius:"50%",background:C.accent,marginLeft:7,verticalAlign:"middle"}}/>}
                  </div>
                  <div style={{fontSize:12,color:C.sub,lineHeight:1.4}}>{n.desc}</div>
                  <div style={{fontSize:10,color:C.sub,marginTop:4}}>{n.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MESSAGING
═══════════════════════════════════════════════════════ */
export function MessagingPanel({user,onClose}){
  const [allMsgs,setAllMsgs]=useState(()=>lsG("messages").filter(m=>m.from===user.ref||m.to===user.ref));
  const [newMsg,setNewMsg]=useState("");
  const [to,setTo]=useState("");
  const endRef=useRef(null);
  const contacts=user.role==="teacher"
    ?lsG("students").map(s=>({id:s.id,name:s.name,role:"student"}))
    :lsG("teachers").map(t=>({id:t.id,name:t.name,role:"teacher"}));
  const thread=to?allMsgs.filter(m=>(m.from===user.ref&&m.to===to)||(m.from===to&&m.to===user.ref)):[];
  useEffect(()=>{endRef.current&&endRef.current.scrollIntoView({behavior:"smooth"});},[thread]);
  const send= async()=>{
    if(!newMsg.trim()||!to)return;
    const rec=[...lsG("students"),...lsG("teachers")].find(x=>x.id===to);
    await addR("messages",{from:user.ref,to,fromName:user.name,toName:rec?.name||"",
      text:newMsg.trim(),time:new Date().toLocaleString("en-IN"),read:false});
    setAllMsgs(lsG("messages").filter(m=>m.from===user.ref||m.to===user.ref));
    setNewMsg("");
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:550,background:"rgba(0,0,0,.5)",
      display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'Poppins',sans-serif"}}>
      <div className="modal-sheet" style={{width:"100%",maxWidth:430,height:"88vh",
        background:"#fff",borderRadius:"22px 22px 0 0",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#22C55E,#16A34A)",padding:20,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>💬 Messages</div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,width:34,height:34,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <select value={to} onChange={e=>setTo(e.target.value)}
            style={{width:"100%",padding:"10px 13px",borderRadius:11,border:"none",
              background:"rgba(255,255,255,.2)",color:"#fff",fontSize:13,outline:"none",
              fontFamily:"'Poppins',sans-serif"}}>
            <option value="">── Select contact ──</option>
            {contacts.map(c=><option key={c.id} value={c.id} style={{color:"#000"}}>{c.name} ({c.role})</option>)}
          </select>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
          {!to&&<div style={{textAlign:"center",padding:40,color:C.sub,fontSize:13}}>👆 Select a contact to start messaging</div>}
          {thread.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from===user.ref?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"75%",padding:"10px 14px",
                borderRadius:m.from===user.ref?"18px 18px 4px 18px":"18px 18px 18px 4px",
                background:m.from===user.ref?"linear-gradient(135deg,#22C55E,#16A34A)":"#F0F4FF",
                color:m.from===user.ref?"#fff":C.text,fontSize:13,lineHeight:1.5,
                boxShadow:m.from===user.ref?"0 4px 12px rgba(34,197,94,.25)":"0 2px 8px rgba(27,16,96,.06)"}}>
                {m.text}
                <div style={{fontSize:10,marginTop:4,opacity:.65}}>{m.time}</div>
              </div>
            </div>
          ))}
          {to&&thread.length===0&&<div style={{textAlign:"center",padding:30,color:C.sub,fontSize:13}}>Start the conversation 👋</div>}
          <div ref={endRef}/>
        </div>
        {to&&(
          <div style={{padding:"12px 14px 22px",borderTop:"1px solid #EEF2FF",display:"flex",gap:10,flexShrink:0}}>
            <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();send();}}}
              placeholder="Type a message..."
              style={{flex:1,padding:"12px 16px",borderRadius:14,border:"1.5px solid "+C.border,
                background:C.light,color:C.text,fontSize:14,outline:"none",fontFamily:"'Poppins',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#22C55E"}
              onBlur={e=>e.target.style.borderColor=C.border}/>
            <button onClick={send}
              style={{width:46,height:46,borderRadius:14,border:"none",flexShrink:0,
                background:"linear-gradient(135deg,#22C55E,#16A34A)",
                color:"#fff",fontSize:20,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANALYTICS BAR CHART
═══════════════════════════════════════════════════════ */
export function BarChart({data,maxVal,color,label}){
  const max=maxVal||Math.max(...data.map(d=>d.v),1);
  return(
    <div>
      {label&&<div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:10}}>{label}</div>}
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,fontWeight:700,color}}>{d.v}{d.unit||""}</div>
            <div style={{width:"100%",background:"#F0F4FF",borderRadius:"5px 5px 0 0",height:64,display:"flex",alignItems:"flex-end"}}>
              <div style={{width:"100%",
                background:"linear-gradient(180deg,"+color+","+color+"77)",
                borderRadius:"5px 5px 0 0",
                height:Math.max(4,(d.v/max)*100)+"%",
                transition:"height .7s cubic-bezier(.34,1.2,.64,1)",
                transitionDelay:(i*0.07)+"s"}}/>
            </div>
            <div style={{fontSize:9,color:C.sub,textAlign:"center",maxWidth:"100%",overflow:"hidden"}}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
