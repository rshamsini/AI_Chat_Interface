import { useState, useRef, useEffect } from "react";
import { X, Send, Mail, Link, Users, Check, UserPlus, AtSign, Copy, ChevronRight, Folder, Plus, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import type { Project } from "../App";

// ─── Backdrop wrapper ─────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

interface ShareModalProps {
  chatTitle: string;
  chatId: string;
  onClose: () => void;
}

export function ShareModal({ chatTitle, onClose }: ShareModalProps) {
  const [tab, setTab] = useState<"link" | "email">("link");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailInputError, setEmailInputError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fakeLink = `https://chat.example.com/share/${Math.random().toString(36).slice(2, 10)}`;

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const addEmail = () => {
    const e = emailInput.trim();
    if (!e) return;
    if (!validateEmail(e)) { setEmailInputError("Invalid email address"); return; }
    if (emails.includes(e)) { setEmailInputError("Already added"); return; }
    setEmails((p) => [...p, e]);
    setEmailInput("");
    setEmailInputError("");
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(fakeLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (emails.length === 0) { setEmailInputError("Add at least one email"); return; }
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1800);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden border border-[#ddd]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div>
            <h2 className="text-[16px] font-bold text-[#111]">Share conversation</h2>
            <p className="text-[14px] text-[#999] mt-0.5 truncate max-w-[340px]">{chatTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e8e8e8]">
          {(["link", "email"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] transition-colors
                ${tab === t ? "text-[#111] font-bold border-b-2 border-[#333]" : "text-[#888] hover:text-[#444]"}`}>
              {t === "link" ? <><Link size={13} />Copy link</> : <><Mail size={13} />Send by email</>}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "link" ? (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] text-[#777]">Anyone with this link can view this conversation.</p>
              <div className="flex items-center gap-2 p-2.5 bg-[#f5f5f5] rounded border border-[#e0e0e0]">
                <Link size={13} color="#aaa" className="shrink-0" />
                <span className="flex-1 text-[14px] text-[#444] truncate font-mono">{fakeLink}</span>
                <button onClick={handleCopy}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[14px] transition-colors shrink-0 ${copied ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#333] text-white hover:bg-[#111]"}`}>
                  {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#e8e8e8]" />
                <span className="text-[12px] text-[#bbb] uppercase tracking-wide">permissions</span>
                <div className="flex-1 h-px bg-[#e8e8e8]" />
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Anyone with link can view", active: true },
                  { label: "Allow replies", active: false },
                ].map(({ label, active }) => (
                  <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${active ? "bg-[#333] border-[#333]" : "border-[#ccc] group-hover:border-[#888]"}`}>
                      {active && <Check size={10} color="white" />}
                    </div>
                    <span className="text-[12px] text-[#444]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] text-[#777]">Send a direct link to specific people via email.</p>
              {/* Email input */}
              <div>
                <div className={`flex items-center gap-2 border rounded px-2.5 py-1.5 ${emailInputError ? "border-[#e53e3e]" : "border-[#ddd] focus-within:border-[#666]"}`}>
                  <AtSign size={13} color="#aaa" />
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="Enter email address…"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setEmailInputError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); } }}
                    className="flex-1 text-[12px] outline-none bg-transparent placeholder:text-[#ccc]"
                  />
                  <button onClick={addEmail}
                    className="text-[11px] bg-[#ebebeb] text-[#555] hover:bg-[#ddd] px-2 py-0.5 rounded">Add</button>
                </div>
                {emailInputError && <p className="text-[10px] text-[#e53e3e] mt-1">{emailInputError}</p>}
                <p className="text-[10px] text-[#bbb] mt-1">Press Enter or comma to add multiple emails</p>
              </div>
              {/* Added emails */}
              {emails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#f9f9f9] rounded border border-[#eee]">
                  {emails.map((e) => (
                    <span key={e} className="flex items-center gap-1 text-[11px] bg-white border border-[#ddd] rounded-full px-2 py-0.5">
                      <Mail size={10} color="#888" />{e}
                      <button onClick={() => setEmails((p) => p.filter((x) => x !== e))} className="ml-0.5 text-[#bbb] hover:text-[#555]"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
              {/* Message */}
              <textarea
                placeholder="Add a personal message (optional)…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full text-[12px] border border-[#ddd] rounded px-3 py-2 outline-none focus:border-[#888] placeholder:text-[#ccc] resize-none"
              />
              <button onClick={handleSendEmail}
                className={`flex items-center justify-center gap-2 py-2 rounded text-[13px] transition-colors ${sent ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#333] text-white hover:bg-[#111]"}`}>
                {sent ? <><Check size={14} />Sent!</> : <><Send size={14} />Send invitations</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Group Chat Modal ─────────────────────────────────────────────────────────

interface GroupChatModalProps {
  chatTitle: string;
  onClose: () => void;
  onStart: (participants: string[], groupName: string) => void;
}

const SUGGESTED_CONTACTS = [
  { name: "Alex Kim",     email: "alex@company.com",   initials: "AK" },
  { name: "Sam Rivera",   email: "sam@company.com",    initials: "SR" },
  { name: "Jordan Lee",   email: "jordan@company.com", initials: "JL" },
  { name: "Casey Morgan", email: "casey@company.com",  initials: "CM" },
  { name: "Taylor Scott", email: "taylor@company.com", initials: "TS" },
];

export function GroupChatModal({ chatTitle, onClose, onStart }: GroupChatModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState(`Group — ${chatTitle.slice(0, 25)}`);
  const [emailInput, setEmailInput] = useState("");
  const [step, setStep] = useState<"select" | "name" | "done">("select");

  const filtered = SUGGESTED_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleContact = (email: string) =>
    setSelected((p) => p.includes(email) ? p.filter((e) => e !== email) : [...p, email]);

  const addCustomEmail = () => {
    const e = emailInput.trim();
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !selected.includes(e)) {
      setSelected((p) => [...p, e]);
    }
    setEmailInput("");
  };

  const allSelected = [
    ...selected.map((e) => {
      const c = SUGGESTED_CONTACTS.find((x) => x.email === e);
      return c ? c.name : e;
    }),
  ];

  if (step === "done") {
    return (
      <ModalBackdrop onClose={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-[420px] p-8 flex flex-col items-center gap-4 border border-[#ddd]">
          <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center">
            <Check size={28} color="#2e7d32" />
          </div>
          <h2 className="text-[16px] font-bold text-[#111]">Group chat created!</h2>
          <p className="text-[12px] text-[#777] text-center">
            <strong>{groupName}</strong> has been started with {allSelected.join(", ")}.
          </p>
          <button onClick={onClose} className="w-full py-2 bg-[#333] text-white rounded hover:bg-[#111] text-[13px]">Done</button>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden border border-[#ddd]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div>
            <h2 className="text-[15px] font-bold text-[#111]">
              {step === "select" ? "Start a group chat" : "Name your group"}
            </h2>
            <p className="text-[12px] text-[#999] mt-0.5 truncate">Based on: {chatTitle.slice(0, 35)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><X size={16} /></button>
        </div>

        {step === "select" ? (
          <>
            {/* Search + email */}
            <div className="p-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2 border border-[#ddd] rounded px-2.5 py-1.5 focus-within:border-[#888]">
                <Users size={13} color="#aaa" />
                <input type="text" placeholder="Search contacts or enter email…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-[12px] outline-none placeholder:text-[#ccc]" />
              </div>
              {search && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search.trim()) && (
                <button onClick={() => { setEmailInput(search); addCustomEmail(); setSearch(""); }}
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#555] hover:text-[#111]">
                  <UserPlus size={11} />Invite {search.trim()} by email
                </button>
              )}
            </div>

            {/* Contact list */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((c) => {
                const on = selected.includes(c.email);
                return (
                  <button key={c.email} onClick={() => toggleContact(c.email)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f9f9f9] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#e8e8e8] flex items-center justify-center text-[11px] font-bold text-[#555] shrink-0">
                      {c.initials}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[12px] font-bold text-[#111]">{c.name}</p>
                      <p className="text-[10px] text-[#aaa]">{c.email}</p>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${on ? "bg-[#333] border-[#333]" : "border-[#ccc]"}`}>
                      {on && <Check size={10} color="white" />}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-[12px] text-[#bbb]">No contacts found</div>
              )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="px-4 py-2 border-t border-[#f0f0f0] flex flex-wrap gap-1">
                {selected.map((e) => {
                  const c = SUGGESTED_CONTACTS.find((x) => x.email === e);
                  return (
                    <span key={e} className="flex items-center gap-1 text-[11px] bg-[#ebebeb] rounded-full px-2 py-[2px]">
                      {c?.name ?? e}
                      <button onClick={() => toggleContact(e)} className="text-[#999] hover:text-[#333]"><X size={9} /></button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="p-4 border-t border-[#e8e8e8]">
              <button disabled={selected.length === 0} onClick={() => setStep("name")}
                className="w-full py-2 bg-[#333] text-white rounded hover:bg-[#111] disabled:opacity-40 text-[13px] transition-colors">
                Continue ({selected.length} selected)
              </button>
            </div>
          </>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-[11px] text-[#888] uppercase tracking-wide mb-1 block">Group name</label>
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                className="w-full text-[13px] border border-[#ddd] rounded px-3 py-2 outline-none focus:border-[#888]" />
            </div>
            <div>
              <label className="text-[11px] text-[#888] uppercase tracking-wide mb-1 block">Participants</label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#f9f9f9] rounded border border-[#eee]">
                {selected.map((e) => {
                  const c = SUGGESTED_CONTACTS.find((x) => x.email === e);
                  return (
                    <span key={e} className="flex items-center gap-1 text-[11px] bg-white border border-[#ddd] rounded-full px-2 py-[2px]">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#d0d0d0] flex items-center justify-center text-[8px] text-[#555]">{c?.initials?.[0]}</div>
                      {c?.name ?? e}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("select")}
                className="flex-1 py-2 border border-[#ddd] rounded hover:bg-[#f5f5f5] text-[13px] text-[#555]">
                Back
              </button>
              <button onClick={() => { onStart(selected, groupName); setStep("done"); }}
                className="flex-1 py-2 bg-[#333] text-white rounded hover:bg-[#111] text-[13px]">
                Create group
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

// ─── Move-to-project submenu (inline popover) ────────────────────────────────

interface MoveToProjectMenuProps {
  projects: Project[];
  currentProjectId?: string;
  onMove: (projectId: string) => void;
  onRemoveFromProject?: () => void;
  onCreateProject?: (name: string) => void;
  x: number;
  y: number;
  onClose: () => void;
}

export function MoveToProjectMenu({
  projects, currentProjectId, onMove, onRemoveFromProject, onCreateProject, x, y, onClose,
}: MoveToProjectMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  useEffect(() => { if (creatingNew) inputRef.current?.focus(); }, [creatingNew]);

  // Smart positioning: open to left if near right edge
  const menuWidth = 220;
  const menuHeight = Math.min(projects.length * 36 + 100, 340);
  let left = x;
  if (left + menuWidth > window.innerWidth - 8) left = x - menuWidth;
  left = Math.max(8, left);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  const submitNew = () => {
    const n = newName.trim();
    if (n && onCreateProject) { onCreateProject(n); setNewName(""); setCreatingNew(false); }
  };

  return (
    <div ref={ref} className="fixed z-[300] bg-white border border-[#d0d0d0] rounded shadow-lg py-1"
      style={{ left, top: adjustedY, width: menuWidth }}>
      <p className="text-[10px] text-[#bbb] uppercase tracking-wide px-3 pt-1.5 pb-1">Move to project</p>
      <div className="max-h-48 overflow-y-auto">
        {projects.map((p) => (
          <button key={p.id} onClick={() => { onMove(p.id); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#f5f5f5] ${currentProjectId === p.id ? "text-[#111] font-bold" : "text-[#333]"}`}>
            <Folder size={12} color="#888" />
            <span className="flex-1 text-left truncate">{p.name}</span>
            {currentProjectId === p.id && <Check size={11} color="#555" />}
          </button>
        ))}
        {projects.length === 0 && (
          <p className="px-3 py-2 text-[12px] text-[#aaa] italic">No projects yet</p>
        )}
      </div>
      {currentProjectId && onRemoveFromProject && (
        <>
          <div className="my-1 border-t border-[#e8e8e8]" />
          <button onClick={() => { onRemoveFromProject(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#cc5500] hover:bg-[#fff5f0]">
            <X size={12} />Remove from project
          </button>
        </>
      )}
      <div className="my-1 border-t border-[#e8e8e8]" />
      {creatingNew ? (
        <div className="px-2 pb-2 flex items-center gap-1">
          <input ref={inputRef} type="text" placeholder="Project name…" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitNew(); if (e.key === "Escape") { setCreatingNew(false); setNewName(""); } }}
            className="flex-1 text-[11px] border border-[#ccc] rounded px-2 py-1 outline-none focus:border-[#888]" />
          <button onClick={submitNew} disabled={!newName.trim()}
            className="p-1 rounded bg-[#333] text-white hover:bg-[#111] disabled:opacity-40"><Check size={11} /></button>
          <button onClick={() => { setCreatingNew(false); setNewName(""); }}
            className="p-1 rounded hover:bg-[#eee] text-[#888]"><X size={11} /></button>
        </div>
      ) : (
        <button onClick={() => setCreatingNew(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#555] hover:bg-[#f5f5f5]">
          <Plus size={12} color="#888" />New project
        </button>
      )}
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  itemName: string;
  itemType: "chat" | "project" | "folder";
  permanent?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ itemName, itemType, permanent, onConfirm, onCancel }: DeleteConfirmProps) {
  const isPermanent = permanent === true;
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-[380px] p-6 border border-[#ddd]">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPermanent ? "bg-[#fff0f0]" : "bg-[#FFF7ED]"}`}>
            <span className="text-[18px]">{isPermanent ? "⚠️" : "🗑️"}</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111]">{isPermanent ? "Permanently delete" : "Delete"} {itemType}?</h2>
            <p className="text-[12px] text-[#777] mt-1">
              {isPermanent ? (
                <>
                  "<strong>{itemName.length > 40 ? itemName.slice(0, 40) + "…" : itemName}</strong>" will be <strong>permanently deleted</strong>.
                  {" "}This action cannot be undone.
                </>
              ) : (
                <>
                  "<strong>{itemName.length > 40 ? itemName.slice(0, 40) + "…" : itemName}</strong>" will be moved to the <strong>Recycle Bin</strong> and kept for 30 days.
                  {itemType === "project" || itemType === "folder"
                    ? " All chats inside will also be moved."
                    : " You can restore it anytime from the Recycle Bin."}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 border border-[#ddd] rounded hover:bg-[#f5f5f5] text-[13px] text-[#555]">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2 text-white rounded text-[13px] ${isPermanent ? "bg-[#cc0000] hover:bg-[#990000]" : "bg-[#FF8F5C] hover:bg-[#E67A47]"}`}>
            {isPermanent ? "Delete Forever" : "Move to Bin"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── New Chat In Project Modal ────────────────────────────────────────────────

interface NewChatInProjectProps {
  projectName: string;
  onStart: (initialMessage: string) => void;
  onCancel: () => void;
}

export function NewChatInProjectModal({ projectName, onStart, onCancel }: NewChatInProjectProps) {
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-[460px] p-6 border border-[#ddd]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#111]">New chat in project</h2>
            <p className="text-[12px] text-[#999] mt-0.5 flex items-center gap-1">
              <Folder size={11} color="#aaa" />{projectName}
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><X size={16} /></button>
        </div>
        <textarea ref={ref} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you like to discuss in this project?"
          rows={4}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (message.trim()) onStart(message.trim()); } }}
          className="w-full text-[13px] border border-[#ddd] rounded px-3 py-2.5 outline-none focus:border-[#888] placeholder:text-[#ccc] resize-none mb-3"
        />
        <p className="text-[10px] text-[#bbb] mb-3">Press Cmd+Enter to start</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 border border-[#ddd] rounded hover:bg-[#f5f5f5] text-[13px] text-[#555]">Cancel</button>
          <button onClick={() => message.trim() && onStart(message.trim())} disabled={!message.trim()}
            className="flex-1 py-2 bg-[#333] text-white rounded hover:bg-[#111] disabled:opacity-40 text-[13px] flex items-center justify-center gap-1.5">
            <Send size={13} />Start chat
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Recycle Bin Modal ───────────────────────────────────────────────────────

export interface RecycleBinItem {
  id: string;
  name: string;
  type: "chat" | "project";
  deletedAt: string;
}

interface RecycleBinModalProps {
  items: RecycleBinItem[];
  onRestore: (id: string, type: "chat" | "project") => void;
  onPermanentDelete: (id: string, type: "chat" | "project") => void;
  onEmptyBin: () => void;
  onClose: () => void;
}

export function RecycleBinModal({ items, onRestore, onPermanentDelete, onEmptyBin, onClose }: RecycleBinModalProps) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden border border-[#ddd]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center">
              <Trash2 size={16} color="#888" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#111]">Recycle Bin</h2>
              <p className="text-[11px] text-[#aaa]">{items.length} deleted item{items.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={() => setConfirmEmpty(true)}
                className="text-[12px] text-[#cc0000] hover:bg-[#fff0f0] px-2 py-1 rounded">
                Empty bin
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#f0f0f0] text-[#888]"><X size={16} /></button>
          </div>
        </div>

        {/* Items */}
        <div className="max-h-[380px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <Trash2 size={22} color="#ccc" />
              </div>
              <p className="text-[14px] font-bold text-[#bbb]">Recycle bin is empty</p>
              <p className="text-[12px] text-[#ccc]">Deleted chats and projects will appear here</p>
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] group">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${item.type === "project" ? "bg-[#e8e8e8]" : "bg-[#f0f0f0]"}`}>
                    {item.type === "project"
                      ? <Folder size={15} color="#888" />
                      : <span className="text-[11px] font-bold text-[#888]">💬</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#333] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#bbb]">
                      {item.type === "project" ? "Project" : "Chat"} · Deleted {item.deletedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onRestore(item.id, item.type)}
                      title="Restore"
                      className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#555] border border-[#ddd] rounded hover:bg-[#f0f0f0]">
                      <RotateCcw size={11} />Restore
                    </button>
                    <button onClick={() => setConfirmDeleteId(item.id)}
                      title="Delete permanently"
                      className="p-1.5 rounded text-[#cc0000] hover:bg-[#fff0f0]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty bin confirm */}
        {confirmEmpty && (
          <div className="border-t border-[#e8e8e8] p-4 bg-[#fffafa]">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-[#cc0000] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#333]">
                <strong>Permanently delete all {items.length} item{items.length !== 1 ? "s" : ""}?</strong><br />
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmEmpty(false)}
                className="flex-1 py-1.5 border border-[#ddd] rounded text-[12px] text-[#555] hover:bg-[#f5f5f5]">Cancel</button>
              <button onClick={() => { onEmptyBin(); setConfirmEmpty(false); }}
                className="flex-1 py-1.5 bg-[#cc0000] text-white rounded text-[12px] hover:bg-[#990000]">Empty bin</button>
            </div>
          </div>
        )}

        {/* Single item permanent delete confirm */}
        {confirmDeleteId && (() => {
          const item = items.find((i) => i.id === confirmDeleteId);
          return item ? (
            <div className="border-t border-[#e8e8e8] p-4 bg-[#fffafa]">
              <p className="text-[12px] text-[#333] mb-3">
                <strong>Permanently delete "{item.name.length > 35 ? item.name.slice(0, 35) + "…" : item.name}"?</strong><br />
                <span className="text-[#999]">This cannot be undone.</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-1.5 border border-[#ddd] rounded text-[12px] text-[#555] hover:bg-[#f5f5f5]">Cancel</button>
                <button onClick={() => { onPermanentDelete(item.id, item.type); setConfirmDeleteId(null); }}
                  className="flex-1 py-1.5 bg-[#cc0000] text-white rounded text-[12px] hover:bg-[#990000]">Delete forever</button>
              </div>
            </div>
          ) : null;
        })()}
      </div>
    </ModalBackdrop>
  );
}