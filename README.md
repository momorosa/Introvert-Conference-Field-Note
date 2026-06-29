# The Introvert's Field Plan

A personal, opinionated schedule + networking companion for AI Engineer World's Fair 2026.
React + Tailwind, persists to `localStorage`, no backend. Built to live on your phone.

## Run it locally

```bash
npm install
npm run dev      # opens http://localhost:5173
```

## Deploy to Vercel (5 minutes)

1. Push this folder to a GitHub repo.
2. On vercel.com: New Project, import the repo.
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`. (Vercel auto-detects.)
4. Deploy. You get a URL. Open it on your phone and "Add to Home Screen" for an app-like icon.

That's it. No environment variables, no database.

## Cross-device sync with Supabase (magic-link auth)

Data syncs across your laptop and phone through your own Supabase project. Architecture is
**local-first**: every change writes to `localStorage` instantly (works offline in a bad-wifi room),
then upserts to Supabase in the background. Across two devices it's last-write-wins on `updated_at`,
which is correct since you're the only user and won't edit on both at the same second.

If the two Supabase env vars are absent, the app boots in local-only mode (no auth wall), so you can
still run it bare.

### One-time setup (about 10 minutes)

1. **Create a Supabase project** (or reuse your TomoCare one: a new table is fine alongside it).
2. **Run the schema:** open `supabase-schema.sql`, paste into Supabase SQL Editor, Run. This creates
   one `field_plan` table with row-level security so you can only ever touch your own row.
3. **Enable email auth:** Supabase dashboard -> Authentication -> Providers -> Email is on by default.
   Magic link works out of the box.
4. **Set redirect URLs:** Authentication -> URL Configuration. Add `http://localhost:5173` and your
   Vercel URL (e.g. `https://field-plan.vercel.app`) to both Site URL and Redirect URLs. The magic
   link won't return you to the app without this.
5. **Env vars:** copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Project Settings -> API). In Vercel, add the same two under
   Settings -> Environment Variables, then redeploy.

### Using it

Open the app, enter your email, tap the magic link from whichever device you want. Sign in with the
same email on the laptop Day 1 and the phone Days 2 to 4 and you see the same data. The little dot
under the header shows sync state: green synced, amber syncing, red offline-but-saved-locally.

First sign-in inherits any data you'd already entered locally before logging in, so nothing you tap
pre-auth is lost.

### A note on the anon key

The anon key is safe to ship in the browser. It is not a secret: RLS is what protects your data, and
the policies in `supabase-schema.sql` scope every read and write to `auth.uid()`. Never put the
service-role key in this app.

## What's built (your 8 asks)

1. **Responsive** — mobile-first Tailwind, single column, big tap targets. Modals dock to the bottom on phones.
2. **Attendance** — one tap Yes/No per session. After a session's end time passes (device clock vs. the real
   conference dates in `data.js`), the prompt flips to "Went?". No geolocation: indoor GPS can't tell Moscone
   rooms apart, so a tap is the reliable move.
3. **People log** — "+ met someone" on any attended session, or "+ Log who I met" in the tracker. Name, one-line
   note, optional LinkedIn, follow-up flag. Linked to the session. Saving auto-counts a conversation.
4. **Social battery** — a self-report model (no sensor exists). Starts at 100/day, drops per attended session
   (social costs more than focus) and per conversation, recovers when you tap "I took a break." Tune the numbers
   in `ENERGY` (data.js) and the convo cost in `batteryForDay` (App.jsx).

## Hand-off notes for Claude Code (quick wins)

- **Em-dash scrub:** the older session `why` copy may still contain a few "—". Replace with colons or periods
  (your voice guardrail). One pass over `data.js`.
- **Time-aware "now":** the nudge uses the device clock against the conference dates. To test before Monday,
  temporarily hard-code `now` in `App.jsx`.
- **Re-sync sessions:** the schedule keeps moving. Re-fetch `https://www.ai.engineer/worldsfair/sessions.json`
  the morning of each day and update `data.js`. The MCP server they published could automate this.
- **Export:** add a "copy my people list / my day as text" button for easy follow-up after the conference.
- **Share-back artifact:** once it feels good, a read-only public route makes it tweetable to @aidotengineer.

## File map

```
index.html
supabase-schema.sql   # run once in Supabase SQL editor
.env.example          # copy to .env.local
src/main.jsx          # mount
src/App.jsx           # all UI + state + battery/affinity/donut logic
src/data.js           # sessions, TOPICS, DAYS, ENERGY  <- edit your schedule here
src/index.css         # tailwind entry
src/lib/supabase.js   # supabase client (reads env vars)
src/lib/auth.jsx      # magic-link sign-in + useSession
src/lib/store.js      # local-first + Supabase synced state hook
```
