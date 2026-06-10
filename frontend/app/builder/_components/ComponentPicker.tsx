"use client";
import { useState, useEffect, useRef } from "react";
import { X, Plus, LayoutGrid, ChevronLeft, Layers, Bookmark, Trash2, Eye, Search } from "lucide-react";
import { CATEGORIES, COMPONENTS, type ComponentDef } from "@/lib/builderComponents";
import CanvasEditor from "./CanvasEditor";
import BlockPreview from "./BlockPreview";

const SAVED_KEY = "lhrweb_saved_sections";

function useSavedSections() {
  const [saved, setSaved] = useState<ComponentDef[]>([]);
  useEffect(() => {
    const load = () => {
      try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]")); }
      catch { setSaved([]); }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const remove = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaved(next);
  };
  return { saved, remove };
}

// ── Live scaled thumbnail ─────────────────────────────────────────────────────

const RENDER_W = 1280;
const CARD_W   = 374;   // usable width inside the card (drawer 420px - padding)
const THUMB_H  = 180;   // visible clip height in px
const SCALE    = CARD_W / RENDER_W;

function SectionThumbnail({ comp, primaryColor = "#6344d4" }: { comp: ComponentDef; primaryColor?: string }) {
  const block = { id: "prev", type: comp.blockType, content: comp.defaultContent, styles: comp.defaultStyles };
  return (
    <div className="w-full overflow-hidden" style={{ height: THUMB_H, position: "relative", background: "#f3f4f6" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: RENDER_W,
          transformOrigin: "top left",
          transform: `scale(${SCALE})`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <BlockPreview blocks={[block]} primaryColor={primaryColor} />
      </div>
    </div>
  );
}

// ── Full-size preview modal ───────────────────────────────────────────────────

const MODAL_W   = 900;
const MODAL_SCALE = MODAL_W / RENDER_W;

function PreviewModal({ comp, primaryColor, onClose, onAdd }: {
  comp: ComponentDef; primaryColor?: string;
  onClose: () => void; onAdd: () => void;
}) {
  const block = { id: "prev", type: comp.blockType, content: comp.defaultContent, styles: comp.defaultStyles };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ width: MODAL_W, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-[15px] font-bold text-gray-900">{comp.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{comp.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
              <Plus size={14} /> Add to page
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="overflow-y-auto flex-1">
          <div style={{ width: RENDER_W, transformOrigin: "top left", transform: `scale(${MODAL_SCALE})`, pointerEvents: "none" }}>
            <BlockPreview blocks={[block]} primaryColor={primaryColor ?? "#6344d4"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Built-in section browser ──────────────────────────────────────────────────

function BuiltinBrowser({ onAdd, primaryColor, onBuildCustom }: { onAdd: (comp: ComponentDef) => void; primaryColor?: string; onBuildCustom?: () => void }) {
  const { saved, remove } = useSavedSections();
  const hasSaved = saved.length > 0;
  const allCats = [
    ...(hasSaved ? [{ key: "saved", label: "My Sections" }] : []),
    ...CATEGORIES,
  ];
  const [activeCategory, setActiveCategory] = useState(hasSaved ? "saved" : CATEGORIES[0].key as string);
  const [previewComp, setPreviewComp] = useState<ComponentDef | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // When searching, show results across all categories
  const isSearching = searchQuery.trim().length > 0;
  const filtered = isSearching
    ? COMPONENTS.filter((c) =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.categoryKey.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory === "saved"
      ? saved
      : COMPONENTS.filter((c) => c.categoryKey === activeCategory);

  return (
    <>
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search blocks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-gray-800 placeholder-gray-400 outline-none border-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs — hidden while searching */}
      {!isSearching && <div className="border-b border-gray-100 flex-shrink-0 overflow-x-auto">
        <div className="flex px-4 gap-0.5 min-w-max py-2">
          {allCats.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === cat.key
                  ? cat.key === "saved" ? "bg-[#6344d4] text-white" : "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {cat.key === "saved" && <Bookmark size={11} />}
              {cat.label}
              {cat.key === "saved" && (
                <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{saved.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>}

      {/* Component cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isSearching && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Search className="text-gray-300" size={24} />
            <p className="text-[13px] font-semibold text-gray-500">No blocks match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
        {!isSearching && filtered.length === 0 && activeCategory === "saved" && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Bookmark className="text-[#6344d4]" size={20} />
            </div>
            <p className="text-[13px] font-semibold text-gray-700">No saved sections yet</p>
            <p className="text-[11px] text-gray-400 max-w-[200px]">Build a section in the Canvas Builder and click "Save to Library" to save it here.</p>
          </div>
        )}

        {filtered.map((comp) => (
          <div key={comp.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 transition-all group">
            {/* Thumbnail */}
            {activeCategory === "saved" ? (
              <div className="w-full h-16 bg-gradient-to-br from-[#6344d4]/10 to-purple-50 flex items-center justify-center">
                <Bookmark className="text-[#6344d4]/40" size={24} />
              </div>
            ) : (
              <div className="relative cursor-pointer" onClick={() => setPreviewComp(comp)}>
                <SectionThumbnail comp={comp} primaryColor={primaryColor} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[12px] font-bold text-gray-900 shadow-lg">
                    <Eye size={13} /> Preview
                  </span>
                </div>
              </div>
            )}

            {/* Card footer */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{comp.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{comp.description}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                {activeCategory === "saved" && (
                  <button
                    onClick={() => remove(comp.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remove from library"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => onAdd(comp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-gray-800 transition-all"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas builder shortcut */}
      {onBuildCustom && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button
            onClick={onBuildCustom}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-100 text-[12px] font-bold text-blue-500 hover:border-blue-400 hover:bg-blue-50/30 transition-all"
          >
            <Layers size={13} /> Build Custom with Canvas
          </button>
        </div>
      )}

      {/* Preview modal */}
      {previewComp && (
        <PreviewModal
          comp={previewComp}
          primaryColor={primaryColor}
          onClose={() => setPreviewComp(null)}
          onAdd={() => { onAdd(previewComp); setPreviewComp(null); }}
        />
      )}
    </>
  );
}

// ── Main picker ───────────────────────────────────────────────────────────────

type Mode = "home" | "builtin" | "canvas";

interface Props {
  onAdd:         (component: ComponentDef) => void;
  onClose:       () => void;
  primaryColor?: string;
}

export default function ComponentPicker({ onAdd, onClose, primaryColor }: Props) {
  const [mode, setMode] = useState<Mode>("builtin");

  if (mode === "canvas") {
    return <CanvasEditor onAdd={(comp) => { onAdd(comp); }} onClose={() => setMode("home")} />;
  }

  const heading    = mode === "home" ? "Add Section" : "Browse Sections";
  const subheading = mode === "home"
    ? "Pick a ready-made section or build with the canvas"
    : "Choose from our library of pre-built, professional sections";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[420px] bg-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {mode !== "home" && (
              <button
                onClick={() => setMode("home")}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">{heading}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{subheading}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Home: two-path chooser ── */}
        {mode === "home" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <button
              onClick={() => setMode("builtin")}
              className="w-full border-2 border-gray-100 rounded-[1.5rem] p-6 text-left hover:border-black transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <LayoutGrid className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-gray-900 mb-1">Browse Ready-Made Sections</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
                    Pick from our library of professionally designed sections — headers, banners, services, pricing and more.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Header", "Banner", "Services", "Features", "FAQ", "+8 more"].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("canvas")}
              className="w-full border-2 border-blue-100 bg-blue-50/20 rounded-[1.5rem] p-5 text-left hover:border-blue-500 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                  <Layers className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-bold text-gray-900">Canvas Builder</p>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-wide">New</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                    Drag-and-drop editor — add rows, columns, headings, buttons, images and more.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {["Rows", "Columns", "Images", "Buttons", "Lists"].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Built-in browser ── */}
        {mode === "builtin" && (
          <div className="flex-1 flex flex-col min-h-0">
            <BuiltinBrowser onAdd={(comp) => { onAdd(comp); }} primaryColor={primaryColor} onBuildCustom={() => setMode("canvas")} />
          </div>
        )}

      </div>
    </div>
  );
}
