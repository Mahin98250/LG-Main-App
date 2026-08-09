import React,{useState,useEffect,useRef,useCallback,useMemo,useLayoutEffect}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";
import {PDFViewer,BarChart} from "@/lg/panels";

/* ═══════════════════════════════════════════════════════
   MARKS – TEACHER ENTER MARKS
═══════════════════════════════════════════════════════ */
export function THMarks({teacher}){
  const students=lsG("students");
  const [marks,setMarks]=useState(()=>lsG("marks").filter(m=>teacher&&m.tid===teacher.id));
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({sid:"",subject:teacher?.subject||"",exam:"Unit Test 1",marks:"",total:"100",date:new Date().toISOString().split("T")[0]});
  const refresh=()=>setMarks(lsG("marks").filter(m=>teacher&&m.tid===teacher.id));

  const save= async()=>{
    if(!form.sid||!form.marks)return;
    await addR("marks",{...form,marks:Number(form.marks),total:Number(form.total),tid:teacher?.id});
    const u=lsG("users").find(u=>u.ref===form.sid);
    if(u)addR("notifications",{title:"New marks added 📊",
      desc:form.subject+" ("+form.exam+"): "+form.marks+"/"+form.total,
      time:form.date,type:"marks",read:false,uid:u.id});
    refresh();setModal(false);
    setForm({sid:"",subject:teacher?.subject||"",exam:"Unit Test 1",marks:"",total:"100",date:new Date().toISOString().split("T")[0]});
  };

  const byStudent=students.map(s=>{
    const sm=marks.filter(m=>m.sid===s.id);
    const avg=sm.length?Math.round(sm.reduce((a,m)=>a+(m.marks/m.total*100),0)/sm.length):null;
    return {...s,sm,avg};
  }).filter(s=>s.sm.length>0);

  const gradeColor=(p)=>p>=80?"#22C55E":p>=60?"#F5A623":"#EF4444";
  const gradeLabel=(p)=>p>=90?"A+":p>=80?"A":p>=70?"B+":p>=60?"B":p>=50?"C":"D";

  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <SBtn ch="+ Add Marks" onClick={()=>setModal(true)} color="linear-gradient(135deg,#8B5CF6,#6D28D9)"/>
      </div>
      <Sec title={"Marks & Grades 📊"}/>

      {/* Analytics chart */}
      {byStudent.length>0&&(
        <Card style={{marginBottom:16}}>
          <BarChart
            data={byStudent.map(s=>({label:s.name.split(" ")[0],v:s.avg}))}
            maxVal={100} color="#8B5CF6" label="Average Score by Student (%)"/>
        </Card>
      )}

      {byStudent.map((s,si)=>{
        const gc=gradeColor(s.avg);
        const gl=gradeLabel(s.avg);
        return(
          <Card key={s.id} className={"fu d"+(si%3+1)} style={{marginBottom:11}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontWeight:800,color:C.text,fontSize:14}}>{s.name}</div>
                <div style={{fontSize:11,color:C.sub}}>Cl.{s.cls}-{s.sec} · {s.sm.length} exam(s)</div>
              </div>
              <div style={{width:52,height:52,borderRadius:16,background:gc+"15",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:gc}}>{gl}</div>
                <div style={{fontSize:10,color:gc,fontWeight:700}}>{s.avg}%</div>
              </div>
            </div>
            {s.sm.map((m,i)=>{
              const pct=Math.round(m.marks/m.total*100);
              return(
                <div key={m.id} style={{display:"flex",justifyContent:"space-between",
                  padding:"7px 0",borderTop:"1px solid #EEF2FF",fontSize:12,alignItems:"center"}}>
                  <div>
                    <span style={{fontWeight:600,color:C.text}}>{m.exam}</span>
                    <span style={{color:C.sub,marginLeft:6}}>· {m.subject}</span>
                  </div>
                  <span style={{fontWeight:700,color:gradeColor(pct)}}>{m.marks}/{m.total} <span style={{fontWeight:400,color:C.sub}}>({pct}%)</span></span>
                </div>
              );
            })}
          </Card>
        );
      })}
      {marks.length===0&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>📊</div><div style={{color:C.sub,fontSize:13}}>No marks entered yet</div></Card>}

      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:200,
          display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'Poppins',sans-serif"}}>
          <div className="modal-sheet" style={{background:"#fff",borderRadius:"22px 22px 0 0",
            padding:"26px 22px 38px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <div style={{fontSize:17,fontWeight:800,color:C.text}}>Add Marks 📊</div>
              <button onClick={()=>setModal(false)} className="pressable"
                style={{background:C.light,border:"none",borderRadius:9,padding:"5px 11px",fontSize:17,cursor:"pointer"}}>✕</button>
            </div>
            {/* Student */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Student</div>
              <select value={form.sid} onChange={e=>setForm({...form,sid:e.target.value})}
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}>
                <option value="">Select student…</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {/* Subject */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Subject</div>
              <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Subject"
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
            </div>
            {/* Exam */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Exam</div>
              <select value={form.exam} onChange={e=>setForm({...form,exam:e.target.value})}
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}>
                {["Unit Test 1","Unit Test 2","Mid Term","Final Exam","Class Test","Project"].map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Marks Obtained</div>
                <input type="number" value={form.marks} onChange={e=>setForm({...form,marks:e.target.value})} placeholder="e.g. 85"
                  style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Total Marks</div>
                <input type="number" value={form.total} onChange={e=>setForm({...form,total:e.target.value})} placeholder="e.g. 100"
                  style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:13,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.sub,marginBottom:5}}>Date</div>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1.5px solid "+C.border,background:C.light,color:C.text,fontSize:14,outline:"none",fontFamily:"'Poppins',sans-serif"}}/>
            </div>
            <GBtn ch="Save Marks ✓" onClick={save} color="linear-gradient(135deg,#8B5CF6,#6D28D9)"/>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEACHER ANALYTICS DASHBOARD
═══════════════════════════════════════════════════════ */
export function THAnalytics({teacher}){
  const students=lsG("students");
  const att=lsG("attendance");
  const marks=lsG("marks").filter(m=>teacher&&m.tid===teacher.id);
  const hw=lsG("homework").filter(h=>teacher&&h.tid===teacher.id);

  const attByStudent=students.map(s=>{
    const sa=att.filter(a=>a.sid===s.id);
    return {label:s.name.split(" ")[0],v:sa.length?Math.round(sa.filter(a=>a.status==="present").length/sa.length*100):0};
  });

  const marksByExam={};
  marks.forEach(m=>{if(!marksByExam[m.exam])marksByExam[m.exam]=[];marksByExam[m.exam].push(m.marks/m.total*100);});
  const examAvgs=Object.entries(marksByExam).map(([e,vs])=>({
    label:e.length>8?e.slice(0,7)+"…":e,
    v:Math.round(vs.reduce((a,b)=>a+b,0)/vs.length)
  }));

  const lowAtt=attByStudent.filter(s=>s.v<75);
  const avgAtt=attByStudent.length?Math.round(attByStudent.reduce((a,b)=>a+b.v,0)/attByStudent.length):0;

  return(
    <div>
      <Sec title="Analytics Dashboard 📈"/>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        {[["🎓","Students",students.length,"#5B4FE8"],["✅","Avg Attendance",avgAtt+"%","#22C55E"],["📊","Marks Entries",marks.length,"#8B5CF6"],["📝","HW Assigned",hw.length,"#F5A623"]].map(([ic,l,v,c])=>(
          <Card key={l} className="fu card-lift" style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:24,marginBottom:6}}>{ic}</div>
            <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
            <div style={{fontSize:11,color:C.sub}}>{l}</div>
          </Card>
        ))}
      </div>
      {/* Attendance chart */}
      <Card style={{marginBottom:14}}>
        <BarChart data={attByStudent} maxVal={100} color={C.accent} label="Attendance Rate by Student (%)"/>
      </Card>
      {/* Exam performance chart */}
      {examAvgs.length>0&&(
        <Card style={{marginBottom:14}}>
          <BarChart data={examAvgs} maxVal={100} color="#8B5CF6" label="Average Score by Exam (%)"/>
        </Card>
      )}
      {/* Low attendance alert */}
      {lowAtt.length>0&&(
        <Card style={{borderLeft:"4px solid #EF4444",background:"#FFF5F5",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:"#EF4444",marginBottom:8}}>⚠️ Low Attendance Students</div>
          {lowAtt.map((s,i)=>(
            <div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderTop:i>0?"1px solid #FEE2E2":"none"}}>
              {s.label} — <strong style={{color:"#EF4444"}}>{s.v}%</strong> attendance
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STUDENT MARKS VIEW
═══════════════════════════════════════════════════════ */
export function STMarks({student}){
  const marks=lsG("marks").filter(m=>student&&m.sid===student.id);
  const avg=marks.length?Math.round(marks.reduce((a,m)=>a+(m.marks/m.total*100),0)/marks.length):null;
  const gc=avg!=null?(avg>=80?"#22C55E":avg>=60?"#F5A623":"#EF4444"):C.sub;
  const gl=avg!=null?(avg>=90?"A+":avg>=80?"A":avg>=70?"B+":avg>=60?"B":avg>=50?"C":"D"):null;

  const bySub={};
  marks.forEach(m=>{if(!bySub[m.subject])bySub[m.subject]=[];bySub[m.subject].push(m);});
  const subData=Object.entries(bySub).map(([sub,ms])=>{
    const a=Math.round(ms.reduce((s,m)=>s+m.marks/m.total*100,0)/ms.length);
    return {label:sub.length>6?sub.slice(0,5)+"…":sub,v:a};
  });

  return(
    <div>
      {avg!==null&&(
        <Card className="fu" style={{textAlign:"center",marginBottom:16,padding:"22px 18px"}}>
          <div style={{fontSize:13,color:C.sub,marginBottom:8}}>Overall Performance</div>
          <div style={{width:90,height:90,borderRadius:"50%",border:"6px solid "+gc,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            margin:"0 auto 12px"}}>
            <div style={{fontSize:22,fontWeight:900,color:gc}}>{gl}</div>
            <div style={{fontSize:11,color:gc,fontWeight:700}}>{avg}%</div>
          </div>
          <div style={{fontSize:12,color:C.sub}}>{marks.length} exam(s) recorded</div>
        </Card>
      )}
      {subData.length>0&&(
        <Card style={{marginBottom:14}}>
          <BarChart data={subData} maxVal={100} color="#8B5CF6" label="Score by Subject (%)"/>
        </Card>
      )}
      <Sec title="Exam Results 📋"/>
      {marks.length===0
        ?<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>📊</div><div style={{color:C.sub,fontSize:13}}>No marks yet</div></Card>
        :marks.map((m,i)=>{
          const pct=Math.round(m.marks/m.total*100);
          const c=pct>=80?"#22C55E":pct>=60?"#F5A623":"#EF4444";
          return(
            <Card key={m.id} className={"fu d"+(i%3+1)} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,color:C.text,fontSize:13}}>{m.exam}</div>
                  <div style={{fontSize:11,color:C.sub}}>{m.subject} · {m.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:900,color:c}}>{m.marks}/{m.total}</div>
                  <div style={{fontSize:11,fontWeight:700,color:c}}>{pct}%</div>
                </div>
              </div>
              <div style={{height:6,background:"#F0F4FF",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+c+","+c+"88)",borderRadius:3,transition:"width .6s ease"}}/>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PARENT MARKS VIEW
═══════════════════════════════════════════════════════ */
export function PTMarks({child}){
  const marks=lsG("marks").filter(m=>child&&m.sid===child.id);
  const avg=marks.length?Math.round(marks.reduce((a,m)=>a+(m.marks/m.total*100),0)/marks.length):null;
  const gc=avg!=null?(avg>=80?"#22C55E":avg>=60?"#F5A623":"#EF4444"):C.sub;
  const gl=avg!=null?(avg>=90?"A+":avg>=80?"A":avg>=70?"B+":avg>=60?"B":avg>=50?"C":"D"):null;
  return(
    <div>
      {avg!==null&&(
        <Card className="fu" style={{textAlign:"center",marginBottom:16,padding:"22px 18px",background:"linear-gradient(135deg,#5B4FE8,#7B6FF5)",border:"none"}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:8}}>{child?.name}'s Performance</div>
          <div style={{display:"flex",justifyContent:"center",gap:22}}>
            <div><div style={{fontSize:42,fontWeight:900,color:"#fff"}}>{gl}</div><div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>Grade</div></div>
            <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
            <div><div style={{fontSize:42,fontWeight:900,color:"#fff"}}>{avg}%</div><div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>Average</div></div>
          </div>
        </Card>
      )}
      <Sec title="Exam Results 📊"/>
      {marks.length===0?<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:28,marginBottom:6}}>📊</div><div style={{color:C.sub,fontSize:13}}>No marks recorded yet</div></Card>
        :marks.map((m,i)=>{
          const pct=Math.round(m.marks/m.total*100);
          const c=pct>=80?"#22C55E":pct>=60?"#F5A623":"#EF4444";
          return(
            <Card key={m.id} className={"fu d"+(i%3+1)} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{m.exam}</div><div style={{fontSize:11,color:C.sub}}>{m.subject} · {m.date}</div></div>
                <div style={{fontWeight:900,fontSize:18,color:c}}>{m.marks}/{m.total} <span style={{fontSize:12,fontWeight:400}}>({pct}%)</span></div>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}
