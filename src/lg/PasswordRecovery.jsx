import React, { useEffect, useMemo, useState } from "react";
import { C } from "@/lg/data";
import { supabase } from "@/lg/supabase";
import { GLOBAL_CSS, LGLogo, Bubbles, BackBtn, WBtn, Inp, EyeBtn } from "@/lg/ui";

const baseUrl = () => `${window.location.origin}${import.meta.env.BASE_URL || "/"}`;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordChecks(value) {
  return {
    length: value.length >= 10,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
  };
}

export function PasswordRecovery({ role = "student", onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mode, setMode] = useState("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const strongEnough = checks.length && checks.upper && checks.lower && checks.number;

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
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const request = async () => {
    const clean = email.trim().toLowerCase();
    setError(""); setMessage("");
    if (!emailPattern.test(clean)) {
      setError("Enter the recovery email address registered for this account. If no recovery email has been configured, ask your institute administrator to add one first.");
      return;
    }
    if (cooldown) return;
    setLoading(true);
    try {
      const redirectTo = `${baseUrl()}reset-password`;
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo });
      if (recoveryError) throw recoveryError;
      setMessage("If an account uses this recovery email, a reset link has been sent. Check your inbox and spam folder. The link will open the secure password-reset page.");
      setCooldown(45);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start password recovery. Please try again or contact the institute administrator.");
    } finally {
      setLoading(false);
    }
  };

  const update = async () => {
    setError(""); setMessage("");
    if (!strongEnough) {
      setError("Use at least 10 characters with an uppercase letter, lowercase letter, and number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("This reset link has expired or is no longer valid. Request a new reset link.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut({ scope: "local" });
      setPassword(""); setConfirm(""); setShowPassword(false); setShowConfirm(false); setMode("request");
      setMessage("Password changed successfully. You have been signed out for security. Return to login and use your new password.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your password. Request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === "parent" ? "parent" : role === "teacher" ? "teacher" : role === "admin" ? "administrator" : "student";

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Poppins',sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style><Bubbles />
      <div style={{ position: "absolute", top: 18, left: 18, zIndex: 10 }}><BackBtn onClick={onBack} /></div>
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "76px 22px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <LGLogo size={70} showText={false} light />
          <div style={{ marginTop: 12, fontSize: 20, fontWeight: 900, color: "#fff" }}>PASSWORD RECOVERY</div>
          <div style={{ marginTop: 7, fontSize: 12, color: "rgba(255,255,255,.5)" }}>{mode === "update" ? "Choose a new password" : `Recover your Learner's Guide ${roleLabel} account`}</div>
        </div>
        <div style={{ background: "rgba(0,0,0,.22)", borderRadius: 26, padding: "24px 20px", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,.1)" }}>
          {mode === "request" ? <>
            <Inp label="Recovery Email" val={email} set={setEmail} ph="you@example.com" icon="✉️" />
            <div style={{ fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,.5)", margin: "-2px 0 16px" }}>Only the recovery email already assigned to the account can start a password reset. Your login ID and existing password are not changed by this step.</div>
            {message && <div role="status" style={{ background: "rgba(34,197,94,.16)", color: "#86efac", padding: "10px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{message}</div>}
            {error && <div role="alert" style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", padding: "10px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <WBtn ch={loading ? "Sending…" : cooldown ? `Try again in ${cooldown}s` : "Send Reset Link →"} onClick={request} dis={loading || !!cooldown} />
          </> : <>
            <Inp label="New Password" type={showPassword ? "text" : "password"} val={password} set={setPassword} ph="At least 10 characters" icon="🔒" right={<EyeBtn open={showPassword} onClick={() => setShowPassword((value) => !value)} />} />
            <div style={{ display: "grid", gap: 4, margin: "-4px 0 12px", fontSize: 10, color: "rgba(255,255,255,.58)" }}>
              <div style={{ color: checks.length ? "#86efac" : "rgba(255,255,255,.58)" }}>• 10+ characters</div>
              <div style={{ color: checks.upper ? "#86efac" : "rgba(255,255,255,.58)" }}>• One uppercase letter</div>
              <div style={{ color: checks.lower ? "#86efac" : "rgba(255,255,255,.58)" }}>• One lowercase letter</div>
              <div style={{ color: checks.number ? "#86efac" : "rgba(255,255,255,.58)" }}>• One number</div>
            </div>
            <Inp label="Confirm Password" type={showConfirm ? "text" : "password"} val={confirm} set={setConfirm} ph="Enter the password again" icon="🔒" right={<EyeBtn open={showConfirm} onClick={() => setShowConfirm((value) => !value)} />} />
            {error && <div role="alert" style={{ background: "rgba(239,68,68,.18)", color: "#fca5a5", padding: "10px 13px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <WBtn ch={loading ? "Updating…" : "Set New Password →"} onClick={update} dis={loading} />
          </>}
        </div>
      </div>
    </div>
  );
}
