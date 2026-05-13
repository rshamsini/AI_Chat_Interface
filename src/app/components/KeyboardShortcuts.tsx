import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { section: "Navigation", items: [
    { keys: ["Ctrl", "N"], desc: "New chat" },
    { keys: ["Ctrl", "E"], desc: "Open Chat Explorer" },
    { keys: ["Ctrl", "K"], desc: "Focus search" },
    { keys: ["Ctrl", "B"], desc: "Toggle sidebar" },
  ]},
  { section: "Chat Actions", items: [
    { keys: ["Enter"], desc: "Send message" },
    { keys: ["Shift", "Enter"], desc: "New line in message" },
    { keys: ["Ctrl", "Shift", "R"], desc: "Rename current chat" },
  ]},
  { section: "Help", items: [
    { keys: ["?"], desc: "Show keyboard shortcuts" },
    { keys: ["Esc"], desc: "Close modal / cancel" },
  ]},
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only trigger on "?" when not typing in an input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        className="fixed bottom-4 right-4 z-[100] p-2.5 rounded-full bg-white border-2 border-[#E7DFC8] hover:border-[#FF8F5C] shadow-lg hover:shadow-xl transition-all group"
      >
        <Keyboard size={16} className="text-[#9CA3AF] group-hover:text-[#FF8F5C] transition-colors" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden border-2 border-[#E7DFC8]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7DFC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF8F5C, #FFB078)" }}>
              <Keyboard size={16} color="white" />
            </div>
            <h2 className="text-[16px] font-bold text-[#111]">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {SHORTCUTS.map((section) => (
            <div key={section.section} className="mb-5 last:mb-0">
              <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2.5">{section.section}</h3>
              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F9FAFB]">
                    <span className="text-[13px] text-[#374151]">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-[11px] font-semibold text-[#374151] bg-[#F3F4F6] border border-[#D1D5DB] rounded-md shadow-sm">
                            {key}
                          </kbd>
                          {i < item.keys.length - 1 && <span className="text-[10px] text-[#9CA3AF] mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E7DFC8] bg-[#FAFAFA]">
          <p className="text-[11px] text-[#9CA3AF] text-center">Press <kbd className="px-1.5 py-0.5 text-[10px] bg-[#F3F4F6] border border-[#D1D5DB] rounded">?</kbd> to toggle this panel</p>
        </div>
      </div>
    </div>
  );
}
