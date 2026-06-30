// ─────────────────────────────────────────────────────────────
// The Introvert's Field Plan — data layer
// AI Engineer World's Fair 2026 · synced to schedule v4498
//
// Edit sessions here. The app reads TOPICS, DAYS, ENERGY, SESSIONS.
// chips: any of TOPIC keys below. energy: focus | social | recharge.
// kind: anchor | flex | recharge. backup is optional per session.
// Voice note: keep copy em-dash-free (colons and short lines).
// ─────────────────────────────────────────────────────────────

export const TOPICS = {
  fde:        { label: "FDE",        chip: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",   dot: "#E8B059" },
  agents:     { label: "Agents",     chip: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30", dot: "#A78BFA" },
  robotics:   { label: "Robotics",   chip: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30", dot: "#5DCAA5" },
  design:     { label: "Design",     chip: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",         dot: "#7FA8C9" },
  governance: { label: "Governance", chip: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",      dot: "#E89B9B" },
  networking: { label: "Networking", chip: "bg-neutral-500/15 text-neutral-300 ring-1 ring-neutral-500/30", dot: "#9C988F" },
};

// Energy cost/gain applied when a session is marked attended.
export const ENERGY = {
  focus:    { delta: -10, label: "focus" },
  social:   { delta: -18, label: "social" },
  recharge: { delta: +15, label: "recharge" },
};

// Map day number -> real date (used for the time-aware "went?" nudge).
export const DAYS = [
  { n: 1, dow: "MON", date: "Jun 29", iso: "2026-06-29", name: "Workshop Day",     theme: "Build credibility in hands-on rooms." },
  { n: 2, dow: "TUE", date: "Jun 30", iso: "2026-06-30", name: "FDE + Governance",  theme: "Morning: your thesis on stage. Afternoon: the FDE track at your targets." },
  { n: 3, dow: "WED", date: "Jul 1",  iso: "2026-07-01", name: "Design to Robotics", theme: "Phase 1 post drops. Design all morning, cross to robotics after lunch." },
  { n: 4, dow: "THU", date: "Jul 2",  iso: "2026-07-02", name: "Trust + Wrap",      theme: "Low battery by design. Listen, note, follow up." },
];

// Booth recommendations — companies featured at the fair, matched to your
// thesis (FDE targets, agents, document triage, governance/trust, design-eng).
// NOTE: these are companies present/speaking at the event; verify each is
// actually on the expo floor — some may be talks, not booths.
export const BOOTHS = [
  // FDE targets
  { id: "b-factory",    name: "Factory",    topic: "fde",        why: "Agentic dev platform on the FDE track. A Strong-tier target: ask how their forward-deployed engineers scope and ship." },
  { id: "b-cognition",  name: "Cognition",  topic: "fde",        why: "Devin's makers, on the FDE track. Good for the role's history and contradictions before interviews." },
  { id: "b-cursor",     name: "Cursor",     topic: "fde",        why: "FDE implementation plus semantic codebase search. On your tier; see how design and agents meet in their tooling." },
  // document triage / agents (TomoCare's lane)
  { id: "b-reducto",    name: "Reducto",    topic: "agents",     why: "TomoCare's twin: parses redacted PDFs to handwritten letters. Compare their classify-extract-route pipeline to yours." },
  { id: "b-llamaindex", name: "LlamaIndex", topic: "agents",     why: "Document context layer for agents: the retrieval half of your triage problem." },
  { id: "b-composio",   name: "Composio",   topic: "agents",     why: "Tool-integration framework: the governed MCP layer your architecture depends on." },
  { id: "b-exa",        name: "Exa",        topic: "agents",     why: "Search built for agents. Useful if TomoCare needs grounded retrieval." },
  // governance / trust / evals
  { id: "b-braintrust", name: "Braintrust", topic: "governance", why: "Evals, traces, scorers: the enterprise vocabulary for your provenance thesis. You already have their Day 1 session." },
  { id: "b-qodo",       name: "Qodo",       topic: "governance", why: "Automated code review and validation: the trust-in-AI-code lane you keep circling." },
  { id: "b-greptile",   name: "Greptile",   topic: "governance", why: "Analyzed 1M+ AI-generated PRs. Hard data on when to trust agent output." },
  { id: "b-twosigma",   name: "Two Sigma",  topic: "governance", why: "Regulated-domain agents at a $70B hedge fund: HITL at scale, your finance angle for TomoCare." },
  // design engineering
  { id: "b-figma",      name: "Figma",      topic: "design",     why: "MCP server for design agents: dead center of your design-code roundtrip thesis." },
];

// time is "h:mmam-h:mmpm". end time is parsed for the attendance nudge.
export const SESSIONS = [
  // ── DAY 1 ──
  { id: "d1-1", day: 1, time: "9:00am-11:00am", title: "Mastering AI Observability", who: "Doug Guthrie · Braintrust", room: "Track 9", chips: ["governance"], kind: "anchor", energy: "focus",
    why: "Evals, traces, custom scorers: the enterprise vocabulary for what you call provenance.",
    backup: { title: "Total Recall: Agent Memory and Harness Engineering", who: "Oracle", room: "Track 6" } },
  { id: "d1-2", day: 1, time: "11:05am-12:05pm", title: "Open block: walk, coffee, no badge talk", who: "", room: "", chips: ["networking"], kind: "recharge", energy: "recharge",
    why: "Bank energy now. The afternoon is dense and ends in a social room." },
  { id: "d1-3", day: 1, time: "12:10pm-1:10pm", title: "Build the Right Thing: Product Engineering (Part 1)", who: "Kent C. Dodds", room: "Track 4", chips: ["design"], kind: "flex", energy: "focus",
    why: "Moved to 12:10, so it no longer collides with Reducto: you can do both. Product judgment for builder-designers. Take Part 1, then leave for Reducto." },
  { id: "d1-4", day: 1, time: "1:15pm-2:15pm", title: "Build a Document Triage Agent with Reducto", who: "Reducto", room: "Track 7", chips: ["agents"], kind: "anchor", energy: "focus",
    why: "TomoCare's twin: mixed corpus, classify, extract, route. Compare their pipeline to yours; the gaps are conversation material all week.",
    backup: { title: "Beyond RAG: Build a Relational Context Engine", who: "Peter Werry", room: "Track 7" } },
  { id: "d1-5", day: 1, time: "2:20pm-4:20pm", title: "Burn Your Flags: PayPal's CLI Tools for Agents", who: "Lummus, Patil · PayPal", room: "Track 4", chips: ["design", "agents"], kind: "anchor", energy: "social",
    why: "Now a 2-hour hands-on workshop. Agent-centered interface design, the discipline your view=agent artifact shows. Small room, exact peers.",
    backup: { title: "Context Engineering in 2026: Compaction, Memory, Cost", who: "Towards AI", room: "Track 6" } },
  { id: "d1-6", day: 1, time: "4:30pm-5:30pm", title: "The Dark Arts of Skill Engineering", who: "Paul Bakaus", room: "Track 2", chips: ["design", "agents"], kind: "flex", energy: "focus",
    why: "Skill patterns from someone who built 24 design skills across 9 platforms. Feeds how you'd structure TomoCare's agent skills.",
    backup: { title: "Evolution of Agentic Surfaces", who: "Anthropic", room: "Track 9" } },

  // ── DAY 2 ──
  { id: "d2-1", day: 2, time: "9:00am-10:30am", title: "Opening keynotes", who: "OpenAI · HuggingFace · GLM-5.2", room: "Main Stage", chips: ["networking"], kind: "flex", energy: "focus",
    why: "State-of-the-field read. Skip if you'd rather bank energy for the FDE afternoon." },
  { id: "d2-2", day: 2, time: "10:45am-11:05am", title: "Governance Is the Real Bottleneck to AI ROI", who: "David Hsu · Retool", room: "Leadership 2", chips: ["governance"], kind: "anchor", energy: "focus",
    why: "Your portfolio thesis, on stage. Front row. Have one question ready: TomoCare's candidate-vs-trusted-truth model is a credible follow-up.",
    backup: { title: "Security Firewall for Agents", who: "Ryan Dahl", room: "Track 1" } },
  { id: "d2-3", day: 2, time: "11:10am-11:30am", title: "FDE at Factory, then FDE at Cursor", who: "Eno Reyes / Pauline Brunet", room: "Track 8 · FDE", chips: ["fde"], kind: "anchor", energy: "social",
    why: "Open the day in the FDE track: two back-to-back how-it-works-at-[company] talks. Small rooms, exactly your people. Talk between sessions." },
  { id: "d2-4", day: 2, time: "12:05pm-12:25pm", title: "Tethered: Our Agents Are Us", who: "Shu Fang · Two Sigma", room: "Track 1 · Claws", chips: ["agents", "governance"], kind: "flex", energy: "focus",
    why: "Every employee at a $70B hedge fund gets a remote agent acting as them. Regulated-domain HITL at scale.",
    backup: { title: "FDE at Cognition", who: "Jia Wu", room: "Track 8" } },
  { id: "d2-5", day: 2, time: "12:25pm-1:30pm", title: "Lunch + expo sweep: 3 booths max", who: "", room: "Expo floor", chips: ["networking"], kind: "anchor", energy: "social",
    why: "Booth staff start the conversations for you. Pre-pick three targets; ask how they think about the design side of their agent products." },
  { id: "d2-6", day: 2, time: "1:30pm-1:50pm", title: "The Dirty Secret of Forward Deployed Engineering", who: "Natalie Meurer · Sierra", room: "Track 8 · FDE", chips: ["fde"], kind: "anchor", energy: "focus",
    why: "New marquee FDE talk. Sierra is on your radar, and the role's history and contradictions are the framing you want before interviews.",
    backup: { title: "Agents' Next Frontier: Agent-to-Agent", who: "Town", room: "Track 1" } },
  { id: "d2-7", day: 2, time: "1:55pm-2:15pm", title: "Dual-Surface Architecture: Humans + Agents, One Tool Layer", who: "Ethan Cha · Carlyle", room: "Track 5", chips: ["governance", "agents"], kind: "anchor", energy: "focus",
    why: "The closest thing to TomoCare on the board: deterministic harness, one governed MCP server, phased rollout, provenance non-optional, from regulated finance. THE room to be in.",
    backup: { title: "FDE at Decagon", who: "Sunny Rekhi", room: "Track 8" } },
  { id: "d2-8", day: 2, time: "2:25pm-2:45pm", title: "FDE at Ramp", who: "Leo Mehr · Ramp", room: "Track 8 · FDE", chips: ["fde"], kind: "anchor", energy: "social",
    why: "Ramp is on your Strong tier. Stay after and introduce yourself. (The Anthropic FDE talk I flagged earlier is not in the current schedule.)",
    backup: { title: "Tool Execution Layer for Agents", who: "Karan Vaidya · Composio", room: "Track 1" } },
  { id: "d2-9", day: 2, time: "2:50pm-4:05pm", title: "Protected recharge: leave the building", who: "", room: "", chips: ["networking"], kind: "recharge", energy: "recharge",
    why: "You spent the afternoon's social budget on the FDE block and the Carlyle talk. Save a little for the evening expo floor." },

  // ── DAY 3 ──
  { id: "d3-0", day: 3, time: "8:30am-9:00am", title: "Phase 1 post goes live", who: "linkedin.com/in/rosachoi7", room: "", chips: ["networking"], kind: "anchor", energy: "recharge",
    why: "Everyone you meet today who looks you up tonight sees a fresh shipped verification UI. Light start; rooms matter more after 10:45." },
  { id: "d3-1", day: 3, time: "10:45am-11:05am", title: "Understanding Is the New Bottleneck", who: "Geoffrey Litt", room: "Track 6 · Design", chips: ["design"], kind: "anchor", energy: "focus",
    why: "Retitled since last sync, same speaker. Staying in the loop and building understanding of agent work: design judgment at the architecture layer.",
    backup: { title: "Building Simulation Infra for World Models", who: "Moonlake", room: "Track 2" } },
  { id: "d3-2", day: 3, time: "11:10am-11:30am", title: "The Spatial Harness: Agents to the Canvas", who: "Max Drake · tldraw", room: "Track 6 · Design", chips: ["design", "agents"], kind: "anchor", energy: "focus",
    why: "Agents meeting the canvas: interaction design at the architecture layer." },
  { id: "d3-3", day: 3, time: "11:40am-12:00pm", title: "The Design-Code Roundtrip That Isn't", who: "Jonathan Gordon · ReWeaver", room: "Track 6 · Design", chips: ["design"], kind: "flex", energy: "focus",
    why: "Design-intent drift through Figma MCP loops, named and measured. Your hybrid profile is the answer to this talk." },
  { id: "d3-4", day: 3, time: "12:05pm-12:25pm", title: "Mousepower: measure agents or you can't manage them", who: "Maximillian Piras · Yutori", room: "Track 6 · Design", chips: ["design", "agents"], kind: "flex", energy: "focus",
    why: "Measuring agent quality: design, evals, and PM in one. The governance-meets-design lane.",
    backup: { title: "Tell the Robot What You Want (live SO101 + GR00T)", who: "Strands Agents", room: "Track 2" } },
  { id: "d3-5", day: 3, time: "12:25pm-1:30pm", title: "Lunch + expo, second pass", who: "", room: "Expo floor", chips: ["networking"], kind: "flex", energy: "social",
    why: "Revisit a booth where a conversation started Tuesday. 'I was thinking about what you said' beats ten cold intros." },
  { id: "d3-6", day: 3, time: "1:30pm-1:50pm", title: "Design at the Speed of Adjectives", who: "Paul Bakaus · Impeccable", room: "Track 6 · Design", chips: ["design"], kind: "flex", energy: "focus",
    why: "Adjective-level design controls as the right abstraction when the designer is also the engineer. Catch this, then cross to robotics." },
  { id: "d3-7", day: 3, time: "1:55pm-2:15pm", title: "Frontier Robotics Research", who: "Deepak Pathak", room: "Track 2 · Robotics", chips: ["robotics", "agents"], kind: "anchor", energy: "focus",
    why: "Brand-new Robotics & World Models track. Pathak is a marquee name. Cross over from the design room here.",
    backup: { title: "Training Taste", who: "Design Eng track", room: "Track 6" } },
  { id: "d3-8", day: 3, time: "2:25pm-2:45pm", title: "Manual Drones to Autonomous Multi-Agent Missions", who: "Juraj Kabzan · Skydio", room: "Track 2 · Robotics", chips: ["robotics", "agents"], kind: "anchor", energy: "focus",
    why: "The most 'you' session on the board: robotics AND multi-agent in one. One operator orchestrating a drone fleet from a browser. Protect this slot.",
    backup: { title: "Distillation + Continual Learning for Enterprise AI", who: "Memory track", room: "Track 3" } },
  { id: "d3-9", day: 3, time: "2:50pm-3:10pm", title: "Why Large? Tiny LMs on Edge / Robotics", who: "Cormac Brick", room: "Track 2 · Robotics", chips: ["robotics", "agents"], kind: "flex", energy: "focus",
    why: "Close the robotics thread: small models on edge hardware. Skip and recharge if the battery's gone. (Tentative slot, verify in-app.)" },

  // ── DAY 4 ──  (not fully in the last sync: verify in-app Thursday)
  { id: "d4-1", day: 4, time: "9:00am-10:30am", title: "Light start: follow-ups over breakfast", who: "", room: "", chips: ["networking"], kind: "recharge", energy: "recharge",
    why: "48-hour rule: message Tuesday's and Wednesday's contacts with one specific reference each. This is networking; it just doesn't look like it." },
  { id: "d4-2", day: 4, time: "11:10am-11:30am", title: "Anthropic's CCA Exam as a Field Guide", who: "Agentic Eng track", room: "Track 4", chips: ["agents", "fde"], kind: "flex", energy: "focus",
    why: "How Anthropic frames agentic competence: useful vocabulary for interviews." },
  { id: "d4-3", day: 4, time: "12:05pm-12:25pm", title: "Trust / code-review session (verify in app)", who: "Agentic Eng track", room: "Track 4", chips: ["governance"], kind: "flex", energy: "focus",
    why: "Heads up: 'The Last Human Code Review' moved to Day 2. Day 4 wasn't fully in the last sync, so treat these four cards as directional." },
  { id: "d4-4", day: 4, time: "1:30pm-1:50pm", title: "Harness Engineering: The Production Cage for Domain Agents", who: "Main Stage", room: "Main Stage", chips: ["governance"], kind: "anchor", energy: "focus",
    why: "'Production cage' is governance and restraint with engineering branding. Your portfolio thesis as a main-stage track." },
  { id: "d4-5", day: 4, time: "2:25pm-2:45pm", title: "What It Takes to Trust AI That Runs Production Software", who: "Agentic Eng track", room: "Track 4", chips: ["governance"], kind: "anchor", energy: "focus",
    why: "Trust as a systems property: the throughline of your whole portfolio, from banking to vehicle safety to TomoCare." },
  { id: "d4-6", day: 4, time: "2:50pm-3:30pm", title: "One or two follow-ups. No new cold intros.", who: "", room: "", chips: ["networking"], kind: "recharge", energy: "social",
    why: "Quality over volume on the final day. Depth with two people beats cards from ten." },
];
