"use client";

import { useState, useRef } from "react";
import {
  X, Plus, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, ChevronRight, Sliders, Type, Sparkles,
  LayoutGrid, RotateCcw, ImageIcon, Upload, Layers,
} from "lucide-react";
import NavItemsEditor from "./NavItemsEditor";
import {
  BLOCK_FIELDS, ITEM_FIELDS, ITEM_ARRAY_KEY, DEFAULT_ITEM,
  type BlockStyles, type NavItem,
} from "@/lib/builderComponents";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  styles?: BlockStyles;
}

interface ItemEditorProps {
  item: Record<string, unknown>;
  idx: number;
  fields: { key: string; label: string; type: "text" | "textarea" }[];
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (item: Record<string, unknown>) => void;
  onDelete: () => void;
}

// ── Shared style constants ────────────────────────────────────────────────────

const PRESET_COLORS = [
  { label: "White",   value: "#ffffff" },
  { label: "Slate",   value: "#0f172a" },
  { label: "Indigo",  value: "#6344d4" },
  { label: "Emerald", value: "#059669" },
  { label: "Crimson", value: "#dc2626" },
  { label: "Violet",  value: "#7c3aed" },
  { label: "Amber",   value: "#d97706" },
  { label: "Rose",    value: "#db2777" },
];

const CARD_BLOCK_TYPES = ["services", "features", "whyus", "testimonials", "team", "pricing", "faq"];
const GRID_BLOCK_TYPES = ["services", "features", "whyus", "testimonials", "team", "pricing", "gallery"];

// ── Reusable style controls ───────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange }: {
  options: { label: React.ReactNode; value: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-gray-50/70 border border-gray-100 rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            value === opt.value
              ? "bg-white text-black shadow-sm border border-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ value, placeholder, onChange }: {
  value: string | undefined; placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((p) => (
          <button key={p.value} onClick={() => onChange(p.value)} title={p.label}
            className={`w-6 h-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center ${
              value?.toLowerCase() === p.value.toLowerCase() ? "border-black ring-2 ring-black/10 scale-105" : "border-gray-200"
            }`}
            style={{ backgroundColor: p.value }}>
            {value?.toLowerCase() === p.value.toLowerCase() && (
              <span className="w-1.5 h-1.5 rounded-full bg-current invert opacity-60" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-gray-50/70 border border-gray-100 p-1 rounded-xl">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
          <input type="color" value={value ?? "#ffffff"} onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer p-0 border-0 outline-none" />
        </div>
        <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1 text-[11px] font-mono border-none focus:outline-none focus:ring-0 text-gray-800" />
      </div>
    </div>
  );
}

function BgImageUpload({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
            <X size={11} />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#6344d4]/40 hover:text-[#6344d4]/70 transition-all">
          <Upload size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Upload Image</span>
        </button>
      )}
      <div className="flex items-center gap-2 bg-gray-50/70 border border-gray-100 p-1 rounded-xl">
        <ImageIcon size={14} className="text-gray-300 flex-shrink-0 ml-1" />
        <input type="text" value={value?.startsWith("data:") ? "" : (value ?? "")}
          onChange={(e) => onChange(e.target.value)} placeholder="Or paste image URL..."
          className="flex-1 bg-transparent px-1 py-1 text-[11px] font-mono border-none focus:outline-none focus:ring-0 text-gray-800" />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all ${checked ? "bg-black" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function FL({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">{children}</p>;
}

function StyleAccordion({ title, icon: Icon, isOpen, onToggle, children }: {
  title: string; icon: React.ComponentType<{ size?: number; className?: string }>;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="text-gray-400" size={15} />
          <span className="text-[12px] font-bold text-gray-800">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Item editor (for item arrays in content tab) ──────────────────────────────

function ItemEditor({ item, idx, fields, isOpen, onToggle, onUpdate, onDelete }: ItemEditorProps) {
  const displayLabel = String(item.title ?? item.name ?? item.question ?? item.quote ?? `Item ${idx + 1}`).slice(0, 32);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center px-3 py-2 bg-gray-50/40 gap-2">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">#{idx + 1}</span>
          <span className="text-[11px] font-semibold text-gray-700 truncate">{displayLabel}</span>
          {isOpen
            ? <ChevronDown size={10} className="text-gray-300 ml-auto flex-shrink-0" />
            : <ChevronRight size={10} className="text-gray-300 ml-auto flex-shrink-0" />}
        </button>
        <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
          <X size={10} />
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
                  <textarea className="w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/30 min-h-[50px] transition-all"
                    value={val} onChange={(e) => onUpdate({ ...item, [f.key]: e.target.value })} />
                ) : (
                  <input type="text" className="w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/30 transition-all"
                    value={val} onChange={(e) => onUpdate({ ...item, [f.key]: e.target.value })} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main unified panel ────────────────────────────────────────────────────────

const REWRITE_TONES = ["professional", "friendly", "confident", "playful", "luxury"] as const;

export default function BlockEditorPanel({ block, onChange, onStyleChange, onClose, onRewrite }: {
  block: Block;
  onChange: (b: Block) => void;
  onStyleChange: (styles: BlockStyles) => void;
  onClose: () => void;
  // Round 5 Ch 5.2 — returns 3 copy variants for a text field
  onRewrite?: (text: string, tone: string) => Promise<string[]>;
}) {
  const [tab, setTab] = useState<"content" | "style" | "advanced">("content");
  const [openItemIdx, setOpenItemIdx]   = useState<number | null>(null);
  const [openExtraIdx, setOpenExtraIdx] = useState<number | null>(null);
  const [openStyleSects, setOpenStyleSects] = useState<Set<string>>(() => new Set(["layout", "background"]));

  // ── AI rewrite state (one active field at a time) ────────────────────────────
  const [rewriteField, setRewriteField]       = useState<string | null>(null);
  const [rewriteTone, setRewriteTone]         = useState<string>("professional");
  const [rewriteVariants, setRewriteVariants] = useState<string[] | null>(null);
  const [rewriteLoading, setRewriteLoading]   = useState(false);

  const startRewrite = async (fieldKey: string, text: string, tone = rewriteTone) => {
    if (!onRewrite || !text.trim()) return;
    setRewriteField(fieldKey);
    setRewriteTone(tone);
    setRewriteVariants(null);
    setRewriteLoading(true);
    try {
      const variants = await onRewrite(text, tone);
      setRewriteVariants(variants);
    } catch {
      setRewriteField(null);
    } finally {
      setRewriteLoading(false);
    }
  };
  const closeRewrite = () => { setRewriteField(null); setRewriteVariants(null); };

  // ── Content helpers ──────────────────────────────────────────────────────────
  const fields       = BLOCK_FIELDS[block.type] ?? [];
  const itemArrayKey = ITEM_ARRAY_KEY[block.type] ?? null;
  const itemFields   = ITEM_FIELDS[block.type]   ?? [];
  const items: Record<string, unknown>[] =
    itemArrayKey && Array.isArray(block.content[itemArrayKey])
      ? (block.content[itemArrayKey] as Record<string, unknown>[])
      : [];

  const SKIP_KEYS = new Set(["layout", "rows", "id", "extraElements", "sectionCtaText", "sectionCtaLink", ...fields.map((f) => f.key), ...(itemArrayKey ? [itemArrayKey] : [])]);
  const extraStringFields = Object.entries(block.content)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && (typeof v === "string" || typeof v === "number"))
    .map(([k, v]) => ({ key: k, value: String(v) }));
  const extraArrayFields = Object.entries(block.content)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && Array.isArray(v) && (v as unknown[]).length > 0 && typeof (v as unknown[])[0] === "object")
    .map(([k, v]) => ({ key: k, items: v as Record<string, unknown>[] }));

  const set = (patch: Partial<Record<string, unknown>>) =>
    onChange({ ...block, content: { ...block.content, ...patch } });

  const totalContentFields = fields.length + extraStringFields.length +
    (itemArrayKey ? items.length : 0) + extraArrayFields.reduce((s, a) => s + a.items.length, 0);

  // ── Style helpers ────────────────────────────────────────────────────────────
  const styles = block.styles ?? {};
  const upd    = (patch: Partial<BlockStyles>) => onStyleChange({ ...styles, ...patch });
  const toggleStyle = (s: string) => setOpenStyleSects((prev) => {
    const n = new Set(prev);
    if (n.has(s)) n.delete(s); else n.add(s);
    return n;
  });
  const hasCards = CARD_BLOCK_TYPES.includes(block.type);
  const hasGrid  = GRID_BLOCK_TYPES.includes(block.type);

  const inputCls = "w-full px-3 py-2 text-[12px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/30 transition-all";
  const areaCls  = `${inputCls} resize-none min-h-[72px]`;
  const lblCls   = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />

      <div className="relative w-[380px] h-full bg-white shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-black text-white text-[10px] font-bold rounded-lg flex items-center justify-center uppercase">
              {block.type[0]}
            </span>
            <div>
              <p className="text-[14px] font-bold text-gray-900 capitalize leading-tight">{block.type}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{totalContentFields} field{totalContentFields !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(["content", "style", "advanced"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[12px] font-bold capitalize transition-colors relative ${tab === t ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
              {t}
              {tab === t && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── CONTENT TAB ── */}
          {tab === "content" && (
            <>
              {/* Predefined fields */}
              {fields.length > 0 && (
                <div className="space-y-4">
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
                          <label className={lblCls}>{f.label}</label>
                          <NavItemsEditor items={navItems}
                            onChange={(next) => set({ [f.key]: next })} />
                        </div>
                      );
                    }
                    const val = String(block.content[f.key] ?? "");
                    const canRewrite = !!onRewrite && f.type !== "url" && val.trim().length > 3;
                    return (
                      <div key={f.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
                          {canRewrite && (
                            <button
                              onClick={() => rewriteField === f.key ? closeRewrite() : startRewrite(f.key, val)}
                              className="flex items-center gap-1 text-[10px] font-bold text-[#6344d4] hover:text-[#4c2fc4] transition-colors"
                              title="Rewrite with AI"
                            >
                              <Sparkles size={10} /> Rewrite
                            </button>
                          )}
                        </div>
                        {f.type === "textarea" ? (
                          <textarea className={areaCls} value={val} onChange={(e) => set({ [f.key]: e.target.value })} />
                        ) : (
                          <input type={f.type === "url" ? "url" : "text"} className={inputCls} value={val} onChange={(e) => set({ [f.key]: e.target.value })} />
                        )}

                        {/* AI rewrite variants (Round 5 Ch 5.2 — pick one of 3) */}
                        {rewriteField === f.key && (
                          <div className="mt-2 border border-[#6344d4]/20 bg-[#6344d4]/[0.04] rounded-xl p-3 space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {REWRITE_TONES.map((t) => (
                                <button key={t}
                                  onClick={() => startRewrite(f.key, val, t)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-lg capitalize transition-all ${
                                    rewriteTone === t ? "bg-[#6344d4] text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-[#6344d4]/40"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            {rewriteLoading ? (
                              <p className="text-[11px] text-gray-400 py-2 animate-pulse">Writing 3 options…</p>
                            ) : (
                              rewriteVariants?.map((v, i) => (
                                <button key={i}
                                  onClick={() => { set({ [f.key]: v }); closeRewrite(); }}
                                  className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 bg-white border border-gray-100 rounded-lg hover:border-[#6344d4]/50 hover:bg-[#6344d4]/[0.03] transition-all"
                                >
                                  {v}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Extra string fields */}
              {extraStringFields.length > 0 && (
                <div className={`space-y-4 ${fields.length > 0 ? "pt-4 border-t border-gray-100" : ""}`}>
                  {extraStringFields.map(({ key, value }) => (
                    <div key={key}>
                      <label className={lblCls}>{key.replace(/([A-Z])/g, " $1").trim()}</label>
                      {value.length > 60 ? (
                        <textarea className={areaCls} value={value} onChange={(e) => set({ [key]: e.target.value })} />
                      ) : (
                        <input type="text" className={inputCls} value={value} onChange={(e) => set({ [key]: e.target.value })} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Item arrays */}
              {itemArrayKey && itemFields.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {itemArrayKey === "tiers" ? "Plans" : "Items"} ({items.length})
                    </label>
                    <button onClick={() => {
                      const def = DEFAULT_ITEM[block.type] ?? {};
                      set({ [itemArrayKey]: [...items, def] });
                    }} className="text-[10px] font-bold text-[#6344d4] hover:text-purple-800 flex items-center gap-1 transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <ItemEditor key={idx} item={item} idx={idx} fields={itemFields}
                        isOpen={openItemIdx === idx}
                        onToggle={() => setOpenItemIdx((p) => (p === idx ? null : idx))}
                        onUpdate={(u) => { const arr = [...items]; arr[idx] = u; set({ [itemArrayKey]: arr }); }}
                        onDelete={() => set({ [itemArrayKey]: items.filter((_, i) => i !== idx) })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Extra array fields */}
              {extraArrayFields.map(({ key, items: extraItems }) => {
                const dynFields = Object.keys(extraItems[0] ?? {})
                  .filter((k) => typeof extraItems[0][k] === "string")
                  .map((k) => ({ key: k, label: k.replace(/([A-Z])/g, " $1").trim(), type: "text" as const }));
                return (
                  <div key={key} className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, " $1").trim()} ({extraItems.length})
                      </label>
                      <button onClick={() => {
                        const blank = Object.fromEntries(dynFields.map((f) => [f.key, ""]));
                        set({ [key]: [...extraItems, blank] });
                      }} className="text-[10px] font-bold text-[#6344d4] hover:text-purple-800 flex items-center gap-1 transition-colors">
                        <Plus size={11} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {extraItems.map((item, idx) => (
                        <ItemEditor key={idx} item={item} idx={idx} fields={dynFields}
                          isOpen={openExtraIdx === idx}
                          onToggle={() => setOpenExtraIdx((p) => (p === idx ? null : idx))}
                          onUpdate={(u) => { const arr = [...extraItems]; arr[idx] = u; set({ [key]: arr }); }}
                          onDelete={() => set({ [key]: extraItems.filter((_, i) => i !== idx) })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Extra elements (buttons / text snippets) */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extra Elements</label>
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                      const el = block.content.extraElements as unknown[] ?? [];
                      set({ extraElements: [...el, { id: crypto.randomUUID(), type: "text", content: "New text" }] });
                    }} className="text-[10px] font-bold text-[#6344d4] hover:text-purple-800 flex items-center gap-1 transition-colors">
                      <Plus size={11} /> Text
                    </button>
                    <button onClick={() => {
                      const el = block.content.extraElements as unknown[] ?? [];
                      set({ extraElements: [...el, { id: crypto.randomUUID(), type: "button", content: "Button", link: "#" }] });
                    }} className="text-[10px] font-bold text-[#6344d4] hover:text-purple-800 flex items-center gap-1 transition-colors">
                      <Plus size={11} /> Button
                    </button>
                  </div>
                </div>
                {(() => {
                  const els = (block.content.extraElements as { id: string; type: string; content: string; link?: string }[] | undefined) ?? [];
                  if (els.length === 0) return (
                    <p className="text-[11px] text-gray-400 text-center py-3">Add extra buttons or text snippets to this section.</p>
                  );
                  return (
                    <div className="space-y-2">
                      {els.map((el, idx) => (
                        <div key={el.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="flex items-center px-3 py-2 bg-gray-50/40 gap-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-12 flex-shrink-0">{el.type}</span>
                            <input type="text" value={el.content}
                              onChange={(e) => {
                                const arr = [...els];
                                arr[idx] = { ...arr[idx], content: e.target.value };
                                set({ extraElements: arr });
                              }}
                              className="flex-1 bg-transparent text-[11px] font-semibold text-gray-700 border-none focus:outline-none focus:ring-0 px-1 py-0.5 rounded"
                              placeholder={el.type === "button" ? "Button text" : "Text content"} />
                            <button onClick={() => {
                              set({ extraElements: els.filter((_, i) => i !== idx) });
                            }} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                              <X size={10} />
                            </button>
                          </div>
                          {el.type === "button" && (
                            <div className="px-3 py-2 border-t border-gray-50">
                              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Link URL</label>
                              <input type="url" value={el.link ?? ""}
                                onChange={(e) => {
                                  const arr = [...els];
                                  arr[idx] = { ...arr[idx], link: e.target.value };
                                  set({ extraElements: arr });
                                }}
                                className="w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/30 transition-all"
                                placeholder="https://" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Section CTA */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Section Action Button</label>
                <div className="space-y-2">
                  <input type="text" placeholder="Button text (e.g. View All Services)"
                    value={String(block.content.sectionCtaText ?? "")}
                    onChange={(e) => set({ sectionCtaText: e.target.value || "" })}
                    className={inputCls} />
                  <input type="url" placeholder="Button link URL"
                    value={String(block.content.sectionCtaLink ?? "")}
                    onChange={(e) => set({ sectionCtaLink: e.target.value || "" })}
                    className={inputCls} />
                </div>
              </div>

              {totalContentFields === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-[13px] font-medium">No text fields for this section.</p>
                  <p className="text-[11px] mt-1">Switch to the Style tab to customise its appearance.</p>
                </div>
              )}
            </>
          )}

          {/* ── STYLE TAB ── */}
          {tab === "style" && (
            <>
              <StyleAccordion title="Layout & Canvas" icon={Sliders} isOpen={openStyleSects.has("layout")} onToggle={() => toggleStyle("layout")}>
                <div><FL>Vertical Padding</FL>
                  <SegmentedControl options={[{label:"XS",value:"xs"},{label:"S",value:"sm"},{label:"M",value:"md"},{label:"L",value:"lg"},{label:"XL",value:"xl"}]}
                    value={styles.paddingY} onChange={(v) => upd({ paddingY: v as BlockStyles["paddingY"] })} />
                </div>
                <div><FL>Max Container Width</FL>
                  <SegmentedControl options={[{label:"SM",value:"sm"},{label:"MD",value:"md"},{label:"LG",value:"lg"},{label:"XL",value:"xl"},{label:"Full",value:"full"}]}
                    value={styles.maxWidth} onChange={(v) => upd({ maxWidth: v as BlockStyles["maxWidth"] })} />
                </div>
                {hasGrid && (
                  <div><FL>Grid Columns</FL>
                    <SegmentedControl options={[{label:"2 Col",value:"2"},{label:"3 Col",value:"3"},{label:"4 Col",value:"4"}]}
                      value={styles.gridCols} onChange={(v) => upd({ gridCols: v as BlockStyles["gridCols"] })} />
                  </div>
                )}
                <div><FL>Content Layout</FL>
                  <SegmentedControl
                    options={[
                      { label: "Center", value: "centered" },
                      { label: "Left", value: "left" },
                      { label: "Right", value: "right" },
                    ]}
                    value={styles.contentLayout ?? "centered"}
                    onChange={(v) => upd({ contentLayout: v as BlockStyles["contentLayout"] })}
                  />
                  <div className="mt-1.5">
                    <SegmentedControl
                      options={[
                        { label: "◧ Split →", value: "split-left" },
                        { label: "◨ ← Split", value: "split-right" },
                      ]}
                      value={styles.contentLayout === "split-left" || styles.contentLayout === "split-right" ? styles.contentLayout : ""}
                      onChange={(v) => upd({ contentLayout: v as BlockStyles["contentLayout"] })}
                    />
                  </div>
                </div>
                <div><FL>Button Position</FL>
                  <SegmentedControl
                    options={[
                      { label: <AlignLeft size={13}/>, value: "left" },
                      { label: <AlignCenter size={13}/>, value: "center" },
                      { label: <AlignRight size={13}/>, value: "right" },
                    ]}
                    value={styles.buttonAlign ?? "center"}
                    onChange={(v) => upd({ buttonAlign: v as BlockStyles["buttonAlign"] })}
                  />
                </div>
              </StyleAccordion>

              <StyleAccordion title="Typography" icon={Type} isOpen={openStyleSects.has("typography")} onToggle={() => toggleStyle("typography")}>
                <div><FL>Heading Color</FL><ColorRow value={styles.headingColor} placeholder="#111111" onChange={(v) => upd({ headingColor: v })} /></div>
                <div><FL>Heading Size</FL>
                  <SegmentedControl options={[{label:"S",value:"sm"},{label:"M",value:"md"},{label:"L",value:"lg"},{label:"XL",value:"xl"}]}
                    value={styles.headingSize} onChange={(v) => upd({ headingSize: v as BlockStyles["headingSize"] })} />
                </div>
                <div><FL>Body Color</FL><ColorRow value={styles.bodyColor} placeholder="#6b7280" onChange={(v) => upd({ bodyColor: v })} /></div>
                <div><FL>Alignment</FL>
                  <SegmentedControl options={[{label:<AlignLeft size={13}/>,value:"left"},{label:<AlignCenter size={13}/>,value:"center"},{label:<AlignRight size={13}/>,value:"right"}]}
                    value={styles.textAlign} onChange={(v) => upd({ textAlign: v as BlockStyles["textAlign"] })} />
                </div>
                <div><FL>Font Family</FL>
                  <SegmentedControl options={[{label:"Sans",value:"sans"},{label:"Serif",value:"serif"},{label:"Mono",value:"mono"}]}
                    value={styles.fontFamily} onChange={(v) => upd({ fontFamily: v as BlockStyles["fontFamily"] })} />
                </div>
              </StyleAccordion>

              <StyleAccordion title="Accents & Buttons" icon={Sparkles} isOpen={openStyleSects.has("accents")} onToggle={() => toggleStyle("accents")}>
                <div><FL>Accent Color</FL><ColorRow value={styles.accentColor} placeholder="#000000" onChange={(v) => upd({ accentColor: v })} /></div>
                <div><FL>Button Style</FL>
                  <SegmentedControl options={[{label:"Solid",value:"filled"},{label:"Outline",value:"outline"},{label:"Ghost",value:"ghost"}]}
                    value={styles.buttonVariant} onChange={(v) => upd({ buttonVariant: v as BlockStyles["buttonVariant"] })} />
                </div>
                <div><FL>Button Radius</FL>
                  <SegmentedControl options={[{label:"Sharp",value:"md"},{label:"Sleek",value:"lg"},{label:"Pill",value:"full"}]}
                    value={styles.buttonRadius} onChange={(v) => upd({ buttonRadius: v as BlockStyles["buttonRadius"] })} />
                </div>
                <div><FL>Button Size</FL>
                  <SegmentedControl options={[{label:"Small",value:"sm"},{label:"Medium",value:"md"},{label:"Large",value:"lg"}]}
                    value={styles.buttonSize} onChange={(v) => upd({ buttonSize: v as BlockStyles["buttonSize"] })} />
                </div>
                <div><FL>Button Fill Color</FL>
                  <ColorRow value={styles.buttonColor} placeholder="Uses accent color" onChange={(v) => upd({ buttonColor: v })} />
                </div>
                <div><FL>Button Text Color</FL>
                  <ColorRow value={styles.buttonTextColor} placeholder="#ffffff" onChange={(v) => upd({ buttonTextColor: v })} />
                </div>
              </StyleAccordion>

              <StyleAccordion title="Background" icon={ImageIcon} isOpen={openStyleSects.has("background")} onToggle={() => toggleStyle("background")}>
                <div><FL>Section Background</FL><ColorRow value={styles.sectionBg} placeholder="#ffffff" onChange={(v) => upd({ sectionBg: v })} /></div>
                <div><FL>Background Type</FL>
                  <SegmentedControl options={[{label:"Solid",value:"color"},{label:"Gradient",value:"gradient"},{label:"Image",value:"image"}]}
                    value={styles.bgType ?? "color"} onChange={(v) => upd({ bgType: v as BlockStyles["bgType"] })} />
                </div>
                {styles.bgType === "gradient" && (
                  <>
                    <div><FL>From</FL><ColorRow value={styles.bgGradientFrom} placeholder="#6344d4" onChange={(v) => upd({ bgGradientFrom: v })} /></div>
                    <div><FL>To</FL><ColorRow value={styles.bgGradientTo} placeholder="#000000" onChange={(v) => upd({ bgGradientTo: v })} /></div>
                    <div><FL>Direction</FL>
                      <SegmentedControl options={[{label:"→",value:"to-r"},{label:"↘",value:"to-br"},{label:"↓",value:"to-b"},{label:"↙",value:"to-bl"},{label:"←",value:"to-l"},{label:"↗",value:"to-tr"}]}
                        value={styles.bgGradientDir ?? "to-r"} onChange={(v) => upd({ bgGradientDir: v as BlockStyles["bgGradientDir"] })} />
                    </div>
                  </>
                )}
                {styles.bgType === "image" && (
                  <>
                    <div><FL>Background Image</FL><BgImageUpload value={styles.bgImage} onChange={(v) => upd({ bgImage: v })} /></div>
                    <div><FL>Image Size</FL>
                      <SegmentedControl options={[{label:"Cover",value:"cover"},{label:"Contain",value:"contain"},{label:"Repeat",value:"repeat"}]}
                        value={styles.bgImageSize ?? "cover"} onChange={(v) => upd({ bgImageSize: v as BlockStyles["bgImageSize"] })} />
                    </div>
                    <div><FL>Position</FL>
                      <SegmentedControl options={[{label:"Top",value:"top"},{label:"Center",value:"center"},{label:"Bottom",value:"bottom"}]}
                        value={styles.bgImagePos ?? "center"} onChange={(v) => upd({ bgImagePos: v as BlockStyles["bgImagePos"] })} />
                    </div>
                    <ToggleRow label="Fixed / Parallax" checked={!!styles.bgImageFixed} onChange={(v) => upd({ bgImageFixed: v })} />
                    <ToggleRow label="Dark Overlay" checked={!!styles.bgOverlay} onChange={(v) => upd({ bgOverlay: v })} />
                    {styles.bgOverlay && (
                      <>
                        <div><FL>Overlay Color</FL><ColorRow value={styles.bgOverlayColor ?? "#000000"} placeholder="#000000" onChange={(v) => upd({ bgOverlayColor: v })} /></div>
                        <div><FL>Overlay Opacity</FL>
                          <SegmentedControl options={[{label:"10%",value:"10"},{label:"20%",value:"20"},{label:"40%",value:"40"},{label:"60%",value:"60"},{label:"80%",value:"80"}]}
                            value={styles.bgOverlayOpacity ?? "40"} onChange={(v) => upd({ bgOverlayOpacity: v as BlockStyles["bgOverlayOpacity"] })} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </StyleAccordion>

              <StyleAccordion title="Section Effects" icon={Layers} isOpen={openStyleSects.has("effects")} onToggle={() => toggleStyle("effects")}>
                <div><FL>Box Shadow</FL>
                  <SegmentedControl options={[{label:"None",value:"none"},{label:"Soft",value:"sm"},{label:"Mid",value:"md"},{label:"High",value:"lg"}]}
                    value={styles.sectionShadow ?? "none"} onChange={(v) => upd({ sectionShadow: v as BlockStyles["sectionShadow"] })} />
                </div>
                <ToggleRow label="Border Top" checked={!!styles.borderTop} onChange={(v) => upd({ borderTop: v })} />
                <ToggleRow label="Border Bottom" checked={!!styles.borderBottom} onChange={(v) => upd({ borderBottom: v })} />
                {(styles.borderTop || styles.borderBottom) && (
                  <div><FL>Border Color</FL><ColorRow value={styles.sectionBorderColor ?? "#e5e7eb"} placeholder="#e5e7eb" onChange={(v) => upd({ sectionBorderColor: v })} /></div>
                )}
              </StyleAccordion>

              {hasCards && (
                <StyleAccordion title="Cards" icon={LayoutGrid} isOpen={openStyleSects.has("cards")} onToggle={() => toggleStyle("cards")}>
                  <div><FL>Card Background</FL><ColorRow value={styles.cardBg} placeholder="#ffffff" onChange={(v) => upd({ cardBg: v })} /></div>
                  <div><FL>Corner Radius</FL>
                    <SegmentedControl options={[{label:"MD",value:"md"},{label:"LG",value:"lg"},{label:"XL",value:"xl"}]}
                      value={styles.cardRadius} onChange={(v) => upd({ cardRadius: v as BlockStyles["cardRadius"] })} />
                  </div>
                  <div><FL>Card Shadow</FL>
                    <SegmentedControl options={[{label:"None",value:"none"},{label:"Soft",value:"sm"},{label:"Elevated",value:"md"}]}
                      value={styles.cardShadow} onChange={(v) => upd({ cardShadow: v as BlockStyles["cardShadow"] })} />
                  </div>
                </StyleAccordion>
              )}

              <button onClick={() => onStyleChange({})}
                className="w-full py-2.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <RotateCcw size={11} /> Reset Styling
              </button>
            </>
          )}

          {/* ── ADVANCED TAB ── */}
          {tab === "advanced" && (
            <div className="space-y-5">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700 leading-relaxed">
                Advanced settings affect the block's HTML output and visibility. Use for SEO anchor links, custom animations, and responsive hiding.
              </div>

              <div>
                <label className={lblCls}>Anchor ID</label>
                <input type="text" className={inputCls}
                  value={styles.blockId ?? ""}
                  onChange={(e) => upd({ blockId: e.target.value || undefined })}
                  placeholder="e.g. services, about-us, contact" />
                <p className="text-[10px] text-gray-400 mt-1">Link to this section with <code className="bg-gray-100 px-1 rounded">#id</code> in any URL</p>
              </div>

              <div>
                <label className={lblCls}>Extra CSS Classes</label>
                <input type="text" className={inputCls}
                  value={styles.cssClasses ?? ""}
                  onChange={(e) => upd({ cssClasses: e.target.value || undefined })}
                  placeholder="e.g. my-custom-class animate-bounce" />
                <p className="text-[10px] text-gray-400 mt-1">Appended to the section wrapper element</p>
              </div>

              <div>
                <label className={lblCls}>Entrance Animation</label>
                <SegmentedControl
                  options={[
                    { label: "None",     value: "none"    },
                    { label: "Fade In",  value: "fade-in" },
                    { label: "Slide Up", value: "slide-up"},
                    { label: "Scale",    value: "scale-in"},
                  ]}
                  value={styles.animation ?? "none"}
                  onChange={(v) => upd({ animation: v as BlockStyles["animation"] })}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className={lblCls}>Visibility</label>
                <ToggleRow label="Hide on Mobile" checked={!!styles.hideOnMobile} onChange={(v) => upd({ hideOnMobile: v })} />
                <ToggleRow label="Hide on Desktop" checked={!!styles.hideOnDesktop} onChange={(v) => upd({ hideOnDesktop: v })} />
                {(styles.hideOnMobile || styles.hideOnDesktop) && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    Hidden sections are excluded from the live site but remain editable here.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
