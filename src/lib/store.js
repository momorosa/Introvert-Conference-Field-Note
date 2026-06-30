import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

export const DEFAULT_STATE = {
  attendance: {},      // sessionId -> "yes" | "no" | "backup"
  ratings: {},         // sessionId -> 1 | 2 | 3
  people: [],          // { id, name, note, linkedin, sessionId, day, followUp, ts }
  breaks: [],          // { day, ts }
  conversations: {},   // day -> count
  nightOut: {},        // day -> true
  notes: {},           // sessionId -> my own note text
  updated_at: 0,       // ms epoch, drives last-write-wins
};

const TABLE = "field_plan";
const keyFor = (uid) => `fieldplan-v3:${uid || "anon"}`;

function loadLocal(uid) {
  try { const r = localStorage.getItem(keyFor(uid)); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveLocal(uid, s) {
  try { localStorage.setItem(keyFor(uid), JSON.stringify(s)); } catch { /* memory only */ }
}

// ─────────────────────────────────────────────────────────────
// useFieldPlanState(session)
// Returns { state, setState, status }.
//   - Reads localStorage synchronously so first paint is instant.
//   - When a signed-in user is present, reconciles with Supabase by
//     updated_at (newest wins), then keeps both in sync.
//   - Every setState writes localStorage now and upserts Supabase
//     after a short debounce. Offline writes stay local and push on
//     the next successful save.
// status: "local" | "syncing" | "synced" | "offline"
// ─────────────────────────────────────────────────────────────
export function useFieldPlanState(session) {
  const uid = session?.user?.id || null;
  const [state, setStateRaw] = useState(() => ({ ...DEFAULT_STATE, ...(loadLocal(uid) || loadLocal(null)) }));
  const [status, setStatus] = useState(supabase && uid ? "syncing" : "local");
  const timer = useRef(null);

  async function pushRemote(s) {
    if (!supabase || !uid) return false;
    try {
      const { error } = await supabase.from(TABLE).upsert({
        user_id: uid,
        state: s,
        updated_at: new Date(s.updated_at || Date.now()).toISOString(),
      });
      return !error;
    } catch { return false; }
  }

  // reconcile once we have a user + client
  useEffect(() => {
    if (!supabase || !uid) return;
    let cancelled = false;
    (async () => {
      setStatus("syncing");
      // first sign-in: inherit any anon local data from before login
      const local = { ...DEFAULT_STATE, ...(loadLocal(uid) || loadLocal(null)) };
      try {
        const { data, error } = await supabase
          .from(TABLE).select("state,updated_at").eq("user_id", uid).maybeSingle();
        if (error) throw error;
        const remote = data?.state
          ? { ...DEFAULT_STATE, ...data.state, updated_at: new Date(data.updated_at).getTime() }
          : null;
        const winner = remote && (remote.updated_at || 0) > (local.updated_at || 0) ? remote : local;
        if (cancelled) return;
        setStateRaw(winner);
        saveLocal(uid, winner);
        if (!remote || (local.updated_at || 0) > (remote.updated_at || 0)) await pushRemote(winner);
        setStatus("synced");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const setState = useCallback((updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.updated_at = Date.now();
      saveLocal(uid, next);
      if (supabase && uid) {
        setStatus("syncing");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          setStatus((await pushRemote(next)) ? "synced" : "offline");
        }, 800);
      }
      return next;
    });
  }, [uid]);

  return { state, setState, status };
}
