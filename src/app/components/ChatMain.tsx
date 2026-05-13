import { useState, useEffect, useRef } from "react";
import {
  RotateCcw, Copy, ThumbsUp, ThumbsDown, Send, Paperclip, Mic,
  ChevronDown, ChevronRight, Pencil, Check, X, Plus, Folder, FileText,
  Share2, Users, Trash2, FolderInput,
} from "lucide-react";
import {
  CHAT_MAP, ChatMessage, SessionChat, ALL_CHATS,
  generateChatTitle, detectTopic, getDynamicTitleSuggestions,
  getRenameSuggestions, generateMultiTopicTitle, PROJECT_CHATS,
} from "../data/chatData";
import { ShareModal, GroupChatModal, MoveToProjectMenu, DeleteConfirmModal } from "./Modals";
import type { Project } from "../App";

// ─── AI Avatar ────────────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center shadow-sm"
      style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.09 8.26L20.18 9.27L15.09 14.24L16.18 20.32L12 17.77L7.82 20.32L8.91 14.24L3.82 9.27L9.91 8.26L12 2Z" fill="white" />
      </svg>
    </div>
  );
}

// ─── Message components ───────────────────────────────────────────────────────

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[58%] px-4 py-3 rounded-2xl rounded-br-sm text-[15px] text-[#1a1a1a] whitespace-pre-wrap"
        style={{ lineHeight: "1.65", background: "#FFF4EE", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2 max-w-[74%] group">
      <div className="flex items-center gap-2">
        <AIAvatar />
        <span className="text-[12px] text-[#999] tracking-wide" style={{ letterSpacing: "0.02em" }}>Assistant</span>
      </div>
      <div
        className="px-4 py-3.5 rounded-2xl rounded-tl-sm text-[15px] text-[#1a1a1a] whitespace-pre-wrap"
        style={{ lineHeight: "1.65", background: "#F7F7F8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        {content}
      </div>
      <div className="flex items-center gap-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {[
          { icon: <Copy size={12} />, label: "Copy" },
          { icon: <RotateCcw size={12} />, label: "Retry" },
          { icon: <ThumbsUp size={12} />, label: "Good" },
          { icon: <ThumbsDown size={12} />, label: "Bad" },
        ].map(({ icon, label }) => (
          <button key={label} title={label}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#aaa] hover:text-[#444] hover:bg-[#f0f0f0] transition-colors">
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col gap-2 max-w-[74%]">
      <div className="flex items-center gap-2">
        <AIAvatar />
        <span className="text-[12px] text-[#999]">Assistant</span>
      </div>
      <div
        className="px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
        style={{ background: "#F7F7F8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <style>{`
          @keyframes aiDot { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
        `}</style>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #FF8F5C, #FFB078)",
              animation: `aiDot 1.3s ease-in-out ${i * 0.18}s infinite`,
            }} />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const PROMPTS = [
  { icon: "✍️", label: "Write", text: "Help me write a product brief" },
  { icon: "🔍", label: "Analyse", text: "Summarise my week's highlights" },
  { icon: "💻", label: "Code", text: "Debug this code snippet" },
  { icon: "📋", label: "Plan", text: "Draft a cold outreach email" },
];

function NewChatEmpty({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 pb-10">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.09 8.26L20.18 9.27L15.09 14.24L16.18 20.32L12 17.77L7.82 20.32L8.91 14.24L3.82 9.27L9.91 8.26L12 2Z" fill="white" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-[22px] text-[#111] mb-1" style={{ letterSpacing: "-0.3px" }}>How can I help you today?</h2>
          <p className="text-[14px] text-[#999]">Start typing or pick a suggestion to get going.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[480px]">
        {PROMPTS.map((p) => (
          <button key={p.text} onClick={() => onPrompt(p.text)}
            className="group text-left px-4 py-3.5 rounded-xl border border-[#ebebeb] bg-white hover:border-[#FFB078] hover:bg-[#FFF9F5] transition-all"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span className="block text-[16px] mb-1">{p.icon}</span>
            <span className="block text-[11px] text-[#bbb] mb-0.5">{p.label}</span>
            <span className="block text-[13px] text-[#333] group-hover:text-[#111]">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Multi-topic banner ───────────────────────────────────────────────────────

function MultiTopicBanner({ onContinue, onNewChat }: { onContinue: () => void; onNewChat: () => void }) {
  return (
    <div className="mx-8 mb-2 flex items-start gap-3 p-3 rounded border border-[#f0d060] bg-[#fffbe6]">
      <div className="text-[18px]">🔀</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#7a5c00] mb-0.5">Looks like you've switched topics</p>
        <p className="text-[12px] text-[#9a7700]">
          Continuing will auto-tag this chat as <strong>multi-topic</strong> and update its title. Or start a focused new chat.
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={onNewChat} className="text-[11px] px-2.5 py-1 bg-[#333] text-white rounded hover:bg-[#111] whitespace-nowrap">Start new chat</button>
        <button onClick={onContinue} className="text-[11px] px-2.5 py-1 border border-[#ccc] rounded hover:bg-[#f0f0f0] whitespace-nowrap text-[#555]">Continue & auto-tag</button>
      </div>
    </div>
  );
}

// ─── Project view ─────────────────────────────────────────────────────────────

function ProjectView({
  projectId, projects, chatTitles, chatTags, chatProjectMap,
  sessionChats, deletedChatIds, onChatClick, onNewChatInProject,
}: {
  projectId: string; projects: Project[];
  chatTitles: Record<string, string>; chatTags: Record<string, string[]>;
  chatProjectMap: Record<string, string>; sessionChats: SessionChat[];
  deletedChatIds: Set<string>;
  onChatClick: (id: string) => void;
  onNewChatInProject: () => void;
}) {
  const project = projects.find((p) => p.id === projectId);

  // Static project chats
  const staticChats = ALL_CHATS.filter(
    (c) => (c.section === "project" && c.projectId === projectId) ||
            chatProjectMap[c.id] === projectId
  ).filter((c) => !deletedChatIds.has(c.id));

  // Session chats moved to this project
  const sessionProjectChats = sessionChats.filter(
    (c) => chatProjectMap[c.id] === projectId && !deletedChatIds.has(c.id)
  );

  const allChats = [...sessionProjectChats, ...staticChats]
    .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);

  return (
    <div className="flex flex-col flex-1 bg-[#FFF9E6] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e0e0e0]">
        <div className="w-8 h-8 rounded bg-[#e8e8e8] flex items-center justify-center">
          <Folder size={18} color="#555" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[16px] font-bold text-[#111]">{project?.name ?? projectId}</span>
          <p className="text-[12px] text-[#aaa] mt-0.5">{allChats.length} conversation{allChats.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onNewChatInProject}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ddd] rounded hover:bg-[#f5f5f5] text-[12px] text-[#444]">
          <Plus size={13} />New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {allChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Folder size={32} color="#d0d0d0" />
            <p className="text-[13px] text-[#bbb]">No chats in this project yet</p>
            <button onClick={onNewChatInProject}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#333] text-white rounded hover:bg-[#111] text-[13px]">
              <Plus size={13} />Start the first chat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allChats.map((chat) => {
              const title = chatTitles[chat.id] ?? chat.title;
              const tags  = chatTags[chat.id]   ?? chat.tags;
              const preview = chat.messages.find((m) => m.role === "assistant")?.text ?? chat.messages[0]?.text ?? "";
              return (
                <button key={chat.id} onClick={() => onChatClick(chat.id)}
                  className="text-left w-full flex items-start gap-3 p-4 rounded-lg border border-[#e8e8e8] hover:border-[#bbb] hover:bg-[#fafafa] transition-colors group">
                  <div className="w-8 h-8 rounded bg-[#f0f0f0] flex items-center justify-center shrink-0">
                    <FileText size={15} color="#888" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-[#111] truncate">{title}</span>
                      {tags.map((t) => (
                        <span key={t} className="text-[10px] text-[#555] bg-[#ebebeb] rounded-full px-1.5 py-[1px] shrink-0">{t}</span>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#999] line-clamp-2">{preview}</p>
                    <p className="text-[10px] text-[#ccc] mt-1">{chat.dateLabel}</p>
                  </div>
                  <ChevronRight size={14} color="#ccc" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rename header ────────────────────────────────────────────────────────────

function RenameHeader({ title, tags, messages, onSave, onCancel }: {
  title: string; tags: string[]; messages: ChatMessage[];
  onSave: (t: string, tags: string[]) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(title);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const liveSugg = getDynamicTitleSuggestions(draft, messages, title);
  const { suggestedTags } = getRenameSuggestions(tags, messages, title);
  const activeTags = tags.filter((t) => !removedTags.includes(t));
  const allCurrentTags = [...activeTags, ...pendingTags];
  const toggleTag = (t: string) => setPendingTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const removeExistingTag = (t: string) => setRemovedTags((p) => [...p, t]);
  const addCustomTag = () => {
    const t = newTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !allCurrentTags.includes(t)) setPendingTags((p) => [...p, t]);
    setNewTagInput("");
  };
  const commit = () => onSave(draft.trim() || title, [...activeTags, ...pendingTags]);

  return (
    <div className="px-6 py-4 border-b border-[#e0e0e0] bg-[#fafafa] flex flex-col gap-3">
      {/* Title input */}
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="text" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
          className="flex-1 text-[15px] font-semibold border-2 border-[#EC4899] rounded px-3 py-2 outline-none focus:border-[#DB2777] bg-white text-[#111]" />
        <button onClick={commit} className="p-2 rounded-lg text-white hover:bg-[#E67A47] transition-colors" style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}>
          <Check size={16} />
        </button>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-[#e8e8e8] text-[#666] border border-[#ddd]">
          <X size={16} />
        </button>
      </div>

      {/* Title Suggestions */}
      {liveSugg.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              <path d="M12 4v1M17.66 6.344l-.828.828M20.005 12.004h-1M17.66 17.664l-.828-.828M12 20.01V19M6.34 17.664l.835-.836M3.995 12.004h1.01M6 6l.835.836"/>
            </svg>
            <span className="text-[11px] font-bold text-[#000] uppercase tracking-wide">Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveSugg.map((s) => (
              <button key={s} onClick={() => setDraft(s)}
                className={`text-[12px] px-3 py-1.5 rounded-lg border-2 transition-all ${
                  draft === s 
                    ? "bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-semibold shadow-sm" 
                    : "bg-[#FFFBEB] border-[#FDE68A] text-[#78350F] hover:bg-[#FEF3C7] hover:border-[#F59E0B]"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5Z"/>
            <path d="m2 17 10 5 10-5"/>
            <path d="m2 12 10 5 10-5"/>
          </svg>
          <span className="text-[11px] font-bold text-[#000] uppercase tracking-wide">Tags</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Current tags (removable) */}
          {activeTags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-semibold bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] rounded-full px-3 py-1 hover:border-[#EF4444] hover:bg-[#FEF2F2] transition-all">
              #{t}
              <button onClick={() => removeExistingTag(t)} title={`Remove #${t}`}
                className="ml-0.5 p-0.5 rounded-full hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
          
          {/* Pending tags (newly added) */}
          {pendingTags.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] font-semibold text-white rounded-full px-3 py-1 shadow-sm" style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}>
              #{t}
              <button onClick={() => setPendingTags((p) => p.filter((x) => x !== t))} className="hover:opacity-80">
                <X size={11} />
              </button>
            </span>
          ))}
          
          {/* Suggested tags */}
          {suggestedTags.filter((t) => !allCurrentTags.includes(t)).map((t) => (
            <button key={t} onClick={() => toggleTag(t)}
              className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full border-2 border-dashed border-[#9CA3AF] bg-white text-[#6B7280] hover:border-[#4B5563] hover:text-[#374151] hover:bg-[#F9FAFB] transition-all">
              <Plus size={10} />
              #{t}
            </button>
          ))}
          
          {/* New tag input - HIGHLIGHTED */}
          <div className="flex items-center gap-1 border-2 border-dashed rounded-full px-3 py-1 shadow-md transition-all" style={{ borderColor: "#FFB078", background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)" }}>
            <Plus size={11} style={{ color: "#FF8F5C" }} />
            <input type="text" placeholder="Add new tag…" value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
              className="w-24 text-[11px] font-semibold outline-none bg-transparent placeholder:text-[#FB923C] text-[#EA580C]" />
            {newTagInput && (
              <button onClick={addCustomTag} className="p-0.5 rounded hover:bg-[#FFB078]/20" style={{ color: "#FF8F5C" }}>
                <Check size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mock AI replies ──────────────────────────────────────────────────────────

const MOCK_REPLIES = [
  "Great question! There are several angles worth considering here — from the strategic perspective, you'd want to weigh the trade-offs between short-term gains and long-term sustainability. What's your current timeline for this?",
  "Absolutely, I can help with that. The key is to break it down into smaller steps. First, let's establish the core objective. Once that's clear, the rest tends to follow naturally. What's the most important outcome you're optimising for?",
  "That's a really interesting problem. I'd approach it by first auditing the current state, then identifying the highest-leverage changes. Often the 20% of work that drives 80% of the impact is hiding in plain sight. Want me to dig deeper into any specific area?",
  "Good call. Here's what I'd recommend: start with the quick wins to build momentum, then tackle structural improvements in parallel. The mistake most teams make is trying to do everything at once — prioritisation is key. Shall I help you build a prioritised action list?",
];

// ─── ChatMain ────────────────────────────────────────────────────────────────

interface ChatMainProps {
  activeChatId: string;
  sessionChats: SessionChat[];
  chatTitles: Record<string, string>;
  chatTags: Record<string, string[]>;
  chatProjectMap: Record<string, string>;
  projects: Project[];
  onChatCreated: (chat: SessionChat) => void;
  onChatCreatedInProject: (chat: SessionChat, projectId: string) => void;
  onSessionChatUpdate: (chat: SessionChat) => void;
  onRename: (id: string, title: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onNewChat: () => void;
  onChatSelect?: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onMoveToProject: (chatId: string, projectId: string) => void;
  deletedChatIds?: Set<string>;
}

export function ChatMain({
  activeChatId, sessionChats, chatTitles, chatTags, chatProjectMap, projects,
  onChatCreated, onChatCreatedInProject, onSessionChatUpdate, onRename, onUpdateTags,
  onNewChat, onChatSelect, onDeleteChat, onMoveToProject,
  deletedChatIds = new Set(),
}: ChatMainProps) {
  const isProjectView = activeChatId.startsWith("project:");
  const projectId     = isProjectView ? activeChatId.replace("project:", "") : null;
  const isNew         = activeChatId === "new";

  const staticChat  = (!isNew && !isProjectView) ? CHAT_MAP[activeChatId] ?? null : null;
  const sessionChat = (!isNew && !isProjectView) ? sessionChats.find((c) => c.id === activeChatId) ?? null : null;
  const baseChat    = staticChat ?? sessionChat;

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(baseChat?.messages ?? []);
  const [inputValue,    setInputValue]    = useState("");
  const [isTyping,      setIsTyping]      = useState(false);
  const [isRenaming,    setIsRenaming]    = useState(false);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [groupOpen,     setGroupOpen]     = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [moveMenuPos,   setMoveMenuPos]   = useState<{ x: number; y: number } | null>(null);
  const [chatId,        setChatId]        = useState<string | null>(isNew ? null : activeChatId);
  const [chatTitle,     setChatTitle]     = useState(chatTitles[activeChatId] ?? baseChat?.title ?? "New Chat");
  const [chatTagsLocal, setChatTagsLocal] = useState<string[]>(chatTags[activeChatId] ?? baseChat?.tags ?? []);
  const [isMultiTopic,  setIsMultiTopic]  = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const [pendingMsg,    setPendingMsg]     = useState<string | null>(null);
  const [firstTopic,    setFirstTopic]    = useState<string>("general");
  const [newChatProjectId, setNewChatProjectId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerMoreRef  = useRef<HTMLButtonElement>(null);
  const headerMenuRef  = useRef<HTMLDivElement>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [headerMenuPos,  setHeaderMenuPos]  = useState<{ x: number; y: number } | null>(null);

  // Click-outside to close header menu
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node) &&
          headerMoreRef.current && !headerMoreRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
        setHeaderMenuPos(null);
      }
    };
    if (headerMenuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [headerMenuOpen]);

  useEffect(() => {
    const sc   = sessionChats.find((c) => c.id === activeChatId);
    const base = CHAT_MAP[activeChatId] ?? sc ?? null;
    setChatId(isNew ? null : activeChatId);
    setChatTitle(chatTitles[activeChatId] ?? base?.title ?? "New Chat");
    setChatTagsLocal(chatTags[activeChatId] ?? base?.tags ?? []);
    setLocalMessages(base?.messages ? [...base.messages] : []);
    setInputValue(""); setIsTyping(false); setIsRenaming(false);
    setIsMultiTopic(false); setDismissed(false); setPendingMsg(null); setFirstTopic("general");
    setShareOpen(false); setGroupOpen(false); setDeleteOpen(false); setMoveMenuPos(null);
    setHeaderMenuOpen(false); setHeaderMenuPos(null);
  }, [activeChatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages, isTyping]);

  const detectShift = (newMsg: string, existingMsgs: ChatMessage[]): boolean => {
    const userMsgs = existingMsgs.filter((m) => m.role === "user");
    if (userMsgs.length < 1) return false;
    const established = detectTopic(userMsgs.slice(0, 2).map((m) => m.text).join(" "));
    const newTopic    = detectTopic(newMsg);
    if (newTopic === "general" || established === "general" || newTopic === established) return false;
    setFirstTopic(established);
    return true;
  };

  const sendMessage = (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content) return;
    if (!dismissed && detectShift(content, localMessages)) {
      setPendingMsg(content); setIsMultiTopic(true); return;
    }
    setInputValue(""); setIsMultiTopic(false);
    const userMsg: ChatMessage = { role: "user", text: content };
    const updated = [...localMessages, userMsg];
    setLocalMessages(updated); setIsTyping(true);
    setTimeout(() => {
      const aiText = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      const final  = [...updated, { role: "assistant" as const, text: aiText }];
      setIsTyping(false); setLocalMessages(final);
      if (!chatId) {
        const generatedTitle = generateChatTitle(content);
        const newId = `session-${Date.now()}`;
        const newChat: SessionChat = { id: newId, title: generatedTitle, tags: [], messages: final, date: "2026-03-22", dateLabel: "Today" };
        setChatId(newId); setChatTitle(generatedTitle); setChatTagsLocal([]);
        onChatCreated(newChat);
      } else if (sessionChat) {
        onSessionChatUpdate({ ...sessionChat, messages: final, title: chatTitle, tags: chatTagsLocal });
      }
    }, 900 + Math.random() * 700);
  };

  const handleContinue = () => {
    const newTopic  = pendingMsg ? detectTopic(pendingMsg) : "general";
    const multiTitle = generateMultiTopicTitle(firstTopic, newTopic, localMessages);
    const newTags    = [...new Set([...chatTagsLocal, "multi-topic"])];
    setChatTitle(multiTitle); setChatTagsLocal(newTags);
    if (chatId) { onRename(chatId, multiTitle); onUpdateTags(chatId, newTags); }
    setIsMultiTopic(false); setDismissed(true);
    if (pendingMsg) {
      const content = pendingMsg; setPendingMsg(null); setInputValue("");
      const userMsg: ChatMessage = { role: "user", text: content };
      const updated = [...localMessages, userMsg];
      setLocalMessages(updated); setIsTyping(true);
      setTimeout(() => {
        const aiText = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
        setLocalMessages([...updated, { role: "assistant" as const, text: aiText }]); setIsTyping(false);
      }, 900 + Math.random() * 600);
    }
  };

  const handleRenameCommit = (newTitle: string, newTags: string[]) => {
    setChatTitle(newTitle); setChatTagsLocal(newTags);
    if (chatId) { onRename(chatId, newTitle); onUpdateTags(chatId, newTags); }
    setIsRenaming(false);
  };

  // Project view
  if (isProjectView && projectId) {
    return (
      <>
        <ProjectView
          projectId={projectId}
          projects={projects}
          chatTitles={chatTitles}
          chatTags={chatTags}
          chatProjectMap={chatProjectMap}
          sessionChats={sessionChats}
          deletedChatIds={deletedChatIds}
          onChatClick={(id) => onChatSelect ? onChatSelect(id) : undefined}
          onNewChatInProject={() => setNewChatProjectId(projectId)}
        />
        {newChatProjectId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setNewChatProjectId(null); }}>
            <div className="bg-white rounded-xl shadow-2xl w-[460px] p-6 border border-[#ddd]">
              <h2 className="text-[15px] font-bold text-[#111] mb-3">New chat in project</h2>
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={3}
                placeholder="What would you like to discuss?"
                className="w-full text-[13px] border border-[#ddd] rounded px-3 py-2.5 outline-none focus:border-[#888] resize-none mb-3 placeholder:text-[#ccc]" />
              <div className="flex gap-2">
                <button onClick={() => setNewChatProjectId(null)} className="flex-1 py-2 border border-[#ddd] rounded text-[13px] text-[#555] hover:bg-[#f5f5f5]">Cancel</button>
                <button disabled={!inputValue.trim()} onClick={() => {
                  if (!inputValue.trim()) return;
                  const newChat: SessionChat = {
                    id: `session-${Date.now()}`, title: generateChatTitle(inputValue),
                    tags: [], messages: [{ role: "user", text: inputValue }],
                    date: "2026-03-22", dateLabel: "Today",
                  };
                  onChatCreatedInProject(newChat, newChatProjectId!);
                  setNewChatProjectId(null); setInputValue("");
                  if (onChatSelect) onChatSelect(newChat.id);
                }} className="flex-1 py-2 bg-[#333] text-white rounded hover:bg-[#111] disabled:opacity-40 text-[13px]">
                  Start chat
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const currentProjectId = chatId ? chatProjectMap[chatId] : undefined;

  return (
    <>
      <div className="flex flex-col flex-1 bg-white overflow-hidden">
        {/* Header */}
        {isRenaming ? (
          <RenameHeader title={chatTitle} tags={chatTagsLocal} messages={localMessages}
            onSave={handleRenameCommit} onCancel={() => setIsRenaming(false)} />
        ) : (
          <div className="relative flex items-center px-6 py-3 border-b border-[#e0e0e0] shrink-0 gap-2 min-w-0">
            <button onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-1.5 min-w-0 hover:bg-[#f5f5f5] px-2 py-1 rounded -ml-2">
              <span className="text-[15px] font-bold text-[#111] truncate">{chatTitle}</span>
              <Pencil size={13} className="opacity-0 group-hover:opacity-100 shrink-0" color="#EC4899" />
            </button>
            {chatTagsLocal.length > 0 && (
              <div className="flex flex-wrap gap-1 shrink-0">
                {chatTagsLocal.slice(0, 4).map((t) => {
                  const isMultiTopic = t.includes(",") || t.includes("+") || t.includes("&") || t.includes("/") || t.toLowerCase() === "multi-topic";
                  
                  return isMultiTopic ? (
                    <span key={t} className="text-[10px] rounded-full px-2.5 py-1 font-semibold bg-[#F3E8FF] text-[#7C3AED]">
                      {t}
                    </span>
                  ) : (
                    <span key={t} className="text-[10px] rounded-full px-2.5 py-1 font-semibold bg-[#F3F4F6] text-[#374151]">
                      {t}
                    </span>
                  );
                })}
              </div>
            )}
            {/* Header action buttons */}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <button title="Share" onClick={() => setShareOpen(true)}
                className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><Share2 size={15} /></button>
              <button title="Start a group chat" onClick={() => setGroupOpen(true)}
                className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><Users size={15} /></button>
              <button ref={headerMoreRef} title="More" onClick={() => {
                  if (!headerMenuOpen && headerMoreRef.current) {
                    const r = headerMoreRef.current.getBoundingClientRect();
                    setHeaderMenuPos({ x: Math.max(8, r.right - 208), y: r.bottom + 4 });
                  }
                  setHeaderMenuOpen((v) => !v);
                }}
                className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
            </div>
            {/* Header dropdown — fixed to avoid overflow-hidden clipping */}
            {headerMenuOpen && headerMenuPos && (
              <div ref={headerMenuRef}
                className="fixed z-[300] bg-white border border-[#d0d0d0] rounded w-52 py-1 shadow-md"
                style={{ left: headerMenuPos.x, top: headerMenuPos.y }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setHeaderMenuOpen(false); setHeaderMenuPos(null); setIsRenaming(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                  <Pencil size={13} color="#555" />Rename
                </button>
                <button onClick={() => { setHeaderMenuOpen(false); setHeaderMenuPos(null); setShareOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                  <Share2 size={13} color="#555" />Share
                </button>
                <button onClick={() => { setHeaderMenuOpen(false); setHeaderMenuPos(null); setGroupOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                  <Users size={13} color="#555" />Start a group chat
                </button>
                <button onClick={() => {
                    if (headerMoreRef.current) {
                      const r = headerMoreRef.current.getBoundingClientRect();
                      setMoveMenuPos({ x: r.left, y: r.bottom + 4 });
                    }
                    setHeaderMenuOpen(false); setHeaderMenuPos(null);
                  }} className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#222]">
                  <span className="flex items-center gap-2"><FolderInput size={13} color="#555" />Move to project</span>
                  <ChevronRight size={12} color="#999" />
                </button>
                <div className="my-0.5 border-t border-[#e8e8e8]" />
                <button onClick={() => { setHeaderMenuOpen(false); setHeaderMenuPos(null); setDeleteOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] text-[#cc0000]">
                  <Trash2 size={13} />Delete chat
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {localMessages.length === 0 && !isTyping ? (
          <NewChatEmpty onPrompt={(p) => sendMessage(p)} />
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
            {localMessages.map((msg, i) =>
              msg.role === "user" ? <UserMessage key={i} content={msg.text} /> : <AssistantMessage key={i} content={msg.text} />
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isMultiTopic && <MultiTopicBanner onContinue={handleContinue} onNewChat={onNewChat} />}

        <div className="px-6 py-4 border-t border-[#f0f0f0]">
          <div className="rounded-2xl border border-[#e5e5e5] bg-white overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <textarea
              className="w-full px-5 pt-4 pb-2 text-[14px] text-[#1a1a1a] placeholder:text-[#c0c0c0] resize-none outline-none bg-white"
              rows={3} placeholder="Message the assistant…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#555] transition-colors" title="Attach file">
                  <Paperclip size={15} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#bbb] hover:text-[#555] transition-colors" title="Voice input">
                  <Mic size={15} />
                </button>
                <div className="w-px h-3.5 bg-[#e8e8e8] mx-1" />
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-[#bbb] hover:text-[#555] hover:bg-[#f5f5f5] transition-colors">
                  <span>Tone: Default</span><ChevronDown size={9} />
                </button>
              </div>
              <button
                disabled={!inputValue.trim() || isTyping}
                onClick={() => sendMessage()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] disabled:opacity-35 transition-opacity"
                style={{ background: "linear-gradient(135deg, #FF8F5C 0%, #FFB078 100%)" }}
              >
                <Send size={13} /><span>Send</span>
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#d0d0d0] mt-2 tracking-wide">
            AI can make mistakes — verify important information.
          </p>
        </div>
      </div>

      {/* Modals */}
      {shareOpen && chatTitle && (
        <ShareModal chatTitle={chatTitle} chatId={chatId ?? ""} onClose={() => setShareOpen(false)} />
      )}
      {groupOpen && (
        <GroupChatModal chatTitle={chatTitle} onClose={() => setGroupOpen(false)} onStart={() => setGroupOpen(false)} />
      )}
      {moveMenuPos && (
        <MoveToProjectMenu
          projects={projects}
          currentProjectId={currentProjectId}
          onMove={(pid) => { onMoveToProject(chatId!, pid); setMoveMenuPos(null); }}
          onRemoveFromProject={currentProjectId ? () => { if (chatId) { /* remove */ } setMoveMenuPos(null); } : undefined}
          onCreateProject={(name) => { /* handled in App */ setMoveMenuPos(null); }}
          x={moveMenuPos.x} y={moveMenuPos.y}
          onClose={() => setMoveMenuPos(null)} />
      )}
      {deleteOpen && (
        <DeleteConfirmModal itemName={chatTitle} itemType="chat"
          onConfirm={() => { if (chatId) onDeleteChat(chatId); setDeleteOpen(false); onNewChat(); }}
          onCancel={() => setDeleteOpen(false)} />
      )}
    </>
  );
}