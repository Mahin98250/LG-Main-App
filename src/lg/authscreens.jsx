  const handle=async()=>{
    if(!phone||!pass){setErr("Fill all fields.");return;}
    setLoading(true);setErr("");
    const {user,error}=await signIn(phone.trim(),pass,role);
    setLoading(false);
    if(user){onLogin(user);return;}
    setErr(error==="Invalid login credentials"
      ?(role==="student"
        ?"Invalid credentials. Use your Roll Number (SID) and password."
        :"Invalid credentials. Use your phone number and password.")
      :(error||"Could not sign in. Please try again."));
  };

import React,{useState,useEffect,useRef}from"react";
import {C,ROLES,DAYS,today,lsG,gdb,addR,updR,delR,uid} from "@/lg/data";
import {signIn,signUp} from "@/lg/auth";
import {LGLogo,LGIcon,GLOBAL_CSS,Bubbles,Inp,WBtn,GBtn,SBtn,Card,Badge,Sec,EyeBtn,BackBtn,BottomNav,AppBar,Shell,useRipple} from "@/lg/ui";

/* ═══════════════════════════════════════════════════════
   AUTH SCREENS
═══════════════════════════════════════════════════════ */
export function RoleSelect({onNext}){
  const [sel,setSel]=useState(null);
  const roleEmojis={teacher:"👨‍🏫",student:"🎓",parent:"👨‍👩‍👧"};
  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",
      background:C.bg,display:"flex",flexDirection:"column",
      alignItems:"center",position:"relative",overflow:"hidden",
      fontFamily:"'Poppins',sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <Bubbles/>
      <div style={{position:"relative",zIndex:1,width:"100%",padding:"0 22px 48px"}}>

        {/* ★ LOGO SECTION */}
        <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",
          paddingTop:72,paddingBottom:38}}>
          <div className="logo-float zi">
            <LGLogo size={90} showText={false} light/>
          </div>
          <div className="fu d1" style={{marginTop:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#fff",letterSpacing:1.5,textTransform:"uppercase"}}>
              LEARNER'S GUIDE
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.65)",marginTop:5,fontStyle:"italic"}}>
              Creating Values in Education
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>
              ✨ Mentored By Sapan Sir
            </div>
          </div>
        </div>

        <div className="fu d2" style={{textAlign:"center",fontSize:14,
          color:"rgba(255,255,255,0.5)",marginBottom:18}}>I am a...</div>

        {/* Role cards */}
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {ROLES.map((r,i)=>(
            <button key={r.key} onClick={()=>setSel(r.key)}
              className={`role-card fu d${i+3}`}
              style={{width:"100%",display:"flex",alignItems:"center",gap:15,
                padding:"17px 18px",borderRadius:22,
                border:sel===r.key?"2.5px solid rgba(255,255,255,.9)":"2.5px solid rgba(255,255,255,.1)",
                background:sel===r.key?"rgba(255,255,255,.18)":"rgba(255,255,255,.07)",
                boxShadow:sel===r.key?`0 8px 32px ${r.color}33`:"none",
                textAlign:"left",cursor:"pointer"}}>
              <div style={{width:54,height:54,borderRadius:17,background:r.grad,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:26,boxShadow:`0 6px 18px ${r.color}44`,flexShrink:0,
                transition:"transform .2s",
                transform:sel===r.key?"scale(1.1)":"scale(1)"}}>
                {roleEmojis[r.key]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{r.label}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{r.sub}</div>
              </div>
              {sel===r.key&&(
                <div className="tick-pop" style={{width:26,height:26,borderRadius:"50%",
                  background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                  color:r.color,fontWeight:900,fontSize:14,flexShrink:0}}>✓</div>
              )}
            </button>
          ))}
        </div>

        <div className="fu d6" style={{marginTop:26}}>
          <WBtn ch={<>Continue <span className="arrow-anim">→</span></>}
            onClick={()=>sel&&onNext(sel)} dis={!sel}/>
        </div>
        <div className="fu d6" style={{textAlign:"center",marginTop:22,
          fontSize:12,color:"rgba(255,255,255,.28)"}}>
          Admin login available separately
        </div>
      </div>
    </div>
  );
}

export function LoginScreen({role,onBack,onSwitch,onLogin}){
  const [phone,setPhone]=useState("");
  const [pass,setPass]=useState("");
  const [showP,setShowP]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const rc=ROLES.find(r=>r.key===role);
  const roleEmojis={teacher:"👨‍🏫",student:"🎓",parent:"👨‍👩‍👧"};

  const handle=async()=>{
    if(!phone||!pass){setErr("Fill all fields.");return;}
    setLoading(true);setErr("");
    try{
      const u=await loginUser(phone.trim(),pass,role);
      setLoading(false);
      if(u){
        onLogin({...u,role});
      } else {
        // Helpful role-specific error message
        const hint=role==="student"
          ?"Enter your Roll Number (SID) and password"
          :role==="teacher"
          ?"Enter your phone number and password"
          :"Enter your phone number and password (default: parent@1234)";
        setErr("Invalid credentials. Please check your login ID and password.");
      }
    }catch(e){
      setLoading(false);
      setErr("Connection error. Check internet and try again.");
    }
  };

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,
      fontFamily:"'Poppins',sans-serif",display:"flex",flexDirection:"column",
      position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <Bubbles/>
      <div style={{position:"absolute",top:18,left:18,zIndex:10}}>
        <BackBtn onClick={onBack}/>
      </div>
      <div style={{position:"relative",zIndex:1,flex:1,display:"flex",
        flexDirection:"column",justifyContent:"center",padding:"76px 22px 40px"}}>

        {/* ★ LOGO */}
        <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
          <div className="logo-float">
            <LGLogo size={70} showText={false} light/>
          </div>
          <div style={{marginTop:10,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:1.2}}>
            LEARNER'S GUIDE
          </div>
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:15,background:rc.grad,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,boxShadow:`0 8px 22px ${rc.color}44`}}>
              {roleEmojis[role]}
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>Welcome back!</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Login as {rc.label}</div>
            </div>
          </div>
        </div>

        <div className="fu d1" style={{background:"rgba(0,0,0,.22)",borderRadius:26,
          padding:"24px 20px",backdropFilter:"blur(20px)",
          border:"1.5px solid rgba(255,255,255,.1)"}}>
          <Inp label="Phone / Email" val={phone} set={setPhone}
            ph={role==="student"?"Roll Number / SID (e.g. LG001)":role==="teacher"?"Phone Number (e.g. 9001000001)":"Parent Phone (e.g. 9001000005)"} icon="📱"/>
          <Inp label="Password" type={showP?"text":"password"}
            val={pass} set={setPass} ph="Enter password" icon="🔒"
            right={<EyeBtn open={showP} onClick={()=>setShowP(s=>!s)}/>}/>
          {err&&<div className="fu" style={{background:"rgba(239,68,68,.18)",color:"#fca5a5",
            padding:"9px 13px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}
          <div style={{textAlign:"right",marginBottom:16}}>
            <span className="pressable" style={{fontSize:12,color:"rgba(255,255,255,.45)",
              textDecoration:"underline",padding:"3px 6px",borderRadius:6}}>
              Forgot Password?
            </span>
          </div>
          <WBtn ch={loading?<><span className="spinning">⟳</span> Signing in…</>:"Login →"}
            onClick={handle} dis={loading}/>
          {/* Demo hints */}
          <div style={{marginTop:14,background:"rgba(255,255,255,.07)",borderRadius:11,padding:"10px 13px"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.35)",fontWeight:700,marginBottom:5}}>
              DEMO (pass: 1234)
            </div>
            {lsG("users").filter(u=>u.role===role).map(u=>(
              <div key={u.id} className="demo-row"
                onClick={()=>{setPhone(u.phone);setPass("1234");}}
                style={{fontSize:12,color:"rgba(255,255,255,.55)",padding:"5px 7px",marginTop:2}}>
                📋 {u.name} · {u.phone}
              </div>
            ))}
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:20}}>
          <span style={{fontSize:13,color:"rgba(255,255,255,.45)"}}>New here? </span>
          <span className="pressable" onClick={onSwitch}
            style={{fontSize:13,fontWeight:700,color:C.gold,padding:"3px 6px",borderRadius:6}}>
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
}

export function SignupScreen({role,onBack,onSwitch,onLogin}){
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [pass,setPass]=useState("");
  const [conf,setConf]=useState("");
  const [showP,setShowP]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const rc=ROLES.find(r=>r.key===role);
  const roleEmojis={teacher:"👨‍🏫",student:"🎓",parent:"👨‍👩‍👧"};

  const handle=async()=>{
    if(!name.trim()||!phone.trim()||!pass){setErr("Fill all required fields.");return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");return;}
    if(pass!==conf){setErr("Passwords don't match.");return;}
    setLoading(true);setErr("");
    const {user,needsConfirm,error}=await signUp({name:name.trim(),phone:phone.trim(),password:pass,role});
    setLoading(false);
    if(error){setErr(error);return;}
    if(needsConfirm){setErr("Account created. Check your email to confirm, then log in.");return;}
    if(user)onLogin(user);
  };

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,
      fontFamily:"'Poppins',sans-serif",display:"flex",flexDirection:"column",
      position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <Bubbles/>
      <div style={{position:"absolute",top:18,left:18,zIndex:10}}>
        <BackBtn onClick={onBack}/>
      </div>
      <div style={{position:"relative",zIndex:1,flex:1,display:"flex",
        flexDirection:"column",justifyContent:"center",
        padding:"76px 22px 40px",overflowY:"auto"}}>

        {/* ★ LOGO */}
        <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
          <div className="logo-float" style={{transform:"scale(0.85)"}}>
            <LGLogo size={65} showText={false} light/>
          </div>
          <div style={{marginTop:8,fontSize:19,fontWeight:900,color:"#fff",letterSpacing:1.2}}>
            LEARNER'S GUIDE
          </div>
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:46,height:46,borderRadius:14,background:rc.grad,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
              {roleEmojis[role]}
            </div>
            <div>
              <div style={{fontSize:19,fontWeight:800,color:"#fff"}}>Create Account</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Register as {rc.label}</div>
            </div>
          </div>
        </div>

        <div className="fu d1" style={{background:"rgba(0,0,0,.22)",borderRadius:26,
          padding:"24px 20px",backdropFilter:"blur(20px)",
          border:"1.5px solid rgba(255,255,255,.1)"}}>
          <Inp label="Full Name *" val={name} set={setName} ph="Your full name" icon="👤"/>
          <Inp label="Phone Number *" type="tel" val={phone} set={setPhone}
            ph="+91 00000 00000" icon="📱"/>
          <Inp label="Password *" type={showP?"text":"password"}
            val={pass} set={setPass} ph="Min 6 characters" icon="🔒"
            right={<EyeBtn open={showP} onClick={()=>setShowP(s=>!s)}/>}/>
          <Inp label="Confirm Password *" type="password"
            val={conf} set={setConf} ph="Re-enter password" icon="🔑"/>
          {err&&<div className="fu" style={{background:"rgba(239,68,68,.18)",color:"#fca5a5",
            padding:"9px 13px",borderRadius:10,fontSize:13,marginBottom:12}}>{err}</div>}
          <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:16,lineHeight:1.6}}>
            By signing up, you agree to our{" "}
            <span className="pressable" style={{color:C.gold,padding:"2px 4px",borderRadius:4}}>Terms</span> &{" "}
            <span className="pressable" style={{color:C.gold,padding:"2px 4px",borderRadius:4}}>Privacy Policy</span>
          </div>
          <WBtn ch={loading?<><span className="spinning">⟳</span> Creating…</>:"Create Account 🎉"}
            onClick={handle} dis={loading}/>
        </div>
        <div style={{textAlign:"center",marginTop:18}}>
          <span style={{fontSize:13,color:"rgba(255,255,255,.45)"}}>Already have an account? </span>
          <span className="pressable" onClick={onSwitch}
            style={{fontSize:13,fontWeight:700,color:C.gold,padding:"3px 6px",borderRadius:6}}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
}

