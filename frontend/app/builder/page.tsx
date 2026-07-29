"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Zap, Plus, Trash2, LogOut, RotateCcw,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, Blocks, Bot,
  Columns2, Eye, X, GripVertical, Monitor, Tablet, Smartphone,
  Share2, Send, History, Layout, Layers, Code2, Globe, Pencil, Download, Palette, Bookmark,
  Type, AlignLeft, Link2, List, Wand2, Search as SearchIcon,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast, Toaster } from "sonner";
import { withRetry } from "@/lib/retry";
import { apiFetchJson } from "@/lib/api";
import ErrorBoundary from "./ErrorBoundary";
import BlockPreview from "./_components/BlockPreview";
import BlockEditorPanel from "./_components/BlockEditorPanel";
import ExportModal from "./_components/ExportModal";
import { SeoModal, ThemeModal, type PageSeo, type AiTheme } from "./_components/AiModals";
import FreeCanvas from "./_components/FreeCanvas";
import AddPanel, { createElement } from "./_components/AddPanel";
import StylesPanel from "./_components/StylesPanel";
import FrameComponent from "./_components/Frame";
import FrameContent from "./_components/FrameContent";
import CanvasPropertiesPanel from "./_components/CanvasPropertiesPanel";
import CanvasLayersPanel from "./_components/CanvasLayersPanel";
import ConvertModal from "./_components/ConvertModal";
import { ColorSwatchButton } from "./_components/ColorPicker";
import FramePropertiesPanel from "./_components/FramePropertiesPanel";
import { parseFigmaClipboard, svgToElement, imageToElement } from "@/lib/parseFigmaClipboard";
import { BLOCK_FIELDS, ITEM_FIELDS, ITEM_ARRAY_KEY, type ComponentDef, type BlockStyles } from "@/lib/builderComponents";
import type { ElementNode, StyleClass, SiteTokens, FreeLayout, Frame, CanvasTool, SavedSection, ProjectComponent } from "@/types/builder";
import { FRAME_PRESETS } from "@/types/builder";
import { frameToElements } from "@/lib/frameToElements";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Block   { id: string; type: string; content: Record<string, unknown>; styles?: BlockStyles; }
interface Page    { id: string; name: string; slug: string; blocks: Block[]; elements?: ElementNode[]; classes?: StyleClass[]; tokens?: SiteTokens; seo?: PageSeo; }
interface Project {
  _id: string; businessName: string; tagline: string;
  primaryColor: string; package: "starter" | "pro";
  status: "empty" | "generating" | "ready"; pages: Page[]; prompt?: string;
  classes?: StyleClass[]; tokens?: SiteTokens;
  canvasMode?: "flow" | "free";
  generatedAt?: string; updatedAt?: string;
}

type View = "loading" | "no-auth" | "choose" | "prompt" | "wizard" | "generating" | "manual-setup" | "editor";

const BUSINESS_TYPES = [
  "Restaurant / Cafe", "Retail Shop", "Photography", "Freelancer / Agency",
  "Healthcare", "Education", "Real Estate", "Beauty / Salon", "Gym / Fitness", "Other",
];

const PALETTES = [
  { label: "Ocean",   primary: "#2563eb" },
  { label: "Forest",  primary: "#16a34a" },
  { label: "Sunset",  primary: "#ea580c" },
  { label: "Berry",   primary: "#7c3aed" },
  { label: "Slate",   primary: "#334155" },
  { label: "Midnight",primary: "#0f172a" },
];

interface WizardData {
  businessName: string;
  businessType: string;
  description:  string;
  primaryColor: string;
  theme:        "dark" | "light" | "bold" | "minimal";
}

const LOADING_MSGS = [
  "Analyzing your business...", "Crafting page structure...",
  "Writing professional content...", "Assembling your website...", "Almost ready...",
];


const HINTS = [
  "We're a family-run Italian restaurant in Lahore. Authentic pasta, pizza, and desserts — dine-in and takeaway.",
  "Freelance photography studio for weddings and corporate events based in Islamabad. Want to showcase portfolio and take bookings.",
  "Digital marketing agency in Karachi helping SMEs grow through SEO, social media, and paid advertising.",
];

// ── Element tree helpers (for V2 iframe canvas) ──────────────────────────────

function findElementById(elements: ElementNode[], id: string): ElementNode | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children.length > 0) { const f = findElementById(el.children, id); if (f) return f; }
  }
  return null;
}

function deleteFromTree(elements: ElementNode[], id: string): ElementNode[] {
  return elements.filter((el) => el.id !== id).map((el) => ({ ...el, children: deleteFromTree(el.children, id) }));
}

function addChildInTree(elements: ElementNode[], parentId: string, child: ElementNode): ElementNode[] {
  return elements.map((el) => {
    if (el.id === parentId) return { ...el, children: [...el.children, child] };
    return { ...el, children: addChildInTree(el.children, parentId, child) };
  });
}

function tryInsertNear(elements: ElementNode[], refId: string, newEl: ElementNode, position: "before" | "after"): ElementNode[] | null {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === refId) {
      const result = [...elements];
      result.splice(position === "before" ? i : i + 1, 0, newEl);
      return result;
    }
  }
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].children.length > 0) {
      const newChildren = tryInsertNear(elements[i].children, refId, newEl, position);
      if (newChildren !== null) {
        const result = [...elements];
        result[i] = { ...result[i], children: newChildren };
        return result;
      }
    }
  }
  return null;
}

function insertElementNear(elements: ElementNode[], refId: string | null, newEl: ElementNode, position: "before" | "after" | "inside" | "append"): ElementNode[] {
  if (!refId || position === "append") return [...elements, newEl];
  if (position === "inside") return addChildInTree(elements, refId, newEl);
  return tryInsertNear(elements, refId, newEl, position as "before" | "after") ?? [...elements, newEl];
}

const SAVED_SECTIONS_KEY  = "lhrweb_saved_sections";
const SAVED_ELEMENTS_KEY  = "lhrweb_saved_elements";

function saveSection(block: Block, name: string) {
  const existing: unknown[] = JSON.parse(localStorage.getItem(SAVED_SECTIONS_KEY) ?? "[]");
  const entry = { id: `custom-${Date.now()}`, label: name, category: "My Sections", categoryKey: "saved", blockType: block.type, defaultContent: block.content, defaultStyles: block.styles };
  localStorage.setItem(SAVED_SECTIONS_KEY, JSON.stringify([entry, ...existing]));
}

function saveElementComponent(el: ElementNode, name: string) {
  const existing: unknown[] = JSON.parse(localStorage.getItem(SAVED_ELEMENTS_KEY) ?? "[]");
  const entry = { id: `cel-${Date.now()}`, name, tree: el };
  localStorage.setItem(SAVED_ELEMENTS_KEY, JSON.stringify([entry, ...existing]));
}


function updateElementInTree(elements: ElementNode[], id: string, updater: (el: ElementNode) => ElementNode): ElementNode[] {
  return elements.map((el) => {
    if (el.id === id) return updater(el);
    if (el.children.length > 0) return { ...el, children: updateElementInTree(el.children, id, updater) };
    return el;
  });
}

function updateElementContent(elements: ElementNode[], id: string, content: string): ElementNode[] {
  return updateElementInTree(elements, id, (el) => ({ ...el, content }));
}

function updateElementStyle(elements: ElementNode[], id: string, breakpoint: "desktop" | "tablet" | "mobile", property: string, value: string): ElementNode[] {
  return updateElementInTree(elements, id, (el) => ({
    ...el,
    styles: {
      ...el.styles,
      [breakpoint]: { ...(el.styles[breakpoint] || {}), [property]: value || undefined },
    },
  }));
}

function updateElementLayout(elements: ElementNode[], id: string, layout: Partial<FreeLayout>): ElementNode[] {
  return updateElementInTree(elements, id, (el) => ({
    ...el,
    layout: { ...(el.layout ?? { x: 0, y: 0, width: 400 }), ...layout } as FreeLayout,
  }));
}



// ── Main page ─────────────────────────────────────────────────────────────────

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
`;

// ── Convert a flow Block → ElementNode[] for Free-mode editing ───────────────

function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function blockToElements(block: Block): ElementNode[] {
  const fields       = BLOCK_FIELDS[block.type]   ?? [];
  const itemArrayKey = ITEM_ARRAY_KEY[block.type]  ?? null;
  const items        = itemArrayKey && Array.isArray(block.content[itemArrayKey])
    ? (block.content[itemArrayKey] as Record<string, unknown>[])
    : [];
  const itemFields   = ITEM_FIELDS[block.type]    ?? [];

  const TITLE_KEYS = new Set(["heading","title","headline","name","siteName","logoText","companyName"]);
  const sectionChildren: ElementNode[] = [];

  for (const f of fields) {
    if (f.type === "nav-items" || f.type === "url") continue;
    const val = String(block.content[f.key] ?? "").trim();
    if (!val) continue;
    const isTitle = TITLE_KEYS.has(f.key);
    sectionChildren.push({
      id: genId(),
      tag: isTitle ? "h2" : "p",
      content: val,
      children: [],
      styles: {
        desktop: {
          fontSize: isTitle ? "40px" : "18px",
          fontWeight: isTitle ? "700" : "400",
          color: isTitle ? "#111111" : "#555555",
          marginBottom: "16px",
          lineHeight: isTitle ? "1.2" : "1.6",
        },
      },
    });
  }

  if (items.length > 0 && itemFields.length > 0) {
    const NAME_KEYS = ["title","name","question","plan","step","value"];
    const itemEls: ElementNode[] = items.map((item) => {
      const nameKey = NAME_KEYS.find((k) => item[k]);
      const cardChildren: ElementNode[] = [];
      if (nameKey && item[nameKey]) {
        cardChildren.push({
          id: genId(), tag: "h3", content: String(item[nameKey]),
          children: [],
          styles: { desktop: { fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#111111" } },
        });
      }
      for (const f of itemFields) {
        if (f.key === nameKey || !String(item[f.key] ?? "").trim()) continue;
        cardChildren.push({
          id: genId(), tag: "p", content: String(item[f.key]),
          children: [],
          styles: { desktop: { fontSize: "14px", color: "#555555", lineHeight: "1.5" } },
        });
      }
      return {
        id: genId(), tag: "div" as const, children: cardChildren,
        styles: { desktop: { padding: "24px", border: "1px solid #e5e7eb", borderRadius: "12px", backgroundColor: "#ffffff" } },
      };
    });
    const cols = items.length === 1 ? "1fr" : items.length === 2 ? "1fr 1fr" : "repeat(3, 1fr)";
    sectionChildren.push({
      id: genId(), tag: "div", children: itemEls,
      styles: { desktop: { display: "grid", gridTemplateColumns: cols, gap: "24px", marginTop: "32px", width: "100%" } },
    });
  }

  return [{
    id: genId(),
    tag: "section",
    label: BLOCK_LABELS[block.type] ?? block.type,
    children: sectionChildren,
    styles: { desktop: { width: "100%", padding: "80px 64px", backgroundColor: "#ffffff" } },
  }];
}

// ── Section row (clean list item replacing the old BlockCard accordion) ───────

const BLOCK_LABELS: Record<string, string> = {
  header: "Header", hero: "Hero Banner", about: "About", services: "Services",
  features: "Features", whyus: "Why Us", testimonials: "Testimonials", team: "Team",
  gallery: "Gallery", pricing: "Pricing", faq: "FAQ", cta: "CTA Banner",
  contact: "Contact", footer: "Footer", statement: "Statement",
};

function fieldIcon(type: string) {
  if (type === "textarea") return <AlignLeft size={9} />;
  if (type === "url")      return <Link2 size={9} />;
  if (type === "nav-items") return <List size={9} />;
  return <Type size={9} />;
}

function SectionRow({
  block, index, total, isSelected, isRegenerating, onSelect, onDelete, onMove, onRegen, onSave, onCustomize,
}: {
  block: Block; index: number; total: number; isSelected: boolean; isRegenerating: boolean;
  onSelect: () => void; onDelete: () => void; onMove: (dir: "up" | "down") => void; onRegen: () => void;
  onSave?: () => void; onCustomize?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const fields      = BLOCK_FIELDS[block.type] ?? [];
  const itemArrayKey = ITEM_ARRAY_KEY[block.type] ?? null;
  const itemFields  = ITEM_FIELDS[block.type]   ?? [];
  const items       = itemArrayKey && Array.isArray(block.content[itemArrayKey])
    ? block.content[itemArrayKey] as Record<string, unknown>[]
    : [];

  const navField    = fields.find((f) => f.type === "nav-items");
  const navItems    = navField && Array.isArray(block.content[navField.key])
    ? block.content[navField.key] as { label: string; href?: string }[]
    : [];
  const contentFields = fields.filter((f) => f.type !== "nav-items" && f.type !== "url" && String(block.content[f.key] ?? "").trim());

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {/* ── Header row ── */}
      <div
        onClick={onSelect}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
          isSelected
            ? "border-[#6344d4] bg-purple-50/40 shadow-sm"
            : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <button
          {...attributes} {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          onClick={(e) => e.stopPropagation()} tabIndex={-1}
        >
          <GripVertical size={13} />
        </button>

        <button
          className="p-0.5 text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          tabIndex={-1}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <span className={`w-6 h-6 text-white text-[9px] font-bold rounded-lg flex items-center justify-center uppercase flex-shrink-0 transition-colors ${isSelected ? "bg-[#6344d4]" : "bg-gray-700"}`}>
          {block.type[0]}
        </span>

        <span className="flex-1 text-[12px] font-semibold text-gray-700 truncate">
          {BLOCK_LABELS[block.type] ?? block.type}
        </span>

        {isRegenerating && (
          <div className="w-3.5 h-3.5 border-2 border-[#6344d4] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}

        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onCustomize && (
            <button onClick={onCustomize} title="Convert to free elements to edit layout" className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-300 hover:text-indigo-500 transition-all">
              <Wand2 size={12} />
            </button>
          )}
          <button onClick={onSave} title="Save as template" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-all">
            <Bookmark size={12} />
          </button>
          <button onClick={onRegen} title="Regenerate with AI" className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-300 hover:text-purple-500 transition-all">
            <Sparkles size={12} />
          </button>
          <button onClick={() => onMove("up")} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-all">
            <ArrowUp size={12} />
          </button>
          <button onClick={() => onMove("down")} disabled={index === total - 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-all">
            <ArrowDown size={12} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ── Expanded child tree ── */}
      {expanded && (
        <div className="ml-8 mt-0.5 mb-1 border-l-2 border-gray-100 pl-3 space-y-0.5">
          {/* Content fields */}
          {contentFields.map((f) => (
            <div
              key={f.key}
              onClick={onSelect}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group/field"
            >
              <span className="text-gray-300 flex-shrink-0">{fieldIcon(f.type)}</span>
              <span className="text-[10px] font-semibold text-gray-500 w-[52px] flex-shrink-0 truncate">{f.label}</span>
              <span className="text-[10px] text-gray-400 truncate flex-1">
                {String(block.content[f.key] ?? "").slice(0, 35)}
              </span>
            </div>
          ))}

          {/* Nav items */}
          {navField && navItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-gray-300 flex-shrink-0"><List size={9} /></span>
                <span className="text-[10px] font-semibold text-gray-500">Nav ({navItems.length})</span>
              </div>
              {navItems.map((item, i) => (
                <div
                  key={i}
                  onClick={onSelect}
                  className="flex items-center gap-2 pl-5 pr-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-[9px] text-gray-300">–</span>
                  <span className="text-[10px] text-gray-500 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Item arrays (services, FAQ, etc.) */}
          {itemArrayKey && items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-gray-300 flex-shrink-0"><List size={9} /></span>
                <span className="text-[10px] font-semibold text-gray-500">
                  {itemFields[0]?.label ? `Items` : itemArrayKey} ({items.length})
                </span>
              </div>
              {items.slice(0, 6).map((item, i) => (
                <div
                  key={i}
                  onClick={onSelect}
                  className="flex items-center gap-2 pl-5 pr-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-[9px] text-gray-300">–</span>
                  <span className="text-[10px] text-gray-500 truncate">
                    {String(item.title ?? item.name ?? item.question ?? item.plan ?? `Item ${i + 1}`).slice(0, 28)}
                  </span>
                </div>
              ))}
              {items.length > 6 && (
                <div className="pl-5 py-0.5 text-[9px] text-gray-400">+{items.length - 6} more</div>
              )}
            </div>
          )}

          {contentFields.length === 0 && navItems.length === 0 && items.length === 0 && (
            <div className="px-2 py-1.5 text-[10px] text-gray-400 italic">No content fields</div>
          )}
        </div>
      )}
    </div>
  );
}

function BuilderContent() {
  const searchParams = useSearchParams();
  const pageIdParam  = searchParams.get("pageId");
  const projectIdParam = searchParams.get("projectId");

  const [view, setView]           = useState<View>("loading");
  const [token, setToken]         = useState("");
  const [pkg, setPkg]             = useState("starter");
  const [project, setProject]     = useState<Project | null>(null);

  const [prompt, setPrompt]       = useState("");
  const [aiTheme, setAiTheme]     = useState<"dark" | "light" | "bold" | "minimal">("dark");

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    businessName: "", businessType: "", description: "",
    primaryColor: "#2563eb", theme: "light",
  });
  const [msgIdx, setMsgIdx]       = useState(0);
  // Round 5 Ch 5.1 — real per-page progress from the generation job
  const [genProgress, setGenProgress] = useState<{ name: string; status: string }[] | null>(null);

  // Manual setup
  const [manualName, setManualName]   = useState("");
  const [manualTag, setManualTag]     = useState("");
  const [manualColor, setManualColor] = useState("#000000");
  const [initSaving, setInitSaving]   = useState(false);

  // ── Crash Recovery (Ch 1.5) ──────────────────────────────────────────────────
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<{ elements?: ElementNode[]; frames?: Frame[]; timestamp: number } | null>(null);

  // ── Save Failure Recovery (ER-01, Ch 1.2) ────────────────────────────────────
  const [saveFailed, setSaveFailed] = useState(false);
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const saveAbortRef = useRef<AbortController | null>(null);

  // ── Project Load Error (Ch 1.1) ──────────────────────────────────────────────
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Recovery key prefix ──────────────────────────────────────────────────────
  const recoveryKey = (pid?: string) => `lhrweb_recovery_${project?._id ?? pid ?? "unknown"}`;

  // ── Write recovery snapshot to localStorage (on save failure) ────────────────
  // Must be called with current elements/frames values (closure-safe via refs)
  const elementsForRecovery = useRef<ElementNode[]>([]);
  const framesForRecovery = useRef<Frame[]>([]);
  const writeRecoverySnapshot = useCallback((els?: ElementNode[], frs?: Frame[]) => {
    try {
      const snapshot = {
        elements: els ?? elementsForRecovery.current,
        frames: frs ?? framesForRecovery.current,
        timestamp: Date.now(),
      };
      const json = JSON.stringify(snapshot);
      if (json.length > 4_000_000) return;
      localStorage.setItem(recoveryKey(), json);
    } catch { /* localStorage full or unavailable */ }
  }, [recoveryKey]);

  // ── Clear recovery snapshot (on successful save) ─────────────────────────────
  const clearRecoverySnapshot = useCallback(() => {
    try { localStorage.removeItem(recoveryKey()); } catch {}
  }, [recoveryKey]);

  // ── Check for recovery on editor load ────────────────────────────────────────
  const checkRecovery = useCallback((projectId: string, updatedAt: string) => {
    try {
      const raw = localStorage.getItem(`lhrweb_recovery_${projectId}`);
      if (!raw) return;
      const snapshot = JSON.parse(raw);
      if (snapshot.timestamp > new Date(updatedAt).getTime()) {
        setRecoverySnapshot(snapshot);
        setShowRecovery(true);
      }
    } catch { /* corrupt recovery data — ignore */ }
  }, []);

  // ── Undo / Redo history ───────────────────────────────────────────────────────
  const [blocks, setBlocksRaw]  = useState<Block[]>([]);
  const [past, setPast]         = useState<Block[][]>([]);
  const [future, setFuture]     = useState<Block[][]>([]);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const lastHistoryTime = useRef(0);

  // setBlocks — tracks history; supports both value and functional updates
  // Auto-debounces: rapid changes within 1.5s replace the last history entry
  const setBlocks = useCallback((valOrFn: Block[] | ((prev: Block[]) => Block[])) => {
    setBlocksRaw(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      setPast(p => {
        const now = Date.now();
        if (p.length > 0 && now - lastHistoryTime.current < 1500) {
          lastHistoryTime.current = now;
          return [...p.slice(0, -1), prev];
        }
        lastHistoryTime.current = now;
        return [...p.slice(-50), prev];
      });
      setFuture([]);
      return next;
    });
  }, []);

  // resetBlocks — for page switches; clears history. Canvas-type blocks are dropped.
  const resetBlocks = useCallback((newBlocks: Block[]) => {
    setBlocksRaw(newBlocks.filter((b) => b.type !== "canvas"));
    setPast([]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setBlocksRaw(curr => { setFuture(f => [curr, ...f]); return previous; });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setBlocksRaw(curr => { setPast(p => [...p, curr]); return next; });
      return f.slice(1);
    });
  }, []);

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [showExport, setShowExport]           = useState(false);
  const [addPanelTab, setAddPanelTab]         = useState<"elements" | "sections" | "ai">("elements");
  const [newPageName, setNewPageName]         = useState("");
  const [showAddPage, setShowAddPage]         = useState(false);
  const [renamingPageId, setRenamingPageId]   = useState<string | null>(null);
  const [renameInput, setRenameInput]         = useState("");
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [previewMode, setPreviewMode]         = useState<"none" | "split" | "full">("none");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId]       = useState<string | null>(null);
  const [previewDevice, setPreviewDevice]     = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab]             = useState<"ai" | "design" | "layers" | "styles" | "add" | "assets" | null>("ai");

  const [panelDragType, setPanelDragType]         = useState<string | null>(null);
  const [saveModal, setSaveModal] = useState<{ type: "section" | "element"; data: Block | ElementNode } | null>(null);
  const [saveName, setSaveName]   = useState("");
  const canvasIframeRef   = useRef<HTMLIFrameElement | null>(null);
  const dropResolveRef    = useRef<((r: { id: string | null; position: string }) => void) | null>(null);
  // V2 iframe canvas state
  const [elements, setElements]                   = useState<ElementNode[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasViewport, setCanvasViewport]       = useState<"desktop" | "tablet" | "mobile">("desktop");
const [classes, setClasses]                     = useState<StyleClass[]>([]);
  const [components, setComponents]               = useState<ProjectComponent[]>([]);
  const [tokens, setTokens]                       = useState<SiteTokens>({ colors: [], fonts: [], spacing: {} });
  const [canvasMode, setCanvasModeState]          = useState<"flow" | "free">("flow");
  const [freeSelectedIds, setFreeSelectedIds]     = useState<string[]>([]);
  // Phase 3 — Figma-like frames
  const [frames, setFrames]                       = useState<Frame[]>([]);
  elementsForRecovery.current = elements;
  framesForRecovery.current = frames;
  const [selectedFrameId, setSelectedFrameId]     = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom]               = useState(0.75);
  // Phase 4 — active canvas tool (lifted from FreeCanvas)
  const [activeTool, setActiveTool]               = useState<CanvasTool>("move");
  // Phase 5/6 — elements selected inside a frame (multi-select)
  const [selectedFrameElementIds, setSelectedFrameElementIds] = useState<string[]>([]);
  // Phase 9 — saved sections + convert modal
  const [savedSections, setSavedSections] = useState<SavedSection[]>([]);
  const [convertingFrame, setConvertingFrame] = useState<Frame | null>(null);
  const [chatInput, setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; role: string; text: string; meta?: string }[]>([
    { id: 1, role: "assistant", text: "Hi! Describe what you want on this page and I'll generate the sections for you. For example: \"Create a services page for a photography studio\" or \"Add a pricing section with 3 plans\"." },
  ]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Internal paste fallback ref (set by FreeCanvas) ──────────────────────────
  const internalPasteRef = useRef<(() => void) | null>(null);

  // Keep latest state in refs so the paste handler (registered once) always
  // sees current values without needing to re-register on every render.
  const selectedFrameIdRef = useRef<string | null>(null);
  const framesRef = useRef<Frame[]>([]);
  selectedFrameIdRef.current = selectedFrameId;
  framesRef.current = frames;

  // ── Global Figma / SVG / image paste listener ─────────────────────────────────
  //
  // e.clipboardData.getData() does NOT reliably return custom MIME types
  // (e.g. application/vnd.figma.clipboard.v4+json) in Chromium, because the
  // target element is not contentEditable.  The fix: use navigator.clipboard.read()
  // which returns ALL clipboard formats as ClipboardItem blobs.  It is called
  // within the paste event handler, so Chrome grants clipboard-read automatically.
  //
  useEffect(() => {
    const FIGMA_TYPES = [
      "application/vnd.figma.clipboard.v5+json",
      "application/vnd.figma.clipboard.v4+json",
      "application/vnd.figma.clipboard.v3+json",
      "application/vnd.figma.clipboard.v2+json",
      "application/vnd.figma.clipboard+json",
    ];

    const handler = async (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const cd = e.clipboardData;

      // ── 1. Images (e.clipboardData.files works in all browsers) ──────────
      const imageFile = Array.from(cd?.files ?? []).find(f => f.type.startsWith("image/")) ?? null;

      // ── 2. Read custom MIME types (Figma JSON + SVG) via navigator.clipboard ──
      // navigator.clipboard.read() returns all clipboard formats, including
      // types that getData() cannot access on non-contentEditable targets.
      let figmaEls: ElementNode[] | null = null;
      let svgEl: ElementNode | null = null;

      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          // Figma JSON
          if (!figmaEls?.length) {
            for (const mime of FIGMA_TYPES) {
              if (item.types.includes(mime)) {
                const text = await (await item.getType(mime)).text();
                figmaEls = parseFigmaClipboard(JSON.parse(text));
                break;
              }
            }
          }
          // SVG from image/svg+xml type
          if (!svgEl && item.types.includes("image/svg+xml")) {
            svgEl = svgToElement(await (await item.getType("image/svg+xml")).text());
          }
        }
      } catch { /* navigator.clipboard unavailable or denied — fall back below */ }

      // ── 3. SVG fallback from e.clipboardData (text/plain contains <svg...>) ──
      if (!figmaEls?.length && !svgEl && cd) {
        const svgDirect = cd.getData("image/svg+xml")?.trim() ?? "";
        const textPlain = cd.getData("text/plain")?.trim()    ?? "";
        const svgRaw    = svgDirect || (textPlain.startsWith("<svg") ? textPlain : "");
        if (svgRaw) svgEl = svgToElement(svgRaw);
      }

      // ── 4. Nothing external — fall back to builder-internal clipboard ─────
      if (!figmaEls?.length && !svgEl && !imageFile) {
        internalPasteRef.current?.();
        return;
      }

      e.preventDefault();

      // ── 5. Assemble result ────────────────────────────────────────────────
      let els: ElementNode[] | null = figmaEls;
      if (!els?.length && svgEl) els = [svgEl];
      if (!els?.length && imageFile) {
        const el = await imageToElement(imageFile);
        if (el) els = [el];
      }
      if (!els?.length) { internalPasteRef.current?.(); return; }

      // ── 6. Route to correct destination ──────────────────────────────────
      const frameId = selectedFrameIdRef.current;
      const frame   = frameId ? framesRef.current.find(f => f.id === frameId) : null;

      if (frame) {
        const off = frame.children.length * 8;
        const positioned = els.map(el => ({
          ...el,
          layout: el.layout
            ? { ...el.layout, x: (el.layout.x ?? 0) + off, y: (el.layout.y ?? 0) + off }
            : { x: 20 + off, y: 20 + off, width: 200, height: 100 },
        }));
        handleUpdateFrameChildren(frame.id, [...frame.children, ...positioned]);
      } else {
        setElements(prev => [...prev, ...els!]);
        setSelectedElementId(els![0]?.id ?? null);
      }
      setSaved(false);
    };

    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  // Register once; uses refs for mutable state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth + load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const t    = localStorage.getItem("token")   ?? "";
      const role = localStorage.getItem("role")    ?? "";
      const p    = localStorage.getItem("package") ?? "starter";
      setToken(t); setPkg(p);
      if (!t || (role !== "builder" && role !== "admin" && p !== "builder")) { setView("no-auth"); return; }

      const isNew = searchParams.get("new") === "true";
      if (isNew) { setView("choose"); return; }

      const targetUrl = projectIdParam 
        ? `${API}/api/builder/project?projectId=${projectIdParam}`
        : `${API}/api/builder/project`;

      try {
        const res = await withRetry(() => fetch(targetUrl, {
          headers: { Authorization: `Bearer ${t}` },
          signal: AbortSignal.timeout(15000),
        }), { retries: 2, delays: [2000, 5000], retryOn: [0, 500, 502, 503] });

        if (cancelled) return;

        // Handle HTTP errors
        if (res.status === 404) {
          setLoadError("not-found");
          return;
        }
        if (res.status === 403) {
          setLoadError("forbidden");
          return;
        }

        let data: Project | null = null;
        try {
          data = await res.json();
        } catch {
          // Corrupt JSON — enter editor with warning
          setLoadError("corrupt");
          return;
        }

        if (!data) { setView("choose"); return; }

        if (data.status === "generating") {
          const stuck = !data.generatedAt && data.updatedAt && 
            (Date.now() - new Date(data.updatedAt).getTime()) > 300_000; // 5 min
          if (stuck) {
            setProject(data);
            setLoadError("stuck-generation");
            return;
          }
        }

        if (data.status === "ready" && data.pages.length > 0) {
          setProject(data);
          const targetId = pageIdParam && data.pages.find(p => p.id === pageIdParam) 
            ? pageIdParam 
            : data.pages[0].id;
          enterEditor(data, targetId);
          checkRecovery(data._id, data.updatedAt ?? "");
        } else if (data.status === "empty" || data.status === "generating") {
          setView("choose");
        } else {
          setView("choose");
        }
      } catch (err) {
        if (cancelled) return;
        // Network down / timeout
        if (err instanceof DOMException && err.name === "TimeoutError") {
          setLoadError("timeout");
        } else {
          setLoadError("network");
        }
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdParam, projectIdParam]);

  const enterEditor = useCallback((proj: Project, pageId: string) => {
    const page = proj.pages.find((p) => p.id === pageId);
    setSelectedId(pageId);
    resetBlocks(page?.blocks ?? []);
    setElements(page?.elements ?? []);
    setSelectedElementId(null);
    setClasses(proj.classes ?? []);
    setComponents(((proj as any).components ?? []) as ProjectComponent[]);
    setTokens({ colors: proj.tokens?.colors ?? [], fonts: proj.tokens?.fonts ?? [], spacing: proj.tokens?.spacing ?? {} });
    setCanvasModeState(proj.canvasMode ?? "flow");
    setFrames((proj as any).canvasState?.frames ?? []);
    setSavedSections((proj as any).savedSections ?? []);
    setSelectedFrameId(null);
    setFreeSelectedIds([]);
    setSaved(false);
    setView("editor");
    setActiveTab(proj.prompt ? "ai" : "design");
    setEditingBlockId(null);
  }, [resetBlocks]);

  const selectPage = useCallback((proj: Project, pageId: string, force = false) => {
    if (!force && !saved && selectedId) {
      const proceed = confirm("You have unsaved changes on this page. Switch anyway?");
      if (!proceed) return;
    }
    const page = proj.pages.find((p) => p.id === pageId);
    setSelectedId(pageId);
    resetBlocks(page?.blocks ?? []);
    setElements(page?.elements ?? []);
    setSelectedElementId(null);
    setClasses(proj.classes ?? []);
    setComponents(((proj as any).components ?? []) as ProjectComponent[]);
    setTokens({ colors: proj.tokens?.colors ?? [], fonts: proj.tokens?.fonts ?? [], spacing: proj.tokens?.spacing ?? {} });
    setCanvasModeState(proj.canvasMode ?? "flow");
    setFreeSelectedIds([]);
    setSaved(false);
    setEditingBlockId(null);
  }, [resetBlocks, saved, selectedId]);

  // ── AI generate (Round 5 Ch 5.1 — async job + status polling) ───────────────
  const generateSite = async (builtPrompt: string, theme: string): Promise<Project> => {
    const res = await fetch(`${API}/api/builder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: builtPrompt, theme }),
    });
    const start = await res.json();
    if (!res.ok) {
      if (start?.code === "QUOTA_EXCEEDED") throw new Error("Monthly AI quota exceeded. Upgrade your plan or try next month.");
      throw new Error(start?.message || "Generation failed");
    }

    // poll job status every 2s (max 5 min)
    const deadline = Date.now() + 5 * 60_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const sRes = await fetch(`${API}/api/builder/generate/status/${start.jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!sRes.ok) continue;
        const s = await sRes.json();
        if (Array.isArray(s.pages) && s.pages.length) setGenProgress(s.pages);
        if (s.phase === "done" && s.project) {
          setGenProgress(null);
          if (s.usedTemplateFallback) {
            toast("AI was unavailable, so we started you from a template — everything is editable.", { duration: 6000 });
          }
          return s.project as Project;
        }
        if (s.phase === "failed") {
          setGenProgress(null);
          throw new Error(s.error || "Generation failed");
        }
      } catch (e) {
        if (e instanceof Error && e.message !== "Failed to fetch") throw e;
        // transient network blip — keep polling
      }
    }
    setGenProgress(null);
    throw new Error("Generation timed out. Please try again.");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setView("generating"); setMsgIdx(0); setGenProgress(null);
    const iv = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MSGS.length);
    }, 4000);
    try {
      const data = await generateSite(prompt, aiTheme);
      setProject(data);
      enterEditor(data, data.pages[0].id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed. Please try again.", { duration: 5000 });
      setView("prompt");
    } finally { clearInterval(iv); setGenProgress(null); }
  };

  // ── Manual init ─────────────────────────────────────────────────────────────
  const handleManualInit = async () => {
    setInitSaving(true);
    try {
      const res  = await fetch(`${API}/api/builder/init-manual`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName: manualName, tagline: manualTag, primaryColor: manualColor }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Project = await res.json();
      setProject(data);
      enterEditor(data, data.pages[0].id);
    } catch { toast.error("Failed to set up project. Please try again.", { duration: 5000 }); }
    finally { setInitSaving(false); }
  };

  // ── Save page ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedId || saving || !project) return;
    setSaving(true);
    setSaveFailed(false);
    setSaveRetryCount(0);

    // Abort any still-in-flight save (unmount / a stale retry) before starting a new one
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;
    const { signal } = controller;

    const saveOp = async () => {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const projectQ = `projectId=${project._id}`;

      // In free mode with no explicit flow elements, auto-sync the matching frame
      let elementsToSave = elements;
      if (canvasMode === "free" && frames.length > 0 && elements.length === 0) {
        const currentPage = project.pages?.find((p: { id: string }) => p.id === selectedId);
        const pageName = currentPage?.name ?? "";
        const matched = frames.find(f => f.name.toLowerCase().trim() === pageName.toLowerCase().trim()) ?? frames[0];
        elementsToSave = frameToElements(matched.children, matched.width);
      }

      // Save page (blocks + elements)
      const pageRes = await fetch(`${API}/api/builder/project/pages/${selectedId}?${projectQ}`, {
        method: "PUT", headers, signal,
        body: JSON.stringify({ blocks, elements: elementsToSave }),
      });
      if (!pageRes.ok) {
        const body = await pageRes.text();
        const err = new Error(body);
        (err as any).status = pageRes.status;
        throw err;
      }
      const updated: Project = await pageRes.json();

      // Save classes, tokens, and canvas mode in parallel
      const results = await Promise.allSettled([
        fetch(`${API}/api/builder/project/components?${projectQ}`, {
          method: "PUT", headers, signal, body: JSON.stringify({ components, projectId: project._id }),
        }),
        fetch(`${API}/api/builder/project/classes?${projectQ}`, {
          method: "PUT", headers, signal, body: JSON.stringify({ classes }),
        }),
        fetch(`${API}/api/builder/project/tokens?${projectQ}`, {
          method: "PUT", headers, signal, body: JSON.stringify({ tokens }),
        }),
        fetch(`${API}/api/builder/project/settings?${projectQ}`, {
          method: "PUT", headers, signal, body: JSON.stringify({ canvasMode, canvasState: { frames } }),
        }),
      ]);

      // If any parallel save failed, treat the whole save as failed
      for (const r of results) {
        if (r.status === "rejected") throw r.reason;
        if (!r.value.ok) {
          const bodyErr = new Error(await r.value.text());
          (bodyErr as any).status = r.value.status;
          throw bodyErr;
        }
      }

      setProject({ ...updated, classes, tokens, canvasMode });
    };

    try {
      await withRetry(saveOp, {
        retries: 3,
        delays: [2000, 5000, 15000],
        retryOn: [0, 500, 502, 503],
      });

      // Success
      setSaved(true);
      setSaveFailed(false);
      clearRecoverySnapshot();
      toast.success("Saved", { duration: 2500 });
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      // A deliberate abort (unmount, or superseded by a newer save) is not a failure —
      // the newer save (or nothing, if unmounting) owns the outcome now.
      if (err instanceof Error && err.name === "AbortError") return;

      // All retries failed
      setSaveFailed(true);
      setSaveRetryCount(3);

      // Write recovery snapshot to localStorage
      writeRecoverySnapshot();

      const status = err && typeof err === "object" && "status" in err
        ? (err as any).status
        : 0;

      // 401 → session expired (handled by onAuthFail)
      if (status === 401) {
        toast.error("Session expired — your work is preserved");
        return;
      }

      toast.error("Save failed — your changes are still here. Retrying…", {
        duration: 5000,
      });
    } finally {
      if (saveAbortRef.current === controller) saveAbortRef.current = null;
      setSaving(false);
    }
  };

  // Convert a frame's design to page.elements[] and save immediately
  const publishFrameToPage = useCallback(async (frame: Frame) => {
    const clean = frameToElements(frame.children, frame.width);
    setElements(clean);
    setSaved(false);
    // Trigger save right away so the published site is updated without extra clicks
    setTimeout(() => handleSaveRef.current?.(), 0);
  }, []);

  // ── Frame management (Phase 3) ───────────────────────────────────────────────

  const handleAddFrame = useCallback((x: number, y: number, w: number, h: number) => {
    const preset = FRAME_PRESETS.find(p => Math.abs(p.width - w) < 50 && Math.abs(p.height - h) < 50);
    const newFrame: Frame = {
      id:          `frame-${crypto.randomUUID().slice(0, 8)}`,
      name:        preset ? preset.label : `Frame ${frames.length + 1}`,
      canvasX:     x,
      canvasY:     y,
      width:       w,
      height:      h,
      background:  "#ffffff",
      clipContent: true,
      children:    [],
    };
    setFrames(prev => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
    setSaved(false);
  }, [frames.length]);

  // Place a new frame from the toolbar preset button (right of all existing frames)
  const handleNewFrameFromPreset = useCallback((preset: { label: string; width: number; height: number }) => {
    const rightEdge = frames.length > 0
      ? Math.max(...frames.map(f => f.canvasX + f.width))
      : 100;
    const topY = frames.length > 0 ? frames[0].canvasY : 100;
    const newFrame: Frame = {
      id:          `frame-${crypto.randomUUID().slice(0, 8)}`,
      name:        `${preset.label} ${frames.filter(f => f.name.startsWith(preset.label)).length + 1}`,
      canvasX:     rightEdge + 80,
      canvasY:     topY,
      width:       preset.width,
      height:      preset.height,
      background:  "#ffffff",
      clipContent: true,
      children:    [],
    };
    setFrames(prev => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
    setSaved(false);
  }, [frames]);

  const handleRenameFrame = useCallback((id: string, name: string) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    setSaved(false);
  }, []);

  // Phase 5 — constraints: children respond to frame resize per their pin settings
  const applyConstraints = (children: ElementNode[], oldW: number, oldH: number, newW: number, newH: number): ElementNode[] =>
    children.map((c) => {
      if (!c.layout) return c;
      const l = c.layout;
      const ch = l.constraints?.horizontal ?? "left";
      const cv = l.constraints?.vertical ?? "top";
      let { x, y } = l;
      let w = l.width, h = l.height ?? 0;
      // horizontal
      if (ch === "right")       x = newW - (oldW - x);
      else if (ch === "center") x = x + (newW - oldW) / 2;
      else if (ch === "scale")  { const s = newW / oldW; x *= s; w *= s; }
      else if (ch === "both")   { w = newW - (oldW - (x + w)) - x; }
      // vertical
      if (cv === "bottom")      y = newH - (oldH - y);
      else if (cv === "center") y = y + (newH - oldH) / 2;
      else if (cv === "scale")  { const s = newH / oldH; y *= s; h *= s; }
      else if (cv === "both")   { h = newH - (oldH - (y + h)) - y; }
      return { ...c, layout: { ...l, x: Math.round(x), y: Math.round(y), width: Math.max(4, Math.round(w)), height: h ? Math.max(4, Math.round(h)) : l.height } };
    });

  const handleResizeFrame = useCallback((id: string, width: number, height: number) => {
    setFrames(prev => prev.map(f => {
      if (f.id !== id) return f;
      const hasConstraints = f.children.some((c) => c.layout?.constraints);
      return {
        ...f, width, height,
        children: hasConstraints ? applyConstraints(f.children, f.width, f.height, width, height) : f.children,
      };
    }));
    setSaved(false);
  }, []);

  const handleMoveFrame = useCallback((id: string, canvasX: number, canvasY: number) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, canvasX, canvasY } : f));
    setSaved(false);
  }, []);

  const handleDeleteFrame = useCallback((id: string) => {
    setFrames(prev => prev.filter(f => f.id !== id));
    setSelectedFrameId(prev => prev === id ? null : prev);
    setSaved(false);
  }, []);

  // Deep-clone an element tree with fresh IDs so re-used designs don't share IDs
  const deepCloneWithNewIds = useCallback((els: ElementNode[]): ElementNode[] =>
    els.map(el => ({
      ...el,
      id: `el-${crypto.randomUUID().slice(0, 8)}`,
      children: deepCloneWithNewIds(el.children),
    }))
  , []);

  // Phase 10: place a saved design as a new frame on the canvas
  const handleUseDesign = useCallback((section: SavedSection) => {
    const sourceFrame = section.sourceFrameId
      ? frames.find(f => f.id === section.sourceFrameId) ?? null
      : null;

    const w = section.frameWidth  ?? 1280;
    const h = section.frameHeight ?? 720;

    // Place to the right of all existing frames (with gap), or at a default position
    const rightEdge = frames.length > 0
      ? Math.max(...frames.map(f => f.canvasX + f.width))
      : 100;

    const newFrame: Frame = {
      id:          `frame-${Date.now()}`,
      name:        section.name,
      width:       w,
      height:      h,
      canvasX:     rightEdge + 80,
      canvasY:     sourceFrame?.canvasY ?? 100,
      children:    sourceFrame ? deepCloneWithNewIds(sourceFrame.children) : [],
      background:  sourceFrame?.background  ?? "#ffffff",
      clipContent: sourceFrame?.clipContent ?? false,
    };

    setFrames(prev => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
    setSelectedFrameElementIds([]);
    setSaved(false);

    if (canvasMode !== "free") setCanvasModeState("free");
  }, [frames, canvasMode, deepCloneWithNewIds]);

  // ── Phase 5: frame child management ─────────────────────────────────────────

  // Returns which frame (if any) contains the given world point
  const findFrameAtPoint = useCallback((wx: number, wy: number): Frame | null => {
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (wx >= f.canvasX && wx <= f.canvasX + f.width &&
          wy >= f.canvasY && wy <= f.canvasY + f.height) {
        return f;
      }
    }
    return null;
  }, [frames]);

  const handleUpdateFrameChildren = useCallback((frameId: string, children: ElementNode[]) => {
    setFrames(prev => prev.map(f => f.id === frameId ? { ...f, children } : f));
    setSaved(false);
  }, []);

  const handleFrameChildLayoutChange = useCallback((frameId: string, elId: string, layout: Partial<FreeLayout>) => {
    setFrames(prev => prev.map(f => {
      if (f.id !== frameId) return f;
      return {
        ...f,
        children: f.children.map(c =>
          c.id === elId ? { ...c, layout: { ...(c.layout ?? { x: 0, y: 0, width: 200, height: 60 }), ...layout } } : c
        ),
      };
    }));
    setSaved(false);
  }, []);

  const handleFrameChildContentChange = useCallback((frameId: string, elId: string, content: string) => {
    setFrames(prev => prev.map(f => {
      if (f.id !== frameId) return f;
      return { ...f, children: f.children.map(c => c.id === elId ? { ...c, content } : c) };
    }));
    setSaved(false);
  }, []);

  // ── Add component from picker ────────────────────────────────────────────────
  const handleAddComponent = (comp: ComponentDef) => {
    const newBlock: Block = {
      id:      `block-${crypto.randomUUID()}`,
      type:    comp.blockType,
      content: { ...comp.defaultContent },
      styles:  comp.defaultStyles,
    };
    setBlocks((bs) => [...bs, newBlock]);
  };

  // ── Delete / move block ──────────────────────────────────────────────────────
  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert("Cannot delete the last block on this page.");
      return;
    }
    if (!confirm("Delete this section?")) return;
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  // ── Regenerate a single block with AI (Round 5 Ch 6.2 — variant cycling) ──────
  // variants[0] is always the pre-regen original, so Discard = perfect restore (Ch 6.1).
  const [regenBlockId, setRegenBlockId] = useState<string | null>(null);
  const [blockVariants, setBlockVariants] = useState<{ blockId: string; variants: Block[]; index: number } | null>(null);

  const handleRegenBlock = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const session = blockVariants?.blockId === blockId ? blockVariants : null;
    if (session && session.variants.length >= 4) {
      toast("Variant limit reached — cycle with ◀ ▶ and apply the one you like.");
      return;
    }
    setRegenBlockId(blockId);
    try {
      const res = await fetch(`${API}/api/builder/regenerate-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: project?._id, blockType: block.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Regeneration failed");
      const newBlock: Block = { ...data.block, id: blockId };
      setBlocks((bs) => bs.map((b) => (b.id === blockId ? newBlock : b)));
      setSaved(false);
      setBlockVariants(
        session
          ? { blockId, variants: [...session.variants, newBlock], index: session.variants.length }
          : { blockId, variants: [block, newBlock], index: 1 }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed. Your section is unchanged.");
    } finally {
      setRegenBlockId(null);
    }
  };

  const cycleVariant = (dir: -1 | 1) => {
    if (!blockVariants) return;
    const next = (blockVariants.index + dir + blockVariants.variants.length) % blockVariants.variants.length;
    setBlocks((bs) => bs.map((b) => (b.id === blockVariants.blockId ? blockVariants.variants[next] : b)));
    setBlockVariants({ ...blockVariants, index: next });
    setSaved(false);
  };

  const applyVariant = () => setBlockVariants(null); // keep what's on canvas

  const discardVariants = () => {
    if (!blockVariants) return;
    setBlocks((bs) => bs.map((b) => (b.id === blockVariants.blockId ? blockVariants.variants[0] : b)));
    setBlockVariants(null);
    setSaved(false);
  };

  // Variant sessions don't survive page switches
  useEffect(() => { setBlockVariants(null); }, [selectedId]);

  // Abort any in-flight save on unmount so a stale response can't overwrite newer state
  useEffect(() => () => { saveAbortRef.current?.abort(); }, []);

  // ── Phase 4: reusable components (masters live at project level) ─────────────
  const handleCreateComponent = useCallback((el: ElementNode) => {
    const name = window.prompt("Component name:", el.label || el.tag);
    if (!name?.trim()) return;
    const comp: ProjectComponent = {
      id: `comp-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim().slice(0, 60),
      rootElement: JSON.parse(JSON.stringify(el)),
      createdAt: new Date().toISOString(),
    };
    setComponents((prev) => [...prev, comp]);
    // the original becomes the first instance (purple badge via componentId)
    setElements((prev) => updateElementInTree(prev, el.id, (n) => ({ ...n, componentId: comp.id, label: n.label ?? comp.name })));
    setSaved(false);
    toast.success(`Component "${comp.name}" created — find it in Add → My Designs`);
  }, []);

  const handlePlaceComponent = useCallback((comp: ProjectComponent) => {
    const clone = deepCloneWithNewIds([JSON.parse(JSON.stringify(comp.rootElement))])[0];
    const inst: ElementNode = {
      ...clone,
      componentId: comp.id,
      label: comp.name,
      layout: { ...(clone.layout ?? { width: 300, height: 120 }), x: 60, y: 60 },
    };
    setElements((prev) => [...prev, inst]);
    setSelectedElementId(inst.id);
    setFreeSelectedIds([inst.id]);
    if (canvasMode !== "free") setCanvasModeState("free");
    setSaved(false);
    toast.success(`Placed "${comp.name}"`);
  }, [canvasMode, deepCloneWithNewIds]);

  const handleDeleteComponent = useCallback((id: string) => {
    if (!confirm("Delete this component? Placed copies stay on your pages.")) return;
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setSaved(false);
  }, []);

  // ── Blueprint v3 F-02: third starting point — start from the starter template ──
  const handleTemplateInit = useCallback(async () => {
    const name = window.prompt("What's your business called?", "My Website");
    if (!name?.trim()) return;
    setView("loading");
    try {
      const res = await fetch(`${API}/api/builder/init-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName: name.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Project = await res.json();
      setProject(data);
      enterEditor(data, data.pages[0].id);
      toast.success("Template ready — everything is editable");
    } catch {
      toast.error("Couldn't create the template site. Please try again.");
      setView("choose");
    }
  }, [token, enterEditor]);

  // ── Round 1 R-12b: Swap Component — replace an instance with another master ──
  const [swapTarget, setSwapTarget] = useState<ElementNode | null>(null);

  const performSwap = useCallback((oldEl: ElementNode, comp: ProjectComponent) => {
    // best-effort text carry: same structural position + same tag keeps the old text
    let keptTexts = 0;
    const carryText = (oldNode: ElementNode | undefined, newNode: ElementNode): ElementNode => {
      if (!oldNode) return newNode;
      const content =
        oldNode.tag === newNode.tag && oldNode.content && newNode.content !== oldNode.content
          ? (keptTexts++, oldNode.content)
          : newNode.content;
      return {
        ...newNode,
        content,
        children: newNode.children.map((c, i) => carryText(oldNode.children[i], c)),
      };
    };
    const fresh = deepCloneWithNewIds([JSON.parse(JSON.stringify(comp.rootElement))])[0];
    const merged = carryText(oldEl, fresh);
    const swapped: ElementNode = {
      ...merged,
      componentId: comp.id,
      label: comp.name,
      // position preserved; size resets to the new master's natural size (R-12b)
      layout: {
        ...(merged.layout ?? { width: 300, height: 120 }),
        x: oldEl.layout?.x ?? 60,
        y: oldEl.layout?.y ?? 60,
      },
    };
    setElements((prev) => prev.map((el) => (el.id === oldEl.id ? swapped : el)));
    setSelectedElementId(swapped.id);
    setFreeSelectedIds([swapped.id]);
    setSaved(false);
    setSwapTarget(null);
    toast.success(`Swapped to "${comp.name}"${keptTexts ? ` — ${keptTexts} text edit${keptTexts > 1 ? "s" : ""} kept` : ""}`);
  }, [deepCloneWithNewIds]);

  // ── AI rewrite — 3 copy variants for a text field (Round 5 Ch 5.2) ───────────
  const handleRewrite = async (text: string, tone: string): Promise<string[]> => {
    const res = await fetch(`${API}/api/builder/ai/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, tone, tag: text.length < 80 ? "h1" : "p", projectId: project?._id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.message || "Rewrite failed. Please try again.");
      throw new Error(data?.message || "Rewrite failed");
    }
    return data.variants as string[];
  };

  // ── AI SEO + Theme modals (Round 5 Ch 5.2 / Ch 8.1) ──────────────────────────
  const [showSeoModal, setShowSeoModal]     = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleSeoGenerate = async (): Promise<PageSeo> => {
    const pageName = selectedPage?.name ?? "Home";
    const headings: string[] = [];
    const texts: string[] = [];
    blocks.forEach((b) => {
      Object.entries(b.content).forEach(([k, v]) => {
        if (typeof v !== "string" || !v.trim()) return;
        if (/headline|title/i.test(k)) headings.push(v);
        else texts.push(v);
      });
    });
    const res = await fetch(`${API}/api/builder/ai/seo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pageName, headings: headings.slice(0, 10), textSample: texts.join(" ").slice(0, 600), projectId: project?._id }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.message || "SEO generation failed."); throw new Error(data?.message); }
    return data.seo as PageSeo;
  };

  const handleSeoSave = async (seo: PageSeo) => {
    if (!project || !selectedId) return;
    const res = await fetch(`${API}/api/builder/project/pages/${selectedId}?projectId=${project._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ seo }),
    });
    if (!res.ok) { toast.error("Failed to save SEO."); throw new Error("save failed"); }
    setProject((p) => p ? { ...p, pages: p.pages.map((pg) => pg.id === selectedId ? { ...pg, seo } : pg) } : p);
    toast.success("SEO saved");
  };

  const handleThemeGenerate = async (themePrompt: string): Promise<AiTheme> => {
    const res = await fetch(`${API}/api/builder/ai/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: themePrompt, projectId: project?._id }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.message || "Theme suggestion failed."); throw new Error(data?.message); }
    return data.theme as AiTheme;
  };

  const handleThemeApply = async (theme: AiTheme) => {
    if (!project) return;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const mergedTokens = {
      colors:  theme.tokens?.colors ?? [],
      fonts:   theme.tokens?.fonts ?? [],
      spacing: {},
    };
    const reqs: Promise<Response>[] = [
      fetch(`${API}/api/builder/project/tokens`, { method: "PUT", headers, body: JSON.stringify({ tokens: mergedTokens, projectId: project._id }) }),
    ];
    if (theme.primaryColor) {
      reqs.push(fetch(`${API}/api/builder/project/settings`, { method: "PUT", headers, body: JSON.stringify({ primaryColor: theme.primaryColor, projectId: project._id }) }));
    }
    const results = await Promise.all(reqs);
    if (results.some((r) => !r.ok)) { toast.error("Failed to apply theme."); throw new Error("apply failed"); }
    setProject((p) => p ? { ...p, primaryColor: theme.primaryColor ?? p.primaryColor } : p);
    toast.success("Theme applied — new sections will use it");
  };
  const moveBlock   = (id: string, dir: "up" | "down") => setBlocks((bs) => {
    const idx  = bs.findIndex((b) => b.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= bs.length) return bs;
    const next = [...bs];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return next;
  });

  // ── DnD handlers ─────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((bs) => {
        const oldIndex = bs.findIndex((b) => b.id === active.id);
        const newIndex = bs.findIndex((b) => b.id === over.id);
        return arrayMove(bs, oldIndex, newIndex);
      });
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasClickedBlock, setHasClickedBlock] = useState(false);

  useEffect(() => {
    if (view !== "editor") return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Ignore shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && e.key === "s") { e.preventDefault(); handleSave(); return; }
      if (mod && e.shiftKey && (e.key === "s" || e.key === "S")) { e.preventDefault(); handleSave(); return; }

      if (inInput) return;

      if (mod && e.key === "a") { e.preventDefault(); setAddPanelTab("sections"); setActiveTab("add"); return; }
      if (mod && e.key === "d" && editingBlockId) {
        e.preventDefault();
        const blockToDup = blocks.find((b) => b.id === editingBlockId);
        if (blockToDup) {
          const dup = { ...blockToDup, id: `block-${crypto.randomUUID()}` };
          const idx = blocks.findIndex((b) => b.id === editingBlockId);
          const next = [...blocks];
          next.splice(idx + 1, 0, dup);
          setBlocks(next);
          setEditingBlockId(dup.id);
          setSaved(false);
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && editingBlockId && e.target === document.body) {
        deleteBlock(editingBlockId);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId && e.target === document.body) {
        setElements((prev) => deleteFromTree(prev, selectedElementId));
        setSelectedElementId(null);
        setSaved(false);
        return;
      }
      if (e.key === "ArrowUp" && !e.shiftKey && editingBlockId) {
        e.preventDefault(); moveBlock(editingBlockId, "up"); return;
      }
      if (e.key === "ArrowDown" && !e.shiftKey && editingBlockId) {
        e.preventDefault(); moveBlock(editingBlockId, "down"); return;
      }
      if (e.key === "Escape") {
        setEditingBlockId(null);
        setShowShortcutsModal(false);
        return;
      }
      if (e.key === "?" && !mod) {
        setShowShortcutsModal((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, editingBlockId, blocks, undo, redo]);

  // ── Beforeunload warning when there are unsaved changes ──────────────────────
  useEffect(() => {
    if (view !== "editor") return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!saved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [view, saved]);

  // ── POINT_RESULT + BOUNDS_RESULT message listener ───────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "POINT_RESULT" && dropResolveRef.current) {
        dropResolveRef.current({ id: e.data.id ?? null, position: e.data.position ?? "append" });
        dropResolveRef.current = null;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Auto-save every 30s when there are unsaved changes ───────────────────────
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (view !== "editor") return;
    autoSaveRef.current = setInterval(() => {
      if (!savedRef.current) handleSaveRef.current();
    }, 30_000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── AI: generate sections for current page ───────────────────────────────────
  const handleAiGenerate = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const userMsgId = Date.now();
    setChatMessages((prev) => [...prev, { id: userMsgId, role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);

    // V2 mode when elements exist; otherwise fall back to V1 blocks
    const isV2 = elements.length > 0;

    setChatMessages((prev) => [...prev, {
      id: userMsgId + 1, role: "assistant",
      text: isV2 ? "⏳ Building elements…" : "⏳ Generating sections…",
    }]);

    try {
      if (isV2) {
        const res = await fetch(`${API}/api/builder/generate-elements`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: msg, projectId: project?._id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Failed");

        const newEls: ElementNode[]    = data.elements ?? [];
        const newCls: typeof classes   = data.classes  ?? [];
        setElements((prev) => [...prev, ...newEls]);
        setClasses((prev) => {
          const existing = new Set(prev.map((c) => c.name));
          return [...prev, ...newCls.filter((c) => !existing.has(c.name))];
        });
        setSaved(false);
        setActiveTab("layers");

        setChatMessages((prev) => prev.map((m) =>
          m.id === userMsgId + 1
            ? { ...m, text: `Done! Added ${newEls.length} section${newEls.length !== 1 ? "s" : ""}.` }
            : m
        ));
      } else {
        const res = await fetch(`${API}/api/builder/generate-page`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: msg, projectId: project?._id, theme: aiTheme }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Failed");

        const newBlocks: Block[] = data.blocks;
        setBlocks((bs) => [...bs, ...newBlocks]);
        setSaved(false);
        setActiveTab("design");

        setChatMessages((prev) => prev.map((m) =>
          m.id === userMsgId + 1
            ? { ...m, text: `Done! Added ${newBlocks.length} section${newBlocks.length !== 1 ? "s" : ""} to your page.` }
            : m
        ));
      }
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (err && typeof err === "object" && "status" in err) {
        const apiErr = err as { status: number; retryAfter?: number };
        if (apiErr.status === 429) {
          const wait = apiErr.retryAfter ?? 30;
          message = `Too many AI requests. Wait ${wait}s.`;
        } else if (apiErr.status === 403) {
          message = "You've used all AI generations this month.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setChatMessages((prev) => prev.map((m) =>
        m.id === userMsgId + 1 ? { ...m, text: `Error: ${message}` } : m
      ));
    } finally {
      setChatLoading(false);
    }
  };

  // ── AI generate from AddPanel (no chat thread) ───────────────────────────────
  const handleAddPanelGenerate = async (prompt: string): Promise<void> => {
    const isV2 = elements.length > 0;
    if (isV2) {
      const res = await fetch(`${API}/api/builder/generate-elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, projectId: project?._id }),
      });
      if (!res.ok) {
        const apiErr = new Error("Generation failed");
        (apiErr as any).status = res.status;
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          (apiErr as any).retryAfter = body.retryAfter;
        }
        throw apiErr;
      }
      const data = await res.json();
      const newEls: ElementNode[]  = data.elements ?? [];
      const newCls: StyleClass[]   = data.classes  ?? [];
      setElements((prev) => [...prev, ...newEls]);
      setClasses((prev) => {
        const existing = new Set(prev.map((c) => c.name));
        return [...prev, ...newCls.filter((c) => !existing.has(c.name))];
      });
      setSaved(false);
      setActiveTab("layers");
    } else {
      const res = await fetch(`${API}/api/builder/generate-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, projectId: project?._id, theme: aiTheme }),
      });
      if (!res.ok) {
        const apiErr = new Error("Generation failed");
        (apiErr as any).status = res.status;
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          (apiErr as any).retryAfter = body.retryAfter;
        }
        throw apiErr;
      }
      const data = await res.json();
      setBlocks((bs) => [...bs, ...(data.blocks ?? [])]);
      setSaved(false);
      setActiveTab("design");
    }
  };

  // ── Add / delete page ────────────────────────────────────────────────────────
  const handleAddPage = async () => {
    if (!newPageName.trim() || !project) return;
    const res  = await fetch(`${API}/api/builder/project/pages?projectId=${project._id}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newPageName }),
    });
    const updated: Project = await res.json();
    setProject(updated);
    const np = updated.pages[updated.pages.length - 1];
    enterEditor(updated, np.id);
    setNewPageName(""); setShowAddPage(false);
  };
  const handleDeletePage = async (pageId: string) => {
    if (!project) return;
    if ((project.pages.length ?? 0) <= 1) {
      alert("Cannot delete the last page.");
      return;
    }
    if (!confirm("Delete this page?")) return;
    const res  = await fetch(`${API}/api/builder/project/pages/${pageId}?projectId=${project._id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    const updated: Project = await res.json();
    setProject(updated);
    if (selectedId === pageId) selectPage(updated, updated.pages[0]?.id ?? "");
  };

  const handleRenamePage = async (pageId: string, name: string) => {
    setRenamingPageId(null);
    if (!project || !name.trim()) return;
    const res = await fetch(`${API}/api/builder/project/pages/${pageId}?projectId=${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const updated: Project = await res.json();
      setProject(updated);
    }
  };

  const handleLogout = () => {
    ["token","role","package","name","email"].forEach((k) => localStorage.removeItem(k));
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const isPro        = pkg === "pro";
  const selectedPage = project?.pages?.find((p) => p.id === selectedId);
  const activeDragBlock = activeDragId ? blocks.find((b) => b.id === activeDragId) : null;

  // ── Shared TopBar (Airo Style) ───────────────────────────────────────────────
  const FloatingTopBar = () => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-1 h-12">
      {/* Undo / Redo */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl p-1">
        <button
          onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          className="p-2 rounded-xl transition-colors text-gray-400 hover:text-black disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <History size={15} />
        </button>
        <button
          onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          className="p-2 rounded-xl transition-colors text-gray-400 hover:text-black disabled:opacity-25 disabled:cursor-not-allowed rotate-180"
        >
          <History size={15} />
        </button>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl p-1">
        <button 
          onClick={() => setPreviewMode("none")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[12px] font-bold transition-all ${previewMode === "none" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Pencil size={14} /> Edit
        </button>
        <button 
          onClick={() => setPreviewMode("split")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[12px] font-bold transition-all ${previewMode === "split" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Code2 size={14} />
        </button>
        <button
          onClick={() => {
            if (project) {
              const slug = selectedPage?.slug ?? "home";
              window.open(`/builder/preview?id=${project._id}&page=${slug}`, "_blank");
            }
            setPreviewMode("full");
          }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[12px] font-bold transition-all ${previewMode === "full" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
          title="Full page preview"
        >
          <Globe size={14} />
        </button>
      </div>

      {/* Canvas mode toggle — only in V2 mode */}
      {elements.length > 0 && (
        <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl p-1">
          <button
            onClick={() => { setCanvasModeState("flow"); setSaved(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${canvasMode === "flow" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
            title="Flow canvas (scrollable)"
          >
            <Columns2 size={13} /> Flow
          </button>
          <button
            onClick={() => { setCanvasModeState("free"); setSaved(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${canvasMode === "free" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
            title="Free canvas (Figma-like)"
          >
            <Layout size={13} /> Free
          </button>
        </div>
      )}

      {/* Device & Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl p-1">
          <button onClick={() => setView("choose")} className="p-2 text-gray-400 hover:text-black transition-colors" title="New Website"><RotateCcw size={15} /></button>
          <button 
            onClick={() => setPreviewDevice("desktop")}
            className={`p-2 rounded-xl transition-colors ${previewDevice === "desktop" ? "text-black bg-gray-50" : "text-gray-400 hover:text-black"}`}
          >
            <Monitor size={15} />
          </button>
          <button 
            onClick={() => setPreviewDevice("mobile")}
            className={`p-2 rounded-xl transition-colors ${previewDevice === "mobile" ? "text-black bg-gray-50" : "text-gray-400 hover:text-black"}`}
          >
            <Smartphone size={15} />
          </button>
          <button className="p-2 text-gray-400 hover:text-black transition-colors"><Share2 size={15} /></button>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl p-1 pl-4">
          <button onClick={() => window.location.href = "/pricing"} className="flex items-center gap-2 text-[12px] font-bold text-gray-900 mr-2 hover:opacity-80 transition-opacity">
            <Sparkles size={14} className="text-purple-500" /> Upgrade
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 rounded-xl text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-1.5"
            title="Export code"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 ${
              saveFailed ? "bg-red-500 text-white hover:bg-red-600" :
              saved ? "bg-green-500 text-white" : "bg-[#6344d4] text-white hover:opacity-90"
            }`}
          >
            {saving ? "Saving..." : saveFailed ? "Retry" : saved ? "Saved ✓" : "Publish"}
          </button>
        </div>

        <Link 
          href="/dashboard"
          title="Back to Dashboard" 
          className="w-10 h-10 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-black transition-all"
        >
          <Blocks size={16} />
        </Link>

        <button onClick={handleLogout} title="Sign out" className="w-10 h-10 bg-white border border-gray-100 shadow-xl shadow-black/5 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all group">
          <LogOut size={16} className="text-gray-400 group-hover:text-red-500" />
        </button>
      </div>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (view === "loading" && !loadError) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fa]">
      <style>{scrollbarStyles}</style>
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Load errors (Ch 1.1) ─────────────────────────────────────────────────────
  if (loadError) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-4 text-center px-6">
      <style>{scrollbarStyles}</style>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
        loadError === "not-found" || loadError === "forbidden" ? "bg-orange-100" : "bg-red-100"
      }`}>
        <span className={`text-2xl font-bold ${loadError === "not-found" || loadError === "forbidden" ? "text-orange-500" : "text-red-500"}`}>!</span>
      </div>
      {loadError === "network" || loadError === "timeout" ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">Couldn&apos;t load your project</h1>
          <p className="text-gray-500 text-[14px] max-w-md">Check your connection and try again.</p>
          <button
            onClick={() => { setLoadError(null); setView("loading"); window.location.reload(); }}
            className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all"
          >
            Retry
          </button>
        </>
      ) : loadError === "not-found" ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">Project not found</h1>
          <p className="text-gray-500 text-[14px] max-w-md">This project doesn&apos;t exist or was deleted.</p>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all inline-block">
            Back to dashboard
          </a>
        </>
      ) : loadError === "forbidden" ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
          <p className="text-gray-500 text-[14px] max-w-md">You don&apos;t have access to this project.</p>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all inline-block">
            Back to dashboard
          </a>
        </>
      ) : loadError === "stuck-generation" ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">Generation seems stuck</h1>
          <p className="text-gray-500 text-[14px] max-w-md">The AI generation didn&apos;t complete. What would you like to do?</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                setLoadError(null);
                setView("generating");
                try {
                  const data = await generateSite(project?.prompt ?? "", "light");
                  setProject(data);
                  enterEditor(data, data.pages[0].id);
                } catch {
                  setLoadError(null);
                  setView("choose");
                }
              }}
              className="px-6 py-3 bg-[#6344d4] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-all"
            >
              Retry generation
            </button>
            <button
              onClick={async () => {
                setLoadError(null);
                try {
                  await fetch(`${API}/api/builder/init-manual`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ businessName: project?.businessName ?? "My Site", tagline: "", primaryColor: "#333333" }),
                  });
                } catch {}
                setView("choose");
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-200 transition-all"
            >
              Start fresh
            </button>
          </div>
        </>
      ) : loadError === "corrupt" ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">Couldn&apos;t load project data</h1>
          <p className="text-gray-500 text-[14px] max-w-md">The project data appears to be damaged. Please try reloading or contact support.</p>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all inline-block">
            Back to dashboard
          </a>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500 text-[14px] max-w-md">Please try again.</p>
          <button
            onClick={() => { setLoadError(null); setView("loading"); window.location.reload(); }}
            className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );

  // ── No auth ──────────────────────────────────────────────────────────────────
  if (view === "no-auth") return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-6 text-center px-6">
      <style>{scrollbarStyles}</style>
      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center">
        <Zap className="text-white" size={24} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">LHRWEB Website Builder</h1>
        <p className="text-gray-500 max-w-sm">This tool is for LHRWEB Website Builder subscribers. Please sign in with your builder account.</p>
      </div>
      <a href="/login" className="px-8 py-3.5 bg-black text-white rounded-2xl text-[14px] font-bold hover:bg-gray-900 transition-all">
        Sign in to continue
      </a>
    </div>
  );

  // ── Choose mode ──────────────────────────────────────────────────────────────
  if (view === "choose") return (
    <div className="h-screen flex flex-col bg-[#F9FAFB] overflow-hidden relative">
      <style>{scrollbarStyles}</style>
      <FloatingTopBar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 pt-24">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How would you like to build?</h1>
          <p className="text-gray-500">Choose your preferred way to create your website</p>
        </div>

        <div className="grid grid-cols-3 gap-5 w-full max-w-4xl">
          {/* AI Builder card */}
          <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col gap-4 hover:border-black transition-all group cursor-pointer" onClick={() => { setWizardStep(0); setView("wizard"); }}>
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 mb-1">Build with AI</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Describe your business and our AI generates a complete, professional website in seconds.
              </p>
            </div>
            <ul className="space-y-1.5 text-[12px] text-gray-500">
              {["Full website generated instantly", "Pages, content & structure", "Edit anything after generation"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0" />{t}
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all">
              Build with AI →
            </button>
          </div>

          {/* Template card (Blueprint v3 F-02 — three starting points, one workspace) */}
          <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col gap-4 hover:border-black transition-all group cursor-pointer" onClick={handleTemplateInit}>
            <div className="w-12 h-12 bg-[#6344d4]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layout className="text-[#6344d4]" size={22} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 mb-1">Start from Template</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Begin with a clean, professional starter site and make it yours.
              </p>
            </div>
            <ul className="space-y-1.5 text-[12px] text-gray-500">
              {["Ready in one click", "Home & Contact pages included", "Everything fully editable"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#6344d4] rounded-full flex-shrink-0" />{t}
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full py-3 border-2 border-[#6344d4] text-[#6344d4] rounded-xl text-[13px] font-bold hover:bg-[#6344d4] hover:text-white transition-all">
              Use Template →
            </button>
          </div>

          {/* Manual builder card */}
          <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col gap-4 hover:border-black transition-all group cursor-pointer" onClick={() => setView("manual-setup")}>
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Blocks className="text-gray-700" size={22} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 mb-1">Build Manually</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Start with a blank canvas and add pre-built sections from our component library.
              </p>
            </div>
            <ul className="space-y-1.5 text-[12px] text-gray-500">
              {["Full control over layout", "Browse & add components", "Headers, banners, footers & more"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />{t}
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full py-3 border-2 border-black text-black rounded-xl text-[13px] font-bold hover:bg-black hover:text-white transition-all">
              Build Manually →
            </button>
          </div>
        </div>

        {project && (
          <button onClick={() => enterEditor(project, project.pages[0]?.id ?? "")} className="text-[13px] text-gray-400 hover:text-black underline transition-colors">
            Continue editing "{project.businessName}" →
          </button>
        )}
      </div>
    </div>
  );

  // ── Manual setup ─────────────────────────────────────────────────────────────
  if (view === "manual-setup") return (
    <div className="h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      <style>{scrollbarStyles}</style>
      <FloatingTopBar />
      <div className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
              <Blocks className="text-gray-700" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set up your website</h1>
            <p className="text-gray-500 text-[14px]">You can always change these later from the editor</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Business Name</label>
              <input className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all" placeholder="e.g. My Awesome Business" value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tagline <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
              <input className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all" placeholder="e.g. Building digital experiences that matter" value={manualTag} onChange={(e) => setManualTag(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Brand Colour <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-1" value={manualColor} onChange={(e) => setManualColor(e.target.value)} />
                <input className="flex-1 px-4 py-3 text-[14px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 font-mono" value={manualColor} onChange={(e) => setManualColor(e.target.value)} placeholder="#000000" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setView("choose")} className="px-5 py-3 text-[13px] font-semibold text-gray-500 hover:text-black border border-gray-200 rounded-xl hover:border-gray-400 transition-all">
              ← Back
            </button>
            <button onClick={handleManualInit} disabled={initSaving} className="flex-1 py-3 bg-black text-white rounded-xl text-[14px] font-bold hover:bg-gray-900 transition-all disabled:opacity-50">
              {initSaving ? "Setting up..." : "Start Building →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Wizard (AI path — 4 guided steps) ───────────────────────────────────────
  if (view === "wizard") {
    const WIZARD_STEPS = 4;
    const progress = (wizardStep / WIZARD_STEPS) * 100;

    const advanceWizard = (patch: Partial<WizardData>) => {
      const updated = { ...wizardData, ...patch };
      setWizardData(updated);
      if (wizardStep < WIZARD_STEPS - 1) {
        setWizardStep((s) => s + 1);
      } else {
        // Build prompt and start generation
        const builtPrompt = `${updated.businessName} — ${updated.businessType}. ${updated.description}`;
        setPrompt(builtPrompt);
        setAiTheme(updated.theme);
        setView("generating");
        setMsgIdx(0);
        setGenProgress(null);
        const iv = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 4000);
        generateSite(builtPrompt, updated.theme)
          .then((data: Project) => {
            clearInterval(iv);
            setProject(data);
            enterEditor(data, data.pages[0].id);
            setShowWelcome(true);
          })
          .catch((err) => {
            clearInterval(iv);
            setGenProgress(null);
            setView("wizard");
            toast.error(err instanceof Error ? err.message : "Generation failed. Please try again.");
          });
      }
    };

    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-6">
        <style>{scrollbarStyles}</style>
        <div className="w-full max-w-[500px]">

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-[11px] text-gray-400 mb-2 font-mono">
              <span>Step {wizardStep + 1} of {WIZARD_STEPS}</span>
              <span>{Math.round(progress)}% done</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-black rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Step 1 — Business name */}
          {wizardStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] font-bold text-gray-900 mb-1">What&apos;s your business called?</h2>
                <p className="text-gray-500 text-[14px]">This will appear on your website.</p>
              </div>
              <input
                autoFocus
                className="w-full px-5 py-4 text-[17px] border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-black transition-all bg-white"
                placeholder="e.g. Lahore Eats, Nova Studio..."
                value={wizardData.businessName}
                onChange={(e) => setWizardData((d) => ({ ...d, businessName: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && wizardData.businessName.trim() && advanceWizard({})}
              />
              <button
                onClick={() => advanceWizard({})}
                disabled={!wizardData.businessName.trim()}
                className="w-full py-4 bg-black text-white rounded-2xl text-[15px] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-all"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Business type */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[28px] font-bold text-gray-900 mb-1">What type of business?</h2>
                <p className="text-gray-500 text-[14px]">This helps us pick the right layout.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => advanceWizard({ businessType: t })}
                    className={`px-4 py-3 text-left rounded-xl border-2 text-[13px] font-semibold transition-all ${
                      wizardData.businessType === t
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Description */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[28px] font-bold text-gray-900 mb-1">Tell us about your business</h2>
                <p className="text-gray-500 text-[14px]">2–3 sentences. What do you do and who do you serve?</p>
              </div>
              <textarea
                autoFocus
                rows={5}
                className="w-full px-5 py-4 text-[14px] border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-black transition-all bg-white resize-none"
                placeholder={`e.g. We are a family-run restaurant in Lahore serving authentic Mughlai cuisine. We specialise in dine-in and catering for events up to 200 guests.`}
                value={wizardData.description}
                onChange={(e) => setWizardData((d) => ({ ...d, description: e.target.value }))}
              />
              <button
                onClick={() => advanceWizard({})}
                disabled={wizardData.description.trim().length < 20}
                className="w-full py-4 bg-black text-white rounded-2xl text-[15px] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-all"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 4 — Color + theme */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[28px] font-bold text-gray-900 mb-1">Pick a style</h2>
                <p className="text-gray-500 text-[14px]">Choose a colour and visual theme. You can change these later.</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Colour Palette</p>
                <div className="grid grid-cols-3 gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setWizardData((d) => ({ ...d, primaryColor: p.primary }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        wizardData.primaryColor === p.primary ? "border-black" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <div className="w-full h-6 rounded-md mb-2" style={{ background: p.primary }} />
                      <p className="text-[11px] font-semibold text-gray-700">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Visual Theme</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "light", label: "Light & Clean", desc: "Modern SaaS style" },
                    { id: "dark",  label: "Dark & Bold",   desc: "Agency / premium" },
                    { id: "bold",  label: "Vibrant",       desc: "Creative & energetic" },
                    { id: "minimal", label: "Minimal",     desc: "Editorial / luxury" },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setWizardData((d) => ({ ...d, theme: t.id }))}
                      className={`p-3 text-left rounded-xl border-2 transition-all ${
                        wizardData.theme === t.id ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <p className={`text-[13px] font-bold ${wizardData.theme === t.id ? "text-white" : "text-gray-800"}`}>{t.label}</p>
                      <p className={`text-[11px] ${wizardData.theme === t.id ? "text-gray-300" : "text-gray-400"}`}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => advanceWizard({})}
                className="w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: wizardData.primaryColor || "#000" }}
              >
                ✨ Generate my website
              </button>
            </div>
          )}

          {/* Back button */}
          {wizardStep > 0 && (
            <button
              onClick={() => setWizardStep((s) => s - 1)}
              className="mt-5 text-[13px] text-gray-400 hover:text-black transition-colors"
            >
              ← Back
            </button>
          )}
          {wizardStep === 0 && (
            <button onClick={() => setView("choose")} className="mt-5 text-[13px] text-gray-400 hover:text-black transition-colors">
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Prompt (AI path — legacy direct prompt, kept for direct URL access) ──────
  if (view === "prompt" || view === "generating") return (
    <div className="h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      <style>{scrollbarStyles}</style>
      <FloatingTopBar />
      <div className="flex-1 flex items-center justify-center p-8 pt-24 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="text-white" size={22} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Describe your business</h1>
            <p className="text-gray-500 text-[15px]">The more detail you give, the better your website will be.</p>
          </div>

          <textarea
            className="w-full min-h-[160px] px-5 py-4 bg-white border border-gray-200 rounded-2xl text-[14px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
            placeholder="Describe your business, services, target audience, and tone..."
            value={prompt} onChange={(e) => setPrompt(e.target.value)}
            disabled={view === "generating"}
          />

          {view === "prompt" && (
            <>
              {/* Visual theme */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Visual Style</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "dark",    label: "Dark",    emoji: "🌑", desc: "Agency/bold" },
                    { id: "light",   label: "Light",   emoji: "☀️", desc: "Clean/SaaS" },
                    { id: "bold",    label: "Bold",    emoji: "⚡", desc: "Vibrant/creative" },
                    { id: "minimal", label: "Minimal", emoji: "◻️", desc: "Editorial/luxury" },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAiTheme(t.id)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
                        aiTheme === t.id ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-[11px] font-bold">{t.label}</span>
                      <span className={`text-[10px] ${aiTheme === t.id ? "text-gray-300" : "text-gray-400"}`}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Example prompts */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Example prompts:</p>
                {HINTS.map((h, i) => (
                  <button key={i} onClick={() => setPrompt(h)} className="w-full text-left px-4 py-3 text-[12px] text-gray-500 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:text-gray-900 transition-all">
                    {h}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "generating" ? (
            <div className="flex flex-col items-center gap-6 py-6">
              <p className="text-[16px] font-semibold text-gray-800 min-h-[26px] text-center">{LOADING_MSGS[msgIdx]}</p>

              {/* Real per-page progress from the generation job (Round 5 Ch 5.1) */}
              {genProgress && genProgress.length > 0 ? (
                <div className="w-full max-w-xs flex flex-col gap-2">
                  {genProgress.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <span className="text-[13px] font-semibold text-gray-700">{p.name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === "done"       ? "bg-green-100 text-green-700"
                        : p.status === "generating" ? "bg-purple-100 text-purple-700 animate-pulse"
                        : p.status === "failed"    ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-400"
                      }`}>
                        {p.status === "done" ? "✓ Done" : p.status === "generating" ? "Building…" : p.status === "failed" ? "Failed" : "Queued"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Skeleton block preview — shown until the plan phase completes */
                <div className="w-full max-w-xs flex flex-col gap-3">
                  {[
                    { w: "100%", h: 120 }, { w: "70%",  h: 14 },
                    { w: "50%",  h: 14  }, { w: "100%", h: 80 },
                    { w: "85%",  h: 14  }, { w: "60%",  h: 14 },
                    { w: "100%", h: 60  },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        width: s.w, height: s.h, borderRadius: 8,
                        background: "#e5e7eb",
                        animation: `pulse 1.8s ease-in-out ${i * 0.1}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
              <p className="text-[12px] text-gray-400">This usually takes 30–60 seconds</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setView("choose")} className="px-5 py-4 text-[13px] font-semibold text-gray-500 hover:text-black border border-gray-200 rounded-2xl hover:border-gray-400 transition-all">
                ← Back
              </button>
              <button onClick={handleGenerate} disabled={!prompt.trim()} className="flex-1 py-4 bg-black text-white rounded-2xl text-[14px] font-bold hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">
                Generate Website →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Editor ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden font-sans">
      <style>{scrollbarStyles}</style>

      {/* ═══ Top Bar ═══ */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 flex-shrink-0 z-40 relative">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-2">
          <div className="w-7 h-7 bg-[#6344d4] rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="text-white" size={13} />
          </div>
          <span className="text-[13px] font-bold text-gray-900 tracking-tight">LHRWEB</span>
          <span className="text-[9px] font-bold bg-purple-100 text-[#6344d4] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Page dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowPageDropdown(v => !v)}
            className="h-8 flex items-center gap-2 px-3 rounded-lg text-[12px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            <span className="max-w-[140px] truncate">{selectedPage?.name ?? "Select page"}</span>
            <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${showPageDropdown ? "rotate-180" : ""}`} />
          </button>

          {showPageDropdown && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowPageDropdown(false)} />
              <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl shadow-black/10 py-1 min-w-[200px]">
                {project?.pages.map((p) => (
                  <div key={p.id} className="group/row flex items-center gap-1 px-1">
                    {renamingPageId === p.id ? (
                      <input
                        autoFocus
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={() => { if (renameInput.trim()) handleRenamePage(p.id, renameInput); else setRenamingPageId(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && renameInput.trim()) handleRenamePage(p.id, renameInput);
                          if (e.key === "Escape") setRenamingPageId(null);
                        }}
                        className="flex-1 h-8 px-2 text-[12px] font-semibold bg-white border border-[#6344d4] rounded-lg focus:outline-none my-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        onClick={() => { selectPage(project, p.id); setShowPageDropdown(false); }}
                        className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-medium transition-colors text-left ${
                          selectedId === p.id ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">/{p.slug}</span>
                      </button>
                    )}
                    {renamingPageId !== p.id && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenamingPageId(p.id); setRenameInput(p.name); }}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Rename"
                        >
                          <Pencil size={11} />
                        </button>
                        {isPro && (project?.pages.length ?? 0) > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPageDropdown(false); handleDeletePage(p.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Delete page"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isPro && (
                  <>
                    <div className="h-px bg-gray-100 mx-2 my-1" />
                    {showAddPage ? (
                      <div className="flex items-center gap-1.5 px-2 pb-1">
                        <input
                          autoFocus
                          className="flex-1 h-8 px-2 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#6344d4]"
                          placeholder="Page name..."
                          value={newPageName}
                          onChange={(e) => setNewPageName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { handleAddPage(); setShowPageDropdown(false); } if (e.key === "Escape") setShowAddPage(false); }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button onClick={() => { handleAddPage(); setShowPageDropdown(false); }} className="h-8 px-2.5 bg-black text-white text-[11px] font-bold rounded-lg hover:bg-gray-900 transition-all">Add</button>
                        <button onClick={() => setShowAddPage(false)} className="h-8 w-6 flex items-center justify-center text-gray-400 hover:text-gray-700"><X size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAddPage(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={13} /> Add page
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {!saved && !saving && (
          <span className="text-[10px] text-gray-400">• Unsaved</span>
        )}

        <div className="flex-1" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
          <History size={15} />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors rotate-180">
          <History size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Device switcher */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
          {([
            { id: "desktop", icon: <Monitor size={13} />, label: "Desktop" },
            { id: "tablet",  icon: <Tablet size={13} />,  label: "Tablet" },
            { id: "mobile",  icon: <Smartphone size={13} />, label: "Mobile" },
          ] as const).map(({ id, icon, label }) => (
            <button
              key={id}
              title={label}
              onClick={() => setCanvasViewport(id)}
              className={`h-6 w-8 flex items-center justify-center rounded-md transition-all ${canvasViewport === id ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Canvas mode toggle */}
        {(
          <>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => { setCanvasModeState("flow"); setSaved(false); }}
                className={`h-6 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-semibold transition-all ${canvasMode === "flow" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                title="Flow canvas"
              ><Columns2 size={11} /> Flow</button>
              <button
                onClick={() => { setCanvasModeState("free"); setSaved(false); }}
                className={`h-6 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-semibold transition-all ${canvasMode === "free" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                title="Free canvas (Figma-like)"
              ><Layout size={11} /> Free</button>
            </div>
          </>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Preview */}
        <button
          onClick={() => { if (project) { const slug = selectedPage?.slug ?? "home"; window.open(`/builder/preview?id=${project._id}&page=${slug}`, "_blank"); } }}
          className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Eye size={13} /> Preview
        </button>

        {/* SEO (Round 5 Ch 5.2) */}
        <button onClick={() => setShowSeoModal(true)}
          className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Page SEO metadata"
        >
          <SearchIcon size={13} /> SEO
        </button>

        {/* AI Theme (Round 5 Ch 8.1) */}
        <button onClick={() => setShowThemeModal(true)}
          className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="AI theme suggestion"
        >
          <Palette size={13} /> Theme
        </button>

        {/* Export */}
        <button onClick={() => setShowExport(true)}
          className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Download size={13} /> Export
        </button>

        {/* Save / Publish */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`h-8 px-4 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            saveFailed ? "bg-red-500 text-white hover:bg-red-600" :
            saved ? "bg-green-500 text-white" : "bg-[#6344d4] text-white hover:opacity-90"
          }`}
        >
          {saving ? "Saving…" : saveFailed ? "Retry" : saved ? "Saved ✓" : "Publish"}
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Dashboard */}
        <Link href="/dashboard"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Dashboard"
        >
          <Blocks size={15} />
        </Link>
        <button onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </header>

      {/* ── Save Failure Persistent Banner (ER-01) ── */}
      {saveFailed && (
        <div className="h-10 bg-red-500 text-white flex items-center justify-between px-6 text-[13px] font-semibold flex-shrink-0">
          <span>Unable to save. Your work is preserved in this tab — don&apos;t close it.</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1 bg-white text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-50 transition-colors"
          >
            {saving ? "Retrying…" : "Retry Save"}
          </button>
        </div>
      )}

      {/* ═══ Editor Area ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Icon Rail (flow mode only) ── */}
        {canvasMode !== "free" && (
        <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center pt-2 pb-2 gap-0.5 flex-shrink-0 z-30">
          {([
            { id: "add",    Icon: Plus,    label: "Add"    },
            { id: "ai",     Icon: Sparkles, label: "AI"   },
            { id: "layers", Icon: Layers,  label: "Layers" },
            { id: "design", Icon: Layout,  label: "Design" },
            { id: "styles", Icon: Palette, label: "Styles" },
          ] as const).map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(activeTab === id ? null : id)}
              className={`w-11 h-[50px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                activeTab === id
                  ? "bg-[#6344d4]/10 text-[#6344d4]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold">{label}</span>
            </button>
          ))}
        </div>
        )}

        {/* ── Left Panel (flow mode only) ── */}
        {canvasMode !== "free" && activeTab !== null && (
          <div className="w-[300px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">

            {/* Panel Header (for non-Add tabs) */}
            {activeTab !== "add" && (
              <div className="h-10 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
                <span className="text-[12px] font-bold text-gray-800">
                  {activeTab === "ai" ? "AI Assistant" : activeTab === "layers" ? "Layers" : activeTab === "styles" ? "Styles" : activeTab === "design" ? "Sections" : ""}
                </span>
                <button onClick={() => setActiveTab(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">

              {/* AI Chat */}
              {activeTab === "ai" && (
                <div className="flex flex-col h-full">
                  <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                    {["Build a homepage","Add a services section","Create a pricing page","Add team members","Add an FAQ section","Add a contact form"].map((s) => (
                      <button key={s} onClick={() => setChatInput(s)} className="px-3 py-1.5 bg-purple-50 text-[#6344d4] text-[11px] font-semibold rounded-full hover:bg-purple-100 transition-colors">{s}</button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                    {chatMessages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="w-6 h-6 bg-[#6344d4] rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                            <Sparkles size={12} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${m.role === "user" ? "bg-black text-white rounded-br-sm" : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="w-6 h-6 bg-[#6344d4] rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <Sparkles size={12} className="text-white" />
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                          {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-white">
                    <div className="flex items-end gap-2">
                      <textarea
                        rows={1}
                        value={chatInput}
                        onChange={(e) => { setChatInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiGenerate(); } }}
                        disabled={chatLoading}
                        placeholder="Describe what you want on this page…"
                        className="flex-1 resize-none px-3.5 py-2.5 bg-gray-50 rounded-2xl text-[12px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6344d4]/20 transition-all disabled:opacity-50 overflow-hidden"
                        style={{ minHeight: "42px" }}
                      />
                      <button
                        onClick={handleAiGenerate}
                        disabled={!chatInput.trim() || chatLoading}
                        className="w-9 h-9 bg-[#6344d4] rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {chatLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
                  </div>
                </div>
              )}

              {/* Design (blocks / sections) */}
              {activeTab === "design" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                  <div className="p-4 space-y-1.5">
                    {blocks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                          <Layout size={20} className="text-gray-300" />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-500">No sections yet</p>
                        <p className="text-[11px] text-gray-400 max-w-[180px]">Click &quot;Add Section&quot; below or use AI</p>
                      </div>
                    )}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks.map((block, idx) => (
                          <SectionRow
                            key={block.id}
                            block={block} index={idx} total={blocks.length}
                            isSelected={editingBlockId === block.id}
                            isRegenerating={regenBlockId === block.id}
                            onSelect={() => { setEditingBlockId((prev) => prev === block.id ? null : block.id); }}
                            onDelete={() => deleteBlock(block.id)}
                            onMove={(d) => moveBlock(block.id, d)}
                            onRegen={() => handleRegenBlock(block.id)}
                            onSave={() => { setSaveModal({ type: "section", data: block }); setSaveName(BLOCK_LABELS[block.type] ?? block.type); }}
                            onCustomize={() => {
                              const newEls = blockToElements(block);
                              setElements((prev) => [...prev, ...newEls]);
                              setBlocks((bs) => bs.filter((b) => b.id !== block.id));
                              setCanvasModeState("free");
                              setSelectedElementId(newEls[0]?.id ?? null);
                              setActiveTab("layers");
                              setSaved(false);
                            }}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => { setAddPanelTab("sections"); setActiveTab("add"); }}
                      className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-gray-400 hover:border-[#6344d4]/30 hover:text-[#6344d4] transition-all"
                    >
                      <Plus size={14} /> Add Section
                    </button>
                  </div>
                </div>
              )}

              {/* Layers */}
              {activeTab === "layers" && canvasMode === "flow" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                  <div className="p-4 space-y-1.5">
                    {blocks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                          <Layout size={20} className="text-gray-300" />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-500">No sections yet</p>
                        <p className="text-[11px] text-gray-400 max-w-[180px]">Click &quot;Add Section&quot; below or use AI</p>
                      </div>
                    )}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks.map((block, idx) => (
                          <SectionRow
                            key={block.id}
                            block={block} index={idx} total={blocks.length}
                            isSelected={editingBlockId === block.id}
                            isRegenerating={regenBlockId === block.id}
                            onSelect={() => { setEditingBlockId((prev) => prev === block.id ? null : block.id); }}
                            onDelete={() => deleteBlock(block.id)}
                            onMove={(d) => moveBlock(block.id, d)}
                            onRegen={() => handleRegenBlock(block.id)}
                            onSave={() => { setSaveModal({ type: "section", data: block }); setSaveName(BLOCK_LABELS[block.type] ?? block.type); }}
                            onCustomize={() => {
                              const newEls = blockToElements(block);
                              setElements((prev) => [...prev, ...newEls]);
                              setBlocks((bs) => bs.filter((b) => b.id !== block.id));
                              setCanvasModeState("free");
                              setSelectedElementId(newEls[0]?.id ?? null);
                              setActiveTab("layers");
                              setSaved(false);
                            }}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => { setAddPanelTab("sections"); setActiveTab("add"); }}
                      className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-gray-400 hover:border-[#6344d4]/30 hover:text-[#6344d4] transition-all"
                    >
                      <Plus size={14} /> Add Section
                    </button>
                  </div>
                </div>
              )}

              {/* Styles */}
              {activeTab === "styles" && (
                <StylesPanel
                  classes={classes}
                  tokens={tokens}
                  onClassesChange={(c) => { setClasses(c); setSaved(false); }}
                  onTokensChange={(t) => { setTokens(t); setSaved(false); }}
                />
              )}

              {/* Add Panel */}
              {activeTab === "add" && (
                <AddPanel
                  inline
                  defaultTab={addPanelTab}
                  primaryColor={project?.primaryColor}
                  onAddSection={(comp) => {
                    handleAddComponent(comp);
                    setActiveTab("design");
                  }}
                  onAddElement={(element) => {
                    setElements((prev) => [...prev, element]);
                    setSaved(false);
                    setSelectedElementId(element.id);
                    setActiveTab("layers");
                  }}
                  onAiGenerate={handleAddPanelGenerate}
                  onClose={() => setActiveTab(null)}
                  onElementDragStart={(type) => setPanelDragType(type)}
                  onElementDragEnd={() => setPanelDragType(null)}
                  savedSections={savedSections}
                  components={components}
                  onUseComponent={handlePlaceComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onUseDesign={handleUseDesign}
                />
              )}

            </div>
          </div>
        )}

        {/* ── Free mode: Figma-like left Layers panel ── */}
        {canvasMode === "free" && (
          <div style={{ width: 240, flexShrink: 0, background: "#ffffff", borderRight: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ── Pages section ── */}
            <div style={{ flexShrink: 0, borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 5px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.09em", textTransform: "uppercase" }}>Pages</span>
                <button onClick={() => setShowAddPage(true)} title="Add page" style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", fontSize: 15, lineHeight: 1 }}>+</button>
              </div>
              <div style={{ padding: "0 6px 6px" }}>
                {project?.pages.map((p) => (
                  <button key={p.id} onClick={() => selectPage(project, p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, width: "100%",
                      padding: "5px 7px", borderRadius: 5, border: "none", cursor: "pointer",
                      background: selectedId === p.id ? "rgba(99,68,212,0.1)" : "transparent",
                      color: selectedId === p.id ? "#6344d4" : "rgba(0,0,0,0.55)",
                      fontSize: 12, fontWeight: selectedId === p.id ? 600 : 400, textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    {selectedId === p.id && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6344d4", flexShrink: 0, display: "inline-block" }} />}
                  </button>
                ))}
                {showAddPage && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
                    <input
                      autoFocus
                      style={{ flex: 1, height: 28, padding: "0 8px", fontSize: 12, border: "1px solid #6344d4", borderRadius: 5, outline: "none" }}
                      placeholder="Page name..."
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddPage(); if (e.key === "Escape") setShowAddPage(false); }}
                    />
                    <button onClick={handleAddPage} style={{ height: 28, padding: "0 8px", background: "#111", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel header */}
            <div style={{ height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", borderBottom: "1px solid #f0f0f0" }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 1, background: "rgba(0,0,0,0.05)", borderRadius: 6, padding: 2 }}>
                {(["layers", "add", "assets"] as const).map((t) => {
                  const isActive = activeTab === t || (t === "layers" && activeTab !== "add" && activeTab !== "assets");
                  return (
                    <button key={t} onClick={() => setActiveTab(isActive ? "layers" : t)}
                      style={{
                        padding: "3px 9px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600,
                        background: isActive ? "#ffffff" : "transparent",
                        color: isActive ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.35)",
                        textTransform: "capitalize", whiteSpace: "nowrap",
                        boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                      }}
                    >{t === "add" ? "Elements" : t === "assets" ? "Assets" : "Layers"}</button>
                  );
                })}
              </div>
              {/* Add element quick-button (only on Layers tab) */}
              {activeTab !== "add" && activeTab !== "assets" && (
                <button
                  onClick={() => { setElements((prev) => { const el = createElement("div"); return [...prev, { ...el, layout: { x: 40, y: 40 + prev.length * 20, width: 400, height: 120 } }]; }); setSaved(false); }}
                  title="Add element"
                  style={{ width: 22, height: 22, borderRadius: 5, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                >+</button>
              )}
            </div>

            {/* Layers content — frames + free elements */}
            {activeTab !== "add" && activeTab !== "assets" && (
              <CanvasLayersPanel
                frames={frames}
                freeElements={elements}
                selectedFrameId={selectedFrameId}
                selectedFrameElementIds={selectedFrameElementIds}
                selectedElementId={selectedElementId}
                onSelectFrame={(id) => {
                  setSelectedFrameId(id);
                  setSelectedFrameElementIds([]);
                  setSelectedElementId(null);
                }}
                onSelectFrameElement={(frameId, elementId, multi) => {
                  setSelectedFrameId(frameId);
                  setSelectedElementId(null);
                  if (multi) {
                    setSelectedFrameElementIds(prev =>
                      prev.includes(elementId) ? prev.filter(x => x !== elementId) : [...prev, elementId]
                    );
                  } else {
                    setSelectedFrameElementIds([elementId]);
                  }
                }}
                onSelectElement={(id) => {
                  setSelectedElementId(id);
                  setSelectedFrameId(null);
                  setSelectedFrameElementIds([]);
                }}
                onReorderFrames={(reordered) => { setFrames(reordered); setSaved(false); }}
                onDeleteFrame={handleDeleteFrame}
                onRenameFrame={handleRenameFrame}
              />
            )}

            {/* Add Elements content */}
            {activeTab === "add" && (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <AddPanel
                  inline
                  defaultTab="elements"
                  primaryColor={project?.primaryColor}
                  onAddElement={(element) => {
                    const withLayout = { ...element, layout: { x: 40, y: 40 + elements.length * 20, width: 400, height: 120 } };
                    setElements((prev) => [...prev, withLayout]);
                    setSaved(false);
                    setSelectedElementId(withLayout.id);
                    setActiveTab("layers");
                  }}
                  onAddSection={() => {}}
                  onAiGenerate={handleAddPanelGenerate}
                  onClose={() => setActiveTab("layers")}
                  onElementDragStart={(type) => setPanelDragType(type)}
                  onElementDragEnd={() => setPanelDragType(null)}
                  savedSections={savedSections}
                  components={components}
                  onUseComponent={handlePlaceComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onUseDesign={handleUseDesign}
                />
              </div>
            )}

            {/* Assets — saved sections from converted frames */}
            {activeTab === "assets" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "6px 4px" }}>
                {savedSections.length === 0 ? (
                  <div style={{ padding: "24px 12px", textAlign: "center" }}>
                    <Zap size={20} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 8px", display: "block" }} />
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.6, margin: 0 }}>
                      Select a frame and click<br /><strong style={{ color: "rgba(123,110,245,0.7)" }}>⚡ Convert to Section</strong>
                    </p>
                  </div>
                ) : savedSections.map(sec => (
                  <div key={sec.id} style={{ margin: "0 2px 6px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <div style={{ padding: "7px 9px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Zap size={11} color="#7B6EF5" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec.name}</span>
                      <button
                        onClick={() => {
                          setSavedSections(prev => prev.filter(s => s.id !== sec.id));
                          fetch(`${API}/api/builder/project/sections/${sec.id}?projectId=${project?._id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => {});
                        }}
                        style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "rgba(239,68,68,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Remove section"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div style={{ padding: "0 9px 7px", fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "ui-monospace,monospace" }}>
                      {sec.html.length} B html · {sec.css.length} B css
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Canvas ── */}
        <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
          {/* Free canvas mode */}
          {canvasMode === "free" ? (
            <FreeCanvas
                elements={elements}
                frames={frames}
                selectedId={selectedElementId}
                selectedIds={freeSelectedIds}
                onSelect={(id, multi) => {
                  setSelectedFrameId(null);
                  if (multi) {
                    // Figma: shift+click toggles membership in the selection
                    const next = freeSelectedIds.includes(id)
                      ? freeSelectedIds.filter((x) => x !== id)
                      : [...freeSelectedIds, id];
                    setFreeSelectedIds(next);
                    setSelectedElementId(next.length === 1 ? next[0] : next.length ? id : null);
                  } else {
                    setSelectedElementId(id);
                    setFreeSelectedIds([id]);
                  }
                }}
                onDeselect={() => {
                  setSelectedElementId(null);
                  setSelectedFrameId(null);
                  setFreeSelectedIds([]);
                }}
                onLayoutChange={(id, layout) => {
                  setElements((prev) => updateElementLayout(prev, id, layout));
                  setSaved(false);
                }}
                onElementsChange={(newElements) => { setElements(newElements); setSaved(false); }}
                onAddElement={(type, x, y, w, h, rotation) => {
                  // Shape tools get styled elements with visible fills
                  let el: ElementNode;
                  if (type === "rect") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      styles: { desktop: { backgroundColor: "#E2E8F0", borderRadius: "8px" } },
                    };
                  } else if (type === "ellipse") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      styles: { desktop: { backgroundColor: "#7B6EF5", borderRadius: "50%" } },
                    };
                  } else if (type === "line") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      styles: { desktop: { backgroundColor: "#000000", height: "2px", borderRadius: "1px", width: "100%", minWidth: "1px" } },
                    };
                  } else if (type === "arrow") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      attrs: { "data-arrow": "true" },
                      styles: { desktop: { backgroundColor: "#000000", height: "2px", borderRadius: "1px", width: "100%", minWidth: "1px" } },
                    };
                  } else if (type === "polygon") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      styles: { desktop: { backgroundColor: "#7B6EF5", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" } },
                    };
                  } else if (type === "star") {
                    el = {
                      id: `el-${crypto.randomUUID().slice(0, 8)}`,
                      tag: "div" as const,
                      children: [],
                      styles: { desktop: { backgroundColor: "#F59E0B", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" } },
                    };
                  } else if (type === "image") {
                    // Open file picker for image tool
                    const input = document.createElement("input");
                    input.type = "file"; input.accept = "image/*";
                    input.onchange = () => {
                      const file = input.files?.[0]; if (!file) return;
                      const url = URL.createObjectURL(file);
                      const imgEl: ElementNode = {
                        id: `el-${crypto.randomUUID().slice(0, 8)}`,
                        tag: "img" as const,
                        attrs: { src: url, alt: "Image" },
                        children: [],
                        styles: { desktop: { width: "100%", height: "100%", objectFit: "cover" } },
                        layout: { x, y, width: w ?? 400, height: h ?? 300 },
                      };
                      const hitFrame = findFrameAtPoint(x, y);
                      if (hitFrame) {
                        const frEl = { ...imgEl, layout: { ...imgEl.layout!, x: Math.round(x - hitFrame.canvasX), y: Math.round(y - hitFrame.canvasY) } };
                        setFrames(prev => prev.map(f => f.id === hitFrame.id ? { ...f, children: [...f.children, frEl] } : f));
                        setSelectedFrameId(hitFrame.id); setSelectedFrameElementIds([frEl.id]);
                      } else {
                        setElements(prev => [...prev, imgEl]);
                        setSelectedElementId(imgEl.id);
                      }
                      setSaved(false);
                    };
                    input.click();
                    setActiveTool("move");
                    return;
                  } else {
                    el = createElement(type);
                  }
                  const SIZE_MAP: Record<string, { w: number; h: number }> = {
                    section:   { w: 1200, h: 400 },
                    heading:   { w: 600,  h: 80  },
                    paragraph: { w: 500,  h: 100 },
                    button:    { w: 200,  h: 50  },
                    image:     { w: 400,  h: 300 },
                    video:     { w: 640,  h: 360 },
                    form:      { w: 420,  h: 320 },
                    grid:      { w: 800,  h: 240 },
                    flex:      { w: 600,  h: 120 },
                    rect:      { w: 200,  h: 200 },
                    ellipse:   { w: 200,  h: 200 },
                    polygon:   { w: 200,  h: 200 },
                    star:      { w: 200,  h: 200 },
                    line:      { w: 100,  h: 2  },
                    arrow:     { w: 100,  h: 2  },
                  };
                  const sz = SIZE_MAP[type] ?? { w: 400, h: 120 };
                  const elW = w ?? sz.w;
                  const elH = h ?? sz.h;

                  // Phase 5: hit-test — route to frame if point lands inside one
                  const hitFrame = findFrameAtPoint(x, y);
                  const baseLayout: FreeLayout = { x: 0, y: 0, width: elW, height: elH };
                  if (rotation !== undefined) baseLayout.rotation = rotation;
                  if (hitFrame) {
                    const relX = Math.round(x - hitFrame.canvasX);
                    const relY = Math.round(y - hitFrame.canvasY);
                    const frameEl = { ...el, layout: { ...baseLayout, x: relX, y: relY } };
                    setFrames(prev => prev.map(f =>
                      f.id === hitFrame.id ? { ...f, children: [...f.children, frameEl] } : f
                    ));
                    setSelectedFrameElementIds([frameEl.id]);
                    setSelectedFrameId(hitFrame.id);
                    setSelectedElementId(null);
                  } else {
                    const elWithLayout = { ...el, layout: { ...baseLayout, x, y } };
                    setElements((prev) => [...prev, elWithLayout]);
                    setSelectedElementId(elWithLayout.id);
                    setSelectedFrameElementIds([]);
                  }
                  setSaved(false);
                }}
                onUpdateContent={(id, content) => {
                  setElements((prev) => updateElementContent(prev, id, content));
                  setSaved(false);
                }}
                onAddPen={(svg, x, y, w, h) => {
                  const penEl: ElementNode = {
                    id: `el-${crypto.randomUUID().slice(0, 8)}`,
                    tag: "div" as const,
                    attrs: { "data-svg": svg },
                    children: [],
                    styles: { desktop: { width: "100%", height: "100%" } },
                    layout: { x, y, width: w, height: h },
                  };
                  const hitFrame = findFrameAtPoint(x, y);
                  if (hitFrame) {
                    const relX = Math.round(x - hitFrame.canvasX);
                    const relY = Math.round(y - hitFrame.canvasY);
                    const frEl = { ...penEl, layout: { ...penEl.layout!, x: relX, y: relY } };
                    setFrames(prev => prev.map(f =>
                      f.id === hitFrame.id ? { ...f, children: [...f.children, frEl] } : f
                    ));
                    setSelectedFrameId(hitFrame.id);
                    setSelectedFrameElementIds([frEl.id]);
                  } else {
                    setElements(prev => [...prev, penEl]);
                    setSelectedElementId(penEl.id);
                  }
                  setSaved(false);
                }}
                onAddFrame={handleAddFrame}
                onViewportChange={(zoom) => setCanvasZoom(zoom)}
                tool={activeTool}
                onToolChange={setActiveTool}
                frameChildren={frames.map(frame => (
                  <FrameComponent
                    key={frame.id}
                    frame={frame}
                    isSelected={selectedFrameId === frame.id}
                    scale={canvasZoom}
                    onSelect={() => {
                      setSelectedFrameId(frame.id);
                      setSelectedElementId(null);
                      setSelectedFrameElementIds([]);
                      setFreeSelectedIds([]);
                    }}
                    onRename={(name) => handleRenameFrame(frame.id, name)}
                    onResize={(w, h) => handleResizeFrame(frame.id, w, h)}
                    onMove={(x, y) => handleMoveFrame(frame.id, x, y)}
                    onPublish={publishFrameToPage}
                  >
                    <FrameContent
                      elements={frame.children}
                      selectedIds={selectedFrameId === frame.id ? selectedFrameElementIds : []}
                      scale={canvasZoom}
                      layoutMode={frame.layoutMode ?? "none"}
                      gap={frame.gap ?? 0}
                      paddingTop={frame.paddingTop ?? 0}
                      paddingRight={frame.paddingRight ?? 0}
                      paddingBottom={frame.paddingBottom ?? 0}
                      paddingLeft={frame.paddingLeft ?? 0}
                      justifyContent={frame.justifyContent}
                      alignItems={frame.alignItems}
                      gridColumns={frame.gridColumns ?? 3}
                      onSelect={(id, multi) => {
                        setSelectedFrameId(frame.id);
                        setSelectedElementId(null);
                        setFreeSelectedIds([]);
                        setSelectedFrameElementIds(prev =>
                          multi
                            ? prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                            : [id]
                        );
                      }}
                      onDeselect={() => setSelectedFrameElementIds([])}
                      onSelectAll={() => setSelectedFrameElementIds(frame.children.map(c => c.id))}
                      onLayoutChange={(id, layout) => handleFrameChildLayoutChange(frame.id, id, layout)}
                      onElementsChange={(els) => handleUpdateFrameChildren(frame.id, els)}
                      onUpdateContent={(id, content) => handleFrameChildContentChange(frame.id, id, content)}
                      onDeleteSelected={() => {
                        const ids = new Set(selectedFrameElementIds);
                        handleUpdateFrameChildren(frame.id, frame.children.filter(c => !ids.has(c.id)));
                        setSelectedFrameElementIds([]);
                      }}
                      onNudge={(dx, dy) => {
                        const ids = new Set(selectedFrameElementIds);
                        setFrames(prev => prev.map(f => {
                          if (f.id !== frame.id) return f;
                          return { ...f, children: f.children.map(c =>
                            ids.has(c.id)
                              ? { ...c, layout: { ...(c.layout ?? { x:0,y:0,width:200,height:60 }), x: (c.layout?.x ?? 0) + dx, y: (c.layout?.y ?? 0) + dy } }
                              : c
                          )};
                        }));
                        setSaved(false);
                      }}
                    />
                  </FrameComponent>
                ))}
                saved={saved}
                saving={saving}
                onSave={handleSave}
                onNewFrame={handleNewFrameFromPreset}
                onRegisterPaste={fn => { internalPasteRef.current = fn; }}
                onCreateComponent={handleCreateComponent}
                onSwapComponent={(el) => setSwapTarget(el)}
              />
          ) : (
            <div className="flex-1 overflow-y-auto p-8 bg-[#F3F4F6] custom-scrollbar flex flex-col items-center">
              {/* Browser Frame */}
              <div className={`bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col border border-white h-full transition-all duration-300 ${canvasViewport === "mobile" ? "w-[375px]" : canvasViewport === "tablet" ? "w-[768px]" : "w-full"}`}>
                {/* Browser Header */}
                <div className="h-12 bg-[#F9FAFB] border-b border-gray-100 flex items-center px-8 flex-shrink-0">
                  <div className="flex items-center gap-1.5 mr-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/30" />
                  </div>
                  <div className="flex-1 max-w-sm h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center px-4">
                    <span className="text-[11px] font-mono text-gray-300">yourdomain.com/{selectedPage?.slug === "home" ? "" : selectedPage?.slug}</span>
                  </div>
                </div>

                {/* Render Area */}
                <div
                  className="flex-1 overflow-y-auto bg-white relative"
                  onDragOver={(e) => { if (panelDragType) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData("text/plain") || panelDragType;
                    if (!type) return;
                    const el = createElement(type);
                    setElements((prev) => [...prev, el]);
                    setSelectedElementId(el.id);
                    setSaved(false);
                    setPanelDragType(null);
                  }}
                >
                  {/* Drop overlay — sits above the iframe so drag events aren't swallowed by it */}
                  {panelDragType && (
                    <div
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-auto"
                      style={{ background: "rgba(99,68,212,0.06)", border: "2px dashed #6344d4" }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; }}
                      onDrop={async (e) => {
                        e.preventDefault(); e.stopPropagation();
                        const type = e.dataTransfer.getData("text/plain") || panelDragType;
                        if (!type) return;
                        const newEl = createElement(type);
                        const iframe = canvasIframeRef.current;
                        if (iframe?.contentWindow) {
                          const rect = iframe.getBoundingClientRect();
                          const result = await new Promise<{ id: string | null; position: string }>((resolve) => {
                            dropResolveRef.current = resolve;
                            iframe.contentWindow!.postMessage(
                              { type: "FIND_AT_POINT", x: e.clientX - rect.left, y: e.clientY - rect.top },
                              "*"
                            );
                            setTimeout(() => {
                              if (dropResolveRef.current) {
                                dropResolveRef.current({ id: null, position: "append" });
                                dropResolveRef.current = null;
                              }
                            }, 500);
                          });
                          setElements((prev) =>
                            insertElementNear(prev, result.id, newEl, result.position as "before" | "after" | "inside" | "append")
                          );
                        } else {
                          setElements((prev) => [...prev, newEl]);
                        }
                        setSelectedElementId(newEl.id);
                        setSaved(false);
                        setPanelDragType(null);
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#6344d4] flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Plus size={22} className="text-white" />
                      </div>
                      <p className="text-[14px] font-bold text-[#6344d4]">Drop to add <span className="capitalize">{panelDragType}</span></p>
                      <p className="text-[11px] text-[#6344d4]/60">Release to place on canvas</p>
                    </div>
                  )}
                  <BlockPreview
                    blocks={blocks}
                    primaryColor={project?.primaryColor}
                    onSelectBlock={(id) => {
                      setEditingBlockId((prev) => prev === id ? null : id);
                      setActiveTab("design");
                      setHasClickedBlock(true);
                    }}
                    selectedBlockId={editingBlockId ?? undefined}
                    onUpdateBlockContent={(blockId, newContent) => {
                      setBlocks((bs) => bs.map((b) => b.id === blockId ? { ...b, content: newContent } : b));
                      setSaved(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ── Free mode: Figma-like right Properties panel (always visible) ── */}
        {canvasMode === "free" && (() => {
          // Free element or frame child — whichever is selected
          const freeEl = selectedElementId ? findElementById(elements, selectedElementId) : null;
          const activeFrame = selectedFrameId ? frames.find(f => f.id === selectedFrameId) ?? null : null;
          const frameEl = (activeFrame && selectedFrameElementIds.length === 1)
            ? activeFrame.children.find(c => c.id === selectedFrameElementIds[0]) ?? null
            : null;
          const el = freeEl ?? frameEl;
          const isFrameEl = !freeEl && !!frameEl;

          return (
            <div style={{ width: 260, flexShrink: 0, background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Panel header */}
              <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid #f0f0f0" }}>
                {el ? (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.75)", fontFamily: "ui-monospace, monospace" }}>
                      {isFrameEl && <span style={{ fontSize: 9, color: "#6344d4", marginRight: 5 }}>{activeFrame?.name} /</span>}
                      &lt;{el.tag}&gt;
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {!isFrameEl && (
                        <button
                          onClick={() => { setSaveModal({ type: "element", data: el }); setSaveName(el.tag); }}
                          title="Save element"
                          style={{ height: 26, padding: "0 8px", borderRadius: 5, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}
                        >
                          <Bookmark size={10} /> Save
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (isFrameEl && activeFrame) {
                            handleUpdateFrameChildren(activeFrame.id, activeFrame.children.filter(c => c.id !== el.id));
                            setSelectedFrameElementIds([]);
                          } else {
                            setElements((prev) => deleteFromTree(prev, selectedElementId!));
                            setSelectedElementId(null);
                          }
                          setSaved(false);
                        }}
                        title="Delete element"
                        style={{ height: 26, width: 26, borderRadius: 5, border: "1px solid rgba(220,38,38,0.25)", cursor: "pointer", background: "rgba(220,38,38,0.08)", color: "rgba(239,68,68,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </>
                ) : selectedFrameElementIds.length > 1 ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>{selectedFrameElementIds.length} elements</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Design</span>
                )}
              </div>

              {el ? (
                <CanvasPropertiesPanel
                  element={el}
                  breakpoint={canvasViewport}
                  layoutContext={isFrameEl && (activeFrame?.layoutMode ?? "none") !== "none" ? "auto" : "free"}
                  layout={{
                    x: Math.round(el.layout?.x ?? 0),
                    y: Math.round(el.layout?.y ?? 0),
                    width: Math.round(el.layout?.width ?? 200),
                    height: Math.round(el.layout?.height ?? 60),
                  }}
                  onLayoutChange={(field, num) => {
                    const layout = el.layout ?? { x: 0, y: 0, width: 400, height: 120 };
                    if (isFrameEl && activeFrame) {
                      handleFrameChildLayoutChange(activeFrame.id, el.id, { ...layout, [field]: num });
                    } else {
                      setElements((prev) => updateElementLayout(prev, el.id, { ...layout, [field]: num }));
                    }
                    setSaved(false);
                  }}
                  onStyleChange={(prop, val) => {
                    if (isFrameEl && activeFrame) {
                      setFrames(prev => prev.map(f => {
                        if (f.id !== activeFrame.id) return f;
                        return { ...f, children: f.children.map(c =>
                          c.id === el.id
                            ? { ...c, styles: { ...c.styles, [canvasViewport]: { ...(c.styles?.[canvasViewport] ?? {}), [prop]: val } } }
                            : c
                        )};
                      }));
                    } else {
                      setElements(prev =>
                        updateElementStyle(prev, el.id, canvasViewport, prop, val)
                      );
                    }
                    setSaved(false);
                  }}
                  onContentChange={(content) => {
                    if (isFrameEl && activeFrame) {
                      handleFrameChildContentChange(activeFrame.id, el.id, content);
                    } else {
                      setElements(prev => updateElementContent(prev, el.id, content));
                    }
                    setSaved(false);
                  }}
                />
              ) : activeFrame ? (
                /* ── Frame selected (no child element) — Figma-style panel ── */
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  <FramePropertiesPanel
                    frame={activeFrame}
                    onChange={patch => {
                      setFrames(prev => prev.map(f => f.id === activeFrame.id ? { ...f, ...patch } : f));
                      setSaved(false);
                    }}
                  />
                  {/* Convert to Section */}
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
                    <button
                      onClick={() => setConvertingFrame(activeFrame)}
                      style={{
                        width: "100%", padding: "8px 14px", borderRadius: 8,
                        border: "1px solid rgba(99,68,212,0.4)",
                        background: "rgba(99,68,212,0.08)", cursor: "pointer",
                        color: "#6344d4", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <Zap size={12} />
                      Convert to Section
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Nothing selected — canvas defaults ── */
                <div style={{ flex: 1, overflow: "hidden auto" }}>
                  <div style={{ padding: "24px 16px", textAlign: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" style={{ margin: "0 auto 10px", display: "block" }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9"/>
                    </svg>
                    <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", lineHeight: 1.6, margin: 0 }}>
                      Select an element or frame to edit its properties
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>


      {/* ═══ Overlays ═══ */}
      {/* ── Save Component / Template modal ── */}
      {saveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setSaveModal(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-80 p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-bold text-gray-900">
              {saveModal.type === "section" ? "Save Section as Template" : "Save as Component"}
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</label>
              <input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveName.trim()) {
                    if (saveModal.type === "section") saveSection(saveModal.data as Block, saveName.trim());
                    else saveElementComponent(saveModal.data as ElementNode, saveName.trim());
                    setSaveModal(null);
                  }
                  if (e.key === "Escape") setSaveModal(null);
                }}
                className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-[#6344d4] focus:ring-2 focus:ring-[#6344d4]/10"
                placeholder="e.g. My Hero Section"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSaveModal(null)} className="flex-1 py-2 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">Cancel</button>
              <button
                disabled={!saveName.trim()}
                onClick={() => {
                  if (saveModal.type === "section") saveSection(saveModal.data as Block, saveName.trim());
                  else saveElementComponent(saveModal.data as ElementNode, saveName.trim());
                  setSaveModal(null);
                }}
                className="flex-1 py-2 text-[12px] font-bold text-white bg-[#6344d4] hover:opacity-90 rounded-xl transition-opacity disabled:opacity-40"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {convertingFrame && project && (
        <ConvertModal
          frame={convertingFrame}
          classes={classes}
          tokens={tokens}
          projectId={project._id}
          token={token}
          onSaved={(section) => {
            setSavedSections(prev => {
              const idx = prev.findIndex(s => s.id === section.id);
              return idx >= 0 ? prev.map((s, i) => i === idx ? section : s) : [...prev, section];
            });
          }}
          onClose={() => setConvertingFrame(null)}
        />
      )}

      {showExport && project && (
        <ExportModal
          projectId={project._id}
          businessName={project.businessName}
          elements={elements}
          classes={classes}
          tokens={tokens}
          pageTitle={project.pages.find((p) => p.id === selectedId)?.name}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Crash Recovery Dialog (Ch 1.5) ── */}
      {showRecovery && recoverySnapshot && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => {}}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={24} className="text-amber-600" />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">Unsaved work found</h2>
            <p className="text-gray-500 text-[14px] mb-6">
              We found unsaved work from{" "}
              {(() => {
                const diff = Date.now() - recoverySnapshot.timestamp;
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return "just now";
                if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
                const hrs = Math.floor(mins / 60);
                return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
              })()}
              . Would you like to restore it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (recoverySnapshot.elements) setElements(recoverySnapshot.elements);
                  if (recoverySnapshot.frames) setFrames(recoverySnapshot.frames);
                  setSaved(false);
                  setShowRecovery(false);
                  setRecoverySnapshot(null);
                  try { localStorage.removeItem(recoveryKey()); } catch {}
                  toast.success("Unsaved work restored");
                }}
                className="flex-1 py-3 bg-[#6344d4] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-all"
              >
                Restore my work
              </button>
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoverySnapshot(null);
                  try { localStorage.removeItem(recoveryKey()); } catch {}
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-200 transition-all"
              >
                Discard — use server version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI SEO / Theme modals (Round 5) ── */}
      {showSeoModal && (
        <SeoModal
          pageName={selectedPage?.name ?? "Home"}
          initial={selectedPage?.seo ?? {}}
          onGenerate={handleSeoGenerate}
          onSave={handleSeoSave}
          onClose={() => setShowSeoModal(false)}
        />
      )}
      {showThemeModal && (
        <ThemeModal
          onGenerate={handleThemeGenerate}
          onApply={handleThemeApply}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* ── Swap Component picker (Round 1 R-12b) ── */}
      {swapTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setSwapTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] max-h-[70vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-gray-900 mb-1">Swap component</p>
            <p className="text-[11px] text-gray-400 mb-4">Position is kept; size resets to the new component. Matching text edits are carried over.</p>
            <div className="flex flex-col gap-1.5">
              {components.filter((c) => c.id !== swapTarget.componentId).map((c) => (
                <button key={c.id} onClick={() => performSwap(swapTarget, c)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#6344d4]/50 text-left transition-all">
                  <span className="w-6 h-6 rounded-lg bg-[#6344d4]/10 text-[#6344d4] text-[10px] font-bold flex items-center justify-center flex-shrink-0">◆</span>
                  <span className="text-[12px] font-semibold text-gray-800 truncate">{c.name}</span>
                </button>
              ))}
              {components.filter((c) => c.id !== swapTarget.componentId).length === 0 && (
                <p className="text-[12px] text-gray-400 py-4 text-center">No other components yet — create one first (⌘⌥K).</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Variant cycling bar (Round 5 Ch 6.2) ── */}
      {blockVariants && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-2.5">
          <span className="text-[12px] font-bold text-gray-300 whitespace-nowrap">
            Version {blockVariants.index + 1} of {blockVariants.variants.length}
          </span>
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => cycleVariant(-1)} disabled={blockVariants.variants.length < 2}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all" title="Previous version">
              ◀
            </button>
            <button onClick={() => cycleVariant(1)} disabled={blockVariants.variants.length < 2}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all" title="Next version">
              ▶
            </button>
          </div>
          <button
            onClick={() => handleRegenBlock(blockVariants.blockId)}
            disabled={regenBlockId !== null || blockVariants.variants.length >= 4}
            className="ml-1 px-3 py-1.5 text-[12px] font-bold rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-all whitespace-nowrap"
          >
            {regenBlockId ? "Generating…" : "✨ Try another"}
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button onClick={applyVariant}
            className="px-4 py-1.5 text-[12px] font-bold rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-all">
            Apply
          </button>
          <button onClick={discardVariants}
            className="px-3 py-1.5 text-[12px] font-bold rounded-lg text-gray-300 hover:bg-white/10 transition-all">
            Discard
          </button>
        </div>
      )}

      {editingBlockId && (() => {
        const editBlock = blocks.find((b) => b.id === editingBlockId);
        if (!editBlock || editBlock.type === "canvas") return null;

        return (
          <BlockEditorPanel
            block={editBlock}
            onChange={(updated) => {
              setBlocks((bs) => bs.map((b) => b.id === updated.id ? updated : b));
              setSaved(false);
            }}
            onStyleChange={(styles) => {
              setBlocks((bs) => bs.map((b) => b.id === editingBlockId ? { ...b, styles } : b));
              setSaved(false);
            }}
            onClose={() => setEditingBlockId(null)}
            onRewrite={handleRewrite}
          />
        );
      })()}

      {/* Welcome overlay */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => { setShowWelcome(false); setHasClickedBlock(false); }}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-[420px] w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[48px] mb-4">✨</div>
            <h2 className="text-[24px] font-bold text-gray-900 mb-2">Your site is ready!</h2>
            <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
              We&apos;ve built a complete website based on your answers. Click any section to start customising it.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowWelcome(false); setHasClickedBlock(false); }}
                className="w-full py-3.5 bg-black text-white rounded-xl text-[14px] font-bold hover:bg-gray-900 transition-all"
              >
                Start editing →
              </button>
              <button
                onClick={() => { if (project) window.open(`/site/${project._id}`, "_blank"); setShowWelcome(false); }}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-all"
              >
                Preview live site ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-use tooltip */}
      {canvasMode !== "free" && !showWelcome && !hasClickedBlock && editingBlockId === null && blocks.length > 0 && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9997] px-5 py-3 bg-black text-white rounded-full text-[13px] font-semibold shadow-xl flex items-center gap-2"
          style={{ animation: "pulse 2.5s ease-in-out infinite" }}
        >
          <span>👆</span> Click any block on the canvas to edit it
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowShortcutsModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-gray-900">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcutsModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1.5">
              {[
                ["Ctrl + Z",         "Undo"],
                ["Ctrl + Y",         "Redo"],
                ["Ctrl + S",         "Save"],
                ["Ctrl + Shift + S", "Save"],
                ["Ctrl + A",         "Add Section"],
                ["Ctrl + D",         "Duplicate selected block"],
                ["Delete",           "Delete selected block"],
                ["↑ / ↓",            "Move block up / down"],
                ["Escape",           "Deselect / close panel"],
                ["?",                "Toggle this cheatsheet"],
              ].map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[13px] text-gray-600">{action}</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-[11px] font-mono text-gray-700 rounded-md border border-gray-200">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DragOverlay>
        {activeDragBlock && (
          <div className="bg-white border border-purple-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 opacity-90 scale-105 transition-transform">
            <span className="w-6 h-6 bg-[#6344d4] text-white text-[10px] font-bold rounded-lg flex items-center justify-center uppercase">{activeDragBlock.type[0]}</span>
            <span className="text-[13px] font-bold text-gray-900 capitalize">{activeDragBlock.type}</span>
          </div>
        )}
      </DragOverlay>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#f8f9fa]"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>}>
        <BuilderContent />
      </Suspense>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontSize: "13px", borderRadius: "12px", padding: "12px 16px" },
        }}
      />
    </ErrorBoundary>
  );
}
