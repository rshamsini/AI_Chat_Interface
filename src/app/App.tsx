import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatMain } from "./components/ChatMain";
import { ChatManager } from "./components/ChatManager";
import { DEFAULT_PINNED_IDS, DEFAULT_FAVORITE_IDS, DEFAULT_ARCHIVE_IDS, SessionChat, ALL_CHATS } from "./data/chatData";
import type { RecycleBinItem } from "./components/Modals";
import { Toaster, toast } from "sonner";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcuts";

export interface Project {
  id: string;
  name: string;
  count: number;
}

const DEFAULT_PROJECTS: Project[] = [
  { id: "p1", name: "Marketing Site Redesign", count: 3 },
  { id: "p2", name: "Mobile App MVP",          count: 3 },
  { id: "p3", name: "Internal Tooling",        count: 2 },
  { id: "p4", name: "Q2 Content Calendar",     count: 2 },
  { id: "p5", name: "Customer Research Hub",   count: 2 },
];

export default function App() {
  const [collapsed,       setCollapsed]       = useState<Record<string, boolean>>({ today: false, yesterday: false, older: false });
  const [chatManagerOpen, setChatManagerOpen] = useState(false);
  const [activeChatId,    setActiveChatId]    = useState<string>("f11");
  const [chatManagerInitProject, setChatManagerInitProject] = useState<string | null>(null);

  // ── Interaction state ──
  const [pinnedIds,   setPinnedIds]   = useState<Set<string>>(new Set(DEFAULT_PINNED_IDS));
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(DEFAULT_FAVORITE_IDS));
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set(DEFAULT_ARCHIVE_IDS));
  const [deletedChatIds,    setDeletedChatIds]    = useState<Set<string>>(new Set<string>());
  const [deletedProjectIds, setDeletedProjectIds] = useState<Set<string>>(new Set<string>());
  const [chatTitles,  setChatTitles]  = useState<Record<string, string>>({});
  const [chatTags,    setChatTags]    = useState<Record<string, string[]>>({});
  const [sessionChats, setSessionChats] = useState<SessionChat[]>([]);
  // Map chatId → projectId (runtime assignment / move-to-project)
  const [chatProjectMap, setChatProjectMap] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  // Recycle bin
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);

  // ── Handlers ──
  const toggleSection = (key: string) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const handlePin      = (id: string) => {
    const name = chatTitles[id] ?? sessionChats.find((c) => c.id === id)?.title ?? ALL_CHATS.find((c) => c.id === id)?.title ?? "Chat";
    const wasP = pinnedIds.has(id);
    setPinnedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast(wasP ? `📌 Unpinned "${name}"` : `📌 Pinned "${name}"`, { duration: 2000 });
  };
  const handleFavorite = (id: string) => {
    const name = chatTitles[id] ?? sessionChats.find((c) => c.id === id)?.title ?? ALL_CHATS.find((c) => c.id === id)?.title ?? "Chat";
    const wasF = favoriteIds.has(id);
    setFavoriteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast(wasF ? `⭐ Removed from favorites` : `⭐ Added "${name}" to favorites`, { duration: 2000 });
  };
  const handleArchive  = (id: string) => {
    const name = chatTitles[id] ?? sessionChats.find((c) => c.id === id)?.title ?? ALL_CHATS.find((c) => c.id === id)?.title ?? "Chat";
    const wasA = archivedIds.has(id);
    setArchivedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast(wasA ? `📦 Unarchived "${name}"` : `📦 Archived "${name}"`, { duration: 2000 });
  };

  const handleRename = (id: string, title: string) => {
    setChatTitles((p) => ({ ...p, [id]: title }));
    toast(`✏️ Renamed to "${title}"`, { duration: 2000 });
  };
  const handleUpdateTags = (id: string, tags: string[]) => setChatTags(  (p) => ({ ...p, [id]: tags  }));

  const handleDeleteChat = (id: string) => {
    const name = chatTitles[id] ?? sessionChats.find((c) => c.id === id)?.title ?? ALL_CHATS.find((c) => c.id === id)?.title ?? id;
    setRecycleBin((p) => [{ id, name, type: "chat", deletedAt: "Today" }, ...p.filter((x) => x.id !== id)]);
    setDeletedChatIds((p) => { const n = new Set(p); n.add(id); return n; });
    setPinnedIds(  (p) => { const n = new Set(p); n.delete(id); return n; });
    setFavoriteIds((p) => { const n = new Set(p); n.delete(id); return n; });
    setArchivedIds((p) => { const n = new Set(p); n.delete(id); return n; });
    if (activeChatId === id) setActiveChatId("new");
    setSessionChats((p) => p.filter((c) => c.id !== id));
    toast(`🗑️ "${name}" moved to Recycle Bin`, { duration: 3000 });
  };

  const handleDeleteProject = (projectId: string) => {
    const name = projects.find((p) => p.id === projectId)?.name ?? projectId;
    setRecycleBin((p) => [{ id: projectId, name, type: "project", deletedAt: "Today" }, ...p.filter((x) => x.id !== projectId)]);
    setDeletedProjectIds((p) => { const n = new Set(p); n.add(projectId); return n; });
    setProjects((p) => p.filter((proj) => proj.id !== projectId));
    toast(`🗑️ Project "${name}" moved to Recycle Bin`, { duration: 3000 });
  };

  const handleRestoreItem = (id: string, type: "chat" | "project") => {
    const item = recycleBin.find((x) => x.id === id);
    if (type === "chat") {
      setDeletedChatIds((p) => { const n = new Set(p); n.delete(id); return n; });
    } else {
      setDeletedProjectIds((p) => { const n = new Set(p); n.delete(id); return n; });
      if (item) setProjects((p) => p.find((x) => x.id === id) ? p : [...p, { id, name: item.name, count: 0 }]);
    }
    setRecycleBin((p) => p.filter((x) => x.id !== id));
    toast(`♻️ Restored "${item?.name ?? id}"`, { duration: 2000 });
  };

  const handlePermanentDelete = (id: string, type: "chat" | "project") => {
    // Already deleted from active data; just remove from recycle bin
    setRecycleBin((p) => p.filter((x) => x.id !== id));
    if (type === "chat") setSessionChats((p) => p.filter((c) => c.id !== id));
  };

  const handleEmptyBin = () => {
    // All items in bin are already removed from active data; just clear the bin
    setRecycleBin([]);
  };

  const handleMoveToProject = (chatId: string, projectId: string) => {
    const chatName = chatTitles[chatId] ?? sessionChats.find((c) => c.id === chatId)?.title ?? ALL_CHATS.find((c) => c.id === chatId)?.title ?? "Chat";
    const projName = projects.find((p) => p.id === projectId)?.name ?? "project";
    setChatProjectMap((p) => ({ ...p, [chatId]: projectId }));
    setProjects((p) => p.map((proj) => {
      if (proj.id === projectId) return { ...proj, count: proj.count + 1 };
      const old = chatProjectMap[chatId];
      if (old && proj.id === old) return { ...proj, count: Math.max(0, proj.count - 1) };
      return proj;
    }));
    toast(`📁 Moved "${chatName}" to ${projName}`, { duration: 2000 });
  };

  const handleRemoveFromProject = (chatId: string) => {
    const old = chatProjectMap[chatId];
    setChatProjectMap((p) => { const n = { ...p }; delete n[chatId]; return n; });
    if (old) {
      setProjects((p) => p.map((proj) => proj.id === old ? { ...proj, count: Math.max(0, proj.count - 1) } : proj));
    }
  };

  const handleChatCreated = (chat: SessionChat) => {
    setSessionChats((prev) => {
      const exists = prev.find((c) => c.id === chat.id);
      if (exists) return prev.map((c) => c.id === chat.id ? chat : c);
      return [chat, ...prev];
    });
    setActiveChatId(chat.id);
  };

  const handleChatCreatedInProject = (chat: SessionChat, projectId: string) => {
    handleChatCreated(chat);
    setChatProjectMap((p) => ({ ...p, [chat.id]: projectId }));
    setProjects((p) => p.map((proj) => proj.id === projectId ? { ...proj, count: proj.count + 1 } : proj));
  };

  const handleSessionChatUpdate = (chat: SessionChat) => {
    setSessionChats((prev) => {
      const exists = prev.find((c) => c.id === chat.id);
      if (exists) return prev.map((c) => c.id === chat.id ? chat : c);
      return [chat, ...prev]; // create if not found (e.g. from DesktopView)
    });
  };

  const handleAddProject = (name: string) => {
    setProjects((prev) => [...prev, { id: `p-${Date.now()}`, name, count: 0 }]);
    toast(`📁 Project "${name}" created`, { duration: 2000 });
  };

  const handleRenameProject = (id: string, name: string) => {
    setProjects((p) => p.map((proj) => proj.id === id ? { ...proj, name } : proj));
    toast(`✏️ Project renamed to "${name}"`, { duration: 2000 });
  };

  const handleNewChat = () => {
    setActiveChatId("new");
    if (chatManagerOpen) setChatManagerOpen(false);
  };

  const handleProjectClick = (projectId: string) => {
    if (chatManagerOpen) {
      setChatManagerInitProject(projectId);
    } else {
      setActiveChatId(`project:${projectId}`);
    }
  };

  // Shared props sent to all children
  const sharedState = {
    pinnedIds, favoriteIds, archivedIds, deletedChatIds, deletedProjectIds,
    chatTitles, chatTags, sessionChats, chatProjectMap,
    projects,
    onPin:                handlePin,
    onFavorite:           handleFavorite,
    onArchive:            handleArchive,
    onRename:             handleRename,
    onUpdateTags:         handleUpdateTags,
    onDeleteChat:         handleDeleteChat,
    onDeleteProject:      handleDeleteProject,
    onMoveToProject:      handleMoveToProject,
    onRemoveFromProject:  handleRemoveFromProject,
    onAddProject:         handleAddProject,
    onRenameProject:      handleRenameProject,
    onChatCreatedInProject: handleChatCreatedInProject,
    recycleBin,
    onRestoreItem:        handleRestoreItem,
    onPermanentDelete:    handlePermanentDelete,
    onEmptyBin:           handleEmptyBin,
  };

  return (
    <div className="flex bg-white overflow-hidden w-screen h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {!chatManagerOpen && (
        <Sidebar
          collapsed={collapsed}
          toggleSection={toggleSection}
          onChatManagerToggle={() => { setChatManagerInitProject(null); setChatManagerOpen((v) => !v); }}
          chatManagerOpen={chatManagerOpen}
          activeChatId={activeChatId}
          onChatClick={(id) => { setActiveChatId(id); if (chatManagerOpen) setChatManagerOpen(false); }}
          onProjectClick={handleProjectClick}
          onNewChat={handleNewChat}
          {...sharedState}
        />
      )}

      {chatManagerOpen ? (
        <ChatManager
          onClose={() => setChatManagerOpen(false)}
          onChatOpen={(id) => { setActiveChatId(id); setChatManagerOpen(false); }}
          initialProjectId={chatManagerInitProject}
          onSessionChatUpdate={handleSessionChatUpdate}
          {...sharedState}
        />
      ) : (
        <ChatMain
          activeChatId={activeChatId}
          sessionChats={sessionChats}
          chatTitles={chatTitles}
          chatTags={chatTags}
          chatProjectMap={chatProjectMap}
          projects={projects}
          deletedChatIds={deletedChatIds}
          onChatCreated={handleChatCreated}
          onChatCreatedInProject={handleChatCreatedInProject}
          onSessionChatUpdate={handleSessionChatUpdate}
          onRename={handleRename}
          onUpdateTags={handleUpdateTags}
          onNewChat={handleNewChat}
          onChatSelect={(id) => setActiveChatId(id)}
          onDeleteChat={handleDeleteChat}
          onMoveToProject={handleMoveToProject}
        />
      )}
      <Toaster position="bottom-center" toastOptions={{
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          borderRadius: "12px",
          border: "1px solid #E7DFC8",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        },
      }} />
      <KeyboardShortcutsModal />
    </div>
  );
}