"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X, Search, Plus, Sparkles, Send,
  Box, Rows3, Grid3x3, Columns2, Heading, Pilcrow, Link2, List,
  Image as ImageIcon, Video, Shapes, Triangle, RectangleEllipsis,
  ClipboardList, TextCursorInput, ChevronDown, LayoutGrid, Bookmark, Trash2, Eye,
} from "lucide-react";
import type { ElementNode, SavedSection, ProjectComponent } from "@/types/builder";
import { CATEGORIES, COMPONENTS, type ComponentDef } from "@/lib/builderComponents";
import BlockPreview from "./BlockPreview";

// ── uid ───────────────────────────────────────────────────────────────────────

function uid() { return `el-${crypto.randomUUID().slice(0, 8)}`; }

// ── Variant definitions ───────────────────────────────────────────────────────

const VARIANTS: Record<string, { label: string; sub: string; factory: () => ElementNode }[]> = {
  heading: [
    { label: "H1", sub: "Page title",    factory: () => ({ id: uid(), tag: "h1" as const, content: "Page Title",       attrs: {}, children: [], styles: { desktop: { fontSize: "56px", fontWeight: "800", color: "#111827", lineHeight: "1.1", marginBottom: "16px" } } }) },
    { label: "H2", sub: "Section title", factory: () => ({ id: uid(), tag: "h2" as const, content: "Section Heading", attrs: {}, children: [], styles: { desktop: { fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1.2", marginBottom: "16px" } } }) },
    { label: "H3", sub: "Sub-heading",   factory: () => ({ id: uid(), tag: "h3" as const, content: "Sub Heading",     attrs: {}, children: [], styles: { desktop: { fontSize: "24px", fontWeight: "600", color: "#111827", lineHeight: "1.3", marginBottom: "12px" } } }) },
    { label: "H4", sub: "Card title",    factory: () => ({ id: uid(), tag: "h4" as const, content: "Card Title",      attrs: {}, children: [], styles: { desktop: { fontSize: "18px", fontWeight: "600", color: "#111827", lineHeight: "1.4", marginBottom: "8px"  } } }) },
  ],
  grid: [
    { label: "2 Col", sub: "Two columns",   factory: () => ({ id: uid(), tag: "div" as const, attrs: {}, children: [1,2].map(()   => ({ id: uid(), tag: "div" as const, attrs: {}, content: "Column", children: [], styles: { desktop: { padding: "24px", backgroundColor: "#f9fafb", borderRadius: "8px", textAlign: "center" as const, fontSize: "14px", color: "#6b7280" } } })), styles: { desktop: { display: "grid" as const, gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", padding: "40px" } } }) },
    { label: "3 Col", sub: "Three columns", factory: () => ({ id: uid(), tag: "div" as const, attrs: {}, children: [1,2,3].map(() => ({ id: uid(), tag: "div" as const, attrs: {}, content: "Column", children: [], styles: { desktop: { padding: "24px", backgroundColor: "#f9fafb", borderRadius: "8px", textAlign: "center" as const, fontSize: "14px", color: "#6b7280" } } })), styles: { desktop: { display: "grid" as const, gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", padding: "40px" } } }) },
    { label: "4 Col", sub: "Four columns",  factory: () => ({ id: uid(), tag: "div" as const, attrs: {}, children: [1,2,3,4].map(()=>({ id: uid(), tag: "div" as const, attrs: {}, content: "Column", children: [], styles: { desktop: { padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", textAlign: "center" as const, fontSize: "14px", color: "#6b7280" } } })), styles: { desktop: { display: "grid" as const, gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "40px" } } }) },
  ],
  button: [
    { label: "Filled",  sub: "Primary action",   factory: () => ({ id: uid(), tag: "button" as const, content: "Get Started", attrs: {}, children: [], styles: { desktop: { display: "flex" as const, alignItems: "center", justifyContent: "center", padding: "12px 28px", backgroundColor: "#6344d4", color: "#ffffff", borderRadius: "8px", fontSize: "15px", fontWeight: "600", border: "none", cursor: "pointer" } } }) },
    { label: "Outline", sub: "Secondary action", factory: () => ({ id: uid(), tag: "button" as const, content: "Learn More",  attrs: {}, children: [], styles: { desktop: { display: "flex" as const, alignItems: "center", justifyContent: "center", padding: "12px 28px", backgroundColor: "transparent", color: "#6344d4", borderRadius: "8px", fontSize: "15px", fontWeight: "600", border: "2px solid #6344d4", cursor: "pointer" } } }) },
    { label: "Ghost",   sub: "Subtle action",    factory: () => ({ id: uid(), tag: "button" as const, content: "Read More →", attrs: {}, children: [], styles: { desktop: { display: "flex" as const, alignItems: "center", justifyContent: "center", padding: "12px 28px", backgroundColor: "transparent", color: "#374151", borderRadius: "8px", fontSize: "15px", fontWeight: "600", border: "none", cursor: "pointer", textDecoration: "underline" } } }) },
  ],
};

// ── Element factory ───────────────────────────────────────────────────────────

export function createElement(type: string): ElementNode {
  const id = uid();
  const base = { id, attrs: {} as Record<string, string>, children: [] as ElementNode[] };
  switch (type) {
    case "div":       return { ...base, tag: "div",     styles: { desktop: { padding: "24px", minHeight: "80px", backgroundColor: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: "8px" } } };
    case "section":   return { ...base, tag: "section", styles: { desktop: { padding: "80px 40px", width: "100%", minHeight: "200px" } } };
    case "flex":      return { ...base, tag: "div",     styles: { desktop: { display: "flex" as const, flexDirection: "row", gap: "16px", padding: "24px", alignItems: "center" } } };
    case "heading":   return VARIANTS.heading[1].factory();
    case "paragraph": return { ...base, tag: "p",       content: "Write your paragraph text here.", styles: { desktop: { fontSize: "16px", color: "#4b5563", lineHeight: "1.6", marginBottom: "16px" } } };
    case "link":      return { ...base, tag: "a",       content: "Click here", attrs: { href: "#" }, styles: { desktop: { fontSize: "16px", color: "#6344d4", textDecoration: "underline", cursor: "pointer" } } };
    case "list":      return {
      ...base, tag: "ul",
      styles: { desktop: { fontSize: "16px", color: "#4b5563", lineHeight: "1.8", paddingLeft: "24px" } },
      children: ["Item one", "Item two", "Item three"].map((t) => ({ id: uid(), tag: "li" as const, content: t, attrs: {}, styles: { desktop: {} }, children: [] })),
    };
    case "image":  return { ...base, tag: "img",   attrs: { src: "https://placehold.co/800x400/f3f4f6/9ca3af?text=Image", alt: "Image" }, styles: { desktop: { width: "100%", height: "auto", borderRadius: "8px", display: "block" as const } } };
    case "video":  return { ...base, tag: "video", attrs: { src: "", controls: "true" }, styles: { desktop: { width: "100%", height: "400px", borderRadius: "8px", display: "block" as const, backgroundColor: "#111827" } } };
    case "icon":   return { ...base, tag: "span",  content: "★", styles: { desktop: { fontSize: "40px", color: "#6344d4", display: "inline-block" as const, lineHeight: "1" } } };
    case "svg":    return { ...base, tag: "svg",   attrs: { width: "80", height: "80", viewBox: "0 0 80 80", fill: "none" }, content: '<circle cx="40" cy="40" r="40" fill="#6344d4" fill-opacity="0.1"/>', styles: { desktop: { display: "block" as const } } };
    case "button": return VARIANTS.button[0].factory();
    case "form":   return {
      ...base, tag: "form",
      styles: { desktop: { display: "flex" as const, flexDirection: "column", gap: "16px", maxWidth: "480px", padding: "32px", backgroundColor: "#f9fafb", borderRadius: "12px" } },
      children: [
        { id: uid(), tag: "input" as const, attrs: { type: "text",  name: "name",  placeholder: "Your name",    required: "true" }, styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } }, children: [] },
        { id: uid(), tag: "input" as const, attrs: { type: "email", name: "email", placeholder: "Email address", required: "true" }, styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } }, children: [] },
        { id: uid(), tag: "button" as const, content: "Submit", attrs: { type: "submit" }, styles: { desktop: { padding: "12px 24px", backgroundColor: "#6344d4", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" } }, children: [] },
      ],
    };
    case "input":  return { ...base, tag: "input",  attrs: { type: "text", placeholder: "Enter text..." }, styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", outline: "none" } } };
    case "select": return { ...base, tag: "select", attrs: {}, styles: { desktop: { padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", width: "100%", backgroundColor: "#fff" } } };
    case "grid":   return VARIANTS.grid[1].factory();
    default:       return { ...base, tag: "div", styles: { desktop: { padding: "24px" } } };
  }
}

const ELEMENT_CATEGORIES = [
  {
    label: "LAYOUT",
    items: [
      { id: "div",     label: "Div",      Icon: Box,              hasVariants: false },
      { id: "section", label: "Section",  Icon: Rows3,            hasVariants: false },
      { id: "grid",    label: "Grid",     Icon: Grid3x3,          hasVariants: true  },
      { id: "flex",    label: "Flex Row", Icon: Columns2,         hasVariants: false },
    ],
  },
  {
    label: "TYPOGRAPHY",
    items: [
      { id: "heading",   label: "Heading",   Icon: Heading,         hasVariants: true  },
      { id: "paragraph", label: "Paragraph", Icon: Pilcrow,         hasVariants: false },
      { id: "link",      label: "Link",      Icon: Link2,           hasVariants: false },
      { id: "list",      label: "List",      Icon: List,            hasVariants: false },
    ],
  },
  {
    label: "MEDIA",
    items: [
      { id: "image", label: "Image", Icon: ImageIcon, hasVariants: false },
      { id: "video", label: "Video", Icon: Video,     hasVariants: false },
      { id: "icon",  label: "Icon",  Icon: Shapes,    hasVariants: false },
      { id: "svg",   label: "SVG",   Icon: Triangle,  hasVariants: false },
    ],
  },
  {
    label: "INTERACTIVE",
    items: [
      { id: "button", label: "Button", Icon: RectangleEllipsis, hasVariants: true  },
      { id: "form",   label: "Form",   Icon: ClipboardList,     hasVariants: false },
      { id: "input",  label: "Input",  Icon: TextCursorInput,   hasVariants: false },
      { id: "select", label: "Select", Icon: ChevronDown,       hasVariants: false },
    ],
  },
];

// ── Saved sections hook ───────────────────────────────────────────────────────

const SAVED_KEY          = "lhrweb_saved_sections";
const SAVED_ELEMENTS_KEY = "lhrweb_saved_elements";

interface SavedElementComponent { id: string; name: string; tree: ElementNode; }

function useSavedElements() {
  const [saved, setSaved] = useState<SavedElementComponent[]>([]);
  useEffect(() => {
    const load = () => {
      try { setSaved(JSON.parse(localStorage.getItem(SAVED_ELEMENTS_KEY) ?? "[]")); }
      catch { setSaved([]); }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const remove = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    localStorage.setItem(SAVED_ELEMENTS_KEY, JSON.stringify(next));
    setSaved(next);
  };
  return { saved, remove };
}

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

// ── Section thumbnail ─────────────────────────────────────────────────────────

const RENDER_W = 1280;
const CARD_W   = 316;
const THUMB_H  = 160;
const SCALE    = CARD_W / RENDER_W;

function SectionThumbnail({ comp, primaryColor = "#6344d4" }: { comp: ComponentDef; primaryColor?: string }) {
  const block = { id: "prev", type: comp.blockType, content: comp.defaultContent, styles: comp.defaultStyles };
  return (
    <div className="w-full overflow-hidden" style={{ height: THUMB_H, position: "relative", background: "#f3f4f6" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: RENDER_W, transformOrigin: "top left", transform: `scale(${SCALE})`, pointerEvents: "none", userSelect: "none" }}>
        <BlockPreview blocks={[block]} primaryColor={primaryColor} />
      </div>
    </div>
  );
}

// ── Elements tab ──────────────────────────────────────────────────────────────

function ElementsTab({ onAdd, onAddSaved, onDragStart, onDragEnd }: {
  onAdd: (el: ElementNode) => void;
  onAddSaved?: (el: ElementNode) => void;
  onDragStart?: (type: string) => void;
  onDragEnd?: () => void;
}) {
  const [search, setSearch]                   = useState("");
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const { saved: savedComponents, remove: removeSavedComponent } = useSavedElements();

  const filtered = search.trim()
    ? ELEMENT_CATEGORIES
        .map((cat) => ({ ...cat, items: cat.items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())) }))
        .filter((cat) => cat.items.length > 0)
    : ELEMENT_CATEGORIES;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-gray-800 placeholder-gray-400 outline-none border-none"
          />
          {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={11} /></button>}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Saved Components */}
        {savedComponents.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">My Components</p>
            <div className="grid grid-cols-2 gap-2">
              {savedComponents.map((comp) => (
                <div key={comp.id} className="group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 bg-white hover:border-[#6344d4]/30 hover:bg-purple-50/30 transition-all cursor-pointer text-center"
                  onClick={() => {
                    const clone = { ...comp.tree, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
                    (onAddSaved ?? onAdd)(clone);
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-[10px] font-black text-[#6344d4] uppercase">{comp.tree.tag.slice(0, 3)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 leading-tight truncate w-full">{comp.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSavedComponent(comp.id); }}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full bg-red-100 text-red-400 hover:bg-red-200 transition-all"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Search className="text-gray-300" size={22} />
            <p className="text-[13px] font-semibold text-gray-500">No elements match</p>
          </div>
        ) : filtered.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">{cat.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {cat.items.map(({ id, label, Icon, hasVariants }) => (
                <div key={id} className="col-span-1">
                  <button
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", id);
                      e.dataTransfer.effectAllowed = "copy";
                      onDragStart?.(id);
                    }}
                    onDragEnd={() => onDragEnd?.()}
                    onClick={() => {
                      if (hasVariants && VARIANTS[id]) {
                        setExpandedVariant(expandedVariant === id ? null : id);
                      } else {
                        onAdd(createElement(id));
                      }
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2.5 py-4 border rounded-2xl transition-all group relative cursor-grab active:cursor-grabbing ${
                      expandedVariant === id
                        ? "bg-purple-50 border-[#6344d4]/30"
                        : "bg-gray-50/70 border-gray-100 hover:bg-purple-50/60 hover:border-[#6344d4]/25 active:scale-[0.97]"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={expandedVariant === id ? "text-[#6344d4]" : "text-gray-500 group-hover:text-[#6344d4] transition-colors"}
                    />
                    <span className={`text-[11px] font-semibold leading-tight ${expandedVariant === id ? "text-[#6344d4]" : "text-gray-600 group-hover:text-[#6344d4] transition-colors"}`}>
                      {label}
                    </span>
                    {hasVariants && (
                      <ChevronDown
                        size={10}
                        className={`absolute top-2 right-2 text-gray-300 transition-transform ${expandedVariant === id ? "rotate-180 text-[#6344d4]" : ""}`}
                      />
                    )}
                  </button>

                  {/* Inline variant picker */}
                  {expandedVariant === id && VARIANTS[id] && (
                    <div className="col-span-2 mt-1.5 p-2 bg-purple-50/60 border border-[#6344d4]/15 rounded-xl space-y-1">
                      {VARIANTS[id].map((v) => (
                        <button
                          key={v.label}
                          onClick={() => { onAdd(v.factory()); setExpandedVariant(null); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all group/v"
                        >
                          <div className="text-left">
                            <p className="text-[12px] font-bold text-gray-800 group-hover/v:text-[#6344d4] transition-colors">{v.label}</p>
                            <p className="text-[10px] text-gray-400">{v.sub}</p>
                          </div>
                          <Plus size={12} className="text-gray-300 group-hover/v:text-[#6344d4] transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sections tab ──────────────────────────────────────────────────────────────

function SectionsTab({ onAdd, primaryColor }: { onAdd: (comp: ComponentDef) => void; primaryColor?: string }) {
  const { saved, remove }         = useSavedSections();
  const hasSaved                  = saved.length > 0;
  const allCats                   = [...(hasSaved ? [{ key: "saved", label: "My Sections" }] : []), ...CATEGORIES];
  const [cat, setCat]             = useState(hasSaved ? "saved" : CATEGORIES[0].key as string);
  const [preview, setPreview]     = useState<ComponentDef | null>(null);
  const [search, setSearch]       = useState("");

  const isSearching = search.trim().length > 0;
  const filtered    = isSearching
    ? COMPONENTS.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()) || c.categoryKey.toLowerCase().includes(search.toLowerCase()))
    : cat === "saved" ? saved : COMPONENTS.filter((c) => c.categoryKey === cat);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search sections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-gray-800 placeholder-gray-400 outline-none border-none"
          />
          {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={12} /></button>}
        </div>
      </div>

      {/* Category chips */}
      {!isSearching && (
        <div className="border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          <div className="flex px-4 gap-0.5 min-w-max py-2">
            {allCats.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  cat === c.key
                    ? c.key === "saved" ? "bg-[#6344d4] text-white" : "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {c.key === "saved" && <Bookmark size={10} />}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <LayoutGrid className="text-gray-200" size={28} />
            <p className="text-[13px] font-semibold text-gray-400">No sections found</p>
          </div>
        )}
        {filtered.map((comp) => (
          <div key={comp.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-all group">
            {cat !== "saved" ? (
              <div className="relative cursor-pointer" onClick={() => setPreview(comp)}>
                <SectionThumbnail comp={comp} primaryColor={primaryColor} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[11px] font-bold text-gray-900 shadow-lg">
                    <Eye size={12} /> Preview
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-14 bg-gradient-to-br from-[#6344d4]/10 to-purple-50 flex items-center justify-center">
                <Bookmark className="text-[#6344d4]/40" size={20} />
              </div>
            )}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{comp.label}</p>
                <p className="text-[10px] text-gray-400">{comp.description}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {cat === "saved" && (
                  <button onClick={() => remove(comp.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => onAdd(comp)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-black text-white text-[11px] font-bold rounded-lg hover:bg-gray-800 transition-all"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ width: 820, maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[14px] font-bold text-gray-900">{preview.label}</p>
                <p className="text-[11px] text-gray-400">{preview.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onAdd(preview); setPreview(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-gray-800 transition-all"
                >
                  <Plus size={13} /> Add to page
                </button>
                <button onClick={() => setPreview(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-all">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <div style={{ width: RENDER_W, transformOrigin: "top left", transform: `scale(${820 / RENDER_W})`, pointerEvents: "none" }}>
                <BlockPreview
                  blocks={[{ id: "prev", type: preview.blockType, content: preview.defaultContent, styles: preview.defaultStyles }]}
                  primaryColor={primaryColor ?? "#6344d4"}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Generate tab ───────────────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  "Create a hero section with headline and CTA buttons",
  "Add a 3-column services section",
  "Build a pricing table with 3 plans",
  "Add a team section with 4 members",
  "Create a full landing page for a SaaS app",
  "Build a contact form with name, email, and message",
];

function AiTab({ onGenerate }: { onGenerate: (prompt: string) => Promise<void> }) {
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      await onGenerate(q);
      setDone(true);
      setInput("");
      setTimeout(() => setDone(false), 2500);
    } catch {
      toast.error("Generation failed — please try again.", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header card */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100 rounded-2xl flex-shrink-0">
        <div className="w-10 h-10 bg-[#6344d4] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
          <Sparkles className="text-white" size={18} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-900">AI Page Builder</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">Describe what you want — AI generates it instantly.</p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex-shrink-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Quick Ideas</p>
        <div className="flex flex-col gap-1.5">
          {AI_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="w-full text-left px-3 py-2.5 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-xl hover:bg-purple-50/60 hover:border-[#6344d4]/20 hover:text-[#6344d4] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Input + button */}
      <div className="space-y-2 flex-shrink-0">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          disabled={loading}
          placeholder="e.g. Create a hero with a bold headline, subtitle, and two CTA buttons…"
          className="w-full resize-none px-3.5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[12px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6344d4]/20 focus:border-[#6344d4]/30 transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
            done
              ? "bg-green-500 text-white"
              : "bg-[#6344d4] text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
          ) : done ? (
            "Added to page ✓"
          ) : (
            <><Send size={14} /> Generate with AI</>
          )}
        </button>
        <p className="text-[10px] text-gray-400 text-center">Enter to generate · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ── My Designs tab ────────────────────────────────────────────────────────────

function MyDesignsTab({
  sections,
  onUse,
  components = [],
  onUseComponent,
  onDeleteComponent,
}: {
  sections: SavedSection[];
  onUse: (section: SavedSection) => void;
  components?: ProjectComponent[];
  onUseComponent?: (comp: ProjectComponent) => void;
  onDeleteComponent?: (id: string) => void;
}) {
  const [preview, setPreview] = useState<SavedSection | null>(null);
  const [copied, setCopied]   = useState<{ id: string; type: "html" | "css" } | null>(null);

  const copy = (text: string, id: string, type: "html" | "css") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ id, type });
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const componentsBlock = components.length > 0 && (
    <div className="mb-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Components ({components.length})</p>
      <div className="flex flex-col gap-1.5">
        {components.map((c) => (
          <div key={c.id} className="group flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-100 rounded-xl hover:border-[#6344d4]/40 transition-all">
            <span className="w-6 h-6 rounded-lg bg-[#6344d4]/10 text-[#6344d4] text-[10px] font-bold flex items-center justify-center flex-shrink-0">◆</span>
            <span className="flex-1 text-[12px] font-semibold text-gray-800 truncate">{c.name}</span>
            <button onClick={() => onUseComponent?.(c)}
              className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#6344d4] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              Place
            </button>
            {onDeleteComponent && (
              <button onClick={() => onDeleteComponent(c.id)} title="Delete component"
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-[13px] leading-none">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (sections.length === 0 && components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
          <Bookmark className="text-[#6344d4]/40" size={20} />
        </div>
        <p className="text-[13px] font-semibold text-gray-500">No designs yet</p>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Select a frame on the canvas and click<br />
          <span className="font-bold text-[#6344d4]">⚡ Convert to Section</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {componentsBlock}
      {sections.map((sec) => {
        const iframeDoc = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{overflow:hidden}${sec.css}</style></head><body>${sec.html}</body></html>`;
        const isCopiedHtml = copied?.id === sec.id && copied.type === "html";
        const isCopiedCss  = copied?.id === sec.id && copied.type === "css";

        return (
          <div key={sec.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-sm transition-all group">
            {/* Scaled iframe preview */}
            <div
              className="relative cursor-pointer overflow-hidden bg-gray-50"
              style={{ height: 140 }}
              onClick={() => setPreview(sec)}
            >
              <iframe
                srcDoc={iframeDoc}
                sandbox="allow-same-origin"
                style={{ overflow: "hidden",
                  position: "absolute", top: 0, left: 0,
                  width: sec.frameWidth ?? 1280,
                  height: sec.frameHeight ?? 800,
                  border: "none",
                  transformOrigin: "top left",
                  transform: `scale(${316 / (sec.frameWidth ?? 1280)})`,
                  pointerEvents: "none",
                }}
                title={sec.name}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[11px] font-bold text-gray-900 shadow-lg">
                  <Eye size={12} /> Preview
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{sec.name}</p>
                  {(sec.frameWidth || sec.frameHeight) && (
                    <p className="text-[10px] text-gray-400 font-mono">{sec.frameWidth}×{sec.frameHeight}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copy(sec.html, sec.id, "html")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isCopiedHtml ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-[#6344d4]"}`}
                >
                  {isCopiedHtml ? "✓ Copied!" : "Copy HTML"}
                </button>
                <button
                  onClick={() => copy(sec.css, sec.id, "css")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isCopiedCss ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-[#6344d4]"}`}
                >
                  {isCopiedCss ? "✓ Copied!" : "Copy CSS"}
                </button>
                <button
                  onClick={() => onUse(sec)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#6344d4] text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-all flex-shrink-0"
                >
                  <Plus size={10} /> Use
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Full preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ width: 820, maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[14px] font-bold text-gray-900">{preview.name}</p>
                {(preview.frameWidth || preview.frameHeight) && (
                  <p className="text-[11px] text-gray-400 font-mono">{preview.frameWidth}×{preview.frameHeight}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copy(preview.html, preview.id, "html")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Copy HTML
                </button>
                <button
                  onClick={() => copy(preview.css, preview.id, "css")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Copy CSS
                </button>
                <button onClick={() => setPreview(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-all">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-hidden flex-1 relative bg-gray-50" style={{ height: 600 }}>
              <iframe
                srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0}${preview.css}</style></head><body>${preview.html}</body></html>`}
                sandbox="allow-same-origin"
                style={{ width: "100%", height: "100%", border: "none" }}
                title={`Preview: ${preview.name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AddPanelProps {
  onAddElement:       (element: ElementNode) => void;
  onAddSection:       (comp: ComponentDef)   => void;
  onAiGenerate:       (prompt: string)       => Promise<void>;
  onClose:            () => void;
  primaryColor?:      string;
  defaultTab?:        "elements" | "sections" | "ai" | "designs";
  inline?:            boolean;
  onElementDragStart?: (type: string) => void;
  onElementDragEnd?:   () => void;
  savedSections?:     SavedSection[];
  onUseDesign?:       (section: SavedSection) => void;
  components?:        ProjectComponent[];
  onUseComponent?:    (comp: ProjectComponent) => void;
  onDeleteComponent?: (id: string) => void;
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "elements" | "sections" | "ai" | "designs";

export default function AddPanel({ onAddElement, onAddSection, onAiGenerate, onClose, primaryColor, defaultTab = "elements", inline = false, onElementDragStart, onElementDragEnd, savedSections = [], onUseDesign, components = [], onUseComponent, onDeleteComponent }: AddPanelProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "elements", label: "Elements", icon: <Box size={13} /> },
    { id: "sections", label: "Sections", icon: <LayoutGrid size={13} /> },
    { id: "ai",       label: "AI",       icon: <Sparkles size={13} /> },
    { id: "designs",  label: "Designs",  icon: <Bookmark size={13} /> },
  ];

  const panelContent = (
    <div className={inline ? "w-full h-full flex flex-col overflow-hidden bg-white" : "w-[360px] bg-white flex flex-col h-full shadow-2xl border-l border-gray-100"}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6344d4] rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
            <Plus className="text-white" size={15} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 leading-tight">Add to Page</h2>
            <p className="text-[10px] text-gray-400">Elements · Sections · AI-generated</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0 px-3 pt-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all relative ${
              tab === t.id ? "text-[#6344d4]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.icon}
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6344d4] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {tab === "elements" && <ElementsTab onAdd={(el) => { onAddElement(el); if (!inline) onClose(); }} onAddSaved={(el) => { onAddElement(el); if (!inline) onClose(); }} onDragStart={onElementDragStart} onDragEnd={onElementDragEnd} />}
        {tab === "sections" && <SectionsTab onAdd={(comp) => { onAddSection(comp); if (!inline) onClose(); }} primaryColor={primaryColor} />}
        {tab === "ai"       && <AiTab onGenerate={onAiGenerate} />}
        {tab === "designs"  && <MyDesignsTab sections={savedSections} onUse={(sec) => { onUseDesign?.(sec); if (!inline) onClose(); }} components={components} onUseComponent={(c) => { onUseComponent?.(c); if (!inline) onClose(); }} onDeleteComponent={onDeleteComponent} />}
      </div>
    </div>
  );

  if (inline) return panelContent;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      {panelContent}
    </div>
  );
}
