import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search, Grid2x2, List, Folder, FolderOpen, FileText,
  ChevronRight, ChevronDown, Home, Star, Pin, Archive, Clock,
  X, SlidersHorizontal, MoreHorizontal, Tag,
  Pencil, Trash2, FolderInput, Share2, Lightbulb, Plus,
  CalendarDays, User, Bot, ArrowLeft,
  RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, Paperclip, Mic,
  FolderPlus, Check, ArchiveRestore, Users, MessageSquarePlus,
  ChevronLeft, ArrowUpDown, Type,
} from "lucide-react";
import type { Project } from "../App";
import {
  getDynamicTitleSuggestions, getRenameSuggestions,
  SessionChat, generateChatTitle,
} from "../data/chatData";
// Note: DesktopView uses its own local allFiles/allFolders static data
import { ShareModal, GroupChatModal, MoveToProjectMenu, DeleteConfirmModal, RecycleBinModal } from "./Modals";
import type { RecycleBinItem } from "./Modals";

// ─── Onboarding Tour ──────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  {
    target: "new-chat-btn",
    title: "Create New Chat",
    description: "Click the + icon to start a new conversation. Each chat is automatically saved and fully searchable from the explorer.",
    color: "#FF8F5C",
  },
  {
    target: "new-folder-btn",
    title: "Create New Folder",
    description: "Click the folder+ icon to create project folders. Organize related chats together for easy access and management.",
    color: "#6366F1",
  },
  {
    target: "filter-btn",
    title: "Filter Conversations",
    description: "Use the sliders icon to open filters. Filter by tags (purple pills) or by date range (calendar picker with custom range support).",
    color: "#10B981",
  },
  {
    target: "sort-btn",
    title: "Sort Your Chats",
    description: "Sort your view using three modes: by date (clock icon), by name (A-Z icon), or by tags (tag icon). The active sort is shown in purple.",
    color: "#8B5CF6",
  },
  {
    target: "view-toggle",
    title: "Switch Views",
    description: "Toggle between Grid view (card layout with previews) and List view (compact rows with dates). Use grid for browsing, list for scanning.",
    color: "#F59E0B",
  },
  {
    target: "rename-feature",
    title: "Smart Rename & Tags",
    description: "Click the pencil icon or any chat title to rename. Get AI-powered title suggestions (orange), auto-suggested tags (purple), and add your own custom tags (green input).",
    color: "#EC4899",
  },
  {
    target: "multi-topic",
    title: "Multi-Topic Detection",
    description: "Conversations covering multiple subjects are automatically flagged with a purple 'Multi-topic' badge. AI suggests splitting tags for better organization.",
    color: "#7C5CD6",
  },
];

const STEP_ICONS = [
  <Plus size={18} key="0" />,
  <FolderPlus size={18} key="1" />,
  <SlidersHorizontal size={18} key="2" />,
  <ArrowUpDown size={18} key="3" />,
  <span key="4" className="flex items-center gap-1"><Grid2x2 size={14} /><List size={14} /></span>,
  <Pencil size={18} key="5" />,
  <Users size={18} key="6" />,
];

function OnboardingTour({ currentStep, onNext, onBack, onSkip, onFinish }: {
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const step = ONBOARDING_STEPS[currentStep];
  const totalSteps = ONBOARDING_STEPS.length;
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" style={{ animation: "fadeInScale 0.25s ease-out" }}>
        <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === currentStep ? 24 : 8, background: i <= currentStep ? step.color : "#E5E7EB" }} />
            ))}
          </div>
          <span className="text-[12px] text-[#999]">{currentStep + 1} / {totalSteps}</span>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md"
          style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`, color: "white" }}>
          {STEP_ICONS[currentStep]}
        </div>
        <h3 className="text-[18px] text-[#111] mb-2" style={{ letterSpacing: "-0.3px" }}>{step.title}</h3>
        <p className="text-[14px] text-[#666] leading-relaxed mb-6">{step.description}</p>
        <div className="flex items-center justify-between">
          <button onClick={onSkip} className="text-[13px] text-[#999] hover:text-[#555] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5]">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button onClick={onBack}
                className="px-4 py-2 rounded-xl text-[13px] border border-[#ddd] text-[#666] hover:bg-[#f5f5f5] transition-all">
                ← Back
              </button>
            )}
            <button onClick={isLast ? onFinish : onNext}
              className="px-5 py-2 rounded-xl text-white text-[13px] transition-all hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}CC)` }}>
              {isLast ? "Get Started!" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode   = "grid" | "list";
type SortBy     = "name" | "date" | "tags";
type FilterTab  = "tags" | "date";
type DateFilter = "all" | "today" | "yesterday" | "week" | "month" | "custom";

interface ChatMessage { role: "user" | "ai"; text: string; }

interface FileItem {
  id: string; type: "file"; name: string;
  tags: string[]; suggestedTags?: string[];
  content: string;
  chat: ChatMessage[];
  date: string; dateLabel: string;
  section: string; projectId?: string;
  isDualTopic?: boolean;
}

interface FolderItem {
  id: string; type: "folder"; name: string;
  count: number; tags: string[];
  date: string; dateLabel: string;
}

type Item = FileItem | FolderItem;

interface TreeNodeDef {
  id: string; label: string;
  icon: React.ReactNode; openIcon?: React.ReactNode;
  children?: TreeNodeDef[];
  isFile?: boolean;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const allFolders: FolderItem[] = [
  { id: "p1", type: "folder", name: "Marketing Site Redesign", count: 3, tags: ["design", "seo"],          date: "2026-03-18", dateLabel: "Mar 18"  },
  { id: "p2", type: "folder", name: "Mobile App MVP",          count: 3, tags: ["dev", "ux"],               date: "2026-03-20", dateLabel: "Mar 20"  },
  { id: "p3", type: "folder", name: "Internal Tooling",        count: 2, tags: ["dev"],                     date: "2026-03-08", dateLabel: "Mar 8" },
  { id: "p4", type: "folder", name: "Q2 Content Calendar",     count: 2, tags: ["content", "marketing"],    date: "2026-03-17", dateLabel: "Mar 17"  },
  { id: "p5", type: "folder", name: "Customer Research Hub",   count: 2, tags: ["research", "ux"],          date: "2026-03-15", dateLabel: "Mar 15" },
];

const allFiles: FileItem[] = [
  { id:"f1",  type:"file", section:"today",     name:"Refactor Auth Module",                       tags:["dev","backend"],        content:"JWT + OAuth split, refresh token rotation.",     chat:[{role:"user",text:"I want to refactor our auth module — right now it handles both JWT and OAuth in one file and it's getting messy."},{role:"ai",text:"Good call. The cleanest split is a dedicated `JwtService` for token issuance and validation, and an `OAuthService` for provider flows. For refresh token rotation, generate a new pair on each use and immediately invalidate the old token. Want me to sketch out the folder structure?"}],                                                                               date:"2026-03-22", dateLabel:"Today"    },
  { id:"f2",  type:"file", section:"today",     name:"SEO Audit Summary",                          tags:["seo"],                   content:"Core web vitals review, 12 missing meta descriptions.", chat:[{role:"user",text:"Can you help me interpret these core web vitals scores? LCP is 3.8s on our pricing page."},{role:"ai",text:"3.8s LCP is in the 'Needs Improvement' range — Google's threshold is under 2.5s for 'Good'."}],                                                                                                                                                                          date:"2026-03-22", dateLabel:"Today"    },
  { id:"f3",  type:"file", section:"today",     name:"User Interview Synthesis",                   tags:["ux","research"],         content:"8 interviews — users abandon onboarding at step 3.", chat:[{role:"user",text:"I've finished 8 user interviews. Everyone seems to drop off around step 3 of onboarding but I'm not sure why."},{role:"ai",text:"That's a classic 'value gap' moment. Step 3 is usually where the product asks for effort before the user has seen any value yet."}],                                                                                                                   date:"2026-03-22", dateLabel:"Today"    },
  { id:"f11", type:"file", section:"today",     name:"Product Roadmap Q2",                         tags:["strategy","planning"],   content:"AI search, team collaboration, mobile beta — 14 epics.", chat:[{role:"user",text:"I need to build a Q2 roadmap. Our three big bets are AI search, team collaboration features, and mobile beta. How do I sequence them?"},{role:"ai",text:"Sequence by dependency and risk: Start mobile beta in Week 1 since it's the longest feedback loop."}],                                                                                                                  date:"2026-03-22", dateLabel:"Today"    },
  { id:"f13", type:"file", section:"today",     name:"Weekly Standup Notes",                       tags:["team","recap"],          content:"Week of Mar 20 — shipped search v2, 3 bugs fixed.",    chat:[{role:"user",text:"Summarise this week's standup notes into a shareable async update for stakeholders."},{role:"ai",text:"Week of Mar 20 — Team Update\n✅ Shipped search v2\n🐛 Resolved 3 critical bugs\n👋 Welcomed 2 new engineers"}],                                                                                                                                                           date:"2026-03-22", dateLabel:"Today"    },
  { id:"f4",  type:"file", section:"yesterday", name:"Competitor Analysis",                        tags:["research"],              content:"6 SaaS tools benchmarked — Notion & Linear top NPS.",  chat:[{role:"user",text:"Help me structure a competitive analysis for our project management tool — I need to compare us against Notion, Linear, and Asana."},{role:"ai",text:"I'd suggest a 5-axis scorecard: Pricing model, Core feature depth, Collaboration UX, Integrations ecosystem, and Mobile experience."}],                                                                                       date:"2026-03-21", dateLabel:"Yesterday"},
  { id:"f5",  type:"file", section:"yesterday", name:"Email Campaign Draft",                       tags:["email","copy"],          content:"3 subject line variants for April launch.",              chat:[{role:"user",text:"Write 3 subject line options for our product launch email targeting trial users."},{role:"ai",text:"1. \"Find anything in seconds — your AI search is live\"\n2. \"You asked for faster search. We listened.\"\n3. \"Stop scrolling. Start finding.\""}],                                                                                                                        date:"2026-03-21", dateLabel:"Yesterday"},
  { id:"f_dual",type:"file",section:"yesterday",name:"Morning Workout Tips · Immigration Visa Guide",tags:["fitness","immigration","multi-topic"],suggestedTags:["visa","expat","HIIT","nutrition"],isDualTopic:true, content:"5am HIIT plan then Canadian visa options.",       chat:[{role:"user",text:"I want a 5am HIIT workout routine I can do in 30 minutes with no equipment."},{role:"ai",text:"Perfect — here's a 30-min bodyweight circuit: 5 min warm-up → 4 rounds of (20 burpees, 15 push-ups, 20 jump squats, 30s plank)."},{role:"user",text:"Also — I'm thinking of moving to Canada from the US, what visa options do I have?"},{role:"ai",text:"For Canada from the US: Express Entry (skilled workers, ~6 months), Intra-Company Transfer, or the Startup Visa."}], date:"2026-03-21", dateLabel:"Yesterday"},
  { id:"f12", type:"file", section:"yesterday", name:"Brand Voice Guidelines",                     tags:["brand","copy"],          content:"Tone: confident, clear, human. 20 rewrites included.",  chat:[{role:"user",text:"We need to define a brand voice. We're a B2B SaaS, we want to sound human but not too casual."},{role:"ai",text:"I'd describe that voice as 'Direct with warmth' — confident enough to say what you mean without hedging, but never cold or corporate."}],                                                                                                                     date:"2026-03-21", dateLabel:"Yesterday"},
  { id:"f6",  type:"file", section:"older",     name:"API Integration Plan",                       tags:["dev"],                   content:"Stripe, SendGrid, Segment map with webhook retry.",     chat:[{role:"user",text:"We're integrating Stripe, SendGrid, and Segment. What's the safest order to do this?"},{role:"ai",text:"Start with Stripe — it's the most business-critical. Implement idempotency keys on all payment webhooks."}],                                                                                                                                                          date:"2026-03-15", dateLabel:"Mar 15"  },
  { id:"f14", type:"file", section:"older",     name:"Landing Page Copy Draft",                    tags:["marketing"],             content:"'Think faster. Build smarter.' — 34% vs 28% CTR.",      chat:[{role:"user",text:"Which landing page headline do you think will convert better: 'Think faster. Build smarter.' or 'Your AI workspace, reimagined.'?"},{role:"ai",text:"'Think faster. Build smarter.' will likely win. It's action-oriented and speaks to outcomes."}],                                                                                                                          date:"2026-03-15", dateLabel:"Mar 15"  },
  { id:"f7",  type:"file", section:"older",     name:"Onboarding Flow Review",                     tags:["ux","product"],          content:"43% drop-off at account setup — cut 7 steps to 4.",     chat:[{role:"user",text:"Our onboarding has 7 steps and we're seeing 43% drop-off at step 4."},{role:"ai",text:"43% is painful but fixable. Three quick wins: 1) Move account setup to post-value, 2) Social login, 3) Progress bar."}],                                                                                                                                                             date:"2026-03-10", dateLabel:"Mar 10"  },
  { id:"f8",  type:"file", section:"older",     name:"Sprint Retrospective",                       tags:["team"],                  content:"Sprint 24 retro — shipped dashboard, action items on PR.", chat:[{role:"user",text:"Help me facilitate a sprint retrospective for a remote team of 8."},{role:"ai",text:"Classic retrospective structure for remote: 10 min async 'roses/thorns/buds' → 20 min live discussion → 15 min action items."}],                                                                                                                                                  date:"2026-03-05", dateLabel:"Mar 5"  },
  { id:"f9",  type:"file", section:"older",     name:"Design System Audit",                        tags:["design"],                content:"200+ components — 34 spacing issues, 12 deprecated colors.", chat:[{role:"user",text:"I've audited our design system and found 34 spacing inconsistencies and 12 deprecated color variables."},{role:"ai",text:"Fix the colors first — they're a visual regression risk and easier to grep."}],                                                                                                                                                            date:"2026-02-28", dateLabel:"Feb 28"  },
  { id:"f10", type:"file", section:"older",     name:"Q1 Growth Report",                           tags:["analytics"],             content:"18% MoM signup growth, 9% day-7 retention improvement.", chat:[{role:"user",text:"Q1 numbers are in — 18% MoM signup growth but our CAC went up."},{role:"ai",text:"Frame it as 'growth efficiency improving over time'. Lead with the wins."}],                                                                                                                                                                                                             date:"2026-02-20", dateLabel:"Feb 20"   },
  { id:"f15", type:"file", section:"older",     name:"Old Feature Specs",                          tags:["product"],               content:"Deprecated kanban view specs — archived after low demand.", chat:[{role:"user",text:"We built specs for a kanban view but user research says only 8% of users want it."},{role:"ai",text:"8% is below the threshold worth a full build. I'd archive the spec and revisit in 6 months."}],                                                                                                                                                                  date:"2026-02-10", dateLabel:"Feb 10"  },
  { id:"f16", type:"file", section:"older",     name:"Q1 OKR Review",                              tags:["strategy"],              content:"0.7 avg OKR score — missed NPS, exceeded revenue.",       chat:[{role:"user",text:"Our Q1 OKR score averaged 0.7. Is that considered good or should I be worried?"},{role:"ai",text:"0.7 is actually the sweet spot — Google's OKR framework considers 0.6–0.7 a success."}],                                                                                                                                                                               date:"2026-01-20", dateLabel:"Jan 20"   },
  // ── p1: Marketing Site Redesign ──
  { id:"pf1", type:"file", section:"project", projectId:"p1", name:"Homepage Redesign Brief", tags:["design"],               content:"Social proof above fold: 3 logos, video testimonial.", chat:[{role:"user",text:"We're redesigning our homepage. What should go above the fold to maximise conversions for a B2B SaaS?"},{role:"ai",text:"Above the fold should have: (1) outcome-focused headline (2) social proof (3) primary CTA."}], date:"2026-03-18", dateLabel:"Mar 18" },
  { id:"pf2", type:"file", section:"project", projectId:"p1", name:"SEO Content Strategy",    tags:["seo","content"],        content:"22 keywords, 4 pillar pages, 16 articles planned.",    chat:[{role:"user",text:"Help me plan a content cluster strategy for our marketing site."},{role:"ai",text:"Your pillar page should target 'remote team project management' (~8k monthly searches)."}],                          date:"2026-03-12", dateLabel:"Mar 12"},
  { id:"pf3", type:"file", section:"project", projectId:"p1", name:"Component Library Notes", tags:["design","dev"],         content:"Migrating to Radix UI — Button, Input, Modal done.",    chat:[{role:"user",text:"We're migrating our component library to Radix UI."},{role:"ai",text:"Use a wrapper layer — always. Radix gives you accessibility primitives but your design system owns the styling."}],             date:"2026-03-06", dateLabel:"Mar 6"},
  // ── p2: Mobile App MVP ──
  { id:"pf4", type:"file", section:"project", projectId:"p2", name:"App Architecture Draft",  tags:["dev","backend"],        content:"React Native + Expo, Supabase, offline-first.",         chat:[{role:"user",text:"We're building a mobile app MVP with React Native. What backend should we use?"},{role:"ai",text:"Supabase is the fastest path for MVP: Postgres DB, auth, storage, and edge functions in one platform."}],date:"2026-03-20", dateLabel:"Mar 20" },
  { id:"pf5", type:"file", section:"project", projectId:"p2", name:"User Flow Wireframes",    tags:["ux","design"],          content:"12 flows — 88% task completion in prototype testing.",    chat:[{role:"user",text:"I mapped 12 user flows for our mobile app."},{role:"ai",text:"Apply a two-axis framework: Frequency of use vs. Criticality to core value."}],                                                        date:"2026-03-19", dateLabel:"Mar 19" },
  { id:"pf6", type:"file", section:"project", projectId:"p2", name:"API Endpoints Spec",      tags:["dev"],                  content:"34 REST endpoints, 100 req/min, OpenAPI 3.0 exported.", chat:[{role:"user",text:"Should our mobile app use REST or GraphQL? We have about 34 endpoints planned."},{role:"ai",text:"For a mobile MVP with 34 endpoints, REST is the right call."}],                                       date:"2026-03-14", dateLabel:"Mar 14"},
  // ── p3: Internal Tooling ──
  { id:"pf7", type:"file", section:"project", projectId:"p3", name:"Automation Scripts",      tags:["dev"],                  content:"Python: Slack digests, Notion cleanup, GitHub auto-assign.", chat:[{role:"user",text:"I want to auto-assign GitHub issues based on which files they've touched."},{role:"ai",text:"Use git log --follow to build a file-to-author ownership map."}],                                     date:"2026-03-08", dateLabel:"Mar 8"},
  { id:"pf8", type:"file", section:"project", projectId:"p3", name:"Dashboard Mockup",        tags:["design","ux"],          content:"Ops dashboard — deployments, on-call, support, costs.",   chat:[{role:"user",text:"Design me an internal ops dashboard concept."},{role:"ai",text:"Top row = 4 KPI cards. Below: deployment timeline feed + on-call roster."}],                                                        date:"2026-03-02", dateLabel:"Mar 2"},
  // ── p4: Q2 Content Calendar ──
  { id:"pf9", type:"file", section:"project", projectId:"p4", name:"April Blog Schedule",     tags:["content"],              content:"8 articles in April — 3 thought leadership, 3 how-tos.", chat:[{role:"user",text:"Give me 3 thought leadership blog topics for April that would resonate with startup CTOs."},{role:"ai",text:"1. 'The hidden cost of your internal tooling debt'\n2. 'Why we stopped doing daily standups'\n3. 'Hiring your first AI engineer'"}],date:"2026-03-17", dateLabel:"Mar 17"},
  { id:"pf10",type:"file", section:"project", projectId:"p4", name:"Social Media Calendar",   tags:["marketing"],            content:"LinkedIn: 5/week carousels. Twitter: 2x daily.",           chat:[{role:"user",text:"Our LinkedIn posts get decent reach but almost no clicks."},{role:"ai",text:"LinkedIn's algorithm suppresses posts with links — write the full value in the post, link in first comment."}],        date:"2026-03-07", dateLabel:"Mar 7"},
  // ── p5: Customer Research Hub ──
  { id:"pf11",type:"file", section:"project", projectId:"p5", name:"Interview Transcripts",   tags:["research","ux"],        content:"12 enterprise interviews — pain: no SSO, audit logs.",    chat:[{role:"user",text:"I finished 12 enterprise buyer interviews. Top 3 pain points: no SSO, poor audit logs, no bulk admin."},{role:"ai",text:"SSO first — it's a hard blocker for enterprise procurement."}],              date:"2026-03-15", dateLabel:"Mar 15"},
  { id:"pf12",type:"file", section:"project", projectId:"p5", name:"Persona Definitions",     tags:["research","ux"],        content:"3 personas: Pragmatic PM, Scaling Founder, Enterprise Admin.", chat:[{role:"user",text:"Help me write 3 user personas for our B2B SaaS."},{role:"ai",text:"1. Pragmatic PM — wants speed and integrations\n2. Scaling Founder — needs visibility across teams\n3. Enterprise Admin — needs control and audit trails"}],date:"2026-03-11", dateLabel:"Mar 11"},
];

const allTags = Array.from(new Set(allFiles.flatMap((f) => f.tags)));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyDateFilter(items: Item[], df: DateFilter, customDateStart?: string | null, customDateEnd?: string | null): Item[] {
  if (df === "all") return items;
  return items.filter((item) => {
    const d = item.date;
    if (df === "today")     return d >= "2026-03-22";
    if (df === "yesterday") return d === "2026-03-21";
    if (df === "week")      return d >= "2026-03-15";
    if (df === "month")     return d >= "2026-02-22";
    if (df === "custom") {
      const hasStart = customDateStart !== null;
      const hasEnd = customDateEnd !== null;
      if (!hasStart && !hasEnd) return true;
      if (hasStart && !hasEnd) return d >= customDateStart;
      if (!hasStart && hasEnd) return d <= customDateEnd;
      return d >= customDateStart && d <= customDateEnd;
    }
    return true;
  });
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function matchesQuery(text: string, q: string): boolean {
  if (!q.trim()) return true;
  try { return text.toLowerCase().includes(q.toLowerCase()); } catch { return false; }
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  try {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#ffe98a] text-[#111] rounded-sm px-[1px]">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  } catch { return text; }
}

function getSnippet(text: string, q: string, radius = 55): string {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  const start = Math.max(0, idx - radius);
  const end   = Math.min(text.length, idx + q.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

function getLocationLabel(item: Item, folders: FolderItem[]): string {
  if (item.type === "folder") return "Projects";
  const f = item as FileItem;
  if (f.section === "project" && f.projectId) {
    const folder = folders.find((p) => p.id === f.projectId);
    return folder ? `Projects › ${folder.name}` : "Projects";
  }
  const map: Record<string, string> = { today: "Today", yesterday: "Yesterday", older: "Older", pinned: "Pinned", favorites: "Favorites", archive: "Archive" };
  return map[f.section] ?? "Chats";
}

// ─── Inline Rename Panel (self-contained state, no parent re-render bug) ──────

function InlineRenamePanel({ item, initialDraft, onCommit, onCancel }: {
  item: FileItem | FolderItem;
  initialDraft: string;
  onCommit: (title: string, tags: string[]) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft]           = useState(initialDraft);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const messages = item.type === "file"
    ? (item as FileItem).chat.map((m) => ({ role: m.role === "ai" ? "assistant" as const : "user" as const, text: m.text }))
    : [];

  const activeTags = item.tags.filter((t) => !removedTags.includes(t));
  const liveSuggestions = getDynamicTitleSuggestions(draft, messages, initialDraft);
  const { suggestedTags } = getRenameSuggestions(item.tags, messages, initialDraft);

  const toggleTag = (t: string) => setPendingTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const removeExistingTag = (t: string) => setRemovedTags((p) => [...p, t]);

  const addCustomTag = () => {
    const t = customTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !pendingTags.includes(t) && !activeTags.includes(t)) setPendingTags((p) => [...p, t]);
    setCustomTagInput("");
  };

  const commit = () => onCommit(draft.trim() || initialDraft, [...activeTags, ...pendingTags]);

  return (
    <div className="p-3 bg-white border border-[#e0e0e0] rounded-xl mt-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
      {/* Title input */}
      <div className="flex items-center gap-2 mb-2.5">
        <Pencil size={12} className="text-[#FF8F5C] shrink-0" />
        <input ref={inputRef} type="text" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
          className="w-full text-[12px] border border-[#e0e0e0] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#FF8F5C] focus:ring-1 focus:ring-[#FF8F5C]/20 transition-all"
          placeholder="Enter a title…" />
      </div>

      {/* Existing tags (removable) */}
      {activeTags.length > 0 && (
        <div className="mb-2.5 p-2 rounded-lg bg-[#F9FAFB] border border-[#D1D5DB]">
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wide mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Tag size={10} className="text-[#6B7280]" />Current Tags</span>
            <span className="text-[9px] text-[#9CA3AF] italic normal-case">click × to remove</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeTags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10px] bg-white text-[#374151] border border-[#D1D5DB] rounded-full px-2.5 py-[3px] font-semibold hover:border-[#EF4444] hover:bg-[#FEF2F2] transition-all">
                #{t}
                <button onClick={() => removeExistingTag(t)} title={`Remove #${t}`}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
                  <X size={9} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI live suggestions */}
      {liveSuggestions.length > 0 && (
        <div className="mb-2.5 p-2 rounded-lg bg-gradient-to-r from-[#FFF7ED] to-[#FFFBF5] border border-[#FFE4CC]">
          <p className="text-[10px] text-[#E07B3A] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Lightbulb size={10} className="text-[#FF8F5C]" />AI Title Suggestions
          </p>
          {liveSuggestions.map((s) => (
            <button key={s} onClick={() => setDraft(s)}
              className={`block w-full text-left text-[11px] px-2.5 py-1 rounded-lg transition-all ${draft === s ? "bg-[#FF8F5C] text-white shadow-sm" : "text-[#8B5E3C] hover:bg-[#FFE4CC]/50"}`}>
              ✨ {s}
            </button>
          ))}
        </div>
      )}

      {/* Suggested tags */}
      {suggestedTags.filter((t) => !activeTags.includes(t) && !pendingTags.includes(t)).length > 0 && (
        <div className="mb-2.5 p-2 rounded-lg bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border border-[#DDD6FE]">
          <p className="text-[10px] text-[#7C3AED] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Tag size={10} className="text-[#8B5CF6]" />Suggested Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.filter((t) => !activeTags.includes(t) && !pendingTags.includes(t)).map((t) => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`text-[10px] px-2 py-[2px] rounded-full border transition-all ${pendingTags.includes(t) ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm" : "text-[#6D28D9] border-[#C4B5FD] bg-white hover:bg-[#EDE9FE]"}`}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex items-center gap-1.5 mb-2.5 p-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
        <Tag size={10} className="text-[#16A34A] shrink-0" />
        <input type="text" placeholder="Add custom tag…" value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
          className="flex-1 text-[10px] bg-transparent border-none outline-none placeholder:text-[#4ADE80]" />
        {customTagInput && <button onClick={addCustomTag} className="p-0.5 rounded-full bg-[#16A34A] text-white hover:bg-[#15803D]"><Plus size={10} /></button>}
      </div>

      {/* Pending tags */}
      {pendingTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {pendingTags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-full px-2 py-[2px] shadow-sm">
              #{t}<button onClick={() => setPendingTags((p) => p.filter((x) => x !== t))} className="hover:bg-white/20 rounded-full"><X size={9} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 justify-end pt-1.5 border-t border-[#f0f0f0]">
        <button onClick={onCancel} className="text-[11px] text-[#888] px-3 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors">Cancel</button>
        <button onClick={commit} className="text-[11px] text-white px-3 py-1 rounded-lg transition-all hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #FF8F5C, #FFB078)" }}>Save</button>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

type MenuItem = { icon: React.ReactNode; label: string; danger?: boolean; hasArrow?: boolean; onClick?: () => void } | null;

function ContextMenu({ items, onClose, x, y }: { items: MenuItem[]; onClose: () => void; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const menuW = 208;
  const menuH = 320;
  const adjustedX = Math.max(8, Math.min(x, (window.innerWidth || 1440) - menuW - 8));
  const adjustedY = Math.max(8, Math.min(y, (window.innerHeight || 1024) - menuH - 8));
  return (
    <div ref={ref} className="fixed z-[300] bg-white border border-[#d0d0d0] rounded w-52 py-1 shadow-md" style={{ left: adjustedX, top: adjustedY }}>
      {items.map((item, i) =>
        item === null ? <div key={`d-${i}`} className="my-1 border-t border-[#ebebeb]" /> : (
          <button key={item.label} onClick={() => { item.onClick?.(); }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] ${item.danger ? "text-[#cc0000]" : "text-[#222]"}`}>
            <span className="flex items-center gap-2">
              <span className={item.danger ? "text-[#cc0000]" : "text-[#666]"}>{item.icon}</span>
              {item.label}
            </span>
            {item.hasArrow && <ChevronRight size={11} color="#aaa" />}
          </button>
        )
      )}
    </div>
  );
}

// ─── Chat Preview ─────────────────────────────────────────────────────────────

function ChatPreview({ messages, searchQuery }: { messages: ChatMessage[]; searchQuery?: string }) {
  const shown = (() => {
    if (!searchQuery?.trim()) return messages.slice(0, 2);
    const matchIdx = messages.findIndex((m) => matchesQuery(m.text, searchQuery));
    return matchIdx === -1 ? messages.slice(0, 1) : [messages[matchIdx]];
  })();
  return (
    <div className="flex flex-col gap-1 mt-1 p-1.5 rounded bg-[#f8f8f8] border border-[#eee]">
      {shown.map((m, i) => (
        <div key={i} className="flex items-start gap-1">
          <span className={`shrink-0 mt-0.5 ${m.role === "user" ? "text-[#888]" : "text-[#555]"}`}>
            {m.role === "user" ? <User size={9} /> : <Bot size={9} />}
          </span>
          <span className="text-[10px] text-[#666] leading-relaxed line-clamp-2">
            {searchQuery ? highlight(getSnippet(m.text, searchQuery), searchQuery) : m.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Folder Detail Header (project heading with rename) ──────────────────────

function FolderDetailHeader({ folder, fileCount, localName, onRename, onNewChat }: {
  folder: FolderItem;
  fileCount: number;
  localName?: string;
  onRename: (id: string, name: string) => void;
  onNewChat: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(localName ?? folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) { inputRef.current?.focus(); inputRef.current?.select(); } }, [renaming]);
  useEffect(() => { setDraft(localName ?? folder.name); }, [localName, folder.name]);

  const displayName = localName ?? folder.name;

  const commit = () => {
    const final = draft.trim() || displayName;
    setDraft(final);
    onRename(folder.id, final);
    setRenaming(false);
  };

  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e8e8e8]">
      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
        <Folder size={22} color="#6366F1" />
      </div>
      <div className="flex-1 min-w-0">
        {renaming ? (
          <div className="flex items-center gap-2">
            <Pencil size={13} className="text-[#EC4899] shrink-0" />
            <input ref={inputRef} type="text" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(displayName); setRenaming(false); } }}
              onBlur={commit}
              className="flex-1 text-[16px] border-2 border-[#EC4899] rounded-lg px-3 py-1 outline-none focus:border-[#DB2777] bg-white"
              placeholder="Project name…" />
          </div>
        ) : (
          <button className="group flex items-center gap-2 min-w-0 hover:bg-[#f5f5f5] px-2 py-1 -ml-2 rounded-lg transition-colors"
            onClick={() => setRenaming(true)}>
            <span className="text-[16px] font-bold text-[#111] truncate">{displayName}</span>
            <Pencil size={13} className="opacity-0 group-hover:opacity-100 shrink-0 text-[#EC4899]" />
          </button>
        )}
        <p className="text-[13px] text-[#FF8F5C] ml-2">{fileCount} conversation{fileCount !== 1 ? "s" : ""}</p>
      </div>
      <button onClick={onNewChat}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5] text-[13px] text-[#444] transition-colors shrink-0">
        <Plus size={14} />New chat
      </button>
    </div>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({ item, onContext, onFolderOpen, onFileOpen, locationLabel, searchQuery,
  localTitle, localTags, allFoldersCtx, isRenaming: isRenamingProp, onRenameCommit }: {
  item: Item; onContext: (e: React.MouseEvent) => void;
  onFolderOpen?: (id: string) => void; onFileOpen?: (file: FileItem) => void;
  locationLabel?: string; searchQuery?: string;
  localTitle?: string; localTags?: string[];
  allFoldersCtx?: FolderItem[];
  isRenaming?: boolean;
  onRenameCommit?: (title: string, tags: string[]) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [localTitle2, setLocalTitle2] = useState<string | undefined>(localTitle);
  const [localTags2, setLocalTags2]   = useState<string[] | undefined>(localTags);

  const isFolder = item.type === "folder";
  const file = isFolder ? null : (item as FileItem);
  const displayName = localTitle2 ?? localTitle ?? item.name;
  const displayTags = localTags2 ?? localTags ?? item.tags;

  useEffect(() => { setLocalTitle2(localTitle); }, [localTitle]);
  useEffect(() => { setLocalTags2(localTags); }, [localTags]);
  // Respond to external rename trigger
  useEffect(() => { if (isRenamingProp) setRenaming(true); }, [isRenamingProp]);

  return (
    <div
      onClick={() => {
        if (renaming) return;
        if (isFolder && onFolderOpen) onFolderOpen(item.id);
        else if (file && onFileOpen) onFileOpen(file);
      }}
      className={`group relative flex flex-col gap-1.5 p-3 rounded border bg-white select-none cursor-pointer transition-colors
        ${file?.isDualTopic ? "border-[#b0a0e0] hover:border-[#9f7fe8] hover:bg-[#faf8ff]" : "border-[#C0C0C0] hover:border-[#888] hover:bg-[#f9f9f9]"}`}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContext(e); }}
    >
      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#ebebeb] text-[#888] z-10"
        onClick={(e) => { e.stopPropagation(); onContext(e); }}>
        <MoreHorizontal size={13} />
      </button>

      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${isFolder ? "bg-[#EEF2FF]" : file?.isDualTopic ? "bg-[#F3E8FF]" : "bg-[#FFF7ED]"}`}>
          {isFolder ? <Folder size={20} color="#6366F1" /> : <FileText size={20} color={file?.isDualTopic ? "#9F7FE8" : "#FF8F5C"} />}
        </div>
        {file?.isDualTopic && (
          <span className="text-[9px] bg-[#ede8fb] text-[#7c5cd6] rounded-full px-1.5 py-[1px] border border-[#c8b8f0] font-bold flex items-center gap-0.5">
            <Users size={8} />Multi-topic
          </span>
        )}
      </div>

      {renaming ? (
        <InlineRenamePanel item={item} initialDraft={displayName}
          onCommit={(title, tags) => {
            setLocalTitle2(title);
            setLocalTags2(tags);
            setRenaming(false);
            onRenameCommit?.(title, tags);
          }}
          onCancel={() => setRenaming(false)} />
      ) : (
        <span className="text-[12px] font-bold leading-snug line-clamp-2 text-[#111]">
          {searchQuery ? highlight(displayName, searchQuery) : displayName}
        </span>
      )}

      {isFolder && <span className="text-[10px] text-[#999]">{(item as FolderItem).count} chats</span>}

      {file?.chat && !renaming && <ChatPreview messages={file.chat} searchQuery={searchQuery} />}

      {displayTags.length > 0 && !renaming && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {displayTags.map((t) => (
            <span key={t} className={`text-[10px] rounded-full px-1.5 py-[1px] ${t === "multi-topic" ? "bg-[#ede8fb] text-[#7c5cd6]" : "text-[#555] bg-[#ebebeb]"}`}>{t}</span>
          ))}
        </div>
      )}

      {file?.suggestedTags && file.suggestedTags.length > 0 && (
        <div className="flex items-start gap-1.5 p-1.5 rounded bg-[#fffbe6] border border-[#ffe58a]">
          <Lightbulb size={10} className="text-[#d4a000] mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {file.suggestedTags.map((t) => (
              <button key={t} className="text-[9px] text-[#8a6000] bg-[#fff3cc] border border-[#f0d060] rounded-full px-1.5 py-[1px] hover:bg-[#ffe480]">+#{t}</button>
            ))}
          </div>
        </div>
      )}

      {locationLabel && <div className="flex items-center gap-1"><ChevronRight size={9} color="#bbb" /><span className="text-[10px] text-[#aaa] truncate">{locationLabel}</span></div>}
      <div className="flex items-center gap-1 mt-auto pt-0.5"><Clock size={10} color="#bbb" /><span className="text-[10px] text-[#bbb]">{item.dateLabel}</span></div>
    </div>
  );
}

// ─── File Row ────────────────────────────────────────────────────────────────

function FileRow({ item, onContext, onFolderOpen, onFileOpen, locationLabel, searchQuery,
  localTitle, localTags, isRenaming: isRenamingProp, onRenameCommit }: {
  item: Item; onContext: (e: React.MouseEvent) => void;
  onFolderOpen?: (id: string) => void; onFileOpen?: (file: FileItem) => void;
  locationLabel?: string; searchQuery?: string;
  localTitle?: string; localTags?: string[];
  isRenaming?: boolean;
  onRenameCommit?: (title: string, tags: string[]) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [localTitle2, setLocalTitle2] = useState<string | undefined>(localTitle);
  const [localTags2, setLocalTags2]   = useState<string[] | undefined>(localTags);

  useEffect(() => { setLocalTitle2(localTitle); }, [localTitle]);
  useEffect(() => { setLocalTags2(localTags); }, [localTags]);
  useEffect(() => { if (isRenamingProp) setRenaming(true); }, [isRenamingProp]);

  const isFolder = item.type === "folder";
  const file = isFolder ? null : (item as FileItem);
  const displayName = localTitle2 ?? localTitle ?? item.name;
  const displayTags = (localTags2 ?? localTags ?? item.tags).slice(0, 2);

  return (
    <div
      onClick={() => {
        if (renaming) return;
        if (isFolder && onFolderOpen) onFolderOpen(item.id);
        else if (file && onFileOpen) onFileOpen(file);
      }}
      className={`group flex items-start gap-3 px-3 py-2.5 rounded border-b border-[#f0f0f0] last:border-b-0 select-none cursor-pointer
        ${file?.isDualTopic ? "hover:bg-[#faf8ff]" : "hover:bg-[#f5f5f5]"}`}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContext(e); }}
    >
      <div className={`shrink-0 mt-0.5 ${isFolder ? "text-[#555]" : file?.isDualTopic ? "text-[#9f7fe8]" : "text-[#888]"}`}>
        {isFolder ? <Folder size={15} /> : <FileText size={15} />}
      </div>
      <div className="flex-1 flex flex-col min-w-0 gap-0.5">
        {renaming ? (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineRenamePanel item={item} initialDraft={displayName}
              onCommit={(title, tags) => {
                setLocalTitle2(title);
                setLocalTags2(tags);
                setRenaming(false);
                onRenameCommit?.(title, tags);
              }}
              onCancel={() => setRenaming(false)} />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold truncate text-[#111]">
              {searchQuery ? highlight(displayName, searchQuery) : displayName}
            </span>
            {file?.isDualTopic && <span className="shrink-0 text-[9px] bg-[#ede8fb] text-[#7c5cd6] rounded-full px-1.5 py-[0.5px] border border-[#c8b8f0] font-bold">Multi-topic</span>}
            {isFolder && <span className="shrink-0 text-[10px] text-[#aaa]">{(item as FolderItem).count} chats</span>}
          </div>
        )}
        {file?.chat && !renaming && (() => {
          const msg = file.chat[0];
          return msg ? (
            <span className="text-[10px] text-[#999] truncate">
              <span className="text-[#bbb] mr-1">{msg.role === "user" ? "You:" : "AI:"}</span>
              {searchQuery ? highlight(getSnippet(msg.text, searchQuery), searchQuery) : msg.text}
            </span>
          ) : null;
        })()}
        {locationLabel && <span className="text-[10px] text-[#bbb]">{locationLabel}</span>}
      </div>
      <div className="flex gap-1 shrink-0 mt-0.5">
        {displayTags.map((t) => (
          <span key={t} className={`text-[10px] rounded-full px-1.5 py-[1px] ${t === "multi-topic" ? "bg-[#ede8fb] text-[#7c5cd6]" : "text-[#555] bg-[#ebebeb]"}`}>{t}</span>
        ))}
      </div>
      <span className="text-[11px] text-[#bbb] shrink-0 w-16 text-right mt-0.5">{item.dateLabel}</span>
      <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#ddd] text-[#888] shrink-0 mt-0.5"
        onClick={(e) => { e.stopPropagation(); onContext(e); }}>
        <MoreHorizontal size={13} />
      </button>
    </div>
  );
}

// ─── Explorer Tree Node (with hover actions: Pin, Star, ···) ─────────────────

function ExplorerNode({ node, depth, selected, onSelect, onFileClick,
  pinnedIds, favoriteIds, archivedIds,
  onPin, onFavorite, onArchive,
  onDelete, onRename, onShare, onGroupChat, onMoveToProject, onNewChat,
  projects, chatProjectMap,
}: {
  node: TreeNodeDef; depth: number; selected: string;
  onSelect: (id: string) => void;
  onFileClick?: (id: string) => void;
  pinnedIds?: Set<string>; favoriteIds?: Set<string>; archivedIds?: Set<string>;
  onPin?: (id: string) => void; onFavorite?: (id: string) => void; onArchive?: (id: string) => void;
  onDelete?: (id: string, name: string, type: "file" | "folder") => void;
  onRename?: (id: string, name: string) => void;
  onShare?: (id: string, name: string) => void;
  onGroupChat?: (name: string) => void;
  onMoveToProject?: (id: string, pos: { x: number; y: number }) => void;
  onNewChat?: (folderId: string) => void;
  projects?: Project[];
  chatProjectMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(depth === 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(node.label);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const hasChildren = !!node.children?.length;
  const isFile    = !!node.isFile || (!hasChildren && depth >= 2);
  const isFolder  = !isFile && depth >= 2;
  const isSelected = selected === node.id;
  const isTopLevel = depth <= 1;

  const isPinned    = pinnedIds?.has(node.id)   ?? false;
  const isFavorited = favoriteIds?.has(node.id) ?? false;
  const isArchived  = archivedIds?.has(node.id) ?? false;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);

  const handleClick = () => {
    if (renaming) return;
    if (isFile && onFileClick) onFileClick(node.id);
    else { onSelect(node.id); } // Folders don't auto-expand on row click
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setOpen((v) => !v);
  };

  const menuItems: MenuItem[] = isFile ? [
    { icon: <Pencil size={12} />, label: "Rename",            onClick: () => { setMenuOpen(false); setRenaming(true); setRenameDraft(node.label); } },
    { icon: <Share2 size={12} />, label: "Share",             onClick: () => { setMenuOpen(false); onShare?.(node.id, node.label); } },
    { icon: <Users size={12} />,  label: "Start a group chat", onClick: () => { setMenuOpen(false); onGroupChat?.(node.label); } },
    { icon: <FolderInput size={12} />, label: "Move to project", hasArrow: true, onClick: () => {
      onMoveToProject?.(node.id, menuPos);
      setMenuOpen(false);
    }},
    null,
    isPinned
      ? { icon: <Pin size={12} />, label: "Unpin",   onClick: () => { onPin?.(node.id); setMenuOpen(false); } }
      : { icon: <Pin size={12} />, label: "Pin",     onClick: () => { onPin?.(node.id); setMenuOpen(false); } },
    isFavorited
      ? { icon: <Star size={12} />, label: "Remove from Favorites", onClick: () => { onFavorite?.(node.id); setMenuOpen(false); } }
      : { icon: <Star size={12} />, label: "Add to Favorites",      onClick: () => { onFavorite?.(node.id); setMenuOpen(false); } },
    null,
    isArchived
      ? { icon: <ArchiveRestore size={12} />, label: "Unarchive", onClick: () => { onArchive?.(node.id); setMenuOpen(false); } }
      : { icon: <Archive size={12} />,        label: "Archive",   onClick: () => { onArchive?.(node.id); setMenuOpen(false); } },
    null,
    { icon: <Trash2 size={12} />, label: "Delete", danger: true, onClick: () => { setMenuOpen(false); onDelete?.(node.id, node.label, "file"); } },
  ] : isFolder ? [
    { icon: <MessageSquarePlus size={12} />, label: "New chat",      onClick: () => { setMenuOpen(false); onNewChat?.(node.id); } },
    { icon: <Pencil size={12} />,           label: "Rename",         onClick: () => { setMenuOpen(false); setRenaming(true); setRenameDraft(node.label); } },
    { icon: <Share2 size={12} />,           label: "Share",          onClick: () => { setMenuOpen(false); onShare?.(node.id, node.label); } },
    null,
    { icon: <Trash2 size={12} />, label: "Delete project", danger: true, onClick: () => { setMenuOpen(false); onDelete?.(node.id, node.label, "folder"); } },
  ] : [];

  return (
    <div>
      <div
        className={`group relative flex items-center gap-0 w-full rounded py-[3px] text-left select-none ${isSelected && !isTopLevel ? "bg-white border border-[#D1D5DB] shadow-sm" : "hover:bg-[#efefef]"}`}
        style={{ paddingLeft: 6 + depth * 13 }}
      >
        {/* Expand/collapse or spacer */}
        <button className="flex items-center shrink-0" onClick={handleToggle}
          style={{ minWidth: hasChildren ? 16 : 12 }}>
          {hasChildren
            ? open ? <ChevronDown size={12} color="#888" /> : <ChevronRight size={12} color="#888" />
            : <span style={{ width: 12 }} />}
        </button>

        {/* Icon */}
        <span className="text-[#666] flex items-center shrink-0 mr-1">
          {open && node.openIcon ? node.openIcon : node.icon}
        </span>

        {/* Label or rename input */}
        {renaming ? (
          <input ref={renameRef} type="text" value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { onRename?.(node.id, renameDraft.trim() || node.label); setRenaming(false); setRenameDraft(renameDraft.trim() || node.label); }
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={() => { if (renaming) { onRename?.(node.id, renameDraft.trim() || node.label); setRenaming(false); } }}
            className="flex-1 text-[11px] border-2 border-[#EC4899] rounded px-1 py-0.5 outline-none focus:border-[#DB2777] bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button className="flex-1 min-w-0 text-left" onClick={handleClick}>
            <span className={`text-[14px] truncate block pr-1 ${isSelected && !isTopLevel ? "text-[#111] font-bold" : isFile ? "text-[#444]" : "text-[#222]"}`}>
              {node.label}
            </span>
          </button>
        )}

        {/* Hover actions (only for file/folder nodes, not top-level categories) */}
        {(isFile || isFolder) && !renaming && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 shrink-0 gap-[2px] pr-1">
            {isFile && (
              <>
                <button title={isPinned ? "Unpin" : "Pin"} onClick={(e) => { e.stopPropagation(); onPin?.(node.id); }}
                  className={`p-[4px] rounded-md border transition-colors ${isPinned ? "text-[#111] bg-[#e8e8e8] border-[#bbb] shadow-sm" : "text-[#777] bg-white border-[#ddd] hover:bg-[#e8e8e8] hover:border-[#aaa] hover:text-[#111]"}`}>
                  <Pin size={11} fill={isPinned ? "#111" : "none"} />
                </button>
                <button title={isFavorited ? "Remove from Favorites" : "Add to Favorites"} onClick={(e) => { e.stopPropagation(); onFavorite?.(node.id); }}
                  className={`p-[4px] rounded-md border transition-colors ${isFavorited ? "text-[#FFB800] bg-[#FFF7ED] border-[#FFD580] shadow-sm" : "text-[#777] bg-white border-[#ddd] hover:bg-[#FFF7ED] hover:border-[#FFD580] hover:text-[#FFB800]"}`}>
                  <Star size={11} fill={isFavorited ? "#FFB800" : "none"} />
                </button>
              </>
            )}
            <button ref={moreRef} title="More" onClick={(e) => {
                e.stopPropagation();
                if (moreRef.current) {
                  const r = moreRef.current.getBoundingClientRect();
                  const menuW = 210;
                  let left = r.right + 4;
                  if (left + menuW > window.innerWidth - 8) left = r.left - menuW - 4;
                  setMenuPos({ x: Math.max(4, left), y: Math.min(r.top, window.innerHeight - 320) });
                }
                setMenuOpen((v) => !v);
              }}
              className="p-[4px] rounded-md border border-[#ddd] bg-white hover:bg-[#e8e8e8] hover:border-[#aaa] text-[#aaa]">
              <MoreHorizontal size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Fixed-position dropdown — avoids overflow:hidden clipping from sidebar */}
      {menuOpen && menuItems.length > 0 && (
        <div ref={menuRef} className="fixed z-[200] bg-white border border-[#d0d0d0] rounded py-1 shadow-lg"
          style={{ left: menuPos.x, top: menuPos.y, width: 210 }}
          onClick={(e) => e.stopPropagation()}>
          {menuItems.map((item, i) =>
            item === null ? <div key={`d-${i}`} className="my-0.5 border-t border-[#e8e8e8]" /> : (
              <button key={item.label} onClick={item.onClick}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] hover:bg-[#f5f5f5] ${item.danger ? "text-[#cc0000]" : "text-[#222]"}`}>
                <span className="flex items-center gap-2">
                  <span className={item.danger ? "text-[#cc0000]" : "text-[#555]"}>{item.icon}</span>
                  {item.label}
                </span>
                {item.hasArrow && <ChevronRight size={10} color="#aaa" />}
              </button>
            )
          )}
        </div>
      )}

      {open && hasChildren && node.children!.map((child) => (
        <ExplorerNode key={child.id} node={child} depth={depth + 1} selected={selected}
          onSelect={onSelect} onFileClick={onFileClick}
          pinnedIds={pinnedIds} favoriteIds={favoriteIds} archivedIds={archivedIds}
          onPin={onPin} onFavorite={onFavorite} onArchive={onArchive}
          onDelete={onDelete} onRename={onRename} onShare={onShare} onGroupChat={onGroupChat}
          onMoveToProject={onMoveToProject} onNewChat={onNewChat}
          projects={projects} chatProjectMap={chatProjectMap}
        />
      ))}
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "Any time", value: "all" }, { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" }, { label: "Past 7 days", value: "week" },
  { label: "Past 30 days", value: "month" }, { label: "Custom date range…", value: "custom" },
];

// ─── Inline Date Range Picker (Google Flights–style) ─────────────────────────

const RANGE_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const RANGE_MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const RANGE_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function toRangeKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function formatRangeDate(d: string | null) {
  if (!d) return null;
  const [, m, day] = d.split("-");
  return `${RANGE_MONTH_SHORT[parseInt(m) - 1]} ${parseInt(day)}`;
}

function InlineDateRangePicker({ activeDates, startDate, endDate, onChangeStart, onChangeEnd }: {
  activeDates: string[];
  startDate: string | null;
  endDate: string | null;
  onChangeStart: (d: string | null) => void;
  onChangeEnd: (d: string | null) => void;
}) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(2); // March
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Click logic: first click → start, second click → end, third → reset
  const handleDayClick = (key: string) => {
    if (!startDate || (startDate && endDate)) {
      onChangeStart(key);
      onChangeEnd(null);
    } else {
      if (key === startDate) {
        onChangeStart(null);
        onChangeEnd(null);
      } else if (key < startDate) {
        onChangeStart(key);
        onChangeEnd(startDate);
      } else {
        onChangeEnd(key);
      }
    }
  };

  // Effective end for hover preview
  const effectiveEnd = endDate ?? (startDate && hoverDate && hoverDate > startDate ? hoverDate : null);

  const isStart = (key: string) => key === startDate;
  const isEnd   = (key: string) => !!endDate && key === endDate;
  const isHoverEnd = (key: string) =>
    !endDate && !!startDate && !!hoverDate && hoverDate > startDate && key === hoverDate;
  const isInRange = (key: string) =>
    !!startDate && !!effectiveEnd && key > startDate && key < effectiveEnd;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <div className="pt-3 pb-2 select-none">
      {/* Range chips */}
      <div className="flex items-center gap-1.5 px-3 mb-3">
        <div className={`flex-1 text-center text-[11px] py-1.5 rounded border transition-colors ${startDate ? "border-[#333] bg-[#f7f7f7] text-[#111]" : "border-dashed border-[#ccc] text-[#bbb]"}`}>
          {startDate ? formatRangeDate(startDate) : "Start"}
        </div>
        <span className="text-[10px] text-[#ccc]">→</span>
        <div className={`flex-1 text-center text-[11px] py-1.5 rounded border transition-colors ${endDate ? "border-[#333] bg-[#f7f7f7] text-[#111]" : "border-dashed border-[#ccc] text-[#bbb]"}`}>
          {endDate ? formatRangeDate(endDate) : "End"}
        </div>
        {(startDate || endDate) && (
          <button onClick={() => { onChangeStart(null); onChangeEnd(null); }}
            className="p-1 rounded hover:bg-[#f0f0f0] text-[#aaa] hover:text-[#555] transition-colors">
            <X size={10} />
          </button>
        )}
      </div>

      {/* Hint */}
      <p className="text-[10px] text-[#bbb] text-center mb-2.5 tracking-wide">
        {!startDate ? "Pick a start date" : !endDate ? "Now pick an end date" : "Click any date to reset"}
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-3 mb-2">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-[#f0f0f0] text-[#555]"><ChevronLeft size={13} /></button>
        <span className="text-[11px] font-bold text-[#333]">{RANGE_MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-[#f0f0f0] text-[#555]"><ChevronRight size={13} /></button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 px-2 mb-0.5">
        {RANGE_DAYS.map(d => (
          <div key={d} className="text-center text-[9px] text-[#bbb] py-0.5">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-2 gap-y-0.5" onMouseLeave={() => setHoverDate(null)}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = toRangeKey(viewYear, viewMonth, day);
          const hasChats = activeDates.includes(key);
          const sel = isStart(key) || isEnd(key);
          const hEnd = isHoverEnd(key);
          const inRange = isInRange(key);

          return (
            <button
              key={key}
              onClick={() => handleDayClick(key)}
              onMouseEnter={() => setHoverDate(key)}
              className={[
                "relative flex flex-col items-center justify-center py-[5px] text-[11px] transition-colors",
                sel
                  ? "bg-[#2a2a2a] text-white rounded z-10"
                  : hEnd
                  ? "bg-[#d8d8d8] text-[#333] rounded"
                  : inRange
                  ? "bg-[#ffeee4] text-[#333]"
                  : "hover:bg-[#f0f0f0] text-[#333] rounded",
                !hasChats && !sel ? "text-opacity-40" : "",
                hasChats && !sel && !inRange && !hEnd ? "text-[#222]" : "",
                !hasChats && !sel && !inRange && !hEnd ? "text-[#ccc]" : "",
              ].join(" ")}
            >
              {day}
              {hasChats && (
                <span className={`w-1 h-1 rounded-full mt-[2px] ${sel ? "bg-white opacity-70" : "bg-[#bbb]"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ filterTab, setFilterTab, selectedTags, toggleTag,
  dateFilter, setDateFilter, customDateStart, customDateEnd, setCustomDateStart, setCustomDateEnd, onClear, activeDates }: {
  filterTab: FilterTab; setFilterTab: (t: FilterTab) => void;
  selectedTags: string[]; toggleTag: (t: string) => void;
  dateFilter: DateFilter; setDateFilter: (d: DateFilter) => void;
  customDateStart: string | null; customDateEnd: string | null;
  setCustomDateStart: (d: string | null) => void;
  setCustomDateEnd: (d: string | null) => void;
  onClear: () => void; activeDates: string[];
}) {
  const [customTagInput, setCustomTagInput] = useState("");
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const anyActive = selectedTags.length > 0 || dateFilter !== "all";

  const addCustomFilterTag = () => {
    const t = customTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t) { if (!extraTags.includes(t) && !allTags.includes(t)) setExtraTags((p) => [...p, t]); toggleTag(t); }
    setCustomTagInput("");
  };

  const allAvailableTags = [...allTags, ...extraTags.filter((t) => !allTags.includes(t))];

  return (
    <div className="absolute left-0 top-9 z-40 bg-white border border-[#e0e0e0] rounded-xl shadow-lg overflow-hidden" style={{ width: 300 }}>
      <div className="flex border-b border-[#e8e8e8]">
        {(["tags", "date"] as FilterTab[]).map((tab) => (
          <button key={tab} onClick={() => setFilterTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] transition-colors ${filterTab === tab ? "text-[#111] font-bold border-b-2 border-[#FF8F5C]" : "text-[#888] hover:text-[#444]"}`}>
            {tab === "tags" ? <><Tag size={12} className={filterTab === "tags" ? "text-[#FF8F5C]" : ""} />Tags</> : <><CalendarDays size={12} className={filterTab === "date" ? "text-[#FF8F5C]" : ""} />Date</>}
          </button>
        ))}
      </div>
      {filterTab === "tags" && (
        <div className="p-3">
          <p className="text-[10px] text-[#8B5CF6] uppercase tracking-wide mb-2 flex items-center gap-1"><Tag size={9} />Filter by tag</p>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {allAvailableTags.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${selectedTags.includes(tag) ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm" : "text-[#555] border-[#D4D4D8] hover:border-[#8B5CF6] hover:bg-[#F5F3FF]"}`}>
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-2.5 border-t border-[#f0f0f0]">
            <Tag size={11} className="text-[#16A34A] shrink-0" />
            <input type="text" placeholder="Add custom tag…" value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomFilterTag(); } }}
              className="flex-1 text-[11px] border border-[#BBF7D0] bg-[#F0FDF4] rounded-lg px-2.5 py-1 outline-none focus:border-[#16A34A] placeholder:text-[#4ADE80]" />
            <button onClick={addCustomFilterTag} className="p-1 rounded-full bg-[#16A34A] text-white hover:bg-[#15803D]"><Plus size={12} /></button>
          </div>
          {selectedTags.length > 0 && <p className="text-[10px] text-[#8B5CF6] mt-2">{selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} selected</p>}
        </div>
      )}
      {filterTab === "date" && (
        <div className="py-1">
          {DATE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setDateFilter(opt.value); if (opt.value !== "custom") { setCustomDateStart(null); setCustomDateEnd(null); } }}
              className={`w-full flex items-center justify-between px-4 py-2 text-[12px] hover:bg-[#f5f5f5] ${dateFilter === opt.value ? "text-[#111] font-bold" : "text-[#444]"}`}>
              {opt.label}
              {dateFilter === opt.value && opt.value !== "custom" && <span className="w-1.5 h-1.5 rounded-full bg-[#333]" />}
            </button>
          ))}
          {dateFilter === "custom" && (
            <div className="border-t border-[#f0f0f0]">
              <InlineDateRangePicker
                activeDates={activeDates}
                startDate={customDateStart}
                endDate={customDateEnd}
                onChangeStart={setCustomDateStart}
                onChangeEnd={setCustomDateEnd}
              />
            </div>
          )}
        </div>
      )}
      {anyActive && (
        <div className="border-t border-[#ebebeb] px-3 py-2">
          <button onClick={onClear} className="text-[11px] text-[#888] hover:text-[#333]">Clear all filters</button>
        </div>
      )}
    </div>
  );
}

// ─── Conversation Pane ────────────────────────────────────────────────────────

const MOCK_REPLIES_DV = [
  "Great question! Let me think through that. The key trade-off here is between speed and quality — I'd start by mapping the critical path and finding the highest-leverage action. What's your current constraint?",
  "Absolutely. Here's how I'd approach it: break the problem into three phases — diagnose, prioritise, execute. The mistake most teams make is jumping to execution without enough context. Want me to help map it out?",
  "Good call raising this. The short answer is: it depends on your constraints. If speed is the priority, go lean; if quality is non-negotiable, invest the time upfront. Which matters more to you right now?",
  "Interesting! I'd look at this from two angles: first, what's the minimum viable version that validates the core assumption? Second, what's the biggest risk if you're wrong? Addressing those two questions usually clarifies the path forward.",
];

function ConversationPane({ file, onBack, onMessagesUpdate, onRenameFile, onUpdateFileTags, onSendInFile, onDelete, onMoveToProjectClick }: {
  file: FileItem; onBack: () => void;
  onMessagesUpdate?: (fileId: string, messages: ChatMessage[]) => void;
  onRenameFile?: (fileId: string, title: string) => void;
  onUpdateFileTags?: (fileId: string, tags: string[]) => void;
  onSendInFile?: (fileId: string, messages: ChatMessage[]) => void;
  onDelete?: () => void;
  onMoveToProjectClick?: (pos: { x: number; y: number }) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [localChat, setLocalChat] = useState<ChatMessage[]>(file.chat);
  const [isTyping, setIsTyping] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [localName, setLocalName] = useState(file.name);
  const [localTags, setLocalTags] = useState<string[]>(file.tags);
  const [shareOpen, setShareOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalChat(file.chat); setLocalName(file.name); setLocalTags(file.tags); setRenaming(false); setInputValue(""); setMenuOpen(false); setMenuPos(null); }, [file.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localChat, isTyping]);

  // Click-outside for the header three-dot menu
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setMenuPos(null);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;
    const newMsg: ChatMessage = { role: "user", text: content };
    const updated = [...localChat, newMsg];
    setLocalChat(updated);
    setInputValue("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = MOCK_REPLIES_DV[Math.floor(Math.random() * MOCK_REPLIES_DV.length)];
      const final = [...updated, { role: "ai" as const, text: reply }];
      setLocalChat(final);
      setIsTyping(false);
      onMessagesUpdate?.(file.id, final);
      onSendInFile?.(file.id, final);
    }, 900 + Math.random() * 700);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Header */}
      {renaming ? (
        <div className="px-4 py-2.5 border-b border-[#e0e0e0] bg-[#fafafa]">
          <InlineRenamePanel
            item={{ ...file, name: localName, tags: localTags }}
            initialDraft={localName}
            onCommit={(title, tags) => {
              setLocalName(title);
              setLocalTags(tags);
              setRenaming(false);
              onRenameFile?.(file.id, title);
              onUpdateFileTags?.(file.id, tags);
            }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      ) : (
        <div className="relative flex items-center gap-2 px-5 py-3 border-b border-[#e0e0e0] shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[#888] hover:text-[#333] hover:bg-[#f0f0f0] px-2 py-1 rounded shrink-0">
            <ArrowLeft size={13} />Back
          </button>
          <div className="w-px h-4 bg-[#e0e0e0] shrink-0" />
          <button onClick={() => setRenaming(true)}
            className="group flex items-center gap-1.5 min-w-0 hover:bg-[#f5f5f5] px-2 py-1 rounded -ml-1">
            <FileText size={14} color="#888" className="shrink-0" />
            <span className="text-[14px] font-bold text-[#111] truncate">{localName}</span>
            <Pencil size={12} className="opacity-0 group-hover:opacity-100 shrink-0" color="#EC4899" />
          </button>
          {file.isDualTopic && (
            <span className="shrink-0 text-[9px] bg-[#ede8fb] text-[#7c5cd6] rounded-full px-1.5 py-[1px] border border-[#c8b8f0] font-bold">Multi-topic</span>
          )}
          <div className="flex flex-wrap gap-1 ml-1 min-w-0 flex-1">
            {localTags.slice(0, 4).map((t) => (
              <span key={t} className={`text-[10px] rounded-full px-1.5 py-[1px] shrink-0 ${t === "multi-topic" ? "bg-[#ede8fb] text-[#7c5cd6]" : "text-[#555] bg-[#ebebeb]"}`}>{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button onClick={() => setShareOpen(true)} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]" title="Share"><Share2 size={14} /></button>
            <button onClick={() => setGroupOpen(true)} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]" title="Group chat"><Users size={14} /></button>
            <button ref={moreRef} onClick={() => {
                if (!menuOpen && moreRef.current) {
                  const r = moreRef.current.getBoundingClientRect();
                  setMenuPos({ x: Math.max(8, r.right - 208), y: r.bottom + 4 });
                }
                setMenuOpen(v => !v);
              }} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]" title="More">
              <MoreHorizontal size={14} />
            </button>
          </div>
          {/* Fixed three-dot menu — avoids overflow:hidden clipping */}
          {menuOpen && menuPos && (
            <div ref={menuRef}
              className="fixed z-[300] bg-white border border-[#d0d0d0] rounded w-52 py-1 shadow-md"
              style={{ left: menuPos.x, top: menuPos.y }}
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setRenaming(true); setMenuOpen(false); setMenuPos(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                <Pencil size={13} color="#555"/>Rename
              </button>
              <button onClick={() => { setShareOpen(true); setMenuOpen(false); setMenuPos(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                <Share2 size={13} color="#555"/>Share
              </button>
              <button onClick={() => { setGroupOpen(true); setMenuOpen(false); setMenuPos(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                <Users size={13} color="#555"/>Start a group chat
              </button>
              {onMoveToProjectClick && (
                <button onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    onMoveToProjectClick({ x: rect.right + 4, y: rect.top });
                    setMenuOpen(false); setMenuPos(null);
                  }} className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                  <span className="flex items-center gap-2"><FolderInput size={13} color="#555"/>Move to project</span>
                  <ChevronRight size={12} color="#999" />
                </button>
              )}
              <div className="my-0.5 border-t border-[#e8e8e8]" />
              {onDelete && (
                <button onClick={() => { onDelete(); setMenuOpen(false); setMenuPos(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#cc0000]">
                  <Trash2 size={13} />Delete chat
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {localChat.length === 0 && !isTyping ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 8.26L20.18 9.27L15.09 14.24L16.18 20.32L12 17.77L7.82 20.32L8.91 14.24L3.82 9.27L9.91 8.26L12 2Z" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] text-[#111] mb-1" style={{ letterSpacing: "-0.2px" }}>Continue the conversation</p>
            <p className="text-[13px] text-[#bbb]">Type a message below to keep going.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
          {localChat.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div
                  className="max-w-[60%] px-4 py-3 rounded-2xl rounded-br-sm text-[16px] text-[#1a1a1a] leading-relaxed whitespace-pre-wrap"
                  style={{ background: "#FFF4EE", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-2 max-w-[72%] group">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                    style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.09 8.26L20.18 9.27L15.09 14.24L16.18 20.32L12 17.77L7.82 20.32L8.91 14.24L3.82 9.27L9.91 8.26L12 2Z" fill="white" />
                    </svg>
                  </div>
                  <span className="text-[12px] text-[#999]">Assistant</span>
                </div>
                <div
                  className="px-4 py-3.5 rounded-2xl rounded-tl-sm text-[16px] text-[#1a1a1a] leading-relaxed whitespace-pre-wrap"
                  style={{ background: "#F7F7F8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {[{icon:<Copy size={12}/>,label:"Copy"},{icon:<RotateCcw size={12}/>,label:"Retry"},{icon:<ThumbsUp size={12}/>,label:"Good"},{icon:<ThumbsDown size={12}/>,label:"Bad"}].map(({icon,label})=>(
                    <button key={label} title={label} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#aaa] hover:text-[#444] hover:bg-[#f0f0f0] transition-colors">{icon}<span>{label}</span></button>
                  ))}
                </div>
              </div>
            )
          )}
          {isTyping && (
            <div className="flex flex-col gap-2 max-w-[72%]">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                  style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.09 8.26L20.18 9.27L15.09 14.24L16.18 20.32L12 17.77L7.82 20.32L8.91 14.24L3.82 9.27L9.91 8.26L12 2Z" fill="white" />
                  </svg>
                </div>
                <span className="text-[12px] text-[#999]">Assistant</span>
              </div>
              <div
                className="px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                style={{ background: "#F7F7F8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <style>{`@keyframes dvDot{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
                {[0,1,2].map((i)=>(
                  <span key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background:"linear-gradient(135deg,#FF8F5C,#FFB078)", animation:`dvDot 1.3s ease-in-out ${i*0.18}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          {file.suggestedTags && file.suggestedTags.length > 0 && !isTyping && (
            <div className="flex items-start gap-2 p-3 rounded bg-[#fffbe6] border border-[#ffe58a] max-w-[72%]">
              <Lightbulb size={14} className="text-[#d4a000] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-[#b07800] mb-1">AI detected multiple topics — suggested tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {file.suggestedTags.map((t) => (
                    <button key={t} onClick={() => setLocalTags((p) => p.includes(t) ? p : [...p, t])}
                      className="flex items-center gap-0.5 text-[11px] text-[#8a6000] bg-[#fff3cc] border border-[#f0d060] rounded-full px-2 py-[2px] hover:bg-[#ffe480]">
                      <Plus size={10} />#{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="px-6 py-4 border-t border-[#f0f0f0]">
        <div className="rounded-2xl border border-[#e5e5e5] bg-white overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <textarea className="w-full px-5 pt-4 pb-2 text-[14px] text-[#1a1a1a] placeholder:text-[#c0c0c0] resize-none outline-none bg-white"
            rows={3} placeholder="Continue the conversation…"
            value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#555] transition-colors" title="Attach file"><Paperclip size={15} /></button>
              <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#555] transition-colors" title="Voice input"><Mic size={15} /></button>
            </div>
            <button disabled={!inputValue.trim() || isTyping} onClick={handleSend}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] disabled:opacity-35 transition-opacity"
              style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}>
              <Send size={13} />Send
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#d0d0d0] mt-2 tracking-wide">AI can make mistakes — verify important information.</p>
      </div>

      {shareOpen && <ShareModal chatTitle={localName} chatId={file.id} onClose={() => setShareOpen(false)} />}
      {groupOpen && <GroupChatModal chatTitle={localName} onClose={() => setGroupOpen(false)} onStart={() => setGroupOpen(false)} />}
    </div>
  );
}

// ─── Main DesktopView ─────────────────────────────────────────────────────────

export function DesktopView({
  onClose, onChatOpen,
  projects: _projects = [],
  onAddProject: _onAddProject,
  initialProjectId = null,
  sessionChats: _sessionChats = [],
  chatTitles: _chatTitles = {},
  chatTags: _chatTags = {},
  pinnedIds: _pinnedIds,
  favoriteIds: _favoriteIds,
  archivedIds: _archivedIds,
  deletedChatIds: _deletedChatIds,
  deletedProjectIds: _deletedProjectIds,
  chatProjectMap: _chatProjectMap = {},
  onDeleteChat: _onDeleteChat,
  onDeleteProject: _onDeleteProject,
  onMoveToProject: _onMoveToProject,
  onRenameProject: _onRenameProject,
  onPin: _onPin,
  onFavorite: _onFavorite,
  onArchive: _onArchive,
  onRename: _onRename,
  onUpdateTags: _onUpdateTags,
  onChatCreatedInProject: _onChatCreatedInProject,
  onSessionChatUpdate: _onSessionChatUpdate,
  recycleBin: _recycleBin = [],
  onRestoreItem: _onRestoreItem,
  onPermanentDelete: _onPermanentDeleteBin,
  onEmptyBin: _onEmptyBin,
}: {
  onClose?: () => void;
  onChatOpen?: (id: string) => void;
  projects?: Project[];
  onAddProject?: (name: string) => void;
  initialProjectId?: string | null;
  sessionChats?: SessionChat[];
  chatTitles?: Record<string, string>;
  chatTags?: Record<string, string[]>;
  pinnedIds?: Set<string>;
  favoriteIds?: Set<string>;
  archivedIds?: Set<string>;
  deletedChatIds?: Set<string>;
  deletedProjectIds?: Set<string>;
  chatProjectMap?: Record<string, string>;
  onDeleteChat?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onMoveToProject?: (chatId: string, projectId: string) => void;
  onRenameProject?: (id: string, name: string) => void;
  onPin?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  onChatCreatedInProject?: (chat: SessionChat, projectId: string) => void;
  onSessionChatUpdate?: (chat: SessionChat) => void;
  recycleBin?: RecycleBinItem[];
  onRestoreItem?: (id: string, type: "chat" | "project") => void;
  onPermanentDelete?: (id: string, type: "chat" | "project") => void;
  onEmptyBin?: () => void;
}) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  // Toast notification
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, color = "#333") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, color });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  const [viewMode,  setViewMode]  = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy,    setSortBy]    = useState<SortBy>("date");
  const [selectedLocation, setSelectedLocation] = useState(initialProjectId ?? "all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [filterTab, setFilterTab] = useState<FilterTab>("tags");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen,  setSortOpen]  = useState(false);
  const [customDateStart, setCustomDateStart] = useState<string | null>(null);
  const [customDateEnd, setCustomDateEnd] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "file" | "folder"; itemId: string; itemName: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [localFileTitles, setLocalFileTitles] = useState<Record<string, string>>({});
  const [localFileTags,   setLocalFileTags]   = useState<Record<string, string[]>>({});
  // ── Rename trigger for file grid/list ──
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);

  // ── Modal state ──
  const [shareItem,  setShareItem]  = useState<{ id: string; name: string } | null>(null);
  const [groupItem,  setGroupItem]  = useState<{ name: string } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: "file" | "folder" } | null>(null);
  const [moveItem,   setMoveItem]   = useState<{ id: string; pos: { x: number; y: number } } | null>(null);
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);

  // ── Resizable sidebar ──
  const [sidebarWidth, setSidebarWidth] = useState(192);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(192);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      setSidebarWidth(Math.max(140, Math.min(360, dragStartW.current + delta)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => { document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp); };
  }, []);

  // ── New folder ──
  const [localFolders, setLocalFolders] = useState<FolderItem[]>([]);
  const handleNewFolder = () => {
    const id = `nf-${Date.now()}`;
    setLocalFolders((p) => [...p, { id, type: "folder", name: "New Folder", count: 0, tags: [], date: "2026-03-22", dateLabel: "Today" }]);
    // Start rename inline via ExplorerNode — we just open and the node has a rename mode
  };

  // ── New chat (desktop-only) ──
  const [newChatCounter, setNewChatCounter] = useState(0);
  const handleNewChat = () => {
    const num = newChatCounter + 1; setNewChatCounter(num);
    const newId = `nc-${Date.now()}`;
    const newFile: FileItem = { id: newId, type: "file", name: `New Chat ${num}`, tags: [], content: "", chat: [], date: "2026-03-22", dateLabel: "Today", section: "today" };
    // Register in App state so it shows in home sidebar
    const newSession: SessionChat = { id: newId, title: `New Chat ${num}`, tags: [], messages: [], date: "2026-03-22", dateLabel: "Today" };
    _onSessionChatUpdate?.(newSession);
    setSelectedFile(newFile);
  };

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Merge data ──
  const sessionFileItems: FileItem[] = (_sessionChats ?? []).map((sc) => ({
    id: sc.id, type: "file" as const,
    name: _chatTitles?.[sc.id] ?? sc.title,
    tags: _chatTags?.[sc.id]   ?? sc.tags,
    content: sc.messages[0]?.text?.slice(0, 80) ?? "",
    chat: sc.messages.map((m) => ({ role: (m.role === "assistant" ? "ai" : m.role) as "user" | "ai", text: m.text })),
    date: sc.date, dateLabel: sc.dateLabel, section: "today",
    isDualTopic: sc.isDualTopic,
  }));

  const mergedFiles: FileItem[] = useMemo(() => [
    ...sessionFileItems,
    ...allFiles.map((f) => ({ ...f, name: _chatTitles?.[f.id] ?? f.name, tags: _chatTags?.[f.id] ?? f.tags })),
  ].filter((f) => !_deletedChatIds?.has(f.id)), [_sessionChats, _chatTitles, _chatTags, _deletedChatIds]);

  // Wrap pin/favorite/archive to show toast
  const getItemName = useCallback((id: string) => {
    return localFileTitles[id] ?? mergedFiles.find((f) => f.id === id)?.name ?? allFiles.find((f) => f.id === id)?.name ?? id;
  }, [localFileTitles, mergedFiles]);

  const handlePinWithToast = useCallback((id: string) => {
    const wasPinned = _pinnedIds?.has(id);
    _onPin?.(id);
    const name = getItemName(id);
    showToast(wasPinned ? `"${name}" unpinned` : `"${name}" pinned`, wasPinned ? "#666" : "#111");
  }, [_onPin, _pinnedIds, getItemName, showToast]);

  const handleFavoriteWithToast = useCallback((id: string) => {
    const wasFav = _favoriteIds?.has(id);
    _onFavorite?.(id);
    const name = getItemName(id);
    showToast(wasFav ? `"${name}" removed from favorites` : `"${name}" added to favorites`, wasFav ? "#666" : "#FFB800");
  }, [_onFavorite, _favoriteIds, getItemName, showToast]);

  const handleArchiveWithToast = useCallback((id: string) => {
    const wasArchived = _archivedIds?.has(id);
    _onArchive?.(id);
    const name = getItemName(id);
    showToast(wasArchived ? `"${name}" unarchived` : `"${name}" archived`, wasArchived ? "#666" : "#6B7280");
  }, [_onArchive, _archivedIds, getItemName, showToast]);

  const allFoldersMerged = useMemo(
    () => (allFolders as FolderItem[]).filter((f) => !_deletedProjectIds?.has(f.id)),
    [_deletedProjectIds]
  );
  const allFoldersWithLocal = useMemo(
    () => [...allFoldersMerged, ...localFolders, ...(_projects ?? []).filter((p) => !allFolders.find((f) => f.id === p.id) && !_deletedProjectIds?.has(p.id)).map((p) => ({ id: p.id, type: "folder" as const, name: p.name, count: p.count, tags: [], date: "2026-03-22", dateLabel: "Today" }))],
    [allFoldersMerged, localFolders, _projects, _deletedProjectIds]
  );

  // ── Tree data ──
  const projectTreeChildren: TreeNodeDef[] = allFoldersWithLocal.map((folder) => ({
    id: folder.id, label: folder.name,
    icon: <Folder size={12} />, openIcon: <FolderOpen size={12} />,
    children: mergedFiles
      .filter((f) => f.projectId === folder.id || _chatProjectMap?.[f.id] === folder.id)
      .map((f) => ({ id: f.id, label: localFileTitles[f.id] ?? f.name, icon: <FileText size={11} color="#aaa" />, isFile: true })),
  }));

  const treeData: TreeNodeDef[] = [
    { id: "all", label: "All Chats", icon: <Home size={13} color="#FF8F5C" />, children: [
      { id: "today",     label: "Today",     icon: <Clock size={12} color="#10B981" /> },
      { id: "yesterday", label: "Yesterday", icon: <Clock size={12} color="#F59E0B" /> },
      { id: "older",     label: "Older",     icon: <Clock size={12} color="#9CA3AF" /> },
    ]},
    { id: "pinned",    label: "Pinned",    icon: <Pin size={12} color="#111" /> },
    { id: "favorites", label: "Favorites", icon: <Star size={12} color="#FFB800" /> },
    { id: "archive",   label: "Archive",   icon: <Archive size={13} color="#6B7280" /> },
    { id: "projects",  label: "Projects",  icon: <Folder size={13} color="#6366F1" />, openIcon: <FolderOpen size={13} color="#6366F1" />, children: projectTreeChildren },
  ];

  // ── Breadcrumb ──
  const breadcrumb = useMemo(() => {
    if (selectedLocation === "all") return [{ label: "All Chats", id: "all" }];
    if (["today","yesterday","older"].includes(selectedLocation))
      return [{ label: "All Chats", id: "all" }, { label: selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1), id: selectedLocation }];
    if (["pinned","favorites","archive"].includes(selectedLocation))
      return [{ label: selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1), id: selectedLocation }];
    if (selectedLocation === "projects") return [{ label: "Projects", id: "projects" }];
    const folder = allFoldersWithLocal.find((f) => f.id === selectedLocation);
    if (folder) return [{ label: "Projects", id: "projects" }, { label: folder.name, id: folder.id }];
    return [{ label: "All Chats", id: "all" }];
  }, [selectedLocation, allFoldersWithLocal]);

  const isSearching = searchQuery.trim().length > 0;

  const displayedItems = useMemo((): Item[] => {
    const mf = mergedFiles;
    let items: Item[];
    if (isSearching) { items = [...mf, ...allFoldersWithLocal]; }
    else if (selectedLocation === "today")     { items = mf.filter((f) => f.section === "today"     && !_archivedIds?.has(f.id) && !_deletedChatIds?.has(f.id)); }
    else if (selectedLocation === "yesterday") { items = mf.filter((f) => f.section === "yesterday" && !_archivedIds?.has(f.id) && !_deletedChatIds?.has(f.id)); }
    else if (selectedLocation === "older")     { items = mf.filter((f) => f.section === "older"     && !_archivedIds?.has(f.id) && !_deletedChatIds?.has(f.id)); }
    else if (selectedLocation === "pinned")    { items = _pinnedIds   ? mf.filter((f) => _pinnedIds.has(f.id))   : mf.filter((f) => f.section === "pinned"); }
    else if (selectedLocation === "favorites") { items = _favoriteIds ? mf.filter((f) => _favoriteIds.has(f.id)) : mf.filter((f) => f.section === "favorites"); }
    else if (selectedLocation === "archive")   { items = _archivedIds ? mf.filter((f) => _archivedIds.has(f.id)) : mf.filter((f) => f.section === "archive"); }
    else if (selectedLocation === "projects")  { items = [...allFoldersWithLocal]; }
    else {
      const folder = allFoldersWithLocal.find((f) => f.id === selectedLocation);
      items = folder
        ? mf.filter((f) => f.projectId === selectedLocation || _chatProjectMap?.[f.id] === selectedLocation)
        : [...mf.filter((f) => ["today","yesterday","older"].includes(f.section) && !_archivedIds?.has(f.id)), ...allFoldersWithLocal];
    }

    if (isSearching) {
      items = items.filter((item) =>
        matchesQuery(item.name, searchQuery) ||
        item.tags.some((t) => matchesQuery(t, searchQuery)) ||
        (item.type === "file" && ((item as FileItem).content.includes(searchQuery) || (item as FileItem).chat.some((m) => matchesQuery(m.text, searchQuery))))
      );
    }

    if (selectedTags.length > 0) items = items.filter((item) => selectedTags.every((t) => item.tags.includes(t)));
    items = applyDateFilter(items, dateFilter, customDateStart, customDateEnd);
    if (sortBy === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "date") items = [...items].sort((a, b) => b.date.localeCompare(a.date));
    else if (sortBy === "tags") items = [...items].sort((a, b) => a.tags.join().localeCompare(b.tags.join()));
    return items;
  }, [selectedLocation, searchQuery, selectedTags, dateFilter, sortBy, isSearching, allFoldersWithLocal, customDateStart, customDateEnd, mergedFiles, _pinnedIds, _favoriteIds, _archivedIds, _deletedChatIds, _chatProjectMap]);

  const groupedItems = useMemo(() => {
    if (selectedLocation !== "all" || isSearching || selectedTags.length > 0 || dateFilter !== "all") return null;
    const nonArchived = displayedItems.filter((i) => i.type === "folder" || !_archivedIds?.has(i.id));
    const pinnedFiles = _pinnedIds ? mergedFiles.filter((f) => _pinnedIds.has(f.id) && !_deletedChatIds?.has(f.id)) : [];
    const favFiles = _favoriteIds ? mergedFiles.filter((f) => _favoriteIds.has(f.id) && !_deletedChatIds?.has(f.id)) : [];
    const archiveFiles = _archivedIds ? mergedFiles.filter((f) => _archivedIds.has(f.id) && !_deletedChatIds?.has(f.id)) : [];
    return {
      pinned:    pinnedFiles,
      favorites: favFiles,
      folders:   nonArchived.filter((i) => i.type === "folder"),
      today:     nonArchived.filter((i) => i.type === "file" && (i as FileItem).section === "today" && !_pinnedIds?.has(i.id)),
      yesterday: nonArchived.filter((i) => i.type === "file" && (i as FileItem).section === "yesterday" && !_pinnedIds?.has(i.id)),
      older:     nonArchived.filter((i) => i.type === "file" && (i as FileItem).section === "older" && !_pinnedIds?.has(i.id)),
      archive:   archiveFiles,
    };
  }, [displayedItems, selectedLocation, isSearching, selectedTags, dateFilter, _archivedIds, _pinnedIds, _favoriteIds, _deletedChatIds, mergedFiles]);

  const handleContext = (e: React.MouseEvent, type: "file" | "folder", itemId: string, itemName: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, itemId, itemName });
  };

  const toggleTag = (tag: string) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const clearFilters = () => { setSelectedTags([]); setDateFilter("all"); setCustomDateStart(null); setCustomDateEnd(null); };

  const handleFolderOpen = (id: string) => { setSelectedLocation(id); setSelectedFile(null); };
  const handleFileOpen   = (file: FileItem) => setSelectedFile(file);

  const activeFilterCount = selectedTags.length + (dateFilter !== "all" && (dateFilter !== "custom" || customDateStart || customDateEnd) ? 1 : 0);

  const buildContextMenuItems = (type: "file" | "folder", itemId: string, itemName: string): MenuItem[] => {
    if (type === "folder") return [
      { icon: <Pencil size={12} />, label: "Rename",         onClick: () => { setContextMenu(null); setRenamingItemId(itemId); } },
      { icon: <Share2 size={12} />, label: "Share",          onClick: () => { setShareItem({ id: itemId, name: itemName }); setContextMenu(null); } },
      null,
      { icon: <Trash2 size={12} />, label: "Delete project", danger: true, onClick: () => { setDeleteItem({ id: itemId, name: itemName, type: "folder" }); setContextMenu(null); } },
    ];
    const isPinned    = _pinnedIds?.has(itemId);
    const isFavorited = _favoriteIds?.has(itemId);
    const isArchived  = _archivedIds?.has(itemId);
    return [
      { icon: <Pencil size={12} />,     label: "Rename",         onClick: () => { setContextMenu(null); setRenamingItemId(itemId); } },
      { icon: <Share2 size={12} />,     label: "Share",          onClick: () => { setShareItem({ id: itemId, name: itemName }); setContextMenu(null); } },
      { icon: <Users size={12} />,      label: "Start group chat", onClick: () => { setGroupItem({ name: itemName }); setContextMenu(null); } },
      { icon: <FolderInput size={12} />,label: "Move to project", hasArrow: true, onClick: () => {
        if (contextMenu) { setMoveItem({ id: itemId, pos: { x: contextMenu.x, y: contextMenu.y } }); }
        setContextMenu(null);
      }},
      null,
      isPinned
        ? { icon: <Pin size={12} />,  label: "Unpin",   onClick: () => { handlePinWithToast(itemId); setContextMenu(null); } }
        : { icon: <Pin size={12} />,  label: "Pin",     onClick: () => { handlePinWithToast(itemId); setContextMenu(null); } },
      isFavorited
        ? { icon: <Star size={12} />, label: "Remove from Favorites", onClick: () => { handleFavoriteWithToast(itemId); setContextMenu(null); } }
        : { icon: <Star size={12} />, label: "Add to Favorites",      onClick: () => { handleFavoriteWithToast(itemId); setContextMenu(null); } },
      null,
      isArchived
        ? { icon: <ArchiveRestore size={12} />, label: "Unarchive", onClick: () => { handleArchiveWithToast(itemId); setContextMenu(null); } }
        : { icon: <Archive size={12} />,        label: "Archive",   onClick: () => { handleArchiveWithToast(itemId); setContextMenu(null); } },
      null,
      { icon: <Trash2 size={12} />, label: "Delete", danger: true, onClick: () => { setDeleteItem({ id: itemId, name: itemName, type: "file" }); setContextMenu(null); } },
    ];
  };

  const handleRenameCommit = (itemId: string, title: string, tags: string[]) => {
    setLocalFileTitles((p) => ({ ...p, [itemId]: title }));
    setLocalFileTags((p) => ({ ...p, [itemId]: tags }));
    _onRename?.(itemId, title);
    _onUpdateTags?.(itemId, tags);
    setRenamingItemId(null);
  };

  const renderItems = (items: Item[], showLocation = false) => {
    const commonProps = (item: Item) => ({
      onContext: (e: React.MouseEvent) => handleContext(e, item.type, item.id, item.name),
      onFolderOpen: handleFolderOpen, onFileOpen: handleFileOpen,
      locationLabel: showLocation ? getLocationLabel(item, allFoldersWithLocal) : undefined,
      searchQuery: isSearching ? searchQuery : undefined,
      localTitle: localFileTitles[item.id],
      localTags:  localFileTags[item.id],
      isRenaming: renamingItemId === item.id,
      onRenameCommit: (title: string, tags: string[]) => handleRenameCommit(item.id, title, tags),
    });
    return viewMode === "grid" ? (
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))" }}>
        {items.map((item) => <FileCard key={item.id} item={item} {...commonProps(item)} allFoldersCtx={allFoldersWithLocal} />)}
      </div>
    ) : (
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#e8e8e8] mb-1">
          <span className="w-5" />
          <span className="flex-1 text-[11px] text-[#aaa] uppercase tracking-wide">Name / Preview</span>
          <span className="text-[11px] text-[#aaa] uppercase tracking-wide w-28">Tags</span>
          <span className="text-[11px] text-[#aaa] uppercase tracking-wide w-16 text-right">Date</span>
          <span className="w-5" />
        </div>
        {items.map((item) => <FileRow key={item.id} item={item} {...commonProps(item)} />)}
      </div>
    );
  };

  const sectionColors: Record<string, string> = {
    "Pinned": "#111111", "Favorites": "#FFB800", "Projects": "#6366F1", "Today": "#10B981", "Yesterday": "#F59E0B", "Older": "#9CA3AF", "Archive": "#6B7280",
  };
  const renderSection = (label: string, items: Item[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-6">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <div className="w-1 h-4 rounded-full" style={{ background: sectionColors[label] ?? "#ccc" }} />
          <h3 className="text-[12px] font-bold uppercase tracking-wide" style={{ color: sectionColors[label] ?? "#999" }}>{label}</h3>
          <span className="text-[11px] text-[#bbb]">({items.length})</span>
        </div>
        {renderItems(items)}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Chat Explorer Identity Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2 border-b border-[#e8e8e8] bg-gradient-to-r from-[#FFF7ED] via-white to-[#F5F3FF] shrink-0">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF8F5C, #FFB078)" }}>
          <Search size={12} color="white" />
        </div>
        <span className="text-[14px] text-[#333]" style={{ letterSpacing: "-0.2px" }}>Chat Explorer</span>
        <span className="text-[11px] text-[#bbb]">— Browse, search, and manage all your conversations</span>
        {!showOnboarding && (
          <button onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }}
            className="ml-auto text-[11px] text-[#FF8F5C] hover:text-[#E07B3A] px-2 py-0.5 rounded-lg hover:bg-[#FFF7ED] transition-colors flex items-center gap-1">
            <Lightbulb size={11} />Tour
          </button>
        )}
      </div>

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          currentStep={onboardingStep}
          onNext={() => setOnboardingStep((s) => s + 1)}
          onBack={() => setOnboardingStep((s) => Math.max(0, s - 1))}
          onSkip={() => setShowOnboarding(false)}
          onFinish={() => setShowOnboarding(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* ── Resizable Explorer Sidebar ── */}
      <div className="flex shrink-0 bg-[#FAFAFA] border-r border-[#e0e0e0] flex-col overflow-y-auto"
        style={{ width: sidebarWidth }}>
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF8F5C, #FFB078)" }}>
              <Search size={10} color="white" />
            </div>
            <span className="text-[12px] font-bold text-[#444] tracking-wide">Explorer</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button id="new-chat-btn" title="New Chat" onClick={handleNewChat} className="p-1.5 rounded-lg hover:bg-[#FFE4CC] text-[#FF8F5C] transition-colors"><Plus size={14} /></button>
            <button id="new-folder-btn" title="New Folder" onClick={handleNewFolder} className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#8B5CF6] transition-colors"><FolderPlus size={14} /></button>
          </div>
        </div>
        <div className="px-1 pb-1 flex flex-col overflow-y-auto flex-1">
          {treeData.map((node) => (
            <ExplorerNode key={node.id} node={node} depth={0} selected={selectedLocation}
              onSelect={(id) => { setSelectedLocation(id); setSelectedFile(null); }}
              onFileClick={(fileId) => {
                const file = mergedFiles.find((f) => f.id === fileId);
                if (file) setSelectedFile({ ...file, name: localFileTitles[file.id] ?? file.name, tags: localFileTags[file.id] ?? file.tags });
              }}
              pinnedIds={_pinnedIds} favoriteIds={_favoriteIds} archivedIds={_archivedIds}
              onPin={handlePinWithToast} onFavorite={handleFavoriteWithToast} onArchive={handleArchiveWithToast}
              onDelete={(id, name, type) => setDeleteItem({ id, name, type })}
              onRename={(id, name) => {
                // Determine if it's a folder or file
                const isFolder = allFoldersWithLocal.some((f) => f.id === id);
                if (isFolder) {
                  setLocalFolders((p) => p.map((f) => f.id === id ? { ...f, name } : f));
                  _onRenameProject?.(id, name);
                } else {
                  setLocalFileTitles((p) => ({ ...p, [id]: name }));
                  _onRename?.(id, name);
                  setSelectedFile((f) => f && f.id === id ? { ...f, name } : f);
                }
              }}
              onShare={(id, name) => setShareItem({ id, name })}
              onGroupChat={(name) => setGroupItem({ name })}
              onMoveToProject={(id, pos) => setMoveItem({ id, pos })}
              onNewChat={(folderId) => {
                if (_onChatCreatedInProject) {
                  const newChat: SessionChat = {
                    id: `session-${Date.now()}`,
                    title: "New Chat",
                    tags: [],
                    messages: [],
                    date: "2026-03-22",
                    dateLabel: "Today",
                  };
                  _onChatCreatedInProject(newChat, folderId);
                  const newFile: FileItem = { id: newChat.id, type: "file", name: "New Chat", tags: [], content: "", chat: [], date: "2026-03-22", dateLabel: "Today", section: "project", projectId: folderId };
                  setSelectedFile(newFile);
                }
              }}
              projects={_projects} chatProjectMap={_chatProjectMap}
            />
          ))}
          {/* Recycle Bin button at bottom of explorer */}
          <div className="mt-auto pt-2 border-t border-[#e0e0e0] mx-1">
            <button onClick={() => setRecycleBinOpen(true)}
              className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-[#FEE2E2] text-left transition-colors group">
              <Trash2 size={13} className="text-[#EF4444] group-hover:text-[#DC2626]" />
              <span className="text-[12px] text-[#666] group-hover:text-[#DC2626] transition-colors">Recycle Bin</span>
              {_recycleBin.length > 0 && (
                <span className="ml-auto text-[10px] bg-[#FEE2E2] text-[#EF4444] rounded-full px-1.5 py-0.5">{_recycleBin.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Drag handle ── */}
      <div
        className="w-1 bg-transparent hover:bg-[#bbb] cursor-col-resize shrink-0 transition-colors"
        style={{ minWidth: 4 }}
        onMouseDown={onDragStart}
      />

      {/* ── Main content area ── */}
      {selectedFile ? (
        <ConversationPane
          file={selectedFile}
          onBack={() => setSelectedFile(null)}
          onRenameFile={(fileId, title) => {
            setLocalFileTitles((p) => ({ ...p, [fileId]: title }));
            _onRename?.(fileId, title);
            // update selectedFile so header reflects new name
            setSelectedFile((f) => f ? { ...f, name: title } : f);
          }}
          onUpdateFileTags={(fileId, tags) => {
            setLocalFileTags((p) => ({ ...p, [fileId]: tags }));
            _onUpdateTags?.(fileId, tags);
            setSelectedFile((f) => f ? { ...f, tags } : f);
          }}
          onSendInFile={(fileId, messages) => {
            const sessionMessages = messages.map((m) => ({
              role: (m.role === "ai" ? "assistant" : m.role) as "user" | "assistant",
              text: m.text,
            }));
            const existingSession = _sessionChats?.find((s) => s.id === fileId);
            const fileRef = mergedFiles.find((f) => f.id === fileId);
            if (existingSession) {
              _onSessionChatUpdate?.({ ...existingSession, messages: sessionMessages });
            } else if (fileRef) {
              // First time chatting in this file — create/update session entry so home sidebar shows it
              const newSession: SessionChat = {
                id: fileId,
                title: localFileTitles[fileId] ?? fileRef.name,
                tags: localFileTags[fileId] ?? fileRef.tags,
                messages: sessionMessages,
                date: fileRef.date,
                dateLabel: fileRef.dateLabel,
              };
              _onSessionChatUpdate?.(newSession);
            }
          }}
          onMessagesUpdate={(fileId, msgs) => {
            // Additional sync hook
          }}
          onDelete={() => {
            if (selectedFile) {
              setDeleteItem({ id: selectedFile.id, name: localFileTitles[selectedFile.id] ?? selectedFile.name, type: "file" });
              setSelectedFile(null);
            }
          }}
          onMoveToProjectClick={(pos) => {
            if (selectedFile) setMoveItem({ id: selectedFile.id, pos });
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e8e8] bg-white shrink-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mr-2 shrink-0">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={11} color="#ccc" />}
                  <button className={`text-[12px] hover:underline ${i === breadcrumb.length - 1 ? "text-[#111] font-bold" : "text-[#999]"}`}
                    onClick={() => setSelectedLocation(crumb.id)}>{crumb.label}</button>
                </span>
              ))}
            </div>
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#aaa]" />
              <input type="text" placeholder="Search everything…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#f5f5f5] border border-[#e0e0e0] rounded outline-none focus:border-[#aaa] focus:bg-white" />
              {searchQuery && <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#aaa]" onClick={() => setSearchQuery("")}><X size={12} /></button>}
            </div>
            {/* Filter */}
            <div className="relative" ref={filterRef}>
              <button id="filter-btn" onClick={() => setFilterOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] transition-all ${filterOpen || activeFilterCount > 0 ? "bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]" : "border-[#e0e0e0] hover:bg-[#f5f5f5]"}`}>
                <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-[#16A34A]" : ""} />Filters
                {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-[#16A34A] text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
              </button>
              {filterOpen && (
                <FilterDropdown filterTab={filterTab} setFilterTab={setFilterTab}
                  selectedTags={selectedTags} toggleTag={toggleTag}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  customDateStart={customDateStart} customDateEnd={customDateEnd}
                  setCustomDateStart={setCustomDateStart} setCustomDateEnd={setCustomDateEnd}
                  onClear={clearFilters}
                  activeDates={Array.from(new Set(mergedFiles.map((f) => f.date)))} />
              )}
            </div>
            {/* Sort */}
            <div className="relative" ref={sortRef}>
              <button id="sort-btn" onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e0e0e0] text-[12px] hover:bg-[#F5F3FF] hover:border-[#C4B5FD] transition-all">
                {sortBy === "date" ? <Clock size={12} className="text-[#8B5CF6]" /> : sortBy === "name" ? <Type size={12} className="text-[#8B5CF6]" /> : <Tag size={12} className="text-[#8B5CF6]" />}
                Sort: <span className="font-bold text-[#7C3AED]">{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-9 z-40 bg-white border border-[#d0d0d0] rounded w-40 py-1 shadow-sm">
                  {([
                    { key: "date" as SortBy, label: "Date", icon: <Clock size={12} className="text-[#8B5CF6]" /> },
                    { key: "name" as SortBy, label: "Name", icon: <Type size={12} className="text-[#8B5CF6]" /> },
                    { key: "tags" as SortBy, label: "Tags", icon: <Tag size={12} className="text-[#8B5CF6]" /> },
                  ]).map(({ key, label, icon }) => (
                    <button key={key} onClick={() => { setSortBy(key); setSortOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] ${sortBy === key ? "font-bold text-[#111]" : "text-[#444]"}`}>
                      {icon}
                      {label}
                      {sortBy === key && <Check size={12} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* View toggle */}
            <div id="view-toggle" className="flex items-center border border-[#e0e0e0] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-all ${viewMode === "grid" ? "bg-[#FFF7ED] text-[#FF8F5C]" : "hover:bg-[#f5f5f5]"}`}><Grid2x2 size={14} color={viewMode === "grid" ? "#FF8F5C" : "#888"} /></button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 border-l border-[#e0e0e0] transition-all ${viewMode === "list" ? "bg-[#FFF7ED] text-[#FF8F5C]" : "hover:bg-[#f5f5f5]"}`}><List size={14} color={viewMode === "list" ? "#FF8F5C" : "#888"} /></button>
            </div>
            {/* Close */}
            {onClose && (
              <button onClick={onClose} title="Close Chat Explorer" className="ml-1 p-1.5 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white"><X size={15} /></button>
            )}
          </div>

          {/* File grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Folder detail header when viewing a specific project */}
            {(() => {
              const folder = allFoldersWithLocal.find((f) => f.id === selectedLocation);
              if (!folder) return null;
              return (
                <FolderDetailHeader
                  folder={folder}
                  fileCount={displayedItems.length}
                  localName={localFileTitles[folder.id]}
                  onRename={(id, name) => {
                    setLocalFileTitles((p) => ({ ...p, [id]: name }));
                    setLocalFolders((p) => p.map((f) => f.id === id ? { ...f, name } : f));
                    _onRenameProject?.(id, name);
                  }}
                  onNewChat={() => {
                    if (_onChatCreatedInProject) {
                      const newChat: SessionChat = {
                        id: `session-${Date.now()}`,
                        title: "New Chat",
                        tags: [],
                        messages: [],
                        date: "2026-03-22",
                        dateLabel: "Today",
                      };
                      _onChatCreatedInProject(newChat, folder.id);
                      const newFile: FileItem = { id: newChat.id, type: "file", name: "New Chat", tags: [], content: "", chat: [], date: "2026-03-22", dateLabel: "Today", section: "project", projectId: folder.id };
                      setSelectedFile(newFile);
                    }
                  }}
                />
              );
            })()}
            {displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Search size={28} color="#d0d0d0" />
                <p className="text-[14px] text-[#bbb]">{isSearching ? "No results found." : "No chats here yet."}</p>
              </div>
            ) : groupedItems ? (
              <>
                {renderSection("Pinned",     groupedItems.pinned)}
                {renderSection("Favorites",  groupedItems.favorites)}
                {renderSection("Projects",   groupedItems.folders)}
                {renderSection("Today",      groupedItems.today)}
                {renderSection("Yesterday",  groupedItems.yesterday)}
                {renderSection("Older",      groupedItems.older)}
                {renderSection("Archive",    groupedItems.archive)}
              </>
            ) : (
              <div>
                {isSearching && (
                  <p className="text-[11px] text-[#bbb] mb-4">
                    {displayedItems.length} result{displayedItems.length !== 1 ? "s" : ""} for "<strong>{searchQuery}</strong>"
                  </p>
                )}
                {renderItems(displayedItems, isSearching)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Context menu (right-click on grid) ── */}
      {contextMenu && (
        <ContextMenu
          items={buildContextMenuItems(contextMenu.type, contextMenu.itemId, contextMenu.itemName)}
          onClose={() => setContextMenu(null)}
          x={contextMenu.x} y={contextMenu.y}
        />
      )}

      {/* ── Modals ── */}
      {shareItem && <ShareModal chatTitle={shareItem.name} chatId={shareItem.id} onClose={() => setShareItem(null)} />}
      {groupItem && <GroupChatModal chatTitle={groupItem.name} onClose={() => setGroupItem(null)} onStart={() => setGroupItem(null)} />}
      {deleteItem && (
        <DeleteConfirmModal itemName={deleteItem.name} itemType={deleteItem.type === "folder" ? "folder" : "chat"}
          onConfirm={() => {
            if (deleteItem.type === "file")   { _onDeleteChat?.(deleteItem.id); setLocalFileTitles((p) => { const n = { ...p }; delete n[deleteItem.id]; return n; }); }
            else { _onDeleteProject?.(deleteItem.id); setLocalFolders((p) => p.filter((f) => f.id !== deleteItem.id)); }
            setDeleteItem(null);
          }}
          onCancel={() => setDeleteItem(null)} />
      )}
      {moveItem && (
        <MoveToProjectMenu
          projects={allFoldersWithLocal.map((f) => ({ id: f.id, name: f.name, count: f.count }))}
          currentProjectId={_chatProjectMap?.[moveItem.id]}
          onMove={(pid) => { _onMoveToProject?.(moveItem.id, pid); setMoveItem(null); }}
          onCreateProject={(name) => { _onAddProject?.(name); setMoveItem(null); }}
          x={moveItem.pos.x} y={moveItem.pos.y}
          onClose={() => setMoveItem(null)} />
      )}
      {recycleBinOpen && (
        <RecycleBinModal
          items={_recycleBin}
          onRestore={(id, type) => _onRestoreItem?.(id, type)}
          onPermanentDelete={(id, type) => _onPermanentDeleteBin?.(id, type)}
          onEmptyBin={() => _onEmptyBin?.()}
          onClose={() => setRecycleBinOpen(false)}
        />
      )}
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-2.5 rounded-xl shadow-lg text-[13px] text-white flex items-center gap-2"
          style={{ background: toast.color, animation: "fadeInUp 0.25s ease-out" }}>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          {toast.message}
        </div>
      )}
      </div>{/* close flex-1 row */}
    </div>
  );
}
