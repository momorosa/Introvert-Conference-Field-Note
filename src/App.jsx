import { useState, useMemo, useCallback } from "react";
import { SESSIONS, TOPICS, DAYS, ENERGY, BOOTHS } from "./data";
import { useSession, SignIn } from "./lib/auth";
import { useFieldPlanState } from "./lib/store";

// Persistence now lives in ./lib/store (local-first + Supabase sync) and
// auth in ./lib/auth (magic link). App just consumes the hooks below.

// ── helpers ──────────────────────────────────────────────────
// All sessions = the curated plan plus any you logged yourself.
const allSessions = (state) => [...SESSIONS, ...(state.customSessions || [])];

const parseEnd = (iso, time) => {
  // time like "1:55pm-2:15pm" -> Date of the end on the session's date
  if (!time) return null; // custom sessions you log have no scheduled time
  const end = time.split("-")[1];
  if (!end) return null;
  const m = end.match(/(\d+):(\d+)(am|pm)/i);
  if (!m) return null;
  let h = +m[1] % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return new Date(`${iso}T${String(h).padStart(2, "0")}:${m[2]}:00`);
};

function batteryForDay(day, state) {
  let b = 100;
  for (const s of allSessions(state).filter((x) => x.day === day)) {
    const a = state.attendance[s.id];
    if (a === "yes" || a === "backup") b += ENERGY[s.energy].delta;
  }
  b += (state.breaks.filter((x) => x.day === day).length) * ENERGY.recharge.delta;
  b -= (state.conversations[day] || 0) * 5;
  return Math.max(0, Math.min(100, b));
}

function topicAffinity(state) {
  const sum = {}, cnt = {};
  for (const s of allSessions(state)) {
    const r = state.ratings[s.id];
    if (!r) continue;
    for (const t of s.chips) {
      if (t === "networking") continue;
      sum[t] = (sum[t] || 0) + r;
      cnt[t] = (cnt[t] || 0) + 1;
    }
  }
  return Object.keys(sum)
    .map((t) => ({ topic: t, avg: sum[t] / cnt[t], n: cnt[t] }))
    .sort((a, b) => b.avg - a.avg);
}

function topicDistribution(state) {
  const counts = {};
  for (const s of allSessions(state)) {
    if (state.attendance[s.id] === "yes" || state.attendance[s.id] === "backup") {
      for (const t of s.chips) {
        if (t === "networking") continue;
        counts[t] = (counts[t] || 0) + 1;
      }
    }
  }
  return Object.entries(counts).map(([topic, count]) => ({ topic, count }));
}

const FILTERS = ["all", "fde", "agents", "robotics", "design", "governance"];

// ── small presentational pieces ──────────────────────────────
function Chip({ t }) {
  const cfg = TOPICS[t];
  if (!cfg) return null;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.chip}`}>{cfg.label}</span>;
}

function Donut({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  if (!total) return <div className="text-xs text-neutral-500">Mark sessions attended to see your mix.</div>;
  let acc = 0;
  const R = 38, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90 shrink-0">
        {data.map((d) => {
          const frac = d.count / total;
          const dash = `${frac * C} ${C}`;
          const el = (
            <circle key={d.topic} cx="50" cy="50" r={R} fill="none"
              stroke={TOPICS[d.topic].dot} strokeWidth="14"
              strokeDasharray={dash} strokeDashoffset={-acc * C} />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-1">
        {data.sort((a, b) => b.count - a.count).map((d) => (
          <div key={d.topic} className="flex items-center gap-2 text-xs text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: TOPICS[d.topic].dot }} />
            {TOPICS[d.topic].label}
            <span className="text-neutral-500">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ring({ value, goal }) {
  const R = 30, C = 2 * Math.PI * R;
  const frac = Math.min(1, value / goal);
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
      <circle cx="40" cy="40" r={R} fill="none" stroke="#3A3A3A" strokeWidth="8" />
      <circle cx="40" cy="40" r={R} fill="none" stroke="#E8B059" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} />
      <text x="40" y="40" transform="rotate(90 40 40)" textAnchor="middle"
        dominantBaseline="central" className="fill-neutral-100 text-xl font-bold">{value}</text>
    </svg>
  );
}

// ── main app ─────────────────────────────────────────────────
export default function App() {
  const session = useSession();
  const { state, setState, status } = useFieldPlanState(session);
  const [day, setDay] = useState(1);
  const [filter, setFilter] = useState("all");
  const [personFor, setPersonFor] = useState(null); // sessionId or "general"
  const [showPeople, setShowPeople] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showBooths, setShowBooths] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const patch = useCallback((fn) => setState((s) => { const n = structuredClone(s); fn(n); return n; }), [setState]);

  const dayInfo = DAYS.find((d) => d.n === day);
  const items = useMemo(
    () => allSessions(state).filter((s) => s.day === day)
      .filter((s) => filter === "all" || s.chips.includes(filter) || s.kind === "recharge"),
    [day, filter, state.customSessions]
  );

  const battery = batteryForDay(day, state);
  const affinity = topicAffinity(state);
  const dist = topicDistribution(state);
  const convos = state.conversations[day] || 0;
  const GOAL = 3;
  const streak = DAYS.filter((d) => (state.conversations[d.n] || 0) >= GOAL).length;
  const boothsVisited = Object.values(state.booths || {}).filter((b) => b.visited).length;
  const now = new Date();

  const setAttend = (id, val) =>
    patch((n) => { n.attendance[id] = n.attendance[id] === val ? undefined : val; });
  const setRating = (id, r) =>
    patch((n) => { n.ratings[id] = n.ratings[id] === r ? undefined : r; });
  const setNote = (id, text) =>
    patch((n) => {
      if (!n.notes) n.notes = {};
      if (text) n.notes[id] = text; else delete n.notes[id];
    });
  const addBreak = () => patch((n) => n.breaks.push({ day, ts: Date.now() }));
  const bumpConvo = (d) => {
    patch((n) => { n.conversations[day] = Math.max(0, (n.conversations[day] || 0) + d); });
    if (d > 0 && convos + 1 === GOAL) { setCelebrate(true); setTimeout(() => setCelebrate(false), 2200); }
  };
  const toggleNight = () => patch((n) => { n.nightOut[day] = !n.nightOut[day]; });

  const savePerson = (p) =>
    patch((n) => {
      n.people.push({ id: crypto.randomUUID(), ts: Date.now(), day, ...p });
      n.conversations[day] = (n.conversations[day] || 0) + 1; // meeting someone counts
    });
  const saveCustomSession = (d) =>
    patch((n) => {
      if (!n.customSessions) n.customSessions = [];
      const id = `custom-${crypto.randomUUID()}`;
      n.customSessions.push({ id, day, ts: Date.now(), kind: "flex", custom: true, ...d });
      n.attendance[id] = "yes"; // you're logging one you actually attended
    });
  const removeCustomSession = (id) =>
    patch((n) => {
      n.customSessions = (n.customSessions || []).filter((s) => s.id !== id);
      delete n.attendance[id];
      delete n.ratings[id];
      if (n.notes) delete n.notes[id];
    });
  const toggleBooth = (id) =>
    patch((n) => {
      if (!n.booths) n.booths = {};
      const cur = n.booths[id] || {};
      n.booths[id] = { ...cur, visited: !cur.visited };
    });
  const setBoothNote = (id, text) =>
    patch((n) => {
      if (!n.booths) n.booths = {};
      n.booths[id] = { ...(n.booths[id] || {}), note: text };
    });

  const batteryColor = battery > 40 ? "#5DCAA5" : battery > 20 ? "#E8B059" : "#E89B9B";

  // auth gate (all hooks above already ran, so order is stable)
  if (session === undefined) {
    return <div className="min-h-screen bg-neutral-900 text-neutral-500 flex items-center justify-center font-mono text-xs">loading…</div>;
  }
  if (session === null) {
    return <SignIn />;
  }

  const syncLabel = { local: "on this device", syncing: "syncing…", synced: "synced", offline: "offline (saved locally)" }[status];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">

        {/* header */}
        <header className="mb-5">
          <p className="font-mono text-[10px] tracking-[0.14em] text-amber-400 mb-1">
            AI ENGINEER WORLD'S FAIR · JUN 29 – JUL 2 · MOSCONE WEST
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">The Introvert's Field Plan</h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-lg">
            Social energy is the scarce resource, not session slots. Anchors are non-negotiable.
            Recharge blocks are protected. Three real conversations a day beats thirty business cards.
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === "synced" ? "bg-emerald-400" : status === "offline" ? "bg-rose-400" : "bg-amber-400"}`} />
            <span className="font-mono text-[10px] text-neutral-500">{syncLabel}</span>
          </div>
        </header>

        {/* day tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DAYS.map((d) => {
            const active = d.n === day;
            const hit = (state.conversations[d.n] || 0) >= GOAL;
            return (
              <button key={d.n} onClick={() => setDay(d.n)}
                className={`rounded-xl px-2 py-2 text-left border transition
                  ${active ? "bg-neutral-800 border-amber-500" : "bg-neutral-850 border-neutral-700 hover:border-neutral-600"}`}
                style={!active ? { background: "#222" } : {}}>
                <div className={`font-mono text-[10px] tracking-wider ${active ? "text-amber-400" : "text-neutral-500"}`}>
                  {d.dow} {d.date} {hit ? "✓" : ""}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${active ? "text-neutral-100" : "text-neutral-400"}`}>{d.name}</div>
              </button>
            );
          })}
        </div>

        {/* theme + battery + donut */}
        <section className="rounded-2xl bg-neutral-800/60 border border-neutral-700 p-4 mb-4">
          <div className="flex gap-3">
            <div className="w-1 rounded bg-amber-500 self-stretch" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{dayInfo.theme}</p>

              {/* battery */}
              <div className="mt-3">
                <div className="flex justify-between font-mono text-[10px] tracking-wide text-neutral-500 mb-1">
                  <span>SOCIAL BATTERY (from what you log)</span>
                  <span style={{ color: batteryColor }}>{battery}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${battery}%`, background: batteryColor }} />
                </div>
                <button onClick={addBreak}
                  className="mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
                  + I took a break (recharge)
                </button>
                <span className="ml-2 text-[11px] text-neutral-500">
                  {state.breaks.filter((b) => b.day === day).length} logged today
                </span>
              </div>

              {/* donut */}
              <div className="mt-4 pt-3 border-t border-neutral-700">
                <div className="font-mono text-[10px] tracking-wide text-neutral-500 mb-2">YOUR MIX (attended sessions)</div>
                <Donut data={dist} />
              </div>

              {/* affinity nudge */}
              {affinity.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-700">
                  <div className="font-mono text-[10px] tracking-wide text-neutral-500 mb-1">WHAT'S RESONATING</div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {affinity.map((a) => (
                      <span key={a.topic} className="flex items-center gap-1 text-[11px] text-neutral-300">
                        <Chip t={a.topic} />
                        <span className="text-neutral-500">{a.avg.toFixed(1)}</span>
                      </span>
                    ))}
                  </div>
                  {affinity[0] && (
                    <p className="text-[11px] text-amber-300/80 mt-1.5">
                      Leaning {TOPICS[affinity[0].topic].label}. Want more of it tomorrow? Tap the filter to compare.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* conversation game (independent + gamified) */}
        <section className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-neutral-800/40 border border-amber-500/20 p-4 mb-4 relative overflow-hidden">
          {celebrate && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {[..."🎉✨🎊⭐️🙌"].map((e, i) => (
                <span key={i} className="absolute text-2xl animate-ping" style={{ left: `${15 + i * 18}%`, top: "30%", animationDelay: `${i * 80}ms` }}>{e}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            <Ring value={convos} goal={GOAL} />
            <div className="flex-1">
              <div className="text-sm font-semibold">Real conversations today</div>
              <div className="text-xs text-neutral-400">Goal {GOAL}. {convos >= GOAL ? "Met it. You can stop now, guilt-free." : `${GOAL - convos} to go.`}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => bumpConvo(1)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-900 text-sm font-bold">+1</button>
                <button onClick={() => bumpConvo(-1)} className="px-3 py-1.5 rounded-lg border border-neutral-600 text-neutral-300 text-sm">−1</button>
                <button onClick={() => { setPersonFor("general"); }} className="px-3 py-1.5 rounded-lg border border-neutral-600 text-neutral-200 text-sm">+ Log who I met</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {convos >= 1 && <Badge>First contact</Badge>}
                {convos >= GOAL && <Badge>Daily goal</Badge>}
                {convos >= 5 && <Badge>Overachiever</Badge>}
                {streak >= 2 && <Badge>{streak}-day streak</Badge>}
              </div>
            </div>
          </div>

          {/* night-out stretch goal */}
          <button onClick={toggleNight}
            className={`mt-3 w-full text-left rounded-xl px-3 py-2 border transition
              ${state.nightOut[day] ? "bg-violet-500/15 border-violet-500/40" : "bg-neutral-900/40 border-neutral-700 border-dashed"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{state.nightOut[day] ? "🌙 You went out after dark. Be proud." : "🌙 Stretch goal: after-dark party or gathering"}</span>
              <span className="text-xs text-neutral-400">{state.nightOut[day] ? "done" : "tap if you go"}</span>
            </div>
          </button>
        </section>

        {/* filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => {
            const active = filter === f;
            const label = f === "all" ? "All" : TOPICS[f].label;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${active ? "bg-amber-500 text-neutral-900 border-amber-500" : "text-neutral-400 border-neutral-700 hover:border-neutral-500"}`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* sessions */}
        <div className="flex flex-col gap-3">
          {items.map((s) => {
            const att = state.attendance[s.id];
            const rating = state.ratings[s.id];
            const note = state.notes?.[s.id] || "";
            const isCustom = s.custom;
            const end = parseEnd(DAYS.find((d) => d.n === s.day).iso, s.time);
            const isPast = end && now > end;
            const isRecharge = s.kind === "recharge";
            return (
              <article key={s.id}
                className={`rounded-2xl p-4 border ${isRecharge ? "border-dashed border-neutral-700 bg-transparent" : s.kind === "anchor" ? "border-amber-600/50 bg-neutral-800/50" : "border-neutral-700 bg-neutral-800/30"} ${att === "no" ? "opacity-50" : ""}`}>
                <div className="flex gap-3">
                  {/* time + energy */}
                  <div className="shrink-0 w-[78px]">
                    <div className={`font-mono text-[11px] leading-tight ${s.kind === "anchor" ? "text-amber-400" : "text-neutral-500"}`}>{s.time ? s.time.replace("-", " –\n") : "added"}</div>
                    {!isRecharge && <div className="mt-1 inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border border-neutral-600 text-neutral-400">{ENERGY[s.energy].label}</div>}
                  </div>

                  {/* body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1 items-center">{s.chips.map((t) => <Chip key={t} t={t} />)}{isCustom && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30">added by you</span>}</div>
                    <h3 className="text-sm font-semibold leading-snug">{s.title}</h3>
                    {(s.who || s.room) && <div className="text-xs text-neutral-400 mt-0.5">{s.who}{s.who && s.room ? " · " : ""}{s.room}</div>}
                    {s.why && <p className="text-xs text-neutral-400 leading-relaxed mt-1.5">{s.why}</p>}

                    {/* backup */}
                    {s.backup && (
                      <details className="mt-2">
                        <summary className="text-[11px] text-amber-300/80 cursor-pointer select-none">Backup if full / cancelled / flat</summary>
                        <div className="mt-1 text-[11px] text-neutral-400 border-l-2 border-neutral-700 pl-2">
                          {s.backup.title}{s.backup.who ? ` · ${s.backup.who}` : ""}{s.backup.room ? ` · ${s.backup.room}` : ""}
                          <button onClick={() => setAttend(s.id, "backup")}
                            className="ml-2 text-[10px] underline text-amber-300/80">I went to the backup</button>
                        </div>
                      </details>
                    )}

                    {/* attendance + rating */}
                    {!isRecharge && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] ${isPast ? "text-amber-300" : "text-neutral-500"}`}>{isPast ? "Went?" : "Attend?"}</span>
                        <button onClick={() => setAttend(s.id, "yes")}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${att === "yes" || att === "backup" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200" : "border-neutral-600 text-neutral-300"}`}>Yes</button>
                        <button onClick={() => setAttend(s.id, "no")}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${att === "no" ? "bg-neutral-700 border-neutral-500 text-neutral-200" : "border-neutral-600 text-neutral-300"}`}>No</button>

                        {(att === "yes" || att === "backup") && (
                          <>
                            <span className="text-neutral-600 mx-0.5">·</span>
                            {[[1, "meh"], [2, "good"], [3, "loved"]].map(([r, lbl]) => (
                              <button key={r} onClick={() => setRating(s.id, r)}
                                className={`text-xs px-2 py-1 rounded-lg border ${rating === r ? "bg-amber-500 text-neutral-900 border-amber-500" : "border-neutral-600 text-neutral-400"}`}>{lbl}</button>
                            ))}
                            <button onClick={() => setPersonFor(s.id)}
                              className="text-xs px-2 py-1 rounded-lg border border-neutral-600 text-neutral-300">+ met someone</button>
                          </>
                        )}
                      </div>
                    )}

                    {/* my note */}
                    <details className="mt-2">
                      <summary className="text-[11px] text-amber-300/80 cursor-pointer select-none">
                        {note ? `📝 ${note.replace(/\s+/g, " ").slice(0, 48)}${note.length > 48 ? "…" : ""}` : "+ Add a note"}
                      </summary>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(s.id, e.target.value)}
                        placeholder="What stuck with you? A quote, an idea, a follow-up…"
                        rows={2}
                        className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-600 px-2.5 py-1.5 text-xs text-neutral-200 resize-y"
                      />
                    </details>

                    {isCustom && (
                      <button onClick={() => removeCustomSession(s.id)}
                        className="mt-2 block text-[10px] text-neutral-500 underline">remove this</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* add your own session */}
        <button onClick={() => setShowAddSession(true)}
          className="mt-3 w-full rounded-2xl border border-dashed border-neutral-700 text-neutral-400 text-sm py-3 hover:border-neutral-500">
          + Add a session I went to
        </button>

        {/* footer */}
        <footer className="mt-7 pt-4 border-t border-neutral-800 flex flex-wrap justify-between gap-2">
          <button onClick={() => setShowPeople(true)} className="font-mono text-[11px] text-amber-300/80 underline">
            People I met ({state.people.length})
          </button>
          <button onClick={() => setShowBooths(true)} className="font-mono text-[11px] text-amber-300/80 underline">
            Booths ({boothsVisited}/{BOOTHS.length})
          </button>
          {!session?.local && (
            <button onClick={async () => { const { supabase } = await import("./lib/supabase"); await supabase?.auth.signOut(); }}
              className="font-mono text-[11px] text-neutral-500 underline">sign out</button>
          )}
          <span className="font-mono text-[10px] text-neutral-600">synced to schedule v4498 · verify rooms in the app each morning</span>
        </footer>
      </div>

      {/* person quick-add modal */}
      {personFor && <PersonModal sessionId={personFor === "general" ? null : personFor} onClose={() => setPersonFor(null)} onSave={savePerson} />}
      {/* people list modal */}
      {showPeople && <PeopleList people={state.people} onClose={() => setShowPeople(false)} />}
      {/* add custom session modal */}
      {showAddSession && <SessionModal onClose={() => setShowAddSession(false)} onSave={(d) => { saveCustomSession(d); setShowAddSession(false); }} />}
      {/* booth recommendations modal */}
      {showBooths && <BoothsModal visits={state.booths} onToggle={toggleBooth} onNote={setBoothNote} onClose={() => setShowBooths(false)} />}
    </div>
  );
}

function Badge({ children }) {
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30">{children}</span>;
}

function PersonModal({ sessionId, onClose, onSave }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const sess = SESSIONS.find((s) => s.id === sessionId);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3" onClick={onClose}>
      <div className="bg-neutral-850 bg-neutral-800 w-full max-w-md rounded-2xl border border-neutral-700 p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-1">Who did you meet?</h3>
        {sess && <p className="text-xs text-neutral-400 mb-3">at {sess.title}</p>}
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
          className="w-full mb-2 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="One line: what to remember / follow up on"
          className="w-full mb-2 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn / handle (optional)"
          className="w-full mb-2 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-neutral-300 mb-3">
          <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} /> Flag for follow-up
        </label>
        <div className="flex gap-2">
          <button onClick={() => { if (name.trim()) { onSave({ name, note, linkedin, followUp, sessionId }); onClose(); } }}
            className="flex-1 rounded-lg bg-amber-500 text-neutral-900 font-semibold py-2 text-sm">Save (counts as a convo)</button>
          <button onClick={onClose} className="rounded-lg border border-neutral-600 px-4 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function SessionModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [who, setWho] = useState("");
  const [room, setRoom] = useState("");
  const [topic, setTopic] = useState("agents");
  const [energy, setEnergy] = useState("focus");
  const topics = ["fde", "agents", "robotics", "design", "governance", "networking"];
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-md rounded-2xl border border-neutral-700 p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-1">Add a session you attended</h3>
        <p className="text-xs text-neutral-400 mb-3">Something off the plan? Log it so it counts toward your mix and affinity.</p>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title"
          className="w-full mb-2 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Speaker / org (optional)"
          className="w-full mb-2 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room (optional)"
          className="w-full mb-3 rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm" />
        <div className="font-mono text-[10px] tracking-wide text-neutral-500 mb-1">TOPIC</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topics.map((t) => (
            <button key={t} onClick={() => setTopic(t)}
              className={`text-xs px-2.5 py-1 rounded-full border ${topic === t ? "bg-amber-500 text-neutral-900 border-amber-500" : "border-neutral-600 text-neutral-300"}`}>
              {TOPICS[t].label}
            </button>
          ))}
        </div>
        <div className="font-mono text-[10px] tracking-wide text-neutral-500 mb-1">ENERGY</div>
        <div className="flex gap-1.5 mb-4">
          {["focus", "social"].map((e) => (
            <button key={e} onClick={() => setEnergy(e)}
              className={`text-xs px-2.5 py-1 rounded-full border ${energy === e ? "bg-amber-500 text-neutral-900 border-amber-500" : "border-neutral-600 text-neutral-300"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (title.trim()) onSave({ title: title.trim(), who: who.trim(), room: room.trim(), chips: [topic], energy }); }}
            className="flex-1 rounded-lg bg-amber-500 text-neutral-900 font-semibold py-2 text-sm">Add (marked attended)</button>
          <button onClick={onClose} className="rounded-lg border border-neutral-600 px-4 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function BoothsModal({ visits, onToggle, onNote, onClose }) {
  const byTopic = {};
  for (const b of BOOTHS) { (byTopic[b.topic] = byTopic[b.topic] || []).push(b); }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-md rounded-2xl border border-neutral-700 p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-semibold">Booths worth your time</h3>
          <button onClick={onClose} className="text-neutral-400 text-sm">close</button>
        </div>
        <p className="text-xs text-neutral-400 mb-3">Matched to your thesis. These are companies featured at the fair — verify they're on the expo floor.</p>
        <div className="flex flex-col gap-4">
          {Object.entries(byTopic).map(([topic, list]) => (
            <div key={topic}>
              <div className="font-mono text-[10px] tracking-wide text-neutral-500 mb-1.5">{TOPICS[topic].label.toUpperCase()}</div>
              <div className="flex flex-col gap-2">
                {list.map((b) => {
                  const v = visits?.[b.id] || {};
                  return (
                    <div key={b.id} className={`rounded-xl border p-3 ${v.visited ? "border-emerald-500/40 bg-emerald-500/5" : "border-neutral-700"}`}>
                      <div className="flex items-start gap-2.5">
                        <button onClick={() => onToggle(b.id)}
                          className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${v.visited ? "bg-emerald-500 border-emerald-500 text-neutral-900" : "border-neutral-500"}`}>
                          {v.visited ? "✓" : ""}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold">{b.name}</div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">{b.why}</p>
                          {v.visited && (
                            <input value={v.note || ""} onChange={(e) => onNote(b.id, e.target.value)}
                              placeholder="Note: who you talked to, follow-up…"
                              className="mt-2 w-full rounded-lg bg-neutral-900 border border-neutral-600 px-2.5 py-1.5 text-xs" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PeopleList({ people, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3" onClick={onClose}>
      <div className="bg-neutral-800 w-full max-w-md rounded-2xl border border-neutral-700 p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold">People I met</h3>
          <button onClick={onClose} className="text-neutral-400 text-sm">close</button>
        </div>
        {people.length === 0 && <p className="text-sm text-neutral-500">No one yet. Tap "+ met someone" on a session.</p>}
        <div className="flex flex-col gap-2">
          {people.slice().reverse().map((p) => {
            const sess = SESSIONS.find((s) => s.id === p.sessionId);
            return (
              <div key={p.id} className="rounded-xl border border-neutral-700 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.name}</span>
                  {p.followUp && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">follow up</span>}
                </div>
                {p.note && <p className="text-xs text-neutral-400 mt-0.5">{p.note}</p>}
                {p.linkedin && <p className="text-xs text-sky-300 mt-0.5">{p.linkedin}</p>}
                <p className="text-[11px] text-neutral-500 mt-1">{sess ? sess.title : "general"} · Day {p.day}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
