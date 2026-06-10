"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Zap, Save, Plus, Trash2, LogOut, RotateCcw, Check,
  ChevronDown, ChevronUp, ArrowUp, ArrowDown, Blocks, Bot,
  Columns2, Eye, X, GripVertical, Monitor, Smartphone,
  Share2, Mic, Send, History, BarChart3, MoreHorizontal, Image as ImageIcon,
  MessageSquare, Layout, Code2, Globe, Pencil, Download,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ErrorBoundary from "./ErrorBoundary";
import ComponentPicker from "./_components/ComponentPicker";
import BlockPreview from "./_components/BlockPreview";
import CanvasEditor from "./_components/CanvasEditor";
import BlockEditorPanel from "./_components/BlockEditorPanel";
import NavItemsEditor from "./_components/NavItemsEditor";
import ExportModal from "./_components/ExportModal";
import { BLOCK_FIELDS, ITEM_FIELDS, ITEM_ARRAY_KEY, DEFAULT_ITEM, type ComponentDef, type BlockStyles, type NavItem, type CanvasData, type CanvasRow, type CanvasEl, type CanvasRowLayout } from "@/lib/builderComponents";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Block   { id: string; type: string; content: Record<string, unknown>; styles?: BlockStyles; }
interface Page    { id: string; name: string; slug: string; blocks: Block[]; }
interface Project {
  _id: string; businessName: string; tagline: string;
  primaryColor: string; package: "starter" | "pro";
  status: "empty" | "generating" | "ready"; pages: Page[]; prompt?: string;
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

function buildPersonalizedMsgs(data: WizardData): string[] {
  const name    = data.businessName || "your business";
  const type    = data.businessType || "website";
  const palette = PALETTES.find((p) => p.primary === data.primaryColor)?.label ?? "custom";
  return [
    `Building a site for ${name}…`,
    `Researching ${type} best practices…`,
    `Writing copy for ${name}…`,
    `Applying your ${palette} colour palette…`,
    `Assembling pages and finishing touches…`,
  ];
}

const HINTS = [
  "We're a family-run Italian restaurant in Lahore. Authentic pasta, pizza, and desserts — dine-in and takeaway.",
  "Freelance photography studio for weddings and corporate events based in Islamabad. Want to showcase portfolio and take bookings.",
  "Digital marketing agency in Karachi helping SMEs grow through SEO, social media, and paid advertising.",
];

// ── Convert any block to CanvasData for visual editing ────────────────────────

function uid()    { return `el-${crypto.randomUUID().slice(0, 8)}`; }
function rowUid() { return `row-${crypto.randomUUID().slice(0, 8)}`; }
function colUid() { return `col-${crypto.randomUUID().slice(0, 8)}`; }

function blockToCanvasData(block: Block): { canvas: CanvasData; name: string } {
  const fields       = BLOCK_FIELDS[block.type] ?? [];
  const itemArrayKey = ITEM_ARRAY_KEY[block.type] ?? null;
  const itemFields   = ITEM_FIELDS[block.type]   ?? [];
  const items: Record<string, unknown>[] =
    itemArrayKey && Array.isArray(block.content[itemArrayKey])
      ? (block.content[itemArrayKey] as Record<string, unknown>[])
      : [];

  const rows: CanvasRow[] = [];

  // ── Header fields row ────────────────────────────────────────────────────────
  const HEADING_KEYS = new Set(["heading", "title", "headline", "name"]);
  const SUBHEAD_KEYS = new Set(["subheading", "subtitle", "description", "tagline", "body"]);
  const BUTTON_KEYS  = new Set(["cta", "ctaText", "buttonText", "button"]);
  const LINK_KEYS    = new Set(["ctaLink", "href", "link", "url"]);
  const SKIP_KEYS    = new Set(["layout", "rows", "id", ...fields.map((f) => f.key), ...(itemArrayKey ? [itemArrayKey] : [])]);

  const mainEls: CanvasEl[] = [];

  for (const f of fields) {
    if (f.type === "nav-items" || LINK_KEYS.has(f.key)) continue;
    const val = String(block.content[f.key] ?? "").trim();
    if (!val) continue;

    if (HEADING_KEYS.has(f.key)) {
      mainEls.push({ id: uid(), type: "heading", content: val,
        props: { size: "xl", align: "left", fontWeight: "bold", textColor: "#111111" } });
    } else if (SUBHEAD_KEYS.has(f.key) || f.type === "textarea") {
      mainEls.push({ id: uid(), type: "text", content: val,
        props: { align: "left", textSize: "base", lineHeight: "relaxed", textColor: "#4b5563" } });
    } else if (BUTTON_KEYS.has(f.key)) {
      const href = String(block.content.ctaLink ?? block.content.href ?? block.content.link ?? "#");
      mainEls.push({ id: uid(), type: "button", content: val,
        props: { variant: "filled", color: "#000000", href, btnRadius: "lg", btnSize: "md" } });
    } else {
      mainEls.push({ id: uid(), type: "text", content: val,
        props: { align: "left", textSize: "sm", lineHeight: "normal", textColor: "#6b7280" } });
    }
  }

  // Extra string fields not in BLOCK_FIELDS
  Object.entries(block.content)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && (typeof v === "string" || typeof v === "number") && String(v).trim())
    .forEach(([, v]) => {
      mainEls.push({ id: uid(), type: "text", content: String(v),
        props: { align: "left", textSize: "sm", lineHeight: "normal", textColor: "#6b7280" } });
    });

  if (mainEls.length > 0) {
    rows.push({ id: rowUid(), layout: "1", cols: [{ id: colUid(), elements: mainEls }] });
  }

  // ── Item rows (services, faq, pricing, etc.) ─────────────────────────────────
  if (items.length > 0 && itemFields.length > 0) {
    const PER_ROW   = items.length <= 2 ? items.length : 3;
    const LAYOUTS: Record<number, CanvasRowLayout> = { 1: "1", 2: "1-1", 3: "1-1-1" };

    for (let i = 0; i < items.length; i += PER_ROW) {
      const chunk = items.slice(i, i + PER_ROW);
      const layout = LAYOUTS[chunk.length] ?? "1-1-1";
      const cols = chunk.map((item) => {
        const els: CanvasEl[] = itemFields
          .filter((f) => String(item[f.key] ?? "").trim())
          .map((f) => {
            const val = String(item[f.key] ?? "");
            const isTitle = ["title", "name", "question", "plan", "role"].includes(f.key);
            return {
              id: uid(), type: (isTitle ? "heading" : "text") as CanvasEl["type"], content: val,
              props: isTitle
                ? { size: "md", align: "left", fontWeight: "bold", textColor: "#111111" }
                : { align: "left", textSize: "sm", lineHeight: "relaxed", textColor: "#4b5563" },
            };
          });
        return { id: colUid(), elements: els, style: { padding: "md" as const } };
      });
      rows.push({ id: rowUid(), layout, cols });
    }
  }

  if (rows.length === 0) {
    rows.push({ id: rowUid(), layout: "1", cols: [{ id: colUid(), elements: [] }] });
  }

  const name = String(
    block.content.heading ?? block.content.title ?? block.content.name ?? block.type
  );
  return { canvas: { rows }, name };
}

// ── Item editor (for array fields like services, features, FAQ) ───────────────

function ItemEditor({
  item, idx, fields, onUpdate, onDelete, isOpen, onToggle,
}: {
  item: Record<string, unknown>;
  idx: number;
  fields: { key: string; label: string; type: "text" | "textarea" }[];
  onUpdate: (item: Record<string, unknown>) => void;
  onDelete: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const displayLabel = String(item.title ?? item.name ?? item.question ?? item.quote ?? `Item ${idx + 1}`).slice(0, 32);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center px-3 py-2 bg-gray-50/40 gap-2">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">#{idx + 1}</span>
          <span className="text-[11px] font-semibold text-gray-700 truncate">{displayLabel}</span>
          {isOpen
            ? <ChevronUp size={10} className="text-gray-300 ml-auto flex-shrink-0" />
            : <ChevronDown size={10} className="text-gray-300 ml-auto flex-shrink-0" />}
        </button>
        <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
          <Trash2 size={10} />
        </button>
      </div>
      {isOpen && (
        <div className="px-3 py-2.5 space-y-2 border-t border-gray-50">
          {fields.map((f) => {
            const val = String(item[f.key] ?? "");
            return (
              <div key={f.key}>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    className="w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 min-h-[50px] transition-all"
                    value={val}
                    onChange={(e) => onUpdate({ ...item, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 transition-all"
                    value={val}
                    onChange={(e) => onUpdate({ ...item, [f.key]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Block card ─────────────────────────────────────────────────────────────────

function BlockCard({
  block, index, total, onChange, onDelete, onMove, onEditClick, onRegen, isOpen, onToggle,
}: {
  block: Block; index: number; total: number;
  onChange: (b: Block) => void; onDelete: () => void; onMove: (dir: "up" | "down") => void;
  onEditClick: () => void; onRegen: () => void; isOpen: boolean; onToggle: () => void;
}) {
  const [openItemIdx, setOpenItemIdx] = useState<number | null>(null);
  const [openExtraIdx, setOpenExtraIdx] = useState<number | null>(null);
  const fields       = BLOCK_FIELDS[block.type]    ?? [];
  const itemArrayKey = ITEM_ARRAY_KEY[block.type]  ?? null;
  const itemFields   = ITEM_FIELDS[block.type]     ?? [];
  const items: Record<string, unknown>[] =
    itemArrayKey && Array.isArray(block.content[itemArrayKey])
      ? (block.content[itemArrayKey] as Record<string, unknown>[])
      : [];

  // Keys already rendered by predefined fields / item editor
  const SKIP_KEYS = new Set(["layout", "rows", "id", ...(fields.map((f) => f.key)), ...(itemArrayKey ? [itemArrayKey] : [])]);
  // Extra string fields not covered by BLOCK_FIELDS
  const extraStringFields = Object.entries(block.content)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && (typeof v === "string" || typeof v === "number"))
    .map(([k, v]) => ({ key: k, value: String(v) }));
  // Extra array fields (arrays of objects) not covered by ITEM_ARRAY_KEY
  const extraArrayFields = Object.entries(block.content)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && Array.isArray(v) && (v as unknown[]).length > 0 && typeof (v as unknown[])[0] === "object")
    .map(([k, v]) => ({ key: k, items: v as Record<string, unknown>[] }));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-100 rounded-xl overflow-hidden bg-white group/card shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded-lg text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left mx-1 min-w-0">
          <span className="w-5 h-5 bg-black text-white text-[9px] font-bold rounded-md flex items-center justify-center uppercase flex-shrink-0">
            {block.type[0]}
          </span>
          <span className="text-[12px] font-bold text-gray-800 capitalize truncate">{block.type}</span>
          {isOpen ? <ChevronUp size={12} className="text-gray-300 ml-auto flex-shrink-0" /> : <ChevronDown size={12} className="text-gray-300 ml-auto flex-shrink-0" />}
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={onEditClick}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-all"
            title="Edit content & style"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onRegen}
            className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-300 hover:text-purple-500 transition-all"
            title="Regenerate with AI"
          >
            <Sparkles size={13} />
          </button>
          <button disabled={index === 0} onClick={() => onMove("up")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-20 transition-all">
            <ArrowUp size={13} />
          </button>
          <button disabled={index === total - 1} onClick={() => onMove("down")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-20 transition-all">
            <ArrowDown size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {isOpen && fields.length > 0 && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {fields.map((f) => {
            if (f.type === "nav-items") {
              const raw = block.content[f.key];
              const navItems: NavItem[] = Array.isArray(raw)
                ? (raw as NavItem[])
                : typeof raw === "string" && raw
                  ? raw.split(",").map((l) => ({ label: l.trim(), href: "#" }))
                  : [];
              return (
                <div key={f.key}>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <NavItemsEditor
                    items={navItems}
                    onChange={(next) => onChange({ ...block, content: { ...block.content, [f.key]: next } })}
                  />
                </div>
              );
            }
            const val = String(block.content[f.key] ?? "");
            const set = (v: string) => onChange({ ...block, content: { ...block.content, [f.key]: v } });
            return (
              <div key={f.key}>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea className="w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 min-h-[60px] transition-all" value={val} onChange={(e) => set(e.target.value)} />
                ) : (
                  <input type={f.type === "url" ? "url" : "text"} className="w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 transition-all" value={val} onChange={(e) => set(e.target.value)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isOpen && itemArrayKey && itemFields.length > 0 && (
        <div className={`px-4 pb-4 pt-2 space-y-2 ${fields.length > 0 ? "border-t border-gray-50" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {itemArrayKey === "tiers" ? "Plans" : "Items"} ({items.length})
            </label>
            <button
              onClick={() => {
                const def = DEFAULT_ITEM[block.type] ?? {};
                onChange({ ...block, content: { ...block.content, [itemArrayKey]: [...items, def] } });
              }}
              className="text-[9px] font-bold text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> Add
            </button>
          </div>
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <ItemEditor
                key={idx}
                item={item}
                idx={idx}
                fields={itemFields}
                isOpen={openItemIdx === idx}
                onToggle={() => setOpenItemIdx((prev) => (prev === idx ? null : idx))}
                onUpdate={(updated) => {
                  const arr = [...items];
                  arr[idx] = updated;
                  onChange({ ...block, content: { ...block.content, [itemArrayKey]: arr } });
                }}
                onDelete={() => {
                  onChange({ ...block, content: { ...block.content, [itemArrayKey]: items.filter((_, i) => i !== idx) } });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Extra string fields not covered by BLOCK_FIELDS */}
      {isOpen && extraStringFields.length > 0 && (
        <div className={`px-4 pb-4 pt-2 space-y-3 ${fields.length > 0 || (itemArrayKey && itemFields.length > 0) ? "border-t border-gray-50" : ""}`}>
          {extraStringFields.map(({ key, value }) => (
            <div key={key}>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</label>
              {value.length > 60 ? (
                <textarea
                  className="w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 min-h-[60px] transition-all"
                  value={value}
                  onChange={(e) => onChange({ ...block, content: { ...block.content, [key]: e.target.value } })}
                />
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-200 transition-all"
                  value={value}
                  onChange={(e) => onChange({ ...block, content: { ...block.content, [key]: e.target.value } })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Extra array fields (arrays of objects) not covered by ITEM_ARRAY_KEY */}
      {isOpen && extraArrayFields.map(({ key, items: extraItems }) => {
        const dynFields = Object.keys(extraItems[0] ?? {})
          .filter((k) => typeof extraItems[0][k] === "string")
          .map((k) => ({ key: k, label: k.replace(/([A-Z])/g, " $1").trim(), type: "text" as const }));
        return (
          <div key={key} className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-50">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {key.replace(/([A-Z])/g, " $1").trim()} ({extraItems.length})
              </label>
              <button
                onClick={() => {
                  const blank = Object.fromEntries(dynFields.map((f) => [f.key, ""]));
                  onChange({ ...block, content: { ...block.content, [key]: [...extraItems, blank] } });
                }}
                className="text-[9px] font-bold text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
              >
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {extraItems.map((item, idx) => (
                <ItemEditor
                  key={idx}
                  item={item}
                  idx={idx}
                  fields={dynFields}
                  isOpen={openExtraIdx === idx}
                  onToggle={() => setOpenExtraIdx((prev) => (prev === idx ? null : idx))}
                  onUpdate={(updated) => {
                    const arr = [...extraItems];
                    arr[idx] = updated;
                    onChange({ ...block, content: { ...block.content, [key]: arr } });
                  }}
                  onDelete={() => {
                    onChange({ ...block, content: { ...block.content, [key]: extraItems.filter((_, i) => i !== idx) } });
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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

// ── Section row (clean list item replacing the old BlockCard accordion) ───────

const BLOCK_LABELS: Record<string, string> = {
  header: "Header", hero: "Hero Banner", about: "About", services: "Services",
  features: "Features", whyus: "Why Us", testimonials: "Testimonials", team: "Team",
  gallery: "Gallery", pricing: "Pricing", faq: "FAQ", cta: "CTA Banner",
  contact: "Contact", footer: "Footer", statement: "Statement", canvas: "Custom Section",
};

function SectionRow({
  block, index, total, isSelected, isRegenerating, onSelect, onDelete, onMove, onRegen,
}: {
  block: Block; index: number; total: number; isSelected: boolean; isRegenerating: boolean;
  onSelect: () => void; onDelete: () => void; onMove: (dir: "up" | "down") => void; onRegen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
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

  // Manual setup
  const [manualName, setManualName]   = useState("");
  const [manualTag, setManualTag]     = useState("");
  const [manualColor, setManualColor] = useState("#000000");
  const [initSaving, setInitSaving]   = useState(false);

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

  // resetBlocks — for page switches; clears history
  const resetBlocks = useCallback((newBlocks: Block[]) => {
    setBlocksRaw(newBlocks);
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
  const [showPicker, setShowPicker]           = useState(false);
  const [newPageName, setNewPageName]         = useState("");
  const [showAddPage, setShowAddPage]         = useState(false);
  const [previewMode, setPreviewMode]         = useState<"none" | "split" | "full">("none");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [activeDragId, setActiveDragId]       = useState<string | null>(null);
  const [previewDevice, setPreviewDevice]     = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab]             = useState<"chat" | "design" | "pages">("chat");
  const [chatInput, setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; role: string; text: string; meta?: string }[]>([
    { id: 1, role: "assistant", text: "Hi! Describe what you want on this page and I'll generate the sections for you. For example: \"Create a services page for a photography studio\" or \"Add a pricing section with 3 plans\"." },
  ]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Auth + load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t    = localStorage.getItem("token")   ?? "";
    const role = localStorage.getItem("role")    ?? "";
    const p    = localStorage.getItem("package") ?? "starter";
    setToken(t); setPkg(p);
    if (!t || (role !== "builder" && role !== "admin" && p !== "builder")) { setView("no-auth"); return; }

    const isNew = searchParams.get("new") === "true";
    if (isNew) {
      setView("choose");
      return;
    }

    const targetUrl = projectIdParam 
      ? `${API}/api/builder/project?projectId=${projectIdParam}`
      : `${API}/api/builder/project`;

    fetch(targetUrl, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data: Project | null) => {
        if (data && data.status === "ready" && data.pages.length > 0) {
          setProject(data);
          // If we have a pageId param, use it, otherwise default to first page
          const targetId = pageIdParam && data.pages.find(p => p.id === pageIdParam) 
            ? pageIdParam 
            : data.pages[0].id;
          enterEditor(data, targetId);
        } else {
          setView("choose");
        }
      })
      .catch(() => setView("choose"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdParam, projectIdParam]);

  const enterEditor = useCallback((proj: Project, pageId: string) => {
    setSelectedId(pageId);
    resetBlocks(proj.pages.find((p) => p.id === pageId)?.blocks ?? []);
    setSaved(false);
    setView("editor");
    setActiveTab(proj.prompt ? "chat" : "design");
    setEditingBlockId(null);
  }, [resetBlocks]);

  const selectPage = useCallback((proj: Project, pageId: string, force = false) => {
    if (!force && !saved && selectedId) {
      const proceed = confirm("You have unsaved changes on this page. Switch anyway?");
      if (!proceed) return;
    }
    setSelectedId(pageId);
    resetBlocks(proj.pages.find((p) => p.id === pageId)?.blocks ?? []);
    setSaved(false);
    setEditingBlockId(null);
  }, [resetBlocks, saved, selectedId]);

  // ── AI generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setView("generating"); setMsgIdx(0);
    const iv = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 4000);
    try {
      const res  = await fetch(`${API}/api/builder/generate`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, theme: aiTheme }),
      });
      const data: Project = await res.json();
      if (!res.ok) throw new Error();
      setProject(data);
      enterEditor(data, data.pages[0].id);
    } catch {
      setView("prompt");
      alert("Generation failed. Please try again.");
    } finally { clearInterval(iv); }
  };

  // ── Manual init ─────────────────────────────────────────────────────────────
  const handleManualInit = async () => {
    setInitSaving(true);
    try {
      const res  = await fetch(`${API}/api/builder/init-manual`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName: manualName, tagline: manualTag, primaryColor: manualColor }),
      });
      const data: Project = await res.json();
      setProject(data);
      enterEditor(data, data.pages[0].id);
    } catch { alert("Failed to set up project. Please try again."); }
    finally { setInitSaving(false); }
  };

  // ── Save page ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedId || saving || !project) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/builder/project/pages/${selectedId}?projectId=${project._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blocks }),
      });
      const updated: Project = await res.json();
      setProject(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  // ── Add component from picker ────────────────────────────────────────────────
  const handleAddComponent = (comp: ComponentDef) => {
    const newBlock: Block = {
      id:      `block-${crypto.randomUUID()}`,
      type:    comp.blockType,
      content: { ...comp.defaultContent },
      styles:  comp.defaultStyles,
    };
    setBlocks((bs) => [...bs, newBlock]);
    setShowPicker(false);
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

  // ── Regenerate a single block with AI ────────────────────────────────────────
  const [regenBlockId, setRegenBlockId] = useState<string | null>(null);
  const handleRegenBlock = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    setRegenBlockId(blockId);
    try {
      const res = await fetch(`${API}/api/builder/regenerate-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: project?._id, blockType: block.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBlocks((bs) => bs.map((b) => b.id === blockId ? { ...data.block, id: blockId } : b));
      setSaved(false);
    } catch {
      // silent — user still has original block
    } finally {
      setRegenBlockId(null);
    }
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

      if (mod && e.key === "a") { e.preventDefault(); setShowPicker(true); return; }
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
      if (e.key === "ArrowUp" && !e.shiftKey && editingBlockId) {
        e.preventDefault(); moveBlock(editingBlockId, "up"); return;
      }
      if (e.key === "ArrowDown" && !e.shiftKey && editingBlockId) {
        e.preventDefault(); moveBlock(editingBlockId, "down"); return;
      }
      if (e.key === "Escape") {
        setEditingBlockId(null);
        setShowCanvasEditor(false);
        setShowPicker(false);
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
    setChatMessages((prev) => [...prev, { id: userMsgId + 1, role: "assistant", text: "⏳ Generating sections…" }]);

    try {
      const res  = await fetch(`${API}/api/builder/generate-page`, {
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
          ? { ...m, text: `Done! Added ${newBlocks.length} section${newBlocks.length !== 1 ? "s" : ""} to your page. You can reorder or edit them in the Design tab.` }
          : m
      ));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setChatMessages((prev) => prev.map((m) =>
        m.id === userMsgId + 1 ? { ...m, text: `Error: ${message}` } : m
      ));
    } finally {
      setChatLoading(false);
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
            className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all ${saved ? "bg-green-500 text-white" : "bg-[#6344d4] text-white hover:opacity-90"}`}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Publish"}
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
  if (view === "loading") return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fa]">
      <style>{scrollbarStyles}</style>
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

        <div className="grid grid-cols-2 gap-5 w-full max-w-2xl">
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
        const iv = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 4000);
        fetch(`${API}/api/builder/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: builtPrompt, theme: updated.theme }),
        })
          .then((r) => r.json())
          .then((data: Project) => {
            clearInterval(iv);
            setProject(data);
            enterEditor(data, data.pages[0].id);
            setShowWelcome(true);
          })
          .catch(() => { clearInterval(iv); setView("wizard"); alert("Generation failed. Please try again."); });
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
              {/* Skeleton block preview */}
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
              <p className="text-[12px] text-gray-400">This usually takes 15–30 seconds</p>
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
    <div className="h-screen flex bg-[#F9FAFB] overflow-hidden font-sans">
      <style>{scrollbarStyles}</style>
      {/* Left Sidebar: AI Assistant & Design */}
      <aside
        className={`bg-white border-r border-gray-100 flex flex-col flex-shrink-0 relative z-50 transition-all duration-300 ease-in-out overflow-hidden ${
          editingBlockId || previewMode === "full" ? "w-0 opacity-0 -translate-x-[340px]" : "w-[340px] opacity-100 translate-x-0"
        }`}
      >
        <div className="w-[340px] h-full flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6344d4] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="text-white" size={16} />
            </div>
            <span className="text-[15px] font-bold tracking-tight">LHRWEB <span className="bg-purple-100 text-[#6344d4] text-[9px] uppercase px-1.5 py-0.5 rounded-full ml-1">Beta</span></span>
          </div>
          <button className="p-2 text-gray-400 hover:text-black transition-colors">
            <Layout size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-50 px-2 flex-shrink-0">
          {[
            { id: "chat", icon: Sparkles, label: "AI" },
            { id: "design", icon: Layout, label: "Design" },
            { id: "pages", icon: Blocks, label: "Pages" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-bold transition-all relative ${activeTab === t.id ? "text-[#6344d4]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <t.icon size={14} />
              {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6344d4] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              {/* Suggestion chips */}
              <div className="px-4 pt-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {[
                  "Build a homepage",
                  "Add a services section",
                  "Create a pricing page",
                  "Add team members",
                  "Add an FAQ section",
                  "Add a contact form",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setChatInput(s); }}
                    className="px-3 py-1.5 bg-purple-50 text-[#6344d4] text-[11px] font-semibold rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 bg-[#6344d4] rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Sparkles size={12} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                    }`}>
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
                      {[0,1,2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "design" && (
            <div className="p-4 space-y-1.5">
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <Layout size={20} className="text-gray-300" />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-500">No sections yet</p>
                  <p className="text-[11px] text-gray-400 max-w-[180px]">Click &quot;Add Section&quot; below to build your page</p>
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
                      onSelect={() => { setEditingBlockId((prev) => prev === block.id ? null : block.id); setShowPicker(false); }}
                      onDelete={() => deleteBlock(block.id)}
                      onMove={(d) => moveBlock(block.id, d)}
                      onRegen={() => handleRegenBlock(block.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button onClick={() => setShowPicker(true)} className="w-full py-3.5 mt-1 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-gray-400 hover:border-[#6344d4]/30 hover:text-[#6344d4] transition-all">
                <Plus size={14} /> Add Section
              </button>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Main Pages</p>
                {project?.pages.map((p) => (
                  <div key={p.id} className="group/page relative">
                    <button
                      onClick={() => selectPage(project, p.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedId === p.id ? "bg-black border-black text-white shadow-lg" : "bg-white border-gray-100 text-gray-600 hover:border-gray-300"}`}
                    >
                      <span className="text-[13px] font-bold">{p.name}</span>
                      <span className={`text-[10px] font-mono ${selectedId === p.id ? "text-gray-400" : "text-gray-400"}`}>/{p.slug}</span>
                    </button>
                    {isPro && (project?.pages.length ?? 0) > 1 && (
                      <button 
                        onClick={() => handleDeletePage(p.id)}
                        className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/page:opacity-100 text-gray-300 hover:text-red-500 transition-all z-10"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isPro && (
                showAddPage ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <input 
                      autoFocus 
                      className="w-full px-4 py-2.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10" 
                      placeholder="Page name..." 
                      value={newPageName} 
                      onChange={(e) => setNewPageName(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && handleAddPage()} 
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddPage} className="flex-1 py-2 bg-black text-white text-[11px] font-bold rounded-lg hover:bg-gray-900 transition-all">Add Page</button>
                      <button onClick={() => setShowAddPage(false)} className="flex-1 py-2 border border-gray-200 text-[11px] font-semibold rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddPage(true)} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[12px] font-bold text-gray-400 hover:text-black hover:border-gray-300 transition-all">
                    + Add New Page
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* AI Input — always shown on AI tab */}
        {activeTab === "chat" && (
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
                {chatLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        )}
      </div>
    </aside>

      {/* Main Content: Browser Canvas */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <FloatingTopBar />

        <div className="flex-1 overflow-y-auto p-12 pt-28 bg-[#F3F4F6] custom-scrollbar flex flex-col items-center">
          {/* Browser Frame */}
          <div
            className={`bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col transition-all duration-500 border border-white ${
              previewMode === "full" ? "min-h-full" : "h-full"
            } ${
              previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-6xl"
            }`}
          >
            {/* Browser Header (Dummy) */}
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
            <div className={previewMode === "full" ? "bg-white relative" : "flex-1 overflow-y-auto bg-white relative"}>
              <BlockPreview
                blocks={blocks}
                primaryColor={project?.primaryColor}
                onSelectBlock={previewMode === "none" ? (id) => {
                  setEditingBlockId((prev) => prev === id ? null : id);
                  setShowPicker(false);
                  setActiveTab("design");
                  setHasClickedBlock(true);
                } : undefined}
                selectedBlockId={previewMode === "none" ? (editingBlockId ?? undefined) : undefined}
                onUpdateBlockContent={previewMode === "none" ? (blockId, newContent) => {
                  setBlocks((bs) => bs.map((b) => b.id === blockId ? { ...b, content: newContent } : b));
                  setSaved(false);
                } : undefined}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Overlays */}
      {showPicker && <ComponentPicker onAdd={handleAddComponent} onClose={() => setShowPicker(false)} primaryColor={project?.primaryColor} />}
      {showExport && project && <ExportModal projectId={project._id} onClose={() => setShowExport(false)} />}
      {editingBlockId && (() => {
        const editBlock = blocks.find((b) => b.id === editingBlockId);
        if (!editBlock) return null;
        if (editBlock.type === "canvas" || showCanvasEditor) {
          const canvasRows = editBlock.content.rows as CanvasData["rows"] | undefined;
          const { canvas, name } = canvasRows
            ? { canvas: { rows: canvasRows }, name: String(editBlock.content.name ?? editBlock.type) }
            : blockToCanvasData(editBlock);
          const origType = canvasRows
            ? (editBlock.content._originalType as string | undefined)
            : editBlock.type;
          const origContent = canvasRows
            ? (editBlock.content._originalContent as Record<string, unknown> | undefined) ?? {}
            : editBlock.content;
          return (
            <CanvasEditor
              initialCanvas={canvas}
              initialName={name}
              initialStyles={editBlock.styles}
              initialBlockType={origType}
              initialBlockContent={origContent}
              onAdd={(comp) => {
                setBlocks((bs) => bs.map((b) => b.id === editingBlockId ? {
                  ...b,
                  type: "canvas",
                  content: comp.defaultContent as Record<string, unknown>,
                  styles: comp.defaultStyles || b.styles,
                } : b));
                setSaved(false);
                setShowCanvasEditor(false);
                setEditingBlockId(null);
              }}
              onClose={() => { setShowCanvasEditor(false); setEditingBlockId(null); }}
            />
          );
        }
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
            onEditVisually={() => setShowCanvasEditor(true)}
            onClose={() => setEditingBlockId(null)}
          />
        );
      })()}

      {/* ── Welcome overlay (shown once after first AI generation) ── */}
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
                onClick={() => {
                  if (project) window.open(`/site/${project._id}`, "_blank");
                  setShowWelcome(false);
                }}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:border-gray-400 transition-all"
              >
                Preview live site ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-use tooltip — nudges user to click a block */}
      {!showWelcome && !hasClickedBlock && editingBlockId === null && blocks.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] px-5 py-3 bg-black text-white rounded-full text-[13px] font-semibold shadow-xl flex items-center gap-2"
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
                ["Ctrl + Z",        "Undo"],
                ["Ctrl + Y",        "Redo"],
                ["Ctrl + S",        "Save"],
                ["Ctrl + Shift + S","Save"],
                ["Ctrl + A",        "Add Section"],
                ["Ctrl + D",        "Duplicate selected block"],
                ["Delete",          "Delete selected block"],
                ["↑ / ↓",           "Move block up / down"],
                ["Escape",          "Deselect / close panel"],
                ["?",               "Toggle this cheatsheet"],
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
    </ErrorBoundary>
  );
}
