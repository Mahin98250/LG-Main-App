import React, { useEffect, useState } from "react";
import { C } from "@/lg/data";
import { supabase } from "@/lg/supabase";
import { GLOBAL_CSS, LGLogo, Bubbles, BackBtn, WBtn, Inp } from "@/lg/ui";

const baseUrl = () => `${window.location.origin}${import.meta.env.BASE_URL || "/"}`;

export function PasswordRecovery({ role = "student", onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) setMode("update");
    };
    void check();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setMode("update");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const request = async () => {
    const clean = email.trim().toLowerCase();
    setError(""); setMessage("");
    if (!clean || !clean.includes("@")) {
      setError("Enter the email address registered with your institute account. Phone/SID accounts must first have a recovery email configured by the administrator.");
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${baseUrl()}reset-password` });
      if (e) throw e;
      setMessage("If that email is registered, a password-reset link has been sent. Check your inbox and spam folder.");
    } catch (e) {
      setError("We could not start password recovery. Please verify the email address or contact the institute administrator.");
    } finally { setLoading(false); }
  };

  const update = async () => {
    setError(""); setMessage("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Recovery session expired. Request a new reset link.");
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e) throw e;
      await supabase.auth.signOut();
      setPassword(""); setConfirm(""); setMode("request");
      setMessage("Password changed successfully. You can now sign in with your new password.");
    } catch (e) {
      setError(e?.message || "Could not update your password. Request a new reset link and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Poppins',sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style><Bubbles />
      <div style={{ position: "absolute", top: 18, left: 18, zIndex: 10 }}><BackBtn onClick={onBack} /></div>
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "76px 22px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}><LGLogo size={70} showText={false} light /><div style={{ marginTop: 12, fontSize: 20, fontWeight: 900, color: "#fff" }}>PASSWORD RECOVERY</div><div style={{ marginTop: 7, fontSize: 12, color: "rgba(255,255,255,.5)" }}>{mode === "update" ? "Choose a new password" : "Recover your Learner's Guide account"}</div></div>
        <div style={{ background: "rgba(0,0,0,.22)", borderRadius: 26, padding: "24px 20px", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,.1)" }}>
          {mode === "request" ? <>
            <Inp label="Recovery Email" val={email} set={setEmail} ph="you@example.com" icon="✉️" />
            <div style={{ fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,.5)", margin: "-2px 0 16px" }}>For security, the reset link is sent only to the email address already registered for the account.</div>
            {message && <div role="status" style={{ background: "rgba(34,197,94,.16)", color: "#86efac", padding: "9px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{message}</div>}
            {error && <div role="alert" style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", padding: "9px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <WBtn ch={loading ? "Sending…" : "Send Reset Link →"} onClick={request} dis={loading} />
          </> : <>
            <Inp label="New Password" type="password" val={password} set={setPassword} ph="At least 8 characters" icon="🔒" />
            <Inp label="Confirm Password" type="password" val={confirm} set={setConfirm} ph="Enter the password again" icon="🔒" />
            {error && <div role="alert" style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", padding: "9px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <WBtn ch={loading ? "Updating…" : "Set New Password →"} onClick={update} dis={loading} />
          </>}
        </div>
      </div>
    </div>
  );
}
