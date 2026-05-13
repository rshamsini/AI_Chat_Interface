import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, FolderPlus, Monitor, Pin, Star, Calendar, ChevronDown, ChevronRight,
  MoreHorizontal, Share2, Users, Pencil, FolderInput, Archive, Trash2,
  Folder, X, Search, Check, ArchiveRestore, FileText, MessageSquarePlus, Clock,
} from "lucide-react";
import { MiniCalendar } from "./MiniCalendar";
import { ShareModal, GroupChatModal, MoveToProjectMenu, DeleteConfirmModal, NewChatInProjectModal, RecycleBinModal } from "./Modals";
import type { RecycleBinItem } from "./Modals";
import {
  ALL_CHATS, SessionChat, getDynamicTitleSuggestions, getRenameSuggestions,
} from "../data/chatData";
import type { Project } from "../App";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Semantic tag color mapping
function getSemanticTagColor(tag: string): { bg: string; text: string; border: string } {
  const t = tag.toLowerCase();
  
  // Multi-topic tags - BRIGHT and DISTINCTIVE (electric purple with strong contrast)
  if (t.includes(",") || t.includes("+") || t.includes("&") || t.includes("/") || t.toLowerCase() === "multi-topic") {
    return { bg: "#C084FC", text: "#5B21B6", border: "#A855F7" };
  }
  
  // Brand/Marketing - Professional Pink/Rose
  if (t.match(/brand|voice|guideline/))
    return { bg: "#FCE7F3", text: "#BE185D", border: "#F9A8D4" };
  
  // Copy/Content/Writing - Professional Slate Gray
  if (t.match(/copy|content|writing|text|article|blog/))
    return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
  
  // Team/Collaboration - Professional Light Blue
  if (t.match(/team|collab|group|meeting|standup|sync/))
    return { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" };
  
  // Recap/Summary/Notes - Professional Light Purple
  if (t.match(/recap|summary|note|review|retrospective/))
    return { bg: "#E0E7FF", text: "#4338CA", border: "#A5B4FC" };
  
  // Strategy/Planning - Professional Indigo
  if (t.match(/strategy|planning|plan|roadmap|goal|objective/))
    return { bg: "#E0E7FF", text: "#3730A3", border: "#818CF8" };
  
  // Marketing/Campaign - Professional Amber
  if (t.match(/marketing|campaign|seo|social|advertising|promotion/))
    return { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" };
  
  // Development/Coding - Professional Royal Blue
  if (t.match(/dev|backend|frontend|code|software|api|programming|tech|engineer|module|refactor|auth/))
    return { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" };
  
  // Nature/Environment - Professional Forest Green
  if (t.match(/nature|environment|outdoor|plant|garden|eco|green|sustainability/))
    return { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" };
  
  // Finance/Money - Professional Gold
  if (t.match(/finance|money|invest|budget|payment|cost|revenue|profit/))
    return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
  
  // Research/Science/Audit - Professional Deep Purple
  if (t.match(/research|analysis|science|study|data|analytics|experiment|audit/))
    return { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" };
  
  // Personal/Lifestyle - Professional Magenta
  if (t.match(/personal|lifestyle|health|fitness|wellness|meditation|self/))
    return { bg: "#FCE7F3", text: "#9F1239", border: "#F9A8D4" };
  
  // Travel/Location - Professional Teal
  if (t.match(/travel|location|explore|trip|journey|destination|visit/))
    return { bg: "#CCFBF1", text: "#115E59", border: "#5EEAD4" };
  
  // Design/Creative/Page/Landing - Professional Coral
  if (t.match(/design|ux|ui|creative|art|brand|visual|graphic|page|landing|draft/))
    return { bg: "#FFE4E6", text: "#BE123C", border: "#FDA4AF" };
  
  // Default professional slate
  return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
}

function getSidebarSnippet(messages: { role: string; text: string }[], q: string): string | null {
  if (!q.trim()) return null;
  const msg = messages.find((m) => m.text.toLowerCase().includes(q.toLowerCase()));
  if (!msg) return null;
  const idx = msg.text.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, idx - 35);
  const end = Math.min(msg.text.length, idx + q.length + 35);
  return (start > 0 ? "…" : "") + msg.text.slice(start, end) + (end < msg.text.length ? "…" : "");
}

function HL({ text, q }: { text: string; q: string }): React.ReactElement {
  if (!q.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FFF3B0] text-[#5B4A00] rounded-sm px-[2px]">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ─── Inline rename panel ──────────────────────────────────────────────────────

function RenamePanel({ currentTitle, currentTags, messages, onCommit, onCancel }: {
  currentTitle: string; currentTags: string[];
  messages: { role: "user" | "assistant"; text: string }[];
  onCommit: (title: string, tags: string[]) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(currentTitle);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const suggestions = getDynamicTitleSuggestions(draft, messages, currentTitle);
  const { suggestedTags } = getRenameSuggestions(currentTags, messages, currentTitle);
  const activeTags = currentTags.filter((t) => !removedTags.includes(t));
  const toggleTag = (t: string) => setPendingTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const removeExistingTag = (t: string) => setRemovedTags((p) => [...p, t]);
  const addCustomTag = () => {
    const t = newTagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !pendingTags.includes(t) && !activeTags.includes(t)) setPendingTags((p) => [...p, t]);
    setNewTagInput("");
  };
  const commit = () => onCommit(draft.trim() || currentTitle, [...activeTags, ...pendingTags]);
  return (
    <div className="mx-2 my-1 p-3 bg-gradient-to-br from-white to-[#FAFAFA] border-2 border-[#FF8F5C] rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
      {/* Title Input */}
      <div className="mb-3">
        <label className="block text-[9px] font-bold text-[#FF8F5C] uppercase tracking-wide mb-1.5">✏️ Chat Title</label>
        <input ref={inputRef} type="text" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
          className="w-full text-[12px] border-2 border-[#FF8F5C] rounded-lg px-3 py-2 outline-none focus:border-[#FF7A45] focus:shadow-[0_0_0_3px_rgba(255,143,92,0.1)] bg-white transition-all font-medium" />
      </div>

      {/* Existing Tags (removable) */}
      {activeTags.length > 0 && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-[#F9FAFB] to-[#F3F4F6] rounded-lg border border-[#D1D5DB]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[16px]">🏷️</span>
            <p className="text-[9px] text-[#6B7280] uppercase tracking-wide font-bold">Current Tags</p>
            <span className="text-[9px] text-[#9CA3AF] ml-auto italic">click × to remove</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeTags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10px] bg-white text-[#374151] border border-[#D1D5DB] rounded-full px-3 py-1.5 font-semibold shadow-sm hover:border-[#EF4444] hover:bg-[#FEF2F2] transition-all">
                #{t}
                <button onClick={() => removeExistingTag(t)} title={`Remove #${t}`}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-[#FFF4E6] to-[#FFE4CC] rounded-lg border border-[#FFD4B3]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[16px]">💡</span>
            <p className="text-[9px] text-[#FF6B2C] uppercase tracking-wide font-bold">AI Suggestions</p>
          </div>
          <div className="flex flex-col gap-1">
            {suggestions.map((t) => (
              <button key={t} onClick={() => setDraft(t)}
                className={`block text-left text-[11px] px-3 py-2 rounded-md transition-all font-medium ${
                  draft === t 
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8C55] text-white shadow-md transform scale-[1.02]" 
                    : "bg-white text-[#555] hover:bg-[#FFE4CC] border border-[#FFD4B3]"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] rounded-lg border border-[#C7D2FE]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[16px]">🏷️</span>
            <p className="text-[9px] text-[#4F46E5] uppercase tracking-wide font-bold">Suggested Tags</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.filter((t) => !activeTags.includes(t) && !pendingTags.includes(t)).map((t) => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`text-[10px] px-3 py-1.5 rounded-full border-2 font-semibold transition-all shadow-sm ${
                  pendingTags.includes(t) 
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white border-[#4F46E5] transform scale-105 shadow-md" 
                    : "bg-white text-[#4F46E5] border-[#A5B4FC] hover:bg-[#EEF2FF] hover:border-[#6366F1]"
                }`}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Tag */}
      <div className="mb-3 p-2.5 bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] rounded-lg border border-[#86EFAC]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[16px]">➕</span>
          <p className="text-[9px] text-[#059669] uppercase tracking-wide font-bold">Add Custom Tag</p>
        </div>
        <div className="flex items-center gap-1.5">
          <input type="text" placeholder="Type tag name..." value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
            className="flex-1 text-[11px] border-2 border-[#10B981] rounded-lg px-3 py-2 outline-none focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[#86EFAC] bg-white font-medium transition-all" />
          <button onClick={addCustomTag} 
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold shadow-md transition-all transform hover:scale-105">
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Pending Tags Display */}
      {pendingTags.length > 0 && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-lg border border-[#FCD34D]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[16px]">✨</span>
            <p className="text-[9px] text-[#92400E] uppercase tracking-wide font-bold">Tags to Add</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pendingTags.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[10px] bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-full px-3 py-1.5 font-semibold shadow-md">
                #{t}
                <button onClick={() => setPendingTags((p) => p.filter((x) => x !== t))} 
                  className="hover:bg-white/30 rounded-full p-0.5 transition-colors">
                  <X size={11} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} 
          className="text-[11px] text-[#666] px-4 py-2 rounded-lg border-2 border-[#ddd] font-bold hover:bg-[#f5f5f5] hover:border-[#bbb] transition-all">
          Cancel
        </button>
        <button onClick={commit} 
          className="text-[11px] text-white bg-gradient-to-r from-[#FF6B2C] to-[#FF8C55] px-5 py-2 rounded-lg font-bold hover:from-[#FF5518] hover:to-[#FF7A42] shadow-md hover:shadow-lg transition-all transform hover:scale-105">
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisplayChat {
  id: string; title: string; tags: string[];
  date: string; messages: { role: "user" | "assistant"; text: string }[];
  projectId?: string;
}

interface ChatRowCallbacks {
  activeChatId: string;
  pinnedIds: Set<string>; favoriteIds: Set<string>; archivedIds: Set<string>;
  chatTitles: Record<string, string>; chatTags: Record<string, string[]>;
  chatProjectMap: Record<string, string>;
  projects: Project[];
  onChatClick: (id: string) => void;
  onPin: (id: string) => void; onFavorite: (id: string) => void; onArchive: (id: string) => void;
  onRename: (id: string, t: string) => void; onUpdateTags: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
  onMoveToProject: (id: string, pid: string) => void;
  onRemoveFromProject: (id: string) => void;
  onAddProject?: (name: string) => void;
  searchQuery?: string;
}

// ─── Chat Row ─────────────────────────────────────────────────────────────────

function ChatRow({ chat, cb }: { chat: DisplayChat; cb: ChatRowCallbacks }) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [renaming, setRenaming]   = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [groupOpen, setGroupOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveMenuPos, setMoveMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isPinned    = cb.pinnedIds.has(chat.id);
  const isFavorited = cb.favoriteIds.has(chat.id);
  const isArchived  = cb.archivedIds.has(chat.id);
  const isActive    = cb.activeChatId === chat.id;
  const displayTitle = cb.chatTitles[chat.id] ?? chat.title;
  const displayTags  = cb.chatTags[chat.id]   ?? chat.tags;
  const currentProjId = cb.chatProjectMap[chat.id];
  const snippet = cb.searchQuery ? getSidebarSnippet(chat.messages, cb.searchQuery) : null;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const handleRenameCommit = (newTitle: string, newTags: string[]) => {
    cb.onRename(chat.id, newTitle); cb.onUpdateTags(chat.id, newTags); setRenaming(false);
  };

  type MI = { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean; hasArrow?: boolean } | null;
  const menuItems: MI[] = [
    { icon: <Pencil size={13} />, label: "Rename", onClick: () => { setMenuOpen(false); setRenaming(true); } },
    { icon: <Share2 size={13} />, label: "Share", onClick: () => { setMenuOpen(false); setShareOpen(true); } },
    { icon: <Users size={13} />, label: "Start a group chat", onClick: () => { setMenuOpen(false); setGroupOpen(true); } },
    {
      icon: <FolderInput size={13} />, label: "Move to project", hasArrow: true,
      onClick: (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMoveMenuPos({ x: rect.right + 4, y: rect.top });
        setMenuOpen(false);
      },
    },
    null,
    isPinned
      ? { icon: <Pin size={13} />, label: "Unpin", onClick: () => { cb.onPin(chat.id); setMenuOpen(false); } }
      : { icon: <Pin size={13} />, label: "Pin", onClick: () => { cb.onPin(chat.id); setMenuOpen(false); } },
    isFavorited
      ? { icon: <Star size={13} />, label: "Remove from Favorites", onClick: () => { cb.onFavorite(chat.id); setMenuOpen(false); } }
      : { icon: <Star size={13} />, label: "Add to Favorites", onClick: () => { cb.onFavorite(chat.id); setMenuOpen(false); } },
    null,
    isArchived
      ? { icon: <ArchiveRestore size={13} />, label: "Remove from Archive", onClick: () => { cb.onArchive(chat.id); setMenuOpen(false); } }
      : { icon: <Archive size={13} />, label: "Archive", onClick: () => { cb.onArchive(chat.id); setMenuOpen(false); } },
    null,
    { icon: <Trash2 size={13} />, label: "Delete", danger: true, onClick: () => { setMenuOpen(false); setDeleteOpen(true); } },
  ];

  return (
    <>
      <div>
        <div className={`group flex items-start gap-2 px-3 py-2.5 rounded-xl mx-2 my-1 cursor-pointer relative transition-all bg-white shadow-sm ${
          isActive 
            ? "bg-[#FFF5EB] shadow-sm" 
            : "border border-[#E7DFC8] hover:border-2 hover:border-[#000] hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02]"
        }`}
          onClick={() => cb.onChatClick(chat.id)}>
          
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className={`text-[14px] font-semibold pr-1 truncate ${isActive ? "text-[#1F2937]" : "text-[#374151]"}`}>
              {cb.searchQuery ? <HL text={displayTitle} q={cb.searchQuery} /> : displayTitle}
            </span>
            {snippet && (
              <span className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-2">
                <HL text={snippet} q={cb.searchQuery!} />
              </span>
            )}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayTags.map((t) => {
                  const isMultiTopic = t.includes(",") || t.includes("+") || t.includes("&") || t.includes("/") || t.toLowerCase() === "multi-topic";
                  
                  return isMultiTopic ? (
                    <span key={t} className="text-[10px] rounded-full px-2.5 py-1 font-semibold bg-[#F3E8FF] text-[#7C3AED]">
                      {cb.searchQuery ? <HL text={t} q={cb.searchQuery} /> : t}
                    </span>
                  ) : (
                    <span key={t} className="text-[10px] rounded-full px-2.5 py-1 font-semibold bg-[#F3F4F6] text-[#374151]">
                      {cb.searchQuery ? <HL text={t} q={cb.searchQuery} /> : t}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-1 mt-[1px] opacity-0 group-hover:opacity-100 shrink-0">
            <button title={isPinned ? "Unpin" : "Pin"} onClick={(e) => { e.stopPropagation(); cb.onPin(chat.id); }}
              className={`p-1 rounded-md border transition-all ${
                isPinned 
                  ? "bg-[#FFF3E0] border-[#F59E0B] text-[#F59E0B] shadow-sm" 
                  : "bg-white border-[#ddd] hover:bg-[#FFF3E0] hover:border-[#F59E0B] text-[#9CA3AF] hover:text-[#F59E0B]"
              }`}>
              <Pin size={12} color={isPinned ? "#F59E0B" : undefined} fill={isPinned ? "#F59E0B" : "none"} strokeWidth={isPinned ? 2.5 : 2} />
            </button>
            <button title={isFavorited ? "Remove from Favorites" : "Favorite"} onClick={(e) => { e.stopPropagation(); cb.onFavorite(chat.id); }}
              className={`p-1 rounded-md border transition-all ${
                isFavorited 
                  ? "bg-[#FFF3E0] border-[#FFB800] text-[#FFB800] shadow-sm" 
                  : "bg-white border-[#ddd] hover:bg-[#FFF3E0] hover:border-[#FFB800] text-[#9CA3AF] hover:text-[#FFB800]"
              }`}>
              <Star size={12} color={isFavorited ? "#FFB800" : undefined} fill={isFavorited ? "#FFB800" : "none"} strokeWidth={isFavorited ? 2 : 2} />
            </button>
            <button ref={moreRef} title="More options" onClick={(e) => {
                e.stopPropagation();
                if (!menuOpen && moreRef.current) {
                  const r = moreRef.current.getBoundingClientRect();
                  setMenuPos({ x: r.left - 180, y: r.bottom + 4 });
                }
                setMenuOpen((v) => !v);
              }}
              className="p-1 rounded-md border border-[#ddd] bg-white hover:bg-[#F3F4F6] hover:border-[#aaa] text-[#9CA3AF] hover:text-[#374151] transition-all">
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>
        {renaming && (
          <RenamePanel currentTitle={displayTitle} currentTags={displayTags} messages={chat.messages}
            onCommit={handleRenameCommit} onCancel={() => setRenaming(false)} />
        )}
      </div>

      {/* Dropdown menu rendered via portal to avoid overflow clipping */}
      {menuOpen && createPortal(
        <div ref={menuRef}
          className="fixed z-[9999] bg-white border-2 border-[#000] rounded-xl w-52 py-1 shadow-xl"
          style={{ left: Math.max(8, menuPos.x), top: menuPos.y }}
          onClick={(e) => e.stopPropagation()}>
          {menuItems.map((item, i) =>
            item === null ? <div key={`d-${i}`} className="my-0.5 border-t border-[#E7E3DD]" /> : (
              <button key={item.label} onClick={(e) => item.onClick(e)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] hover:bg-[#FFF9E6] transition-colors rounded-lg ${item.danger ? "text-[#DC2626]" : "text-[#1F2937]"}`}>
                <span className="flex items-center gap-2">
                  <span className={item.danger ? "text-[#DC2626]" : "text-[#6B7280]"}>{item.icon}</span>
                  {item.label}
                </span>
                {item.hasArrow && <ChevronRight size={12} color="#9CA3AF" />}
              </button>
            )
          )}
        </div>,
        document.body
      )}

      {/* Modals */}
      {shareOpen && <ShareModal chatTitle={displayTitle} chatId={chat.id} onClose={() => setShareOpen(false)} />}
      {groupOpen && <GroupChatModal chatTitle={displayTitle} onClose={() => setGroupOpen(false)} onStart={() => setGroupOpen(false)} />}
      {deleteOpen && (
        <DeleteConfirmModal itemName={displayTitle} itemType="chat"
          onConfirm={() => { cb.onDelete(chat.id); setDeleteOpen(false); }}
          onCancel={() => setDeleteOpen(false)} />
      )}
      {moveMenuPos && (
        <MoveToProjectMenu
          projects={cb.projects}
          currentProjectId={currentProjId}
          onMove={(pid) => { cb.onMoveToProject(chat.id, pid); setMoveMenuPos(null); }}
          onRemoveFromProject={currentProjId ? () => { cb.onRemoveFromProject(chat.id); setMoveMenuPos(null); } : undefined}
          onCreateProject={(name) => { cb.onAddProject?.(name); setMoveMenuPos(null); }}
          x={moveMenuPos.x} y={moveMenuPos.y}
          onClose={() => setMoveMenuPos(null)} />
      )}
    </>
  );
}

// ─── Section wrappers ─────────────────────────────────────────────────────────

// Color themes matching Chat Explorer tree exactly (HCI consistency)
const SECTION_THEMES: Record<string, { bgFrom: string; bgTo: string; hoverFrom: string; hoverTo: string; text: string; border: string; icon: string; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  Today:     { bgFrom: "#ECFDF5", bgTo: "#D1FAE5", hoverFrom: "#D1FAE5", hoverTo: "#A7F3D0", text: "#065F46", border: "#6EE7B7", icon: "#10B981", badgeBg: "#ECFDF5", badgeText: "#10B981", badgeBorder: "#6EE7B7" },
  Yesterday: { bgFrom: "#FFFBEB", bgTo: "#FEF3C7", hoverFrom: "#FEF3C7", hoverTo: "#FDE68A", text: "#92400E", border: "#FCD34D", icon: "#F59E0B", badgeBg: "#FFFBEB", badgeText: "#F59E0B", badgeBorder: "#FCD34D" },
  Older:     { bgFrom: "#F9FAFB", bgTo: "#F3F4F6", hoverFrom: "#F3F4F6", hoverTo: "#E5E7EB", text: "#4B5563", border: "#D1D5DB", icon: "#9CA3AF", badgeBg: "#F9FAFB", badgeText: "#9CA3AF", badgeBorder: "#D1D5DB" },
  Pinned:    { bgFrom: "#F9FAFB", bgTo: "#F3F4F6", hoverFrom: "#F3F4F6", hoverTo: "#E5E7EB", text: "#111827", border: "#D1D5DB", icon: "#111",    badgeBg: "#F9FAFB", badgeText: "#111",    badgeBorder: "#D1D5DB" },
  Favorites: { bgFrom: "#FFFBEB", bgTo: "#FEF3C7", hoverFrom: "#FEF3C7", hoverTo: "#FDE68A", text: "#92400E", border: "#FCD34D", icon: "#FFB800", badgeBg: "#FFFBEB", badgeText: "#FFB800", badgeBorder: "#FCD34D" },
  Archive:   { bgFrom: "#F9FAFB", bgTo: "#F3F4F6", hoverFrom: "#F3F4F6", hoverTo: "#E5E7EB", text: "#4B5563", border: "#D1D5DB", icon: "#6B7280", badgeBg: "#F9FAFB", badgeText: "#6B7280", badgeBorder: "#D1D5DB" },
  Projects:  { bgFrom: "#EEF2FF", bgTo: "#E0E7FF", hoverFrom: "#E0E7FF", hoverTo: "#C7D2FE", text: "#4338CA", border: "#A5B4FC", icon: "#6366F1", badgeBg: "#EEF2FF", badgeText: "#6366F1", badgeBorder: "#A5B4FC" },
};

function Section({ label, isOpen, onToggle, chats, cb }: {
  label: string; isOpen: boolean; onToggle: () => void; chats: DisplayChat[]; cb: ChatRowCallbacks;
}) {
  const t = SECTION_THEMES[label] ?? SECTION_THEMES.Older;
  return (
    <div>
      <button className="flex items-center gap-1.5 w-full px-3 py-2 mx-1 rounded-lg transition-all border"
        style={{ background: `linear-gradient(to right, ${t.bgFrom}, ${t.bgTo})`, borderColor: t.border }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `linear-gradient(to right, ${t.hoverFrom}, ${t.hoverTo})`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = `linear-gradient(to right, ${t.bgFrom}, ${t.bgTo})`)}
        onClick={onToggle}>
        {isOpen ? <ChevronDown size={13} color={t.icon} strokeWidth={2.5} /> : <ChevronRight size={13} color={t.icon} strokeWidth={2.5} />}
        <Clock size={12} color={t.icon} />
        <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: t.text }}>{label}</span>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: t.badgeBg, color: t.badgeText, border: `1px solid ${t.badgeBorder}` }}>{chats.length}</span>
      </button>
      {isOpen && (
        <div className="pl-1">
          {chats.length === 0
            ? <p className="px-4 py-1 text-[11px] text-[#ccc] italic">Empty</p>
            : chats.map((c) => <ChatRow key={c.id} chat={c} cb={cb} />)}
        </div>
      )}
    </div>
  );
}

function IconSection({ icon, label, badge, isOpen, onToggle, chats, cb, showFileList }: {
  icon: React.ReactNode; label: string; badge?: number;
  isOpen: boolean; onToggle: () => void; chats: DisplayChat[]; cb: ChatRowCallbacks;
  showFileList?: boolean;
}) {
  const t = SECTION_THEMES[label] ?? SECTION_THEMES.Older;
  return (
    <div className="px-2 py-0.5">
      <button className="flex items-center gap-1.5 w-full px-2.5 py-2 rounded-lg transition-all border"
        style={{ background: `linear-gradient(to right, ${t.bgFrom}, ${t.bgTo})`, borderColor: t.border }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `linear-gradient(to right, ${t.hoverFrom}, ${t.hoverTo})`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = `linear-gradient(to right, ${t.bgFrom}, ${t.bgTo})`)}
        onClick={onToggle}>
        {isOpen ? <ChevronDown size={13} color={t.icon} strokeWidth={2.5} /> : <ChevronRight size={13} color={t.icon} strokeWidth={2.5} />}
        <span style={{ color: t.icon }} className="ml-0.5">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide ml-1" style={{ color: t.text }}>{label}</span>
        {badge !== undefined && badge > 0 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: t.badgeBg, color: t.badgeText, border: `1px solid ${t.badgeBorder}` }}>{badge}</span>}
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 pl-2 border-l-2 border-[#E7DFC8]">
          {chats.length === 0
            ? <p className="px-3 py-1 text-[11px] text-[#ccc] italic">Empty</p>
            : chats.map((c) => (
              <button key={c.id} onClick={() => cb.onChatClick(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 my-0.5 rounded-lg text-left transition-all ${
                  cb.activeChatId === c.id 
                    ? "bg-white border-2 border-[#FF6B2C] text-[#1F2937] shadow-sm" 
                    : "bg-white border border-[#E7DFC8] text-[#374151] hover:border-2 hover:border-[#000] hover:shadow-md"
                }`}>
                <FileText size={11} color={cb.activeChatId === c.id ? "#FF6B2C" : "#9CA3AF"} className="shrink-0" />
                <span className="text-[12px] truncate font-medium">{cb.chatTitles[c.id] ?? c.title}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Project Row (expandable, shows chats) ────────────────────────────────────

function ProjectRow({
  project, chats, activeChatId, onChatClick, onProjectClick, cb,
  onDeleteProject, onRenameProject, onNewChatInProject,
}: {
  project: Project;
  chats: DisplayChat[];
  activeChatId: string;
  onChatClick: (id: string) => void;
  onProjectClick: (id: string) => void;
  cb: ChatRowCallbacks;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onNewChatInProject: (projectId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(project.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const commitRename = () => {
    if (renameDraft.trim()) onRenameProject(project.id, renameDraft.trim());
    setRenaming(false);
  };

  return (
    <>
      <div className="group relative mx-2 my-1">
        {renaming ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#E7DFC8] shadow-sm">
            <Folder size={14} color="#888" className="shrink-0" />
            <input ref={renameRef} type="text" value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
              onBlur={commitRename}
              className="flex-1 text-[13px] bg-white border border-[#E7DFC8] rounded-lg px-2 py-1 outline-none focus:border-[#FF6B2C]" />
          </div>
        ) : (
          <div className={`flex items-center bg-white rounded-xl shadow-sm transition-all ${
            expanded 
              ? "border-2 border-[#FF6B2C] shadow-md" 
              : "border border-[#E7DFC8] hover:border-2 hover:border-[#000] hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02]"
          }`}>
            <button className="flex items-center gap-2 flex-1 px-3 py-2.5 text-left min-w-0"
              onClick={() => { setExpanded((v) => !v); onProjectClick(project.id); }}>
              {expanded ? <ChevronDown size={14} color="#FF6B2C" strokeWidth={2.5} /> : <ChevronRight size={14} color="#6B7280" strokeWidth={2.5} />}
              <Folder size={14} color={expanded ? "#FF6B2C" : "#9CA3AF"} className="shrink-0" strokeWidth={2} />
              <span className={`text-[13px] truncate font-semibold ${expanded ? "text-[#1F2937]" : "text-[#374151]"}`}>{project.name}</span>
              <span className="text-[11px] text-[#9CA3AF] ml-auto shrink-0 bg-[#F3F4F6] px-2 py-0.5 rounded-full font-medium">{chats.length}</span>
            </button>
            <div className="flex items-center opacity-0 group-hover:opacity-100 shrink-0 pr-2 gap-0.5">
              <button title="New chat in project" onClick={(e) => { e.stopPropagation(); onNewChatInProject(project.id); }}
                className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-colors"><Plus size={12} strokeWidth={2.5} /></button>
              <button title="Project options" onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-colors"><MoreHorizontal size={12} /></button>
            </div>
          </div>
        )}

        {/* Project menu */}
        {menuOpen && (
          <div ref={menuRef} className="absolute right-1 top-full mt-1 z-50 bg-white border-2 border-[#000] rounded-xl w-48 py-1 shadow-xl">
            <button onClick={() => { setMenuOpen(false); onNewChatInProject(project.id); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FFF9E6] text-[#1F2937] rounded-lg transition-colors">
              <MessageSquarePlus size={13} color="#6B7280" />New chat
            </button>
            <button onClick={() => { setMenuOpen(false); setRenaming(true); setRenameDraft(project.name); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FFF9E6] text-[#1F2937] rounded-lg transition-colors">
              <Pencil size={13} color="#6B7280" />Rename project
            </button>
            <div className="my-0.5 border-t border-[#E7E3DD]" />
            <button onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FFF9E6] text-[#DC2626] rounded-lg transition-colors">
              <Trash2 size={13} />Delete project
            </button>
          </div>
        )}

        {/* Expanded chats */}
        {expanded && (
          <div className="mt-1 ml-4 pl-2 border-l-2 border-[#E7DFC8]">
            {chats.length === 0 ? (
              <button onClick={() => onNewChatInProject(project.id)}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#9CA3AF] hover:text-[#374151] w-full bg-white rounded-lg border border-[#E7DFC8] hover:border-[#000] transition-all">
                <Plus size={12} strokeWidth={2.5} />Start first chat
              </button>
            ) : (
              chats.map((c) => (
                <button key={c.id} onClick={() => onChatClick(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 my-0.5 rounded-lg text-left transition-all ${
                    activeChatId === c.id 
                      ? "bg-white border-2 border-[#FF6B2C] text-[#1F2937] shadow-sm" 
                      : "bg-white border border-[#E7DFC8] text-[#374151] hover:border-2 hover:border-[#000] hover:shadow-md"
                  }`}>
                  <FileText size={11} color={activeChatId === c.id ? "#FF6B2C" : "#9CA3AF"} className="shrink-0" />
                  <span className="text-[12px] truncate font-medium">{cb.chatTitles[c.id] ?? c.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {deleteOpen && (
        <DeleteConfirmModal itemName={project.name} itemType="project"
          onConfirm={() => { onDeleteProject(project.id); setDeleteOpen(false); }}
          onCancel={() => setDeleteOpen(false)} />
      )}
    </>
  );
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const TODAY     = "2026-03-22";
const YESTERDAY = "2026-03-21";

function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  onNewChat: () => void;
  onChatClick: (id: string) => void;
  onPin: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, t: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onArchive: (id: string) => void;
  onMoveToProject: (chatId: string, projectId: string) => void;
  onRemoveFromProject: (chatId: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onChatManagerToggle: () => void;
  onChatSelect: (id: string) => void;
  projects: Project[];
  chatTitles: Record<string, string>;
  chatTags: Record<string, string[]>;
  sessionChats: SessionChat[];
  chatProjectMap: Record<string, string>;
  activeChatId: string;
  deletedChatIds: Set<string>;
  searchQuery: string;
  onNewChatInProject: (projectId: string) => void;
  pinnedIds: Set<string>;
  favoriteIds: Set<string>;
  archivedIds: Set<string>;
  collapsed?: { today?: boolean; yesterday?: boolean; older?: boolean };
  toggleSection?: (section: string) => void;
  chatManagerOpen?: boolean;
  onProjectClick?: (id: string) => void;
  onChatCreatedInProject?: (chat: SessionChat, projectId: string) => void;
  recycleBin?: RecycleBinItem[];
  onRestoreItem?: (id: string, type: "chat" | "project") => void;
  onPermanentDelete?: (id: string, type: "chat" | "project") => void;
  onEmptyBin?: () => void;
  onDeleteChat?: (id: string) => void;
}

export function Sidebar({
  onNewChat, onChatClick, onPin, onFavorite, onDelete, onRename, onUpdateTags, onArchive,
  onMoveToProject, onRemoveFromProject, onAddProject, onDeleteProject, onRenameProject,
  onChatManagerToggle, onChatSelect, projects, chatTitles, chatTags, chatProjectMap,
  sessionChats, activeChatId, deletedChatIds, searchQuery: externalSearch,
  onNewChatInProject, pinnedIds, favoriteIds, archivedIds,
  collapsed = {}, toggleSection = () => {}, chatManagerOpen = false,
  onProjectClick = () => {}, onChatCreatedInProject, recycleBin = [],
  onRestoreItem, onPermanentDelete, onEmptyBin, onDeleteChat = onDelete,
}: SidebarProps) {
  const [calendarOpen,  setCalendarOpen]  = useState(false);
  const [selectedDate,  setSelectedDate]  = useState<string | null>(null);
  const [projectsOpen,  setProjectsOpen]  = useState(true);
  const [pinnedOpen,    setPinnedOpen]    = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [archiveOpen,   setArchiveOpen]   = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [newProjName,   setNewProjName]   = useState("");
  const [newChatProjectId, setNewChatProjectId] = useState<string | null>(null);
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const projInputRef   = useRef<HTMLInputElement>(null);
  const calendarRef    = useRef<HTMLDivElement>(null);
  const calendarBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
        !calendarBtnRef.current?.contains(e.target as Node)) setCalendarOpen(false);
    };
    if (calendarOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [calendarOpen]);
  useEffect(() => { if (addingProject) projInputRef.current?.focus(); }, [addingProject]);

  // Resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // ── Build display lists ──

  const toDisplay = (c: { id: string; title: string; tags: string[]; date: string; messages: { role: "user" | "assistant"; text: string }[]; projectId?: string }): DisplayChat => ({
    id: c.id, title: chatTitles[c.id] ?? c.title,
    tags: chatTags[c.id] ?? c.tags,
    date: c.date, messages: c.messages, projectId: c.projectId,
  });

  const isDeleted = (id: string) => deletedChatIds.has(id);

  // Static non-project chats (not deleted)
  const baseChats = ALL_CHATS
    .filter((c) => c.section !== "project" && !isDeleted(c.id))
    .map((c) => toDisplay({ ...c, projectId: chatProjectMap[c.id] }));

  // Session chats (not deleted)
  const sessionDisplay = sessionChats
    .filter((c) => !isDeleted(c.id))
    .map((c) => toDisplay({ ...c, projectId: chatProjectMap[c.id] }));

  // "Your Chats" = non-archived, non-project (except those moved into projects)
  const isInProject = (id: string) => !!chatProjectMap[id];
  const yourChats = [...sessionDisplay, ...baseChats]
    .filter((c) => !archivedIds.has(c.id) && !isInProject(c.id));

  const todayChats     = yourChats.filter((c) => c.date === TODAY);
  const yesterdayChats = yourChats.filter((c) => c.date === YESTERDAY);
  const olderChats     = yourChats.filter((c) => c.date < YESTERDAY);

  // All chats (for pinned/favorites/archive)
  const allSource = [...sessionDisplay, ...baseChats];
  const deduped   = allSource.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);

  const pinnedList   = deduped.filter((c) => pinnedIds.has(c.id));
  const favoriteList = deduped.filter((c) => favoriteIds.has(c.id));
  const archiveList  = deduped.filter((c) => archivedIds.has(c.id));

  // Chats per project (static + session + moved)
  const getProjectChats = (projectId: string): DisplayChat[] => {
    // Static project chats
    const staticProjChats = ALL_CHATS
      .filter((c) => (c.section === "project" && c.projectId === projectId) || chatProjectMap[c.id] === projectId)
      .filter((c) => !isDeleted(c.id))
      .map((c) => toDisplay(c));
    // Session chats moved to this project
    const sessionProjChats = sessionChats
      .filter((c) => chatProjectMap[c.id] === projectId && !isDeleted(c.id))
      .map((c) => toDisplay(c));
    // Merge, deduplicate
    const merged = [...staticProjChats, ...sessionProjChats];
    return merged.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
  };

  const activeDates = Array.from(new Set(yourChats.map((c) => c.date)));

  // ── Search ──
  const q = sidebarSearch.toLowerCase().trim();
  const isSearching = q.length > 0;
  const filterC = (arr: DisplayChat[]) => !q ? arr : arr.filter((c) =>
    c.title.toLowerCase().includes(q) ||
    c.tags.some((t) => t.toLowerCase().includes(q)) ||
    c.messages.some((m) => m.text.toLowerCase().includes(q))
  );
  const filteredByDate = selectedDate ? yourChats.filter((c) => c.date === selectedDate) : null;
  const searchResults = isSearching
    ? deduped.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
      )
    : [];

  const cb: ChatRowCallbacks = {
    activeChatId, pinnedIds, favoriteIds, archivedIds,
    chatTitles, chatTags, chatProjectMap, projects,
    onChatClick, onPin, onFavorite, onArchive, onRename, onUpdateTags,
    onDelete: onDeleteChat, onMoveToProject, onRemoveFromProject,
    onAddProject,
    searchQuery: isSearching ? sidebarSearch : undefined,
  };

  const submitProject = () => {
    if (newProjName.trim()) onAddProject(newProjName.trim());
    setNewProjName(""); setAddingProject(false);
  };

  return (
    <>
      {!sidebarCollapsed && (
        <div className="flex flex-col h-screen shrink-0 border-r border-[#E7DFC8] bg-white overflow-hidden shadow-sm relative"
          style={{ width: sidebarWidth }}>
          <div className="flex flex-col overflow-y-auto">
            {/* Search */}
            <div className="px-3 pt-3 pb-3 border-b-2 border-[#E7DFC8]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-[#777] uppercase tracking-wide flex-1">Search Chats</span>
                <button onClick={() => setSidebarCollapsed(true)} title="Close sidebar"
                  className="p-1 rounded hover:bg-[#ebebeb] text-[#9CA3AF] hover:text-[#374151] transition-colors">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input type="text" placeholder="Search chats..." value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-[12px] bg-white border-2 border-[#E7DFC8] rounded-lg text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF6B2C] focus:shadow-[0_0_0_2px_rgba(255,107,44,0.2)] transition-all" />
                {sidebarSearch && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]" onClick={() => setSidebarSearch("")}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* New Chat & New Project Buttons */}
            <div className="px-3 pt-3 pb-3 border-b-2 border-[#E7DFC8] flex flex-col gap-2">
              <button onClick={onNewChat}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF8F5C] to-[#FFB078] hover:from-[#FF7A45] hover:to-[#FFA563] text-white font-bold text-[13px] shadow-lg transition-all transform hover:scale-105">
                <Plus size={16} strokeWidth={3} />
                <span>New Chat</span>
              </button>
              <button onClick={() => { setAddingProject(true); setProjectsOpen(true); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF8F5C] to-[#FFB078] hover:from-[#FF7A45] hover:to-[#FFA563] text-white font-bold text-[13px] shadow-lg transition-all transform hover:scale-105">
                <FolderPlus size={16} strokeWidth={3} />
                <span>New Project</span>
              </button>
            </div>

            {/* Chat Explorer Toggle */}
            <div className="px-3 pt-3 pb-2">
              <button onClick={onChatManagerToggle}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#FF8F5C] to-[#FFB078] hover:from-[#FF7A45] hover:to-[#FFA563] text-white font-bold text-[14px] shadow-lg transition-all">
                <Monitor size={16} strokeWidth={2.5} />
                <span>Chat Explorer</span>
              </button>
            </div>

            {/* Content */}
            {isSearching ? (
              <div className="flex flex-col px-2 py-2">
                <p className="text-[10px] text-[#bbb] uppercase tracking-wide px-3 mb-1">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.length === 0
                  ? <p className="px-3 py-2 text-[12px] text-[#aaa]">No matches found.</p>
                  : searchResults.map((c) => <ChatRow key={c.id} chat={c} cb={cb} />)}
              </div>
            ) : (
              <>
                {/* Projects — expandable with file children */}
                <div className="px-2 pt-2.5 pb-1">
                  <button className="flex items-center gap-1.5 w-full px-2.5 py-2 rounded-lg transition-all border"
                    style={{ background: "linear-gradient(to right, #EEF2FF, #E0E7FF)", borderColor: "#A5B4FC" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(to right, #E0E7FF, #C7D2FE)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(to right, #EEF2FF, #E0E7FF)")}
                    onClick={() => setProjectsOpen((v) => !v)}>
                    {projectsOpen ? <ChevronDown size={13} color="#6366F1" strokeWidth={2.5} /> : <ChevronRight size={13} color="#6366F1" strokeWidth={2.5} />}
                    <span className="text-[#6366F1] ml-0.5"><Folder size={12} /></span>
                    <span className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wide ml-1">Projects</span>
                  </button>
                  {projectsOpen && (
                    <div className="pl-1 flex flex-col">
                      {projects.map((p) => (
                        <ProjectRow key={p.id}
                          project={p}
                          chats={getProjectChats(p.id)}
                          activeChatId={activeChatId}
                          onChatClick={onChatClick}
                          onProjectClick={onProjectClick}
                          cb={cb}
                          onDeleteProject={onDeleteProject}
                          onRenameProject={onRenameProject}
                          onNewChatInProject={(id) => setNewChatProjectId(id)}
                        />
                      ))}
                      {addingProject && (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Folder size={12} color="#999" className="shrink-0" />
                          <input ref={projInputRef} type="text" placeholder="Project name…" value={newProjName}
                            onChange={(e) => setNewProjName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") submitProject(); if (e.key === "Escape") { setAddingProject(false); setNewProjName(""); } }}
                            className="flex-1 text-[12px] bg-white border border-[#ccc] rounded px-2 py-0.5 outline-none focus:border-[#888]" />
                          <button onClick={submitProject} className="p-1 rounded hover:bg-[#ddd] text-[#555]"><Check size={12} /></button>
                          <button onClick={() => { setAddingProject(false); setNewProjName(""); }} className="p-1 rounded hover:bg-[#ddd] text-[#888]"><X size={12} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mx-3 my-1 border-t border-[#e0e0e0]" />

                {/* Pinned */}
                <IconSection icon={<Pin size={12} />} label="Pinned" badge={pinnedList.length}
                  isOpen={pinnedOpen} onToggle={() => setPinnedOpen((v) => !v)}
                  chats={filterC(pinnedList)} cb={cb} />
                <div className="mx-3 border-t border-[#e0e0e0]" />

                {/* Favorites */}
                <IconSection icon={<Star size={12} />} label="Favorites" badge={favoriteList.length}
                  isOpen={favoritesOpen} onToggle={() => setFavoritesOpen((v) => !v)}
                  chats={filterC(favoriteList)} cb={cb} />
                <div className="mx-3 border-t border-[#e0e0e0]" />

                {/* Archive */}
                <IconSection icon={<Archive size={12} />} label="Archive" badge={archiveList.length}
                  isOpen={archiveOpen} onToggle={() => setArchiveOpen((v) => !v)}
                  chats={filterC(archiveList)} cb={cb} />
                <div className="mx-3 border-t border-[#e0e0e0]" />

                {/* Your Chats */}
                <div className="px-2 py-1">
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-wide">Your Chats</span>
                    <div className="relative">
                      <button ref={calendarBtnRef} title="Filter by date"
                        className={`p-1 rounded hover:bg-[#ddd] ${calendarOpen || selectedDate ? "bg-[#ddd]" : ""}`}
                        onClick={() => setCalendarOpen((v) => !v)}>
                        <Calendar size={13} color={selectedDate ? "#111" : "#888"} />
                      </button>
                      {calendarOpen && (
                        <div ref={calendarRef} className="absolute right-0 top-7 z-50">
                          <MiniCalendar activeDates={activeDates} selectedDate={selectedDate}
                            onSelectDate={(d) => { setSelectedDate(d); if (d) setCalendarOpen(false); }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedDate && (
                    <div className="flex items-center justify-between mx-2 mb-2 px-2 py-1 bg-[#e8e8e8] rounded text-[11px] text-[#444]">
                      <span>{formatDate(selectedDate)}</span>
                      <button onClick={() => setSelectedDate(null)}><X size={11} /></button>
                    </div>
                  )}
                  {filteredByDate ? (
                    <div className="pl-1">
                      {filteredByDate.length === 0
                        ? <p className="px-3 py-2 text-[12px] text-[#aaa]">No chats on this date.</p>
                        : filteredByDate.map((c) => <ChatRow key={c.id} chat={c} cb={cb} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <Section label="Today"     isOpen={!collapsed.today}     onToggle={() => toggleSection("today")}     chats={filterC(todayChats)}     cb={cb} />
                      <Section label="Yesterday" isOpen={!collapsed.yesterday} onToggle={() => toggleSection("yesterday")} chats={filterC(yesterdayChats)} cb={cb} />
                      <Section label="Older"     isOpen={!collapsed.older}     onToggle={() => toggleSection("older")}     chats={filterC(olderChats)}     cb={cb} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Recycle Bin button */}
          <div className="px-3 py-2 border-t border-[#E7DFC8] shrink-0">
            <button onClick={() => setRecycleBinOpen(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-[#FEE2E2] text-left transition-colors group">
              <Trash2 size={13} className="text-[#EF4444] group-hover:text-[#DC2626]" />
              <span className="text-[12px] text-[#666] group-hover:text-[#DC2626] transition-colors">Recycle Bin</span>
              {recycleBin.length > 0 && (
                <span className="ml-auto text-[10px] bg-[#FEE2E2] text-[#EF4444] rounded-full px-1.5 py-0.5">{recycleBin.length}</span>
              )}
            </button>
          </div>

          {/* Resize handle */}
          <div className="absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#FF8F5C] transition-colors group"
            onMouseDown={() => setIsResizing(true)}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#E7DFC8] group-hover:bg-[#FF8F5C] transition-colors rounded-l" />
          </div>
        </div>
      )}

      {/* Collapsed sidebar button */}
      {sidebarCollapsed && (
        <button onClick={() => setSidebarCollapsed(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-[#FF6B2C] to-[#FF8C55] hover:from-[#FF5518] hover:to-[#FF7A42] text-white p-2 rounded-r-lg shadow-lg transition-all"
          title="Open sidebar">
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      )}

      {/* New Chat In Project modal */}
      {newChatProjectId && (
        <NewChatInProjectModal
          projectName={projects.find((p) => p.id === newChatProjectId)?.name ?? "Project"}
          onStart={(msg) => {
            const newChat: SessionChat = {
              id: `session-${Date.now()}`,
              title: msg.slice(0, 40).trim() || "New Chat",
              tags: [],
              messages: [{ role: "user", text: msg }],
              date: "2026-03-22",
              dateLabel: "Today",
            };
            if (onChatCreatedInProject) {
              onChatCreatedInProject(newChat, newChatProjectId);
            }
            setNewChatProjectId(null);
            onChatClick(newChat.id);
          }}
          onCancel={() => setNewChatProjectId(null)}
        />
      )}

      {/* Recycle Bin modal */}
      {recycleBinOpen && (
        <RecycleBinModal
          items={recycleBin}
          onRestore={(id, type) => onRestoreItem?.(id, type)}
          onPermanentDelete={(id, type) => onPermanentDelete?.(id, type)}
          onEmptyBin={() => onEmptyBin?.()}
          onClose={() => setRecycleBinOpen(false)}
        />
      )}
    </>
  );
}