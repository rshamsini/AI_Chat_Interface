// Shared chat conversation data — single source of truth for home + desktop

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatData {
  id: string;
  title: string;
  tags: string[];
  date: string;
  dateLabel: string;
  section: "today" | "yesterday" | "older" | "project";
  projectId?: string;
  isDualTopic?: boolean;
  suggestedTags?: string[];
  content: string; // one-line summary for Desktop card preview
  messages: ChatMessage[];
}

export interface SessionChat {
  id: string;
  title: string;
  tags: string[];
  messages: ChatMessage[];
  date: string;
  dateLabel: string;
  isDualTopic?: boolean;
}

// ─── Core data ────────────────────────────────────────────────────────────────

export const ALL_CHATS: ChatData[] = [
  // ── Today ──
  {
    id: "f1", title: "Refactor Auth Module", tags: ["dev", "backend"],
    date: "2026-03-22", dateLabel: "Today", section: "today",
    content: "JWT + OAuth split, refresh token rotation, session edge cases.",
    messages: [
      { role: "user", text: "I want to refactor our auth module — right now it handles both JWT and OAuth in one file and it's getting messy." },
      { role: "assistant", text: "Good call. The cleanest split is a dedicated `JwtService` for token issuance and validation, and an `OAuthService` for provider flows. For refresh token rotation, generate a new pair on each use and immediately invalidate the old token. Want me to sketch out the folder structure?" },
    ],
  },
  {
    id: "f2", title: "SEO Audit Summary", tags: ["seo"],
    date: "2026-03-22", dateLabel: "Today", section: "today",
    content: "Core web vitals review across 40 pages, 12 missing meta descriptions.",
    messages: [
      { role: "user", text: "Can you help me interpret these core web vitals scores? LCP is 3.8s on our pricing page." },
      { role: "assistant", text: "3.8s LCP is in the 'Needs Improvement' range — Google's threshold is under 2.5s for 'Good'. The most common culprits on pricing pages are render-blocking hero images or slow server response. Is your hero image lazily loaded or is it an `<img>` with no explicit dimensions?" },
    ],
  },
  {
    id: "f3", title: "User Interview Synthesis", tags: ["ux", "research"],
    date: "2026-03-22", dateLabel: "Today", section: "today",
    content: "8 interviews synthesized — users abandon onboarding at step 3.",
    messages: [
      { role: "user", text: "I've finished 8 user interviews. Everyone seems to drop off around step 3 of onboarding but I'm not sure why." },
      { role: "assistant", text: "That's a classic 'value gap' moment. Step 3 is usually where the product asks for effort — integrations, inviting teammates, or setting up preferences — before the user has seen any value yet. Try front-loading one 'aha moment' before that step. Did any users verbally explain why they stopped?" },
    ],
  },
  {
    id: "f11", title: "Product Roadmap Q2", tags: ["strategy", "planning"],
    date: "2026-03-22", dateLabel: "Today", section: "today",
    content: "AI search, team collaboration, mobile beta — 14 epics across 3 squads.",
    messages: [
      { role: "user", text: "I need to build a Q2 roadmap. Our three big bets are AI search, team collaboration features, and mobile beta. How do I sequence them?" },
      { role: "assistant", text: "Sequence by dependency and risk: Start mobile beta in Week 1 since it's the longest feedback loop. Run AI search in parallel — it's self-contained and high-visibility. Push team collaboration to Week 6+ since it likely depends on having users to collaborate. Gate each with a Week 4 milestone review so you can cut scope without derailing the quarter." },
    ],
  },
  {
    id: "f13", title: "Weekly Standup Notes", tags: ["team", "recap"],
    date: "2026-03-22", dateLabel: "Today", section: "today",
    content: "Week of Mar 20 — shipped search v2, 3 bugs fixed, 2 engineers onboarded.",
    messages: [
      { role: "user", text: "Summarise this week's standup notes into a shareable async update for stakeholders who weren't in the call." },
      { role: "assistant", text: "Here's a clean async summary:\n\n**Week of Mar 20 — Team Update**\n✅ Shipped search v2 (now live for all users)\n🐛 Resolved 3 critical bugs (login redirect, export CSV, notification delay)\n👋 Welcomed 2 new engineers to the team\n⚠️ Blocker: staging environment latency — investigation in progress\n📋 Next: design review for Q2 dashboard by Friday" },
    ],
  },

  // ── Yesterday ──
  {
    id: "f4", title: "Competitor Analysis", tags: ["research"],
    date: "2026-03-21", dateLabel: "Yesterday", section: "yesterday",
    content: "6 SaaS tools benchmarked — Notion & Linear rank highest on NPS.",
    messages: [
      { role: "user", text: "Help me structure a competitive analysis for our project management tool — I need to compare us against Notion, Linear, and Asana." },
      { role: "assistant", text: "I'd suggest a 5-axis scorecard: Pricing model, Core feature depth, Collaboration UX, Integrations ecosystem, and Mobile experience. Notion wins on flexibility, Linear on speed and dev focus, Asana on enterprise workflow. Where do you want to position yourselves — do you have a clear differentiator in mind?" },
    ],
  },
  {
    id: "f5", title: "Email Campaign Draft", tags: ["email", "copy"],
    date: "2026-03-21", dateLabel: "Yesterday", section: "yesterday",
    content: "3 subject line variants for April launch, A/B test plan across segments.",
    messages: [
      { role: "user", text: "Write 3 subject line options for our product launch email targeting trial users. The feature is AI-powered search." },
      { role: "assistant", text: `Here are three angles:\n1. 🔍 "Find anything in seconds — your AI search is live"\n2. "You asked for faster search. We listened."\n3. "Stop scrolling. Start finding." — which tone fits your brand best? I can also write the preview text to pair with each.` },
    ],
  },
  // ── DUAL-TOPIC CHAT ──
  {
    id: "f_dual",
    title: "Morning Workout Tips · Immigration Visa Guide",
    tags: ["fitness", "immigration", "multi-topic"],
    date: "2026-03-21", dateLabel: "Yesterday", section: "yesterday",
    isDualTopic: true,
    suggestedTags: ["visa", "expat", "HIIT", "nutrition"],
    content: "Started with a 5am HIIT plan and calorie tracking, shifted to Canadian visa options.",
    messages: [
      { role: "user", text: "I want a 5am HIIT workout routine I can do in 30 minutes with no equipment." },
      { role: "assistant", text: "Perfect — here's a 30-min bodyweight circuit: 5 min warm-up jog in place → 4 rounds of (20 burpees, 15 push-ups, 20 jump squats, 30s plank). Rest 90s between rounds. Total burn ~350–400 kcal. Want a calorie tracking template too?" },
      { role: "user", text: "Yes please. Also completely different question — I'm thinking of moving to Canada from the US, what visa options do I have?" },
      { role: "assistant", text: "Sure! For Canada from the US, your main routes are: Express Entry (skilled workers, ~6 months), Intra-Company Transfer if your employer has a Canadian office, or the Startup Visa if you're founding a company. For digital nomads, Portugal's D8 visa and Estonia's e-Residency are also popular. Want me to walk through Express Entry eligibility?" },
    ],
  },
  {
    id: "f12", title: "Brand Voice Guidelines", tags: ["brand", "copy"],
    date: "2026-03-21", dateLabel: "Yesterday", section: "yesterday",
    content: "Tone: confident, clear, human. 20 before/after rewrites included.",
    messages: [
      { role: "user", text: "We need to define a brand voice. We're a B2B SaaS, we want to sound human but not too casual. Something like Basecamp or Linear." },
      { role: "assistant", text: "I'd describe that voice as 'Direct with warmth' — confident enough to say what you mean without hedging, but never cold or corporate. Key rules: short sentences, active verbs, no jargon or filler ('leverage', 'synergy', 'best-in-class'). Linear does this well with phrases like 'Built for the ones who care about quality.' Want me to write a one-page voice guide with dos and don'ts?" },
    ],
  },

  // ── Older ──
  {
    id: "f6", title: "API Integration Plan", tags: ["dev"],
    date: "2026-03-15", dateLabel: "Mar 15", section: "older",
    content: "Stripe, SendGrid, Segment integration map with webhook retry logic.",
    messages: [
      { role: "user", text: "We're integrating Stripe, SendGrid, and Segment. What's the safest order to do this and how should I handle webhook failures?" },
      { role: "assistant", text: "Start with Stripe — it's the most business-critical. Implement idempotency keys on all payment webhooks. Then Segment as your event bus (it'll feed SendGrid anyway). For webhook failures, use an exponential backoff queue with a dead-letter table in your DB so you can replay missed events. Want a schema for the dead-letter table?" },
    ],
  },
  {
    id: "f14", title: "Landing Page Copy Draft", tags: ["marketing"],
    date: "2026-03-15", dateLabel: "Mar 15", section: "older",
    content: "'Think faster. Build smarter.' vs 'Your AI workspace, reimagined.' — 34% vs 28% CTR.",
    messages: [
      { role: "user", text: "Which landing page headline do you think will convert better: 'Think faster. Build smarter.' or 'Your AI workspace, reimagined.'?" },
      { role: "assistant", text: "'Think faster. Build smarter.' will likely win. It's action-oriented, speaks to outcomes (speed + quality), and uses short punchy sentences that scan well above the fold. 'Reimagined' is overused in SaaS and makes visitors work harder to understand the benefit. That said, test both — your audience's job title changes which resonates. Who's your primary buyer?" },
    ],
  },
  {
    id: "f7", title: "Onboarding Flow Review", tags: ["ux", "product"],
    date: "2026-03-10", dateLabel: "Mar 10", section: "older",
    content: "43% drop-off at account setup — proposed reducing 7 steps to 4.",
    messages: [
      { role: "user", text: "Our onboarding has 7 steps and we're seeing 43% drop-off at step 4 which is account setup. Ideas?" },
      { role: "assistant", text: "43% is painful but fixable. Three quick wins: 1) Move account setup to post-value (let users explore first), 2) Replace form fields with social login to cut friction instantly, 3) Add a progress bar with estimated time '2 min left'. Long term: progressive disclosure — only ask what you need now, collect the rest contextually." },
    ],
  },
  {
    id: "f8", title: "Sprint Retrospective", tags: ["team"],
    date: "2026-03-05", dateLabel: "Mar 5", section: "older",
    content: "Sprint 24 retro — shipped new dashboard, action items on PR cycle time.",
    messages: [
      { role: "user", text: "Help me facilitate a sprint retrospective for a remote team of 8. We shipped the dashboard but PR reviews are still too slow." },
      { role: "assistant", text: "Classic retrospective structure for remote: 10 min — async 'roses/thorns/buds' in a shared doc before the call. 20 min — discuss top 3 themes live. 15 min — draft 2–3 action items with owners and due dates. For slow PRs specifically: try a 24h SLA rule where any PR under 200 lines gets reviewed same-day. Who owns that commitment?" },
    ],
  },
  {
    id: "f9", title: "Design System Audit", tags: ["design"],
    date: "2026-02-28", dateLabel: "Feb 28", section: "older",
    content: "200+ components audited — 34 spacing issues, 12 deprecated colors in prod.",
    messages: [
      { role: "user", text: "I've audited our design system and found 34 spacing inconsistencies and 12 deprecated color variables still being used. Where do I start fixing this?" },
      { role: "assistant", text: "Fix the colors first — they're a visual regression risk and easier to grep. Run a codebase search for the deprecated hex values, replace with your token names, then add a lint rule to ban raw color values. For spacing: create a migration doc mapping old values to the nearest token, then tackle it component by component during regular dev cycles rather than a big bang." },
    ],
  },
  {
    id: "f10", title: "Q1 Growth Report", tags: ["analytics"],
    date: "2026-02-20", dateLabel: "Feb 20", section: "older",
    content: "18% MoM signups growth, 9% day-7 retention improvement, CAC down $12.",
    messages: [
      { role: "user", text: "Q1 numbers are in — 18% MoM signup growth but our CAC went up. How should I present this to the board?" },
      { role: "assistant", text: "Frame it as 'growth efficiency improving over time'. Lead with the wins: 18% MoM is strong, and if day-7 retention improved, LTV is rising which justifies higher CAC. Show a CAC:LTV ratio trend — if LTV is growing faster than CAC, you're in a healthy position. Boards respond better to ratios than absolutes. Want help building the slide narrative?" },
    ],
  },
  {
    id: "f15", title: "Old Feature Specs", tags: ["product"],
    date: "2026-02-10", dateLabel: "Feb 10", section: "older",
    content: "Deprecated kanban view specs — archived after low user demand signal.",
    messages: [
      { role: "user", text: "We built specs for a kanban view but user research says only 8% of our users want it. Should we still build it?" },
      { role: "assistant", text: "8% is below the threshold worth a full build unless those users are your highest-value accounts. I'd archive the spec and revisit in 6 months — if churn correlates with the absence of kanban, that's a stronger signal. Could you satisfy that 8% with a lightweight list-grouping feature instead? Less dev effort, still useful." },
    ],
  },
  {
    id: "f16", title: "Q1 OKR Review", tags: ["strategy"],
    date: "2026-01-20", dateLabel: "Jan 20", section: "older",
    content: "0.7 avg OKR score — missed NPS by 4pts, exceeded revenue by 11%.",
    messages: [
      { role: "user", text: "Our Q1 OKR score averaged 0.7. Is that considered good or should I be worried?" },
      { role: "assistant", text: "0.7 is actually the sweet spot — Google's OKR framework considers 0.6–0.7 a success, because if you're consistently hitting 1.0, your goals weren't ambitious enough. The real question is which objectives scored low and whether those misses were due to bad execution or over-ambitious targets. Which OKR scored worst?" },
    ],
  },

  // ── Project chats ──
  { id: "pf1", title: "Homepage Redesign Brief", tags: ["design"], date: "2026-03-18", dateLabel: "Mar 18", section: "project", projectId: "p1", content: "Social proof above the fold: 3 logos, video testimonial, live demo embed.", messages: [{ role: "user", text: "We're redesigning our homepage. What should go above the fold to maximise conversions for a B2B SaaS?" }, { role: "assistant", text: "For B2B SaaS, above the fold should have: (1) A clear outcome-focused headline. (2) One supporting sub-headline that names the audience. (3) Social proof — 3–5 recognisable logos or a single strong stat. (4) A primary CTA and optionally a secondary 'See demo' link. No nav clutter. Want me to critique your current draft?" }] },
  { id: "pf2", title: "SEO Content Strategy", tags: ["seo", "content"], date: "2026-03-12", dateLabel: "Mar 12", section: "project", projectId: "p1", content: "22 keywords, 4 pillar pages, 16 supporting articles planned.", messages: [{ role: "user", text: "Help me plan a content cluster strategy for our marketing site. Our main topic is project management for remote teams." }, { role: "assistant", text: "Your pillar page should target 'remote team project management' (~8k monthly searches). Supporting clusters: async communication tools, remote sprint planning, distributed team OKRs, remote onboarding checklist, and time zone management. Internally link everything back to the pillar. Want me to draft the pillar page outline first?" }] },
  { id: "pf3", title: "Component Library Notes", tags: ["design", "dev"], date: "2026-03-06", dateLabel: "Mar 6", section: "project", projectId: "p1", content: "Migrating to Radix UI — Button, Input, Modal, Tooltip done. Card in progress.", messages: [{ role: "user", text: "We're migrating our component library to Radix UI. Should I build a wrapper layer or use Radix primitives directly?" }, { role: "assistant", text: "Use a wrapper layer — always. Radix gives you accessibility primitives but your design system owns the styling and API shape. A thin wrapper like `<Button variant='primary'>` that composes Radix internals means you can swap out the underlying library later without touching every callsite." }] },
  { id: "pf4", title: "App Architecture Draft", tags: ["dev", "backend"], date: "2026-03-20", dateLabel: "Mar 20", section: "project", projectId: "p2", content: "React Native + Expo, Supabase auth/DB, Node.js edge functions, offline-first.", messages: [{ role: "user", text: "We're building a mobile app MVP with React Native. What backend should we use if we want to move fast?" }, { role: "assistant", text: "Supabase is the fastest path for MVP: Postgres DB, auth, storage, and edge functions in one platform with good React Native SDKs. Pair it with Expo for the front-end to skip the native build complexity." }] },
  { id: "pf5", title: "User Flow Wireframes", tags: ["ux", "design"], date: "2026-03-19", dateLabel: "Mar 19", section: "project", projectId: "p2", content: "12 flows mapped — 88% task completion rate in prototype testing with 5 users.", messages: [{ role: "user", text: "I mapped 12 user flows for our mobile app. How do I prioritise which ones to build first for the MVP?" }, { role: "assistant", text: "Apply a two-axis framework: Frequency of use vs. Criticality to core value. Flows that are both high-frequency AND critical go first." }] },
  { id: "pf6", title: "API Endpoints Spec", tags: ["dev"], date: "2026-03-14", dateLabel: "Mar 14", section: "project", projectId: "p2", content: "34 REST endpoints, 100 req/min rate limit, OpenAPI 3.0 spec exported.", messages: [{ role: "user", text: "Should our mobile app use REST or GraphQL for the API? We have about 34 endpoints planned." }, { role: "assistant", text: "For a mobile MVP with 34 endpoints, REST is the right call. GraphQL's benefits pay off at scale with complex data graphs — at 34 endpoints you'll spend more time on the GraphQL infra than it saves you." }] },
  { id: "pf7", title: "Automation Scripts", tags: ["dev"], date: "2026-03-08", dateLabel: "Mar 8", section: "project", projectId: "p3", content: "Python scripts: Slack digests, Notion DB cleanup, GitHub auto-assign by file ownership.", messages: [{ role: "user", text: "I want to auto-assign GitHub issues to the right team member based on which files they've touched most. How do I build that?" }, { role: "assistant", text: "Use `git log --follow` to build a file-to-author ownership map, then expose it as a JSON config. In a GitHub Actions workflow, when an issue is opened, parse the issue body or linked PR diff for file paths, look up ownership, and use the GitHub API to assign." }] },
  { id: "pf8", title: "Dashboard Mockup", tags: ["design", "ux"], date: "2026-03-02", dateLabel: "Mar 2", section: "project", projectId: "p3", content: "Internal ops dashboard — deployments, on-call, support backlog, infra costs.", messages: [{ role: "user", text: "Design me an internal ops dashboard concept." }, { role: "assistant", text: "Top row = 4 KPI cards (deployments today, active incidents, open P1 tickets, this month's AWS spend vs budget). Below: 2-column layout — left column has a deployment timeline feed, right column has on-call roster + support queue sorted by severity." }] },
  { id: "pf9", title: "April Blog Schedule", tags: ["content"], date: "2026-03-17", dateLabel: "Mar 17", section: "project", projectId: "p4", content: "8 articles in April — 3 thought leadership, 3 how-tos, 2 customer stories.", messages: [{ role: "user", text: "Give me 3 thought leadership blog topics for April that would resonate with startup CTOs." }, { role: "assistant", text: "1. 'The hidden cost of your internal tooling debt'\n2. 'Why we stopped doing daily standups (and what we do instead)'\n3. 'Hiring your first AI engineer: what nobody tells you'" }] },
  { id: "pf10",type: "file", section: "project", projectId: "p4", name: "Social Media Calendar",   tags: ["marketing"],            content: "LinkedIn: 5/week carousels. Twitter: 2x daily.",           chat:[{role:"user",text:"Our LinkedIn posts get decent reach but almost no clicks."},{role:"ai",text:"LinkedIn's algorithm suppresses posts with links — write the full value in the post, link in first comment."}],        date:"2026-03-07", dateLabel:"Mar 7"},
  { id: "pf11",type: "file", section: "project", projectId: "p5", name: "Interview Transcripts",   tags: ["research", "ux"],        content: "12 enterprise interviews — pain: no SSO, audit logs.",    chat:[{role:"user",text:"I finished 12 enterprise buyer interviews. Top 3 pain points: no SSO, poor audit logs, no bulk admin."},{role:"ai",text:"SSO first — it's a hard blocker for enterprise procurement."}],              date:"2026-03-15", dateLabel:"Mar 15"},
  { id: "pf12",type: "file", section: "project", projectId: "p5", name: "Persona Definitions",     tags: ["research", "ux"],        content: "3 personas: Pragmatic PM, Scaling Founder, Enterprise Admin.", chat:[{role:"user",text:"Help me write 3 user personas for our B2B SaaS."},{role:"ai",text:"1. Pragmatic PM — wants speed and integrations\n2. Scaling Founder — needs visibility across teams\n3. Enterprise Admin — needs control and audit trails"}],date:"2026-03-11", dateLabel:"Mar 11"},
];

export const CHAT_MAP: Record<string, ChatData> = Object.fromEntries(
  ALL_CHATS.map((c) => [c.id, c])
);

export const PROJECT_CHATS = (projectId: string) =>
  ALL_CHATS.filter((c) => c.section === "project" && c.projectId === projectId);

// Default state sets
export const DEFAULT_PINNED_IDS   = new Set(["f11", "f12"]);
export const DEFAULT_FAVORITE_IDS = new Set(["f13", "f14"]);
export const DEFAULT_ARCHIVE_IDS  = new Set(["f15", "f16"]);

// ─── Topic detection ──────────────────────────────────────────────────────────

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  dev:         ["code", "api", "function", "bug", "debug", "refactor", "deploy", "backend", "frontend", "auth", "jwt", "oauth", "webhook", "endpoint", "react", "database", "sql"],
  ux:          ["user", "design", "interface", "ux", "wireframe", "prototype", "onboarding", "flow", "persona", "usability", "interview", "journey"],
  marketing:   ["seo", "campaign", "email", "copy", "brand", "content", "landing", "ctr", "conversion", "keyword", "traffic", "funnel"],
  fitness:     ["workout", "exercise", "gym", "hiit", "calories", "nutrition", "training", "diet", "bodyweight", "squat", "pushup", "run"],
  immigration: ["visa", "canada", "passport", "immigration", "residency", "permit", "expat", "nomad", "nationality", "citizenship"],
  finance:     ["revenue", "arr", "cac", "ltv", "okr", "growth", "mrr", "metric", "kpi", "profit", "budget", "board"],
  research:    ["interview", "survey", "synthesis", "insight", "analysis", "finding", "respondent", "data"],
  product:     ["roadmap", "feature", "release", "sprint", "backlog", "epic", "milestone", "launch"],
};

export function detectTopic(text: string): string {
  const lc = text.toLowerCase();
  let maxScore = 0;
  let topic = "general";
  for (const [t, kws] of Object.entries(TOPIC_KEYWORDS)) {
    const score = kws.filter((k) => lc.includes(k)).length;
    if (score > maxScore) { maxScore = score; topic = t; }
  }
  return topic;
}

// ─── Chat title generation ────────────────────────────────────────────────────

export function generateChatTitle(message: string): string {
  const lc = message.toLowerCase();
  if (lc.includes("refactor") && (lc.includes("auth") || lc.includes("jwt"))) return "Auth Module Refactoring";
  if (lc.includes("seo") || lc.includes("web vital") || lc.includes("lcp"))    return "SEO Performance Review";
  if (lc.includes("user interview") || (lc.includes("interview") && lc.includes("onboard"))) return "User Research Synthesis";
  if (lc.includes("sprint") && lc.includes("retrospective")) return "Sprint Retrospective Notes";
  if (lc.includes("roadmap"))                              return "Product Roadmap Planning";
  if (lc.includes("brand voice") || (lc.includes("brand") && lc.includes("voice"))) return "Brand Voice Guidelines";
  if (lc.includes("competitor") || lc.includes("competitive")) return "Competitive Analysis";
  if (lc.includes("design system"))                        return "Design System Review";
  if (lc.includes("landing page") || lc.includes("homepage")) return "Landing Page Strategy";
  if (lc.includes("workout") || lc.includes("hiit"))       return "Workout Plan Session";
  if (lc.includes("visa") || lc.includes("immigration"))   return "Immigration & Visa Guide";
  if (lc.includes("email") && lc.includes("campaign"))     return "Email Campaign Planning";
  if (lc.includes("okr") || lc.includes("objective"))      return "OKRs & Goals Review";
  if (lc.includes("growth") || lc.includes("mrr") || lc.includes("arr")) return "Growth Metrics Analysis";
  if (lc.includes("onboard"))                              return "Onboarding Optimization";
  if (lc.includes("api") || lc.includes("endpoint"))       return "API Design Session";
  if (lc.includes("stripe") || lc.includes("integration") || lc.includes("webhook")) return "Integration Planning";
  if (lc.includes("content") || lc.includes("blog"))       return "Content Strategy Session";
  if (lc.includes("persona") || lc.includes("personas"))   return "User Persona Definitions";
  if (lc.includes("retrospect"))                            return "Sprint Retrospective";
  if (lc.includes("dashboard"))                             return "Dashboard Design Session";
  // Fallback: extract 4 significant words
  const STOP = new Set(["about","would","could","should","their","there","where","which","these","those","help","want","need","have","what","with","that","this","from","also","just","make","more","some","when","than"]);
  const words = message.replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w.toLowerCase())).slice(0, 4);
  if (words.length === 0) return "New Chat";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/** Live title suggestions as user types in rename input */
export function getDynamicTitleSuggestions(
  draft: string,
  messages: ChatMessage[],
  currentTitle: string,
): string[] {
  const results: string[] = [];

  // 1. Generated from draft text
  if (draft.trim().length > 3) {
    const gen = generateChatTitle(draft);
    if (gen && gen !== currentTitle) results.push(gen);
  }

  // 2. Generated from first user message (context-aware)
  const firstUser = messages.find((m) => m.role === "user")?.text ?? "";
  if (firstUser) {
    const ctx = generateChatTitle(firstUser);
    if (ctx && ctx !== currentTitle && !results.includes(ctx)) results.push(ctx);
  }

  // 3. Topic-based suggestions from full conversation
  const allText = [draft, ...messages.map((m) => m.text)].join(" ");
  const topic   = detectTopic(allText);
  const domain  = DOMAIN_SUGGESTIONS[topic] ?? DOMAIN_SUGGESTIONS.general;
  domain.titles.forEach((t) => {
    if (!results.includes(t) && t !== currentTitle) results.push(t);
  });

  // 4. Filter to suggestions that share chars with draft (fuzzy relevance)
  const draftLc = draft.toLowerCase();
  const relevant = draftLc.length > 1
    ? results.sort((a, b) => {
        const aMatch = a.toLowerCase().includes(draftLc) ? -1 : 0;
        const bMatch = b.toLowerCase().includes(draftLc) ? -1 : 0;
        return aMatch - bMatch;
      })
    : results;

  return relevant.slice(0, 4);
}

/** Generate a combined multi-topic title */
export function generateMultiTopicTitle(topic1: string, topic2: string, messages: ChatMessage[]): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Try to use specific label for each topic
  const TOPIC_LABELS: Record<string, string> = {
    dev: "Engineering", ux: "UX Design", marketing: "Marketing",
    fitness: "Fitness", immigration: "Immigration", finance: "Finance",
    research: "Research", product: "Product", general: "General",
  };

  const label1 = TOPIC_LABELS[topic1] ?? cap(topic1);
  const label2 = TOPIC_LABELS[topic2] ?? cap(topic2);

  if (topic1 === "general") return `${label2} & More`;
  if (topic2 === "general") return `${label1} & More`;
  return `${label1} · ${label2}`;
}

// ─── Rename suggestions ───────────────────────────────────────────────────────

const DOMAIN_SUGGESTIONS: Record<string, { titles: string[]; tags: string[] }> = {
  dev:         { titles: ["Technical Architecture Notes", "Engineering Deep Dive", "Backend Dev Session"],     tags: ["backend", "architecture", "api", "devops"] },
  ux:          { titles: ["UX Research Synthesis", "User Flow Analysis", "Design Review Notes"],               tags: ["ux", "design", "research", "prototype"] },
  marketing:   { titles: ["Marketing Strategy Notes", "Campaign Planning Session", "Growth & Content Plan"],   tags: ["marketing", "content", "brand", "growth"] },
  fitness:     { titles: ["Fitness & Workout Plan", "Training Session Notes", "Health & Exercise Guide"],      tags: ["fitness", "health", "workout"] },
  immigration: { titles: ["Immigration Options Review", "Visa & Residency Guide", "Relocation Planning"],      tags: ["immigration", "visa", "expat"] },
  finance:     { titles: ["Growth Metrics Review", "Business Analytics Session", "Revenue & KPIs Notes"],      tags: ["analytics", "metrics", "finance"] },
  research:    { titles: ["Research Synthesis Notes", "Insights & Analysis", "Data Review Session"],           tags: ["research", "insights", "data"] },
  product:     { titles: ["Product Strategy Session", "Feature Planning Notes", "Roadmap Deep Dive"],          tags: ["product", "strategy", "planning"] },
  general:     { titles: ["General Notes & Ideas", "Brainstorm Session", "Quick Reference Notes"],             tags: ["notes", "ideas"] },
};

export function getRenameSuggestions(
  tags: string[],
  messages: ChatMessage[],
  currentTitle: string,
): { titles: string[]; suggestedTags: string[] } {
  const text  = messages.map((m) => m.text).join(" ");
  const topic = detectTopic(text);
  const domain = DOMAIN_SUGGESTIONS[topic] ?? DOMAIN_SUGGESTIONS.general;
  return {
    titles:       domain.titles.filter((t) => t !== currentTitle).slice(0, 3),
    suggestedTags: domain.tags.filter((t)  => !tags.includes(t)).slice(0, 5),
  };
}

/** All known tags across the whole dataset (for filter UI) */
export const ALL_KNOWN_TAGS = Array.from(
  new Set(ALL_CHATS.flatMap((c) => c.tags))
).sort();