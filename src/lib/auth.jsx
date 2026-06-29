import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// undefined = still loading, null = signed out, object = signed in.
// If supabase isn't configured, we report a synthetic "local" session so
// the app runs in single-device local-only mode without an auth wall.
const LOCAL_SESSION = { user: { id: null }, local: true };

export function useSession() {
  const [session, setSession] = useState(supabase ? undefined : LOCAL_SESSION);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}

export function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] tracking-[0.14em] text-amber-400 mb-1">AI ENGINEER WORLD'S FAIR 2026</p>
        <h1 className="text-2xl font-bold mb-1">The Introvert's Field Plan</h1>
        <p className="text-sm text-neutral-400 mb-6">Sign in so your attendance, notes, and people sync across your laptop and phone.</p>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Check your email. Tap the magic link on whichever device you want to use. You can close this tab.
          </div>
        ) : (
          <>
            <input
              type="email" inputMode="email" autoComplete="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="you@email.com"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-2.5 text-sm mb-2"
            />
            <button onClick={send} disabled={busy}
              className="w-full rounded-lg bg-amber-500 text-neutral-900 font-semibold py-2.5 text-sm disabled:opacity-60">
              {busy ? "Sending..." : "Send magic link"}
            </button>
            {err && <p className="text-xs text-rose-300 mt-2">{err}</p>}
            <p className="text-[11px] text-neutral-500 mt-3">No password. The link signs you in on any device you open it on.</p>
          </>
        )}
      </div>
    </div>
  );
}
