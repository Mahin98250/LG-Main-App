import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lg/supabase";

type AdminLoginProps = { onAuthenticated?: () => void; onForgotPassword?: () => void };

export default function AdminLogin({ onAuthenticated, onForgotPassword }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError || !data.session) { setCheckingSession(false); return; }
      const role = data.session.user.app_metadata?.role;
      if (role === "admin") onAuthenticated?.();
      else { await supabase.auth.signOut(); setError("This account does not have administrator access."); setCheckingSession(false); }
    };
    void checkSession();
    return () => { active = false; };
  }, [onAuthenticated]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!email.trim() || !password) { setError("Enter your administrator email and password."); return; }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.user) { setError("Invalid email or password."); return; }
      if (data.user.app_metadata?.role !== "admin") { await supabase.auth.signOut(); setError("Access denied. This account is not an administrator."); return; }
      onAuthenticated?.();
    } catch { setError("Something went wrong while signing in. Please try again."); }
    finally { setLoading(false); }
  };

  if (checkingSession) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><div className="text-sm text-slate-300">Checking administrator session...</div></main>;

  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl">
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Learner&apos;s Guide</p><h1 className="text-3xl font-bold tracking-tight">Administrator Login</h1><p className="mt-2 text-sm text-slate-400">Authorized institute administrators only.</p></div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-200">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="admin@example.com" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" disabled={loading} /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-200">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" disabled={loading} /></label>
        {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        <div className="text-right"><button type="button" onClick={onForgotPassword} className="text-sm text-blue-300 underline hover:text-blue-200" disabled={loading}>Forgot password?</button></div>
        <button type="submit" disabled={loading} className="w-full rounded-2xl bg-blue-500 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : "Sign in securely"}</button>
      </form>
    </section>
  </main>;
}
