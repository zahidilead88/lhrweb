"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  X, Plus, Trash2, GripVertical, Type, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, List, Minus, ChevronDown, ChevronUp,
  Check, ArrowLeft, LayoutTemplate, Square, Maximize2,
  Upload, Code2, Paintbrush, Copy, CheckCheck, Box,
  ExternalLink, AlignJustify, Settings2, Bookmark, BookmarkCheck,
  Smartphone, Monitor,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  CanvasEl, CanvasCol, CanvasRow, CanvasData,
  CanvasElType, CanvasRowLayout, CanvasColStyle, ComponentDef, BlockStyles,
} from "@/lib/builderComponents";
import { BLOCK_FIELDS } from "@/lib/builderComponents";

// ── Layout config ──────────────────────────────────────────────────────────────

const ROW_LAYOUTS: { id: CanvasRowLayout; label: string; cols: number[]; icon: string }[] = [
  { id: "1",       label: "Full",  cols: [12],         icon: "█" },
  { id: "1-1",     label: "50/50", cols: [6, 6],       icon: "▌▐" },
  { id: "1-2",     label: "33/67", cols: [4, 8],       icon: "▍▋" },
  { id: "2-1",     label: "67/33", cols: [8, 4],       icon: "▋▍" },
  { id: "1-1-1",   label: "3 Col", cols: [4, 4, 4],    icon: "▍▌▐" },
  { id: "1-1-1-1", label: "4 Col", cols: [3, 3, 3, 3], icon: "▎▎▎▎" },
];

const COL_PAD: Record<string, string>    = { none: "", sm: "p-3", md: "p-5", lg: "p-8" };
const COL_RADIUS: Record<string, string> = { none: "", sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl" };
const COL_SHADOW: Record<string, string> = { none: "", sm: "shadow-sm", md: "shadow-md" };

function colClasses(s?: CanvasColStyle) {
  if (!s) return "";
  return [s.padding ? COL_PAD[s.padding] : "", s.radius ? COL_RADIUS[s.radius] : "",
    s.shadow ? COL_SHADOW[s.shadow] : "", s.border ? "border" : ""].filter(Boolean).join(" ");
}
function colCssStyle(s?: CanvasColStyle): React.CSSProperties {
  if (!s) return {};
  const o: React.CSSProperties = {};
  if (s.bg) o.background = s.bg;
  if (s.border && s.borderColor) o.borderColor = s.borderColor;
  return o;
}

// ── Palette ────────────────────────────────────────────────────────────────────

const PALETTE: { type: CanvasElType; label: string; icon: React.ReactNode; defaultContent: string; defaultProps: CanvasEl["props"] }[] = [
  { type: "heading", label: "Heading", icon: <Type size={14} />,      defaultContent: "Section Heading",             defaultProps: { size: "lg", align: "left", fontWeight: "bold", textColor: "#111111" } },
  { type: "text",    label: "Text",    icon: <AlignJustify size={14} />, defaultContent: "Add your paragraph text here.", defaultProps: { align: "left", textSize: "base", lineHeight: "relaxed", textColor: "#4b5563" } },
  { type: "button",  label: "Button",  icon: <Square size={14} />,    defaultContent: "Click Me",                    defaultProps: { variant: "filled", color: "#000000", href: "#", btnRadius: "lg", btnSize: "md" } },
  { type: "image",   label: "Image",   icon: <ImageIcon size={14} />, defaultContent: "",                            defaultProps: { src: "", alt: "", imgWidth: "full", imgRadius: "md", imgFit: "cover" } },
  { type: "list",    label: "List",    icon: <List size={14} />,      defaultContent: "",                            defaultProps: { items: ["First item", "Second item", "Third item"], bulletStyle: "check", itemColor: "#374151", itemSize: "md", itemSpacing: "normal" } },
  { type: "divider", label: "Divider", icon: <Minus size={14} />,     defaultContent: "",                            defaultProps: { divColor: "#e5e7eb", divThickness: "1", divStyle: "solid", divWidth: "full" } },
  { type: "spacer",  label: "Spacer",  icon: <Maximize2 size={14} />, defaultContent: "",                            defaultProps: { spacerHeight: "md" } },
  { type: "div",     label: "Div",     icon: <Box size={14} />,        defaultContent: "",                            defaultProps: {} },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid()    { return `el-${Math.random().toString(36).slice(2, 8)}`; }
function rowUid() { return `row-${Math.random().toString(36).slice(2, 8)}`; }
function colUid() { return `col-${Math.random().toString(36).slice(2, 8)}`; }

function deepCloneEls(els: CanvasEl[]): CanvasEl[] {
  return els.map((e) => ({ ...e, id: uid(), children: e.children ? deepCloneEls(e.children) : undefined }));
}

function makeRow(layout: CanvasRowLayout): CanvasRow {
  const cfg = ROW_LAYOUTS.find((r) => r.id === layout)!;
  return { id: rowUid(), layout, cols: cfg.cols.map(() => ({ id: colUid(), elements: [] })) };
}
function changeLayout(row: CanvasRow, layout: CanvasRowLayout): CanvasRow {
  const cfg = ROW_LAYOUTS.find((r) => r.id === layout)!;
  return { ...row, layout, cols: cfg.cols.map((_, i) => row.cols[i] ?? { id: colUid(), elements: [] }) };
}

// ── Recursive element tree helpers ────────────────────────────────────────────

function findElRec(elements: CanvasEl[], id: string): CanvasEl | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) { const f = findElRec(el.children, id); if (f) return f; }
  }
  return null;
}
function updateElRec(elements: CanvasEl[], id: string, updated: CanvasEl): CanvasEl[] {
  return elements.map((el) => {
    if (el.id === id) return updated;
    if (el.children) return { ...el, children: updateElRec(el.children, id, updated) };
    return el;
  });
}
function deleteElRec(elements: CanvasEl[], id: string): CanvasEl[] {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => el.children ? { ...el, children: deleteElRec(el.children, id) } : el);
}
function addElToDiv(elements: CanvasEl[], divId: string, newEl: CanvasEl): CanvasEl[] {
  return elements.map((el) => {
    if (el.id === divId) return { ...el, children: [...(el.children ?? []), newEl] };
    if (el.children) return { ...el, children: addElToDiv(el.children, divId, newEl) };
    return el;
  });
}
function reorderDivChildren(elements: CanvasEl[], divId: string, oldIdx: number, newIdx: number): CanvasEl[] {
  return elements.map((el) => {
    if (el.id === divId) return { ...el, children: arrayMove(el.children ?? [], oldIdx, newIdx) };
    if (el.children) return { ...el, children: reorderDivChildren(el.children, divId, oldIdx, newIdx) };
    return el;
  });
}

// ── Inspector UI primitives ────────────────────────────────────────────────────

function InspSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.12em]">{title}</p>
      {children}
      <div className="border-b border-gray-50 pt-1" />
    </div>
  );
}
function InspRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Seg({ options, value, onChange }: {
  options: { label: React.ReactNode; value: string }[];
  value?: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-0.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
            value === o.value ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}
        >{o.label}</button>
      ))}
    </div>
  );
}
function ColorRow({ value, placeholder, onChange }: { value?: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-1 rounded-lg">
      <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0 flex-shrink-0" />
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent text-[11px] font-mono focus:outline-none" />
      {value && <button onClick={() => onChange("")} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"><X size={10} /></button>}
    </div>
  );
}

// ── Margin-bottom helper ───────────────────────────────────────────────────────

const MB: Record<string, string> = { none: "mb-0", sm: "mb-2", md: "mb-4", lg: "mb-6", xl: "mb-8" };
function mbClass(v?: string) { return v ? (MB[v] ?? "") : "mb-2"; }

// ── Element preview ────────────────────────────────────────────────────────────

function ElPreview({ el }: { el: CanvasEl }) {
  const p = el.props ?? {};
  const align = p.align ?? "left";
  const aC = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const mb = mbClass(p.marginBottom);

  // font-weight map
  const FW: Record<string, string> = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold", black: "font-black" };
  const LS: Record<string, string> = { normal: "tracking-normal", wide: "tracking-wide", wider: "tracking-wider", widest: "tracking-widest" };
  const LH: Record<string, string> = { tight: "leading-tight", normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose" };
  const TS: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" };
  const HS: Record<string, string> = { sm: "text-lg", md: "text-xl", lg: "text-2xl", xl: "text-3xl", "2xl": "text-4xl" };
  const IR: Record<string, string> = { none: "", sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" };
  const IS: Record<string, string> = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" };
  const IW: Record<string, string> = { auto: "w-auto", "1/2": "w-1/2", "3/4": "w-3/4", full: "w-full" };
  const BTN_RADIUS: Record<string, string> = { none: "rounded", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" };
  const BTN_PAD: Record<string, string> = { sm: "px-3 py-1.5 text-[11px]", md: "px-4 py-2 text-[12px]", lg: "px-6 py-3 text-[14px]" };

  switch (el.type) {
    case "heading": return (
      <div className={`px-2 py-1 ${aC} ${mb}`}>
        <p className={`leading-tight ${HS[p.size ?? "lg"] ?? "text-2xl"} ${FW[p.fontWeight ?? "bold"] ?? "font-bold"} ${LS[p.letterSpacing ?? "normal"] ?? ""}`}
          style={{ color: p.textColor ?? "#111111" }}>
          {el.content || "Heading"}
        </p>
      </div>
    );
    case "text": return (
      <div className={`px-2 py-1 ${aC} ${mb}`}>
        <p className={`${TS[p.textSize ?? "base"] ?? "text-base"} ${FW[p.fontWeight ?? "normal"] ?? "font-normal"} ${LH[p.lineHeight ?? "relaxed"] ?? "leading-relaxed"}`}
          style={{ color: p.textColor ?? "#4b5563" }}>
          {el.content || "Text content..."}
        </p>
      </div>
    );
    case "button": return (
      <div className={`px-2 py-1 ${mb} ${align === "center" ? "flex justify-center" : align === "right" ? "flex justify-end" : ""}`}>
        <span
          className={`inline-block font-bold ${BTN_RADIUS[p.btnRadius ?? "lg"] ?? "rounded-xl"} ${BTN_PAD[p.btnSize ?? "md"] ?? "px-4 py-2 text-[12px]"} ${p.fullWidth ? "w-full text-center block" : ""}`}
          style={p.variant === "outline"
            ? { border: `2px solid ${p.color ?? "#000"}`, color: p.color ?? "#000" }
            : p.variant === "ghost" ? { color: p.color ?? "#000" }
            : { background: p.color ?? "#000", color: "#fff" }}
        >{el.content || "Button"}</span>
      </div>
    );
    case "image": return (
      <div className={`px-2 py-1 ${mb} ${align === "center" ? "flex justify-center" : align === "right" ? "flex justify-end" : ""}`}>
        {p.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.src} alt={p.alt ?? ""}
            className={`${IW[p.imgWidth ?? "full"] ?? "w-full"} ${IR[p.imgRadius ?? "md"] ?? "rounded-xl"} ${IS[p.imgShadow ?? "none"] ?? ""} max-h-40 ${p.imgFit === "contain" ? "object-contain" : "object-cover"}`}
          />
        ) : (
          <div className="w-full h-24 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-300 text-[11px] border border-dashed border-gray-200 gap-1.5">
            <ImageIcon size={18} /><span>No image yet</span>
          </div>
        )}
      </div>
    );
    case "list": {
      const spacingCls = p.itemSpacing === "tight" ? "space-y-1" : p.itemSpacing === "loose" ? "space-y-3" : "space-y-2";
      const sizeCls = p.itemSize === "sm" ? "text-[11px]" : p.itemSize === "lg" ? "text-[15px]" : "text-[13px]";
      return (
        <div className={`px-2 py-1 ${mb}`}>
          <ul className={spacingCls}>
            {(p.items ?? ["Item 1"]).map((item, i) => {
              let bullet: React.ReactNode = null;
              if (p.bulletStyle === "dot") bullet = <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: p.itemColor ?? "#374151" }} />;
              else if (p.bulletStyle === "number") bullet = <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: p.itemColor ?? "#374151" }}>{i + 1}.</span>;
              else if (p.bulletStyle === "arrow") bullet = <span className="text-[11px] flex-shrink-0" style={{ color: p.itemColor ?? "#374151" }}>→</span>;
              else if (p.bulletStyle === "none") bullet = null;
              else bullet = <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] flex-shrink-0 mt-0.5" style={{ background: p.itemColor ?? "#374151" }}>✓</span>;
              return (
                <li key={i} className={`flex items-start gap-2 ${sizeCls}`} style={{ color: p.itemColor ?? "#374151" }}>
                  {bullet}{item}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    case "divider": {
      const DW: Record<string, string> = { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", "1/4": "w-1/4" };
      const DT: Record<string, string> = { "1": "border-t", "2": "border-t-2", "4": "border-t-4" };
      return (
        <div className={`px-2 py-2 ${mb} flex justify-center`}>
          <div className={`${DW[p.divWidth ?? "full"] ?? "w-full"} ${DT[p.divThickness ?? "1"]} border-${p.divStyle ?? "solid"}`}
            style={{ borderColor: p.divColor ?? "#e5e7eb" }} />
        </div>
      );
    }
    case "spacer": {
      const SH: Record<string, string> = { xs: "h-3", sm: "h-5", md: "h-8", lg: "h-12", xl: "h-16", "2xl": "h-24" };
      return (
        <div className={`${SH[p.spacerHeight ?? "md"] ?? "h-8"} flex items-center justify-center`}>
          <span className="text-[8px] text-gray-200 uppercase tracking-widest font-bold">spacer</span>
        </div>
      );
    }
    default: return null;
  }
}

// ── Inline text editor (appears on double-click) ────────────────────────────────

function InlineEditor({ el, value, onChange, onSave, onCancel }: {
  el: CanvasEl; value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && el.type !== "text") { e.preventDefault(); onSave(); }
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
  };
  const inputCls = "w-full bg-white border-2 border-[#6344d4] rounded-lg px-2 py-1 text-[11px] font-medium text-gray-900 outline-none shadow-[0_0_0_2px_rgba(99,68,212,0.15)]";
  if (el.type === "text") {
    return <textarea ref={ref as React.Ref<HTMLTextAreaElement>} className={`${inputCls} resize-none min-h-[60px]`} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onSave} onKeyDown={handleKey} autoFocus />;
  }
  return <input ref={ref as React.Ref<HTMLInputElement>} type="text" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onSave} onKeyDown={handleKey} autoFocus />;
}

// ── Sortable element wrapper ───────────────────────────────────────────────────

function SortableEl({ el, isSelected, onSelect, onDelete, selectedElId, activeDivElId, onSelectChild, onDeleteChild, onDivDragEnd, onContentEdit }: {
  el: CanvasEl;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  selectedElId?: string | null;
  activeDivElId?: string | null;
  onSelectChild?: (childId: string, isDiv: boolean) => void;
  onDeleteChild?: (childId: string) => void;
  onDivDragEnd?: (evt: DragEndEvent, divId: string) => void;
  onContentEdit?: (elId: string, content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: el.id });
  const innerSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [editingInline, setEditingInline] = useState(false);
  const [inlineVal, setInlineVal] = useState("");

  // ── Nested div container ───────────────────────────────────────────────────
  if (el.type === "div") {
    const isActiveDrop = activeDivElId === el.id;
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
        className="group/divEl"
      >
        {/* Div wrapper */}
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={`rounded-xl border-2 transition-all ${isSelected ? "border-[#6344d4]" : isActiveDrop ? "border-indigo-400" : "border-dashed border-indigo-200 hover:border-indigo-400"}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-t-xl ${isSelected ? "bg-indigo-50" : "bg-indigo-50/40"}`}>
            <div className="flex items-center gap-1.5">
              <button {...attributes} {...listeners}
                className="text-indigo-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing"
                tabIndex={-1}><GripVertical size={11} /></button>
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Box size={8} /> Div
                {isActiveDrop && <span className="text-[7px] bg-indigo-400 text-white rounded px-1 ml-1">Active</span>}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-300 hover:text-red-500 transition-colors opacity-0 group-hover/divEl:opacity-100">
              <X size={10} />
            </button>
          </div>

          {/* Children drop zone */}
          <div
            className={`${colClasses(el.divStyle)} min-h-[44px] rounded-b-xl`}
            style={colCssStyle(el.divStyle)}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <DndContext sensors={innerSensors} collisionDetection={closestCenter}
              onDragEnd={(evt) => onDivDragEnd?.(evt, el.id)}>
              <SortableContext items={(el.children ?? []).map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="p-1.5 space-y-1 min-h-[36px]">
                  {(el.children ?? []).map((child) => (
                    <SortableEl
                      key={child.id}
                      el={child}
                      isSelected={selectedElId === child.id}
                      onSelect={() => onSelectChild?.(child.id, child.type === "div")}
                      onDelete={() => onDeleteChild?.(child.id)}
                      selectedElId={selectedElId}
                      activeDivElId={activeDivElId}
                      onSelectChild={onSelectChild}
                      onDeleteChild={onDeleteChild}
                      onDivDragEnd={onDivDragEnd}
                      onContentEdit={onContentEdit}
                    />
                  ))}
                  {(!el.children?.length) && (
                    <div className={`min-h-[36px] flex flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${isActiveDrop ? "text-indigo-400 bg-indigo-50/50 border border-dashed border-indigo-200" : "text-gray-300"}`}>
                      <Plus size={11} />{isActiveDrop ? "Pick element from palette" : "Empty div"}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular element ────────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => {
        if (el.type === "heading" || el.type === "text" || el.type === "button") {
          e.stopPropagation();
          setInlineVal(el.content);
          setEditingInline(true);
        }
      }}
      className={`group/el relative rounded-lg transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-[#6344d4] ring-offset-1 bg-purple-50/20" : "hover:ring-1 hover:ring-gray-200"}`}
    >
      <button {...attributes} {...listeners}
        className="absolute -left-5 top-0 w-4 h-full flex items-center justify-center text-gray-300 hover:text-gray-500 opacity-0 group-hover/el:opacity-100 cursor-grab active:cursor-grabbing transition-all"
        tabIndex={-1}><GripVertical size={12} /></button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-1 top-1 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-red-100 text-red-300 hover:text-red-500 opacity-0 group-hover/el:opacity-100 transition-all shadow-sm"
        tabIndex={-1}><X size={9} /></button>
      {editingInline ? (
        <InlineEditor
          el={el}
          value={inlineVal}
          onChange={setInlineVal}
          onSave={() => { if (onContentEdit) onContentEdit(el.id, inlineVal); setEditingInline(false); }}
          onCancel={() => setEditingInline(false)}
        />
      ) : (
        <ElPreview el={el} />
      )}
    </div>
  );
}

// ── Full element inspector ─────────────────────────────────────────────────────

function ElInspector({ el, onChange, tab }: { el: CanvasEl; onChange: (el: CanvasEl) => void; tab?: "content" | "style" }) {
  const p = el.props ?? {};
  const upd  = (patch: Partial<CanvasEl>) => onChange({ ...el, ...patch });
  const updP = (patch: Partial<NonNullable<CanvasEl["props"]>>) => onChange({ ...el, props: { ...p, ...patch } });

  const alignOpts = [
    { label: <AlignLeft size={11} />, value: "left" },
    { label: <AlignCenter size={11} />, value: "center" },
    { label: <AlignRight size={11} />, value: "right" },
  ];
  const mbOpts = [
    { label: "0", value: "none" }, { label: "S", value: "sm" },
    { label: "M", value: "md" },  { label: "L", value: "lg" }, { label: "XL", value: "xl" },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#6344d4] rounded-lg flex items-center justify-center text-white flex-shrink-0">
          {PALETTE.find((pp) => pp.type === el.type)?.icon}
        </div>
        <p className="text-[12px] font-bold text-gray-900 capitalize">{el.type}</p>
      </div>

      {/* ── HEADING ─────────────────────────────────────────────────────────── */}
      {el.type === "heading" && (
        <>
          {(!tab || tab === "content") && (
            <InspSection title="Content">
              <InspRow label="Text">
                <input type="text" className="w-full px-3 py-2 text-[12px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
                  value={el.content} onChange={(e) => upd({ content: e.target.value })} />
              </InspRow>
            </InspSection>
          )}
          {(!tab || tab === "style") && (<>
            <InspSection title="Typography">
              <InspRow label="Size">
                <Seg value={p.size ?? "lg"} onChange={(v) => updP({ size: v as never })}
                  options={[{ label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }, { label: "XL", value: "xl" }, { label: "2XL", value: "2xl" }]} />
              </InspRow>
              <InspRow label="Weight">
                <Seg value={p.fontWeight ?? "bold"} onChange={(v) => updP({ fontWeight: v as never })}
                  options={[{ label: "400", value: "normal" }, { label: "500", value: "medium" }, { label: "600", value: "semibold" }, { label: "700", value: "bold" }, { label: "900", value: "black" }]} />
              </InspRow>
              <InspRow label="Color"><ColorRow value={p.textColor} placeholder="#111111" onChange={(v) => updP({ textColor: v })} /></InspRow>
              <InspRow label="Letter Spacing">
                <Seg value={p.letterSpacing ?? "normal"} onChange={(v) => updP({ letterSpacing: v as never })}
                  options={[{ label: "Norm", value: "normal" }, { label: "Wide", value: "wide" }, { label: "Wider", value: "wider" }, { label: "Max", value: "widest" }]} />
              </InspRow>
            </InspSection>
            <InspSection title="Layout">
              <InspRow label="Alignment"><Seg value={p.align ?? "left"} onChange={(v) => updP({ align: v as never })} options={alignOpts} /></InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          </>)}
        </>
      )}

      {/* ── TEXT ────────────────────────────────────────────────────────────── */}
      {el.type === "text" && (
        <>
          {(!tab || tab === "content") && (
            <InspSection title="Content">
              <InspRow label="Text">
                <textarea className="w-full px-3 py-2 text-[12px] border border-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 min-h-[70px]"
                  value={el.content} onChange={(e) => upd({ content: e.target.value })} />
              </InspRow>
            </InspSection>
          )}
          {(!tab || tab === "style") && (<>
            <InspSection title="Typography">
              <InspRow label="Font Size">
                <Seg value={p.textSize ?? "base"} onChange={(v) => updP({ textSize: v as never })}
                  options={[{ label: "XS", value: "xs" }, { label: "S", value: "sm" }, { label: "M", value: "base" }, { label: "L", value: "lg" }, { label: "XL", value: "xl" }]} />
              </InspRow>
              <InspRow label="Weight">
                <Seg value={p.fontWeight ?? "normal"} onChange={(v) => updP({ fontWeight: v as never })}
                  options={[{ label: "400", value: "normal" }, { label: "500", value: "medium" }, { label: "600", value: "semibold" }, { label: "700", value: "bold" }]} />
              </InspRow>
              <InspRow label="Color"><ColorRow value={p.textColor} placeholder="#4b5563" onChange={(v) => updP({ textColor: v })} /></InspRow>
              <InspRow label="Line Height">
                <Seg value={p.lineHeight ?? "relaxed"} onChange={(v) => updP({ lineHeight: v as never })}
                  options={[{ label: "Tight", value: "tight" }, { label: "Norm", value: "normal" }, { label: "Relax", value: "relaxed" }, { label: "Loose", value: "loose" }]} />
              </InspRow>
            </InspSection>
            <InspSection title="Layout">
              <InspRow label="Alignment"><Seg value={p.align ?? "left"} onChange={(v) => updP({ align: v as never })} options={alignOpts} /></InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          </>)}
        </>
      )}

      {/* ── BUTTON ──────────────────────────────────────────────────────────── */}
      {el.type === "button" && (
        <>
          {(!tab || tab === "content") && (
            <InspSection title="Content & Link">
              <InspRow label="Label">
                <input type="text" className="w-full px-3 py-2 text-[12px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
                  value={el.content} onChange={(e) => upd({ content: e.target.value })} />
              </InspRow>
              <InspRow label="URL">
                <input type="url" className="w-full px-3 py-2 text-[12px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
                  value={p.href ?? "#"} onChange={(e) => updP({ href: e.target.value })} placeholder="https://..." />
              </InspRow>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><ExternalLink size={10} /> Open in new tab</span>
                <button onClick={() => updP({ newTab: !p.newTab })}
                  className={`relative w-9 h-5 rounded-full transition-all ${p.newTab ? "bg-[#6344d4]" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${p.newTab ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            </InspSection>
          )}
          {(!tab || tab === "style") && (<>
            <InspSection title="Appearance">
              <InspRow label="Style">
                <Seg value={p.variant ?? "filled"} onChange={(v) => updP({ variant: v as never })}
                  options={[{ label: "Solid", value: "filled" }, { label: "Outline", value: "outline" }, { label: "Ghost", value: "ghost" }]} />
              </InspRow>
              <InspRow label="Color"><ColorRow value={p.color} placeholder="#000000" onChange={(v) => updP({ color: v })} /></InspRow>
              <InspRow label="Radius">
                <Seg value={p.btnRadius ?? "lg"} onChange={(v) => updP({ btnRadius: v as never })}
                  options={[{ label: "None", value: "none" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "Pill", value: "full" }]} />
              </InspRow>
              <InspRow label="Size">
                <Seg value={p.btnSize ?? "md"} onChange={(v) => updP({ btnSize: v as never })}
                  options={[{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }]} />
              </InspRow>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500">Full Width</span>
                <button onClick={() => updP({ fullWidth: !p.fullWidth })}
                  className={`relative w-9 h-5 rounded-full transition-all ${p.fullWidth ? "bg-[#6344d4]" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${p.fullWidth ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            </InspSection>
            <InspSection title="Layout">
              <InspRow label="Alignment"><Seg value={p.align ?? "left"} onChange={(v) => updP({ align: v as never })} options={alignOpts} /></InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          </>)}
        </>
      )}

      {/* ── IMAGE ───────────────────────────────────────────────────────────── */}
      {el.type === "image" && (
        <>
          {(!tab || tab === "content") && (
            <InspSection title="Source">
              <ImageUpload src={p.src} alt={p.alt} onChange={(patch) => updP(patch)} />
            </InspSection>
          )}
          {(!tab || tab === "style") && (<>
            <InspSection title="Display">
              <InspRow label="Width">
                <Seg value={p.imgWidth ?? "full"} onChange={(v) => updP({ imgWidth: v as never })}
                  options={[{ label: "Auto", value: "auto" }, { label: "1/2", value: "1/2" }, { label: "3/4", value: "3/4" }, { label: "Full", value: "full" }]} />
              </InspRow>
              <InspRow label="Alignment"><Seg value={p.align ?? "left"} onChange={(v) => updP({ align: v as never })} options={alignOpts} /></InspRow>
              <InspRow label="Object Fit">
                <Seg value={p.imgFit ?? "cover"} onChange={(v) => updP({ imgFit: v as never })}
                  options={[{ label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }, { label: "Auto", value: "auto" }]} />
              </InspRow>
            </InspSection>
            <InspSection title="Style">
              <InspRow label="Corner Radius">
                <Seg value={p.imgRadius ?? "md"} onChange={(v) => updP({ imgRadius: v as never })}
                  options={[{ label: "0", value: "none" }, { label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "Full", value: "full" }]} />
              </InspRow>
              <InspRow label="Shadow">
                <Seg value={p.imgShadow ?? "none"} onChange={(v) => updP({ imgShadow: v as never })}
                  options={[{ label: "None", value: "none" }, { label: "Soft", value: "sm" }, { label: "Mid", value: "md" }, { label: "High", value: "lg" }]} />
              </InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          </>)}
        </>
      )}

      {/* ── LIST ────────────────────────────────────────────────────────────── */}
      {el.type === "list" && (
        <>
          {(!tab || tab === "content") && (
            <InspSection title="Items">
              <div className="space-y-1.5">
                {(p.items ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input type="text" className="flex-1 px-2 py-1.5 text-[11px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
                      value={item}
                      onChange={(e) => { const a = [...(p.items ?? [])]; a[i] = e.target.value; updP({ items: a }); }}
                    />
                    <button onClick={() => updP({ items: (p.items ?? []).filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updP({ items: [...(p.items ?? []), "New item"] })}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#6344d4] hover:text-purple-700 transition-colors">
                  <Plus size={10} /> Add item
                </button>
              </div>
            </InspSection>
          )}
          {(!tab || tab === "style") && (
            <InspSection title="Style">
              <InspRow label="Bullet Style">
                <Seg value={p.bulletStyle ?? "check"} onChange={(v) => updP({ bulletStyle: v as never })}
                  options={[{ label: "✓", value: "check" }, { label: "•", value: "dot" }, { label: "1.", value: "number" }, { label: "→", value: "arrow" }, { label: "—", value: "none" }]} />
              </InspRow>
              <InspRow label="Item Color"><ColorRow value={p.itemColor} placeholder="#374151" onChange={(v) => updP({ itemColor: v })} /></InspRow>
              <InspRow label="Font Size">
                <Seg value={p.itemSize ?? "md"} onChange={(v) => updP({ itemSize: v as never })}
                  options={[{ label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }]} />
              </InspRow>
              <InspRow label="Spacing">
                <Seg value={p.itemSpacing ?? "normal"} onChange={(v) => updP({ itemSpacing: v as never })}
                  options={[{ label: "Tight", value: "tight" }, { label: "Norm", value: "normal" }, { label: "Loose", value: "loose" }]} />
              </InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          )}
        </>
      )}

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      {el.type === "divider" && (
        <>
          {(!tab || tab === "style") && (
            <InspSection title="Style">
              <InspRow label="Color"><ColorRow value={p.divColor} placeholder="#e5e7eb" onChange={(v) => updP({ divColor: v })} /></InspRow>
              <InspRow label="Thickness">
                <Seg value={p.divThickness ?? "1"} onChange={(v) => updP({ divThickness: v as never })}
                  options={[{ label: "1px", value: "1" }, { label: "2px", value: "2" }, { label: "4px", value: "4" }]} />
              </InspRow>
              <InspRow label="Line Style">
                <Seg value={p.divStyle ?? "solid"} onChange={(v) => updP({ divStyle: v as never })}
                  options={[{ label: "Solid", value: "solid" }, { label: "Dashed", value: "dashed" }, { label: "Dotted", value: "dotted" }]} />
              </InspRow>
              <InspRow label="Width">
                <Seg value={p.divWidth ?? "full"} onChange={(v) => updP({ divWidth: v as never })}
                  options={[{ label: "1/4", value: "1/4" }, { label: "1/2", value: "1/2" }, { label: "3/4", value: "3/4" }, { label: "Full", value: "full" }]} />
              </InspRow>
              <InspRow label="Margin Bottom"><Seg value={p.marginBottom ?? "sm"} onChange={(v) => updP({ marginBottom: v as never })} options={mbOpts} /></InspRow>
            </InspSection>
          )}
        </>
      )}

      {/* ── SPACER ──────────────────────────────────────────────────────────── */}
      {el.type === "spacer" && (
        <>
          {(!tab || tab === "style") && (
            <InspSection title="Size">
              <InspRow label="Height">
                <Seg value={p.spacerHeight ?? "md"} onChange={(v) => updP({ spacerHeight: v as never })}
                  options={[{ label: "XS", value: "xs" }, { label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }, { label: "XL", value: "xl" }, { label: "2XL", value: "2xl" }]} />
              </InspRow>
            </InspSection>
          )}
        </>
      )}
    </div>
  );
}

// ── Image upload component ─────────────────────────────────────────────────────

function ImageUpload({ src, alt, onChange }: { src?: string; alt?: string; onChange: (p: { src?: string; alt?: string }) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) onChange({ src: ev.target.result as string }); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {src ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? ""} className="w-full h-28 object-cover" />
          <button onClick={() => onChange({ src: "", alt: "" })} className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 text-red-400 hover:text-red-600"><X size={9} /></button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-[#6344d4]/50 hover:bg-purple-50/20 transition-all text-gray-300 hover:text-[#6344d4]/70">
          <Upload size={15} /><span className="text-[10px] font-bold">Upload image</span>
        </button>
      )}
      <input type="url" placeholder="Or paste URL..." className="w-full px-2.5 py-1.5 text-[11px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
        value={src?.startsWith("data:") ? "" : (src ?? "")} onChange={(e) => onChange({ src: e.target.value })} />
      <input type="text" placeholder="Alt text (accessibility)..." className="w-full px-2.5 py-1.5 text-[11px] border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
        value={alt ?? ""} onChange={(e) => onChange({ alt: e.target.value })} />
    </div>
  );
}

// ── Column / Div inspector ─────────────────────────────────────────────────────

function ColInspector({ col, onChange }: { col: CanvasCol; onChange: (c: CanvasCol) => void }) {
  const s = col.style ?? {};
  const upd = (patch: Partial<CanvasColStyle>) => onChange({ ...col, style: { ...s, ...patch } });
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><Box size={13} className="text-white" /></div>
        <p className="text-[12px] font-bold text-gray-900">Div Styles</p>
      </div>
      <InspSection title="Fill">
        <InspRow label="Background"><ColorRow value={s.bg} placeholder="#ffffff" onChange={(v) => upd({ bg: v || undefined })} /></InspRow>
      </InspSection>
      <InspSection title="Box Model">
        <InspRow label="Padding">
          <Seg value={s.padding ?? "none"} onChange={(v) => upd({ padding: v as never })}
            options={[{ label: "0", value: "none" }, { label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }]} />
        </InspRow>
        <InspRow label="Corner Radius">
          <Seg value={s.radius ?? "none"} onChange={(v) => upd({ radius: v as never })}
            options={[{ label: "0", value: "none" }, { label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }]} />
        </InspRow>
        <InspRow label="Shadow">
          <Seg value={s.shadow ?? "none"} onChange={(v) => upd({ shadow: v as never })}
            options={[{ label: "None", value: "none" }, { label: "Soft", value: "sm" }, { label: "Mid", value: "md" }]} />
        </InspRow>
      </InspSection>
      <InspSection title="Border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500">Show Border</span>
          <button onClick={() => upd({ border: !s.border })} className={`relative w-9 h-5 rounded-full transition-all ${s.border ? "bg-[#6344d4]" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.border ? "left-4" : "left-0.5"}`} />
          </button>
        </div>
        {s.border && <InspRow label="Border Color"><ColorRow value={s.borderColor} placeholder="#e5e7eb" onChange={(v) => upd({ borderColor: v })} /></InspRow>}
      </InspSection>
      <button onClick={() => onChange({ ...col, style: {} })} className="w-full py-2 text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors uppercase tracking-wider">
        Reset Div Styles
      </button>
    </div>
  );
}

// ── Section / Canvas inspector ─────────────────────────────────────────────────

function ContentFieldsSection({ blockType, content, onChange }: {
  blockType: string; content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void;
}) {
  const fields = BLOCK_FIELDS[blockType];
  if (!fields || fields.length === 0) return null;
  const inputCls = "w-full px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10 focus:border-[#6344d4]/30 transition-all";
  const areaCls  = `${inputCls} resize-none min-h-[50px]`;
  const lblCls   = "block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1";
  return (
    <div className="px-4 pt-4 pb-2 space-y-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <Type size={11} /> Section Content
      </p>
      {fields.filter((f) => f.type !== "nav-items").map((f) => {
        const val = String(content[f.key] ?? "");
        return (
          <div key={f.key}>
            <label className={lblCls}>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea className={areaCls} value={val} onChange={(e) => onChange({ ...content, [f.key]: e.target.value })} />
            ) : (
              <input type={f.type === "url" ? "url" : "text"} className={inputCls} value={val} onChange={(e) => onChange({ ...content, [f.key]: e.target.value })} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionInspector({ styles, onChange }: { styles: BlockStyles; onChange: (s: BlockStyles) => void }) {
  const upd = (patch: Partial<BlockStyles>) => onChange({ ...styles, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => upd({ bgImage: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const Toggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-500">{label}</span>
      <button onClick={onToggle} className={`relative w-9 h-5 rounded-full transition-all ${checked ? "bg-[#6344d4]" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );

  const bgType = styles.bgType ?? "color";

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center">
          <ImageIcon size={13} className="text-white" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-gray-900">Section Settings</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Background &amp; layout</p>
        </div>
      </div>

      {/* ── Layout ── */}
      <InspSection title="Layout">
        <InspRow label="Vertical Padding">
          <Seg value={styles.paddingY ?? "md"} onChange={(v) => upd({ paddingY: v as BlockStyles["paddingY"] })}
            options={[{ label: "XS", value: "xs" }, { label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }, { label: "XL", value: "xl" }]} />
        </InspRow>
        <InspRow label="Container Width">
          <Seg value={styles.maxWidth ?? "lg"} onChange={(v) => upd({ maxWidth: v as BlockStyles["maxWidth"] })}
            options={[{ label: "SM", value: "sm" }, { label: "MD", value: "md" }, { label: "LG", value: "lg" }, { label: "XL", value: "xl" }, { label: "Full", value: "full" }]} />
        </InspRow>
      </InspSection>

      {/* ── Background ── */}
      <InspSection title="Background">
        {/* Always show base background color */}
        <InspRow label="Background Color">
          <ColorRow value={styles.sectionBg} placeholder="#ffffff" onChange={(v) => upd({ sectionBg: v || undefined })} />
        </InspRow>
        <InspRow label="Enhancement">
          <Seg value={bgType} onChange={(v) => upd({ bgType: v as BlockStyles["bgType"] })}
            options={[{ label: "None", value: "color" }, { label: "Gradient", value: "gradient" }, { label: "Image", value: "image" }]} />
        </InspRow>

        {/* Gradient */}
        {bgType === "gradient" && (
          <>
            <InspRow label="From"><ColorRow value={styles.bgGradientFrom} placeholder="#6344d4" onChange={(v) => upd({ bgGradientFrom: v })} /></InspRow>
            <InspRow label="To"><ColorRow value={styles.bgGradientTo} placeholder="#000000" onChange={(v) => upd({ bgGradientTo: v })} /></InspRow>
            <InspRow label="Direction">
              <Seg value={styles.bgGradientDir ?? "to-r"} onChange={(v) => upd({ bgGradientDir: v as BlockStyles["bgGradientDir"] })}
                options={[{ label: "→", value: "to-r" }, { label: "↘", value: "to-br" }, { label: "↓", value: "to-b" }, { label: "↙", value: "to-bl" }, { label: "←", value: "to-l" }, { label: "↗", value: "to-tr" }]} />
            </InspRow>
          </>
        )}

        {/* Image */}
        {bgType === "image" && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {styles.bgImage ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={styles.bgImage} alt="" className="w-full h-full object-cover" />
                <button onClick={() => upd({ bgImage: undefined })}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors text-[10px]">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#6344d4]/40 hover:text-[#6344d4]/70 transition-all">
                <Upload size={14} /><span className="text-[9px] font-bold uppercase tracking-wider">Upload Image</span>
              </button>
            )}
            <InspRow label="Or paste URL">
              <input type="text" value={styles.bgImage?.startsWith("data:") ? "" : (styles.bgImage ?? "")}
                onChange={(e) => upd({ bgImage: e.target.value || undefined })}
                placeholder="https://..." className="w-full px-2.5 py-1.5 text-[11px] font-mono border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10" />
            </InspRow>
            <InspRow label="Size">
              <Seg value={styles.bgImageSize ?? "cover"} onChange={(v) => upd({ bgImageSize: v as BlockStyles["bgImageSize"] })}
                options={[{ label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }, { label: "Repeat", value: "repeat" }]} />
            </InspRow>
            <InspRow label="Position">
              <Seg value={styles.bgImagePos ?? "center"} onChange={(v) => upd({ bgImagePos: v as BlockStyles["bgImagePos"] })}
                options={[{ label: "Top", value: "top" }, { label: "Center", value: "center" }, { label: "Bottom", value: "bottom" }]} />
            </InspRow>
            <Toggle label="Fixed / Parallax" checked={!!styles.bgImageFixed} onToggle={() => upd({ bgImageFixed: !styles.bgImageFixed })} />
            <Toggle label="Dark Overlay" checked={!!styles.bgOverlay} onToggle={() => upd({ bgOverlay: !styles.bgOverlay })} />
            {styles.bgOverlay && (
              <>
                <InspRow label="Overlay Color"><ColorRow value={styles.bgOverlayColor ?? "#000000"} placeholder="#000000" onChange={(v) => upd({ bgOverlayColor: v })} /></InspRow>
                <InspRow label="Opacity">
                  <Seg value={styles.bgOverlayOpacity ?? "40"} onChange={(v) => upd({ bgOverlayOpacity: v as BlockStyles["bgOverlayOpacity"] })}
                    options={[{ label: "10%", value: "10" }, { label: "20%", value: "20" }, { label: "40%", value: "40" }, { label: "60%", value: "60" }, { label: "80%", value: "80" }]} />
                </InspRow>
              </>
            )}
          </>
        )}
      </InspSection>

      {/* ── Section Effects ── */}
      <InspSection title="Effects">
        <InspRow label="Shadow">
          <Seg value={styles.sectionShadow ?? "none"} onChange={(v) => upd({ sectionShadow: v as BlockStyles["sectionShadow"] })}
            options={[{ label: "None", value: "none" }, { label: "S", value: "sm" }, { label: "M", value: "md" }, { label: "L", value: "lg" }]} />
        </InspRow>
        <Toggle label="Border Top"    checked={!!styles.borderTop}    onToggle={() => upd({ borderTop:    !styles.borderTop })} />
        <Toggle label="Border Bottom" checked={!!styles.borderBottom} onToggle={() => upd({ borderBottom: !styles.borderBottom })} />
        {(styles.borderTop || styles.borderBottom) && (
          <InspRow label="Border Color"><ColorRow value={styles.sectionBorderColor} placeholder="#e5e7eb" onChange={(v) => upd({ sectionBorderColor: v })} /></InspRow>
        )}
      </InspSection>

      <button onClick={() => onChange({})} className="w-full py-2 text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors uppercase tracking-wider">
        Reset Section Styles
      </button>
    </div>
  );
}

// ── HTML code generator ────────────────────────────────────────────────────────

function generateHtml(rows: CanvasRow[], name?: string, sectionStyles?: BlockStyles): string {
  const layoutCols: Record<string, number[]> = {
    "1": [12], "1-1": [6, 6], "1-2": [4, 8], "2-1": [8, 4],
    "1-1-1": [4, 4, 4], "1-1-1-1": [3, 3, 3, 3],
  };
  const FW: Record<string, string> = { normal: "font-weight:400", medium: "font-weight:500", semibold: "font-weight:600", bold: "font-weight:700", black: "font-weight:900" };
  const LS: Record<string, string> = { normal: "", wide: "letter-spacing:0.05em", wider: "letter-spacing:0.1em", widest: "letter-spacing:0.25em" };
  const TS: Record<string, string> = { xs: "font-size:12px", sm: "font-size:14px", base: "font-size:16px", lg: "font-size:18px", xl: "font-size:20px" };
  const HS: Record<string, string> = { sm: "font-size:18px", md: "font-size:20px", lg: "font-size:24px", xl: "font-size:30px", "2xl": "font-size:36px" };
  const LH: Record<string, string> = { tight: "line-height:1.25", normal: "line-height:1.5", relaxed: "line-height:1.625", loose: "line-height:2" };
  const IR: Record<string, string> = { none: "", sm: "border-radius:8px", md: "border-radius:12px", lg: "border-radius:16px", full: "border-radius:9999px" };
  const IS: Record<string, string> = { none: "", sm: "box-shadow:0 1px 2px rgba(0,0,0,.05)", md: "box-shadow:0 4px 6px rgba(0,0,0,.07)", lg: "box-shadow:0 10px 25px rgba(0,0,0,.1)" };
  const SH: Record<string, string> = { xs: "height:12px", sm: "height:20px", md: "height:32px", lg: "height:48px", xl: "height:64px", "2xl": "height:96px" };
  const BTR: Record<string, string> = { none: "border-radius:4px", md: "border-radius:12px", lg: "border-radius:16px", full: "border-radius:9999px" };
  const BTP: Record<string, string> = { sm: "padding:6px 12px;font-size:12px", md: "padding:8px 16px;font-size:14px", lg: "padding:12px 24px;font-size:16px" };
  const MB: Record<string, string>  = { none: "margin-bottom:0", sm: "margin-bottom:8px", md: "margin-bottom:16px", lg: "margin-bottom:24px", xl: "margin-bottom:32px" };

  const renderEl = (el: CanvasEl, indent = "        "): string => {
    const pp = el.props ?? {};
    const align = pp.align ?? "left";
    const aC = `text-align:${align}`;
    const mb = MB[pp.marginBottom ?? "sm"] ?? "margin-bottom:8px";

    switch (el.type) {
      case "heading": {
        const st = [HS[pp.size ?? "lg"], FW[pp.fontWeight ?? "bold"], LS[pp.letterSpacing ?? "normal"], `color:${pp.textColor ?? "#111111"}`, mb, aC].filter(Boolean).join(";");
        return `${indent}<h2 style="${st}">${el.content || "Heading"}</h2>\n`;
      }
      case "text": {
        const st = [TS[pp.textSize ?? "base"], FW[pp.fontWeight ?? "normal"], LH[pp.lineHeight ?? "relaxed"], `color:${pp.textColor ?? "#4b5563"}`, mb, aC].filter(Boolean).join(";");
        return `${indent}<p style="${st}">${el.content || "Text content"}</p>\n`;
      }
      case "button": {
        const filled  = `background:${pp.color ?? "#000"};color:#fff`;
        const outline = `border:2px solid ${pp.color ?? "#000"};color:${pp.color ?? "#000"};background:transparent`;
        const ghost   = `color:${pp.color ?? "#000"};background:transparent`;
        const varSt = pp.variant === "outline" ? outline : pp.variant === "ghost" ? ghost : filled;
        const st = [varSt, BTR[pp.btnRadius ?? "lg"], BTP[pp.btnSize ?? "md"], "font-weight:700;display:inline-block;text-decoration:none", pp.fullWidth ? "width:100%;text-align:center;display:block" : "", mb].filter(Boolean).join(";");
        const target = pp.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `${indent}<a href="${pp.href ?? "#"}"${target} style="${st}">${el.content || "Button"}</a>\n`;
      }
      case "image": {
        const st = [IR[pp.imgRadius ?? "md"], IS[pp.imgShadow ?? "none"], pp.imgWidth !== "auto" ? `width:${pp.imgWidth === "1/2" ? "50%" : pp.imgWidth === "3/4" ? "75%" : "100%"}` : "", mb].filter(Boolean).join(";");
        if (pp.src) return `${indent}<img src="${pp.src}" alt="${pp.alt ?? ""}" style="${st};max-width:100%" />\n`;
        return `${indent}<div style="background:#f3f4f6;height:160px;${IR[pp.imgRadius ?? "md"]};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;${mb}">Image Placeholder</div>\n`;
      }
      case "list": {
        const sizeSt = TS[pp.itemSize === "sm" ? "sm" : pp.itemSize === "lg" ? "lg" : "base"];
        const colorSt = `color:${pp.itemColor ?? "#374151"}`;
        const gapSt = pp.itemSpacing === "tight" ? "gap:4px" : pp.itemSpacing === "loose" ? "gap:12px" : "gap:8px";
        const items = (pp.items ?? []).map((item, i) => {
          let bullet = "";
          if (pp.bulletStyle === "dot")    bullet = `<span style="width:6px;height:6px;border-radius:50%;background:${pp.itemColor ?? "#374151"};flex-shrink:0;margin-top:6px"></span>`;
          else if (pp.bulletStyle === "number") bullet = `<span style="${colorSt};font-weight:700;flex-shrink:0">${i + 1}.</span>`;
          else if (pp.bulletStyle === "arrow")  bullet = `<span style="${colorSt};flex-shrink:0">→</span>`;
          else if (pp.bulletStyle === "none")   bullet = "";
          else bullet = `<span style="width:16px;height:16px;border-radius:50%;background:${pp.itemColor ?? "#374151"};color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">✓</span>`;
          return `${indent}  <li style="display:flex;align-items:flex-start;gap:8px;${sizeSt};${colorSt}">${bullet}${item}</li>`;
        }).join("\n");
        return `${indent}<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;${gapSt};${mb}">\n${items}\n${indent}</ul>\n`;
      }
      case "divider": {
        const DW: Record<string, string> = { full: "100%", "3/4": "75%", "1/2": "50%", "1/4": "25%" };
        const thick = pp.divThickness ?? "1";
        const st = `width:${DW[pp.divWidth ?? "full"] ?? "100%"};border:none;border-top:${thick}px ${pp.divStyle ?? "solid"} ${pp.divColor ?? "#e5e7eb"};${mb}`;
        return `${indent}<hr style="${st}" />\n`;
      }
      case "spacer":
        return `${indent}<div style="${SH[pp.spacerHeight ?? "md"] ?? "height:32px"}"></div>\n`;
      case "div": {
        const ds = el.divStyle;
        const dPad: Record<string, string> = { none: "", sm: "padding:12px", md: "padding:20px", lg: "padding:32px" };
        const dRad: Record<string, string> = { none: "", sm: "border-radius:8px", md: "border-radius:12px", lg: "border-radius:16px" };
        const dShd: Record<string, string> = { none: "", sm: "box-shadow:0 1px 2px rgba(0,0,0,.05)", md: "box-shadow:0 4px 6px rgba(0,0,0,.07)" };
        const divSt = [
          ds?.bg    ? `background:${ds.bg}` : "",
          ds?.padding ? dPad[ds.padding] : "",
          ds?.radius  ? dRad[ds.radius] : "",
          ds?.shadow  ? dShd[ds.shadow] : "",
          ds?.border  ? `border:1px solid ${ds.borderColor ?? "#e5e7eb"}` : "",
          mb,
        ].filter(Boolean).join(";");
        const childHtml = (el.children ?? []).map((c) => renderEl(c, indent + "  ")).join("");
        return `${indent}<div${divSt ? ` style="${divSt}"` : ""}>\n${childHtml}${indent}</div>\n`;
      }
      default: return "";
    }
  };

  // Build section inline style from sectionStyles
  const sectionCssParts: string[] = [];
  const PY: Record<string, string> = { xs: "padding:24px 32px", sm: "padding:40px 32px", md: "padding:64px 32px", lg: "padding:96px 32px", xl: "padding:128px 32px" };
  sectionCssParts.push(PY[sectionStyles?.paddingY ?? "lg"] ?? "padding:80px 32px");
  if (sectionStyles?.bgType === "gradient" && sectionStyles.bgGradientFrom && sectionStyles.bgGradientTo) {
    const DIR: Record<string, string> = { "to-r":"to right","to-br":"to bottom right","to-b":"to bottom","to-bl":"to bottom left","to-l":"to left","to-tr":"to top right" };
    sectionCssParts.push(`background:linear-gradient(${DIR[sectionStyles.bgGradientDir ?? "to-r"] ?? "to right"},${sectionStyles.bgGradientFrom},${sectionStyles.bgGradientTo})`);
  } else if (sectionStyles?.bgType === "image" && sectionStyles.bgImage) {
    const size = sectionStyles.bgImageSize ?? "cover";
    const pos  = sectionStyles.bgImagePos  ?? "center";
    if (sectionStyles.bgOverlay) {
      const op = ((parseInt(sectionStyles.bgOverlayOpacity ?? "40")) / 100).toFixed(2);
      const oc = sectionStyles.bgOverlayColor ?? "#000000";
      sectionCssParts.push(`background:linear-gradient(rgba(0,0,0,${op}),rgba(0,0,0,${op})),url(${sectionStyles.bgImage}) ${pos}/${size} no-repeat`);
    } else {
      sectionCssParts.push(`background:url(${sectionStyles.bgImage}) ${pos}/${size} no-repeat`);
    }
    if (sectionStyles.bgImageFixed) sectionCssParts.push("background-attachment:fixed");
  } else if (sectionStyles?.sectionBg) {
    sectionCssParts.push(`background:${sectionStyles.sectionBg}`);
  }
  const bc = sectionStyles?.sectionBorderColor ?? "#e5e7eb";
  if (sectionStyles?.borderTop)    sectionCssParts.push(`border-top:2px solid ${bc}`);
  if (sectionStyles?.borderBottom) sectionCssParts.push(`border-bottom:2px solid ${bc}`);
  const SHAD: Record<string, string> = { sm:"box-shadow:0 1px 3px rgba(0,0,0,0.08)", md:"box-shadow:0 4px 12px rgba(0,0,0,0.1)", lg:"box-shadow:0 10px 30px rgba(0,0,0,0.15)" };
  if (sectionStyles?.sectionShadow && sectionStyles.sectionShadow !== "none") sectionCssParts.push(SHAD[sectionStyles.sectionShadow] ?? "");
  const MWS: Record<string, string> = { sm:"max-width:640px", md:"max-width:768px", lg:"max-width:1024px", xl:"max-width:1280px", full:"max-width:100%" };
  const mwStr = MWS[sectionStyles?.maxWidth ?? "lg"] ?? "max-width:1024px";

  const comment = name ? `<!-- ${name} -->\n` : "";
  let html = `${comment}<section style="${sectionCssParts.join(";")}">\n  <div style="${mwStr};margin:0 auto">\n`;

  for (const row of rows) {
    const colSpans = layoutCols[row.layout] ?? [12];
    const isMulti = row.cols.length > 1;
    const rowWrapSt = isMulti ? `display:grid;grid-template-columns:${colSpans.map((s) => `${(s / 12 * 100).toFixed(2)}%`).join(" ")};gap:24px;margin-bottom:32px` : "margin-bottom:32px";
    html += `    <div style="${rowWrapSt}">\n`;
    for (let ci = 0; ci < row.cols.length; ci++) {
      const col = row.cols[ci];
      const cs = col.style;
      const colSt = [
        cs?.bg ? `background:${cs.bg}` : "",
        cs?.padding === "sm" ? "padding:12px" : cs?.padding === "md" ? "padding:20px" : cs?.padding === "lg" ? "padding:32px" : "",
        cs?.radius === "sm" ? "border-radius:8px" : cs?.radius === "md" ? "border-radius:12px" : cs?.radius === "lg" ? "border-radius:16px" : "",
        cs?.shadow === "sm" ? "box-shadow:0 1px 2px rgba(0,0,0,.05)" : cs?.shadow === "md" ? "box-shadow:0 4px 6px rgba(0,0,0,.07)" : "",
        cs?.border ? `border:1px solid ${cs.borderColor ?? "#e5e7eb"}` : "",
      ].filter(Boolean).join(";");
      html += `      <div${colSt ? ` style="${colSt}"` : ""}>\n`;
      for (const el of col.elements) html += renderEl(el);
      html += `      </div>\n`;
    }
    html += `    </div>\n`;
  }

  html += `  </div>\n</section>`;
  return html;
}

// ── Code view panel ────────────────────────────────────────────────────────────

function CodePanel({ rows, name, sectionStyles }: { rows: CanvasRow[]; name: string; sectionStyles: BlockStyles }) {
  const [copied, setCopied] = useState(false);
  const code = generateHtml(rows, name, sectionStyles);
  const handleCopy = () => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/40" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/40" /></div>
          <span className="text-[11px] font-mono text-white/30 ml-2">section.html</span>
        </div>
        <button onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"}`}>
          {copied ? <><CheckCheck size={12} /> Copied!</> : <><Copy size={12} /> Copy HTML</>}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-5 text-[12px] font-mono leading-relaxed text-[#e6edf3] whitespace-pre-wrap break-all"><code>{code}</code></pre>
      </div>
    </div>
  );
}

// ── Main Canvas Editor ─────────────────────────────────────────────────────────

type ViewTab = "design" | "code";

interface Props {
  onAdd: (comp: ComponentDef) => void;
  onClose: () => void;
  initialCanvas?: CanvasData;
  initialName?: string;
  initialStyles?: BlockStyles;
  initialBlockType?: string;
  initialBlockContent?: Record<string, unknown>;
}

export default function CanvasEditor({ onAdd, onClose, initialCanvas, initialName, initialStyles, initialBlockType, initialBlockContent }: Props) {
  const isEditing = !!initialCanvas;
  const [sectionName, setSectionName] = useState(initialName ?? "");
  const [canvas, setCanvasRaw]           = useState<CanvasData>(initialCanvas ?? { rows: [makeRow("1")] });
  const setCanvas: typeof setCanvasRaw = useCallback((arg) => {
    setCanvasRaw((prev) => {
      if (!isUndoingRef.current) {
        undoStack.current = [...undoStack.current.slice(-50), prev];
        redoStack.current = [];
      }
      return typeof arg === "function" ? (arg as (prev: CanvasData) => CanvasData)(prev) : arg;
    });
  }, []);
  const [sectionStyles, setSectionStyles] = useState<BlockStyles>(initialStyles ?? { sectionBg: "#ffffff", paddingY: "lg" as const });
  const [blockContent, setBlockContent]   = useState<Record<string, unknown>>(initialBlockContent ?? {});
  const [selectedElId, setSelectedElId]   = useState<string | null>(null);
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [activeDivElId, setActiveDivElId] = useState<string | null>(null);
  const [pendingType, setPendingType]     = useState<CanvasElType | null>(null);
  const [viewTab, setViewTab]             = useState<ViewTab>("design");
  const [inspectorTab, setInspectorTab]   = useState<"content" | "style">("content");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [savedToLib, setSavedToLib]       = useState(false);
  const undoStack = useRef<CanvasData[]>([]);
  const redoStack = useRef<CanvasData[]>([]);
  const isUndoingRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current = [...redoStack.current, canvas];
    const prev = undoStack.current.pop()!;
    isUndoingRef.current = true;
    setCanvasRaw(prev);
    setTimeout(() => { isUndoingRef.current = false; }, 0);
  }, [canvas]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current = [...undoStack.current, canvas];
    const next = redoStack.current.pop()!;
    isUndoingRef.current = true;
    setCanvasRaw(next);
    setTimeout(() => { isUndoingRef.current = false; }, 0);
  }, [canvas]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const saveToLibrary = () => {
    const saved = JSON.parse(localStorage.getItem("lhrweb_saved_sections") ?? "[]");
    const entry = {
      id: `saved-${Date.now()}`,
      category: "My Sections",
      categoryKey: "saved",
      label: sectionName || "Untitled Section",
      description: `${canvas.rows.length} row${canvas.rows.length !== 1 ? "s" : ""}`,
      blockType: "canvas",
      defaultContent: { name: sectionName, rows: canvas.rows },
      defaultStyles: Object.keys(sectionStyles).length ? sectionStyles : undefined,
      savedAt: Date.now(),
    };
    localStorage.setItem("lhrweb_saved_sections", JSON.stringify([...saved, entry]));
    setSavedToLib(true);
    setTimeout(() => setSavedToLib(false), 2000);
  };

  const allEls   = canvas.rows.flatMap((r) => r.cols.flatMap((c) => c.elements));
  const selectedEl  = selectedElId  ? findElRec(allEls, selectedElId) ?? null : null;
  const selectedCol = selectedColId ? canvas.rows.flatMap((r) => r.cols).find((c) => c.id === selectedColId) ?? null : null;
  const rightPanel  = selectedElId
    ? (selectedEl?.type === "div" ? "div-element" : "element")
    : selectedColId ? "col" : "section";

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateRow = useCallback((rowId: string, fn: (r: CanvasRow) => CanvasRow) => {
    setCanvas((d) => ({ ...d, rows: d.rows.map((r) => r.id === rowId ? fn(r) : r) }));
  }, []);

  const addRow    = (l: CanvasRowLayout) => setCanvas((d) => ({ ...d, rows: [...d.rows, makeRow(l)] }));
  const deleteRow = (id: string) => setCanvas((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== id) }));
  const moveRow   = (id: string, dir: "up" | "down") => setCanvas((d) => {
    const i = d.rows.findIndex((r) => r.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= d.rows.length) return d;
    const rows = [...d.rows]; [rows[i], rows[j]] = [rows[j], rows[i]]; return { ...d, rows };
  });
  const cloneRow = (row: CanvasRow): CanvasRow => ({
    ...row, id: uid(),
    cols: row.cols.map((col) => ({
      ...col, id: uid(),
      elements: deepCloneEls(col.elements),
    })),
  });
  const duplicateRow = (id: string) => setCanvas((d) => {
    const i = d.rows.findIndex((r) => r.id === id);
    if (i === -1) return d;
    const rows = [...d.rows];
    rows.splice(i + 1, 0, cloneRow(d.rows[i]));
    return { ...d, rows };
  });

  const addElement = useCallback((colId: string, type: CanvasElType) => {
    const pal = PALETTE.find((pp) => pp.type === type)!;
    const el: CanvasEl = {
      id: uid(), type, content: pal.defaultContent, props: { ...pal.defaultProps },
      ...(type === "div" ? { children: [], divStyle: {} } : {}),
    };
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => col.id === colId ? { ...col, elements: [...col.elements, el] } : col) })) }));
    setSelectedElId(el.id); setSelectedColId(colId);
    if (type === "div") setActiveDivElId(el.id);
  }, []);

  const addElementToDiv = useCallback((divId: string, type: CanvasElType) => {
    const pal = PALETTE.find((pp) => pp.type === type)!;
    const el: CanvasEl = {
      id: uid(), type, content: pal.defaultContent, props: { ...pal.defaultProps },
      ...(type === "div" ? { children: [], divStyle: {} } : {}),
    };
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => ({ ...col, elements: addElToDiv(col.elements, divId, el) })) })) }));
    setSelectedElId(el.id);
    if (type === "div") setActiveDivElId(el.id);
  }, []);

  const updateElement = useCallback((elId: string, updated: CanvasEl) => {
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => ({ ...col, elements: updateElRec(col.elements, elId, updated) })) })) }));
  }, []);

  const handleInlineEdit = useCallback((elId: string, content: string) => {
    setCanvas((d) => {
      const el = findElRec(d.rows.flatMap((r) => r.cols.flatMap((c) => c.elements)), elId);
      if (!el) return d;
      return { ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => ({ ...col, elements: updateElRec(col.elements, elId, { ...el, content }) })) })) };
    });
  }, []);

  const deleteElement = useCallback((elId: string) => {
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => ({ ...col, elements: deleteElRec(col.elements, elId) })) })) }));
    if (selectedElId === elId) { setSelectedElId(null); setActiveDivElId(null); }
    if (activeDivElId === elId) setActiveDivElId(null);
  }, [selectedElId, activeDivElId]);

  const updateCol = useCallback((colId: string, updated: CanvasCol) => {
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => col.id === colId ? updated : col) })) }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent, colId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => {
      if (col.id !== colId) return col;
      const oi = col.elements.findIndex((e) => e.id === active.id);
      const ni = col.elements.findIndex((e) => e.id === over.id);
      return { ...col, elements: arrayMove(col.elements, oi, ni) };
    }) })) }));
  }, []);

  const handleDivDragEnd = useCallback((event: DragEndEvent, divId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const divEl = findElRec(canvas.rows.flatMap((r) => r.cols.flatMap((c) => c.elements)), divId);
    if (!divEl?.children) return;
    const oi = divEl.children.findIndex((e) => e.id === active.id);
    const ni = divEl.children.findIndex((e) => e.id === over.id);
    setCanvas((d) => ({ ...d, rows: d.rows.map((row) => ({ ...row, cols: row.cols.map((col) => ({ ...col, elements: reorderDivChildren(col.elements, divId, oi, ni) })) })) }));
  }, [canvas]);

  const handlePaletteClick = (type: CanvasElType) => {
    if (activeDivElId) addElementToDiv(activeDivElId, type);
    else if (selectedColId) addElement(selectedColId, type);
    else setPendingType(type);
  };

  const totalEls = canvas.rows.flatMap((r) => r.cols.flatMap((c) => c.elements)).length;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#F3F4F6]">

      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"><ArrowLeft size={16} /></button>
        <div className="w-px h-5 bg-gray-100" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-7 h-7 bg-[#6344d4] rounded-lg flex items-center justify-center"><LayoutTemplate size={13} className="text-white" /></div>
          <input className="text-[14px] font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-300 min-w-0 max-w-[200px]"
            placeholder="Section name..." value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
          <button onClick={() => setViewTab("design")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${viewTab === "design" ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-700"}`}><Paintbrush size={13} /> Design</button>
          <button onClick={() => setViewTab("code")}   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${viewTab === "code" ? "bg-[#0d1117] text-green-400 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}><Code2 size={13} /> Code</button>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
          <button onClick={() => setPreviewDevice("desktop")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${previewDevice === "desktop" ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-700"}`}><Monitor size={12} /></button>
          <button onClick={() => setPreviewDevice("mobile")}  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${previewDevice === "mobile" ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-700"}`}><Smartphone size={12} /></button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={undo} disabled={undoStack.current.length === 0} title="Undo (Ctrl+Z)" className="p-2 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"><ArrowLeft size={14} /></button>
          <button onClick={redo} disabled={redoStack.current.length === 0} title="Redo (Ctrl+Shift+Z)" className="p-2 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"><ArrowLeft size={14} className="scale-x-[-1]" /></button>
          <span className="text-[11px] text-gray-400">{canvas.rows.length} row{canvas.rows.length !== 1 ? "s" : ""} · {totalEls} el</span>
          <button
            onClick={saveToLibrary}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
              savedToLib
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-black"
            }`}
          >
            {savedToLib ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {savedToLib ? "Saved!" : "Save to Library"}
          </button>
          <button onClick={() => onAdd({ id: `canvas-${Date.now()}`, category: "Custom", categoryKey: "canvas", label: sectionName || "Canvas Section", description: "Custom canvas-built section", blockType: "canvas", defaultContent: { name: sectionName, rows: canvas.rows, _originalType: initialBlockType, _originalContent: initialBlockType ? blockContent : undefined } as Record<string, unknown>, defaultStyles: Object.keys(sectionStyles).length ? sectionStyles : undefined })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6344d4] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            <Check size={14} /> {isEditing ? "Save Changes" : "Add to Page"}
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left — Palette */}
        <div className="w-[210px] bg-white border-r border-gray-100 flex-shrink-0 flex flex-col overflow-y-auto">
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Elements</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE.map((item) => (
                <button key={item.type} onClick={() => handlePaletteClick(item.type)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${pendingType === item.type ? "border-[#6344d4] bg-purple-50 text-[#6344d4]" : "border-gray-100 hover:border-[#6344d4]/30 hover:bg-gray-50 text-gray-500"}`}>
                  <span className={pendingType === item.type ? "text-[#6344d4]" : "text-gray-400"}>{item.icon}</span>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
            {pendingType && !selectedColId && !activeDivElId && (
              <p className="mt-2.5 text-[10px] text-[#6344d4] font-semibold text-center bg-purple-50 py-2 rounded-lg border border-purple-100">Click a div to place</p>
            )}
            {activeDivElId && !pendingType && (
              <p className="mt-2.5 text-[10px] text-indigo-600 font-semibold text-center bg-indigo-50 py-2 rounded-lg border border-indigo-100 flex items-center justify-center gap-1">
                <Box size={9} /> Nested div active
              </p>
            )}
            {selectedColId && !activeDivElId && !pendingType && (
              <p className="mt-2.5 text-[10px] text-emerald-600 font-semibold text-center bg-emerald-50 py-2 rounded-lg border border-emerald-100">Col selected — pick element</p>
            )}
          </div>
          <div className="border-t border-gray-50 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Add Row</p>
            <div className="space-y-1">
              {ROW_LAYOUTS.map((l) => (
                <button key={l.id} onClick={() => addRow(l.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-100 hover:border-[#6344d4]/40 hover:bg-purple-50/30 transition-all text-left group">
                  <span className="text-[12px] font-mono text-gray-300 group-hover:text-[#6344d4] w-9 flex-shrink-0">{l.icon}</span>
                  <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        {viewTab === "code" ? (
          <CodePanel rows={canvas.rows} name={sectionName} sectionStyles={sectionStyles} />
        ) : (
          <div
            className="flex-1 overflow-y-auto"
            style={(() => {
              const cs: React.CSSProperties = {};
              if (sectionStyles.bgType === "gradient" && (sectionStyles.bgGradientFrom || sectionStyles.bgGradientTo)) {
                const DIR: Record<string, string> = { "to-r":"to right","to-br":"to bottom right","to-b":"to bottom","to-bl":"to bottom left","to-l":"to left","to-tr":"to top right" };
                cs.background = `linear-gradient(${DIR[sectionStyles.bgGradientDir ?? "to-r"] ?? "to right"}, ${sectionStyles.bgGradientFrom ?? "#6344d4"}, ${sectionStyles.bgGradientTo ?? "#000"})`;
              } else if (sectionStyles.bgType === "image" && sectionStyles.bgImage) {
                const size = sectionStyles.bgImageSize ?? "cover";
                const pos  = sectionStyles.bgImagePos  ?? "center";
                if (sectionStyles.sectionBg) cs.backgroundColor = sectionStyles.sectionBg;
                if (sectionStyles.bgOverlay) {
                  const op = (parseInt(sectionStyles.bgOverlayOpacity ?? "40") / 100).toFixed(2);
                  cs.backgroundImage = `linear-gradient(rgba(0,0,0,${op}),rgba(0,0,0,${op})),url(${sectionStyles.bgImage})`;
                } else {
                  cs.backgroundImage = `url(${sectionStyles.bgImage})`;
                }
                cs.backgroundSize     = size === "repeat" ? "auto" : size;
                cs.backgroundRepeat   = size === "repeat" ? "repeat" : "no-repeat";
                cs.backgroundPosition = pos;
              } else if (sectionStyles.sectionBg) {
                cs.background = sectionStyles.sectionBg;
              }
              return cs;
            })()}
            onClick={() => { setSelectedElId(null); setSelectedColId(null); setActiveDivElId(null); setPendingType(null); }}
          >
            {/* bg label */}
            {(sectionStyles.bgType === "gradient" || sectionStyles.bgType === "image" || sectionStyles.sectionBg) && (
              <div className="flex justify-center pt-3 pb-0 pointer-events-none">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/20 text-white/70 backdrop-blur-sm">
                  Section Background Preview
                </span>
              </div>
            )}
            <div className="flex justify-center p-6">
              <div className={`${previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-5xl"} space-y-3`}>
              {canvas.rows.map((row, rowIdx) => {
                const layoutCfg = ROW_LAYOUTS.find((l) => l.id === row.layout)!;
                return (
                  <div key={row.id} className="group/row bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 bg-gray-50/40">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Row {rowIdx + 1}</span>
                        <div className="flex gap-0.5 bg-white border border-gray-100 rounded-lg p-0.5">
                          {ROW_LAYOUTS.map((l) => (
                            <button key={l.id} onClick={() => updateRow(row.id, (r) => changeLayout(r, l.id))} title={l.label}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all ${row.layout === l.id ? "bg-black text-white" : "text-gray-300 hover:text-gray-600 hover:bg-gray-50"}`}>
                              {l.id}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={() => moveRow(row.id, "up")} disabled={rowIdx === 0} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-700 disabled:opacity-20 hover:bg-gray-100 transition-all"><ChevronUp size={12} /></button>
                        <button onClick={() => moveRow(row.id, "down")} disabled={rowIdx === canvas.rows.length - 1} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-700 disabled:opacity-20 hover:bg-gray-100 transition-all"><ChevronDown size={12} /></button>
                        <button onClick={() => duplicateRow(row.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-[#6344d4] hover:bg-purple-50 transition-all"><Copy size={12} /></button>
                        <button onClick={() => deleteRow(row.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 p-3">
                      {row.cols.map((col, colIdx) => {
                        const span     = layoutCfg.cols[colIdx] ?? 12;
                        const isActive = selectedColId === col.id && !selectedElId && !activeDivElId;
                        return (
                          <div key={col.id}
                            style={{ gridColumn: `span ${span} / span ${span}`, ...colCssStyle(col.style) }}
                            className={`min-h-[80px] rounded-xl border-2 transition-all ${colClasses(col.style)} ${isActive ? "border-indigo-500 shadow-[0_0_0_2px_rgba(99,68,212,0.12)]" : "border-dashed border-gray-200 hover:border-[#6344d4]/40"}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedElId(null); setSelectedColId(col.id); setActiveDivElId(null); if (pendingType) { addElement(col.id, pendingType); setPendingType(null); } }}
                          >
                            <div className="flex">
                              <div className={`flex flex-col items-center gap-1 px-1.5 py-2 border-r border-gray-100 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover/row:opacity-50"}`}>
                                <span className="text-[8px] font-bold text-[#6344d4] uppercase tracking-wider" style={{ writingMode: "vertical-lr" }}><Box size={8} /> Div {colIdx + 1}</span>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedColId(col.id); setSelectedElId(null); setActiveDivElId(null); }} className="text-[8px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5 whitespace-nowrap"><Paintbrush size={8} /> Style</button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(evt) => handleDragEnd(evt, col.id)}>
                                  <SortableContext items={col.elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                                    <div className="px-2 pb-2 space-y-1 min-h-[50px]">
                                      {col.elements.map((el) => (
                                        <SortableEl key={el.id} el={el} isSelected={selectedElId === el.id}
                                          onSelect={() => {
                                            setSelectedElId(el.id); setSelectedColId(col.id);
                                            setActiveDivElId(el.type === "div" ? el.id : null);
                                          }}
                                          onDelete={() => deleteElement(el.id)}
                                          selectedElId={selectedElId}
                                          activeDivElId={activeDivElId}
                                          onSelectChild={(childId, isDiv) => {
                                            setSelectedElId(childId);
                                            setActiveDivElId(isDiv ? childId : el.id);
                                          }}
                                          onDeleteChild={(childId) => deleteElement(childId)}
                                          onDivDragEnd={handleDivDragEnd}
                                          onContentEdit={handleInlineEdit}
                                        />
                                      ))}
                                      {col.elements.length === 0 && (
                                    <div className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-lg ${isActive ? "text-[#6344d4]" : "text-gray-300"}`}>
                                      <Plus size={13} /><span className="text-[9px] font-bold uppercase tracking-wider">Add elements</span>
                                    </div>
                                  )}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                );
              })}
              <button onClick={() => addRow("1")} className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-gray-300 hover:border-[#6344d4]/40 hover:text-[#6344d4]/70 transition-all">
                <Plus size={14} /> Add Row
              </button>
            </div>
            </div>{/* end p-6 */}
          </div>
        )}

        {/* Right — Inspector */}
        <div className="w-[260px] bg-white border-l border-gray-100 flex-shrink-0 flex flex-col overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setInspectorTab("content")} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${inspectorTab === "content" ? "text-[#6344d4] border-b-2 border-[#6344d4] bg-purple-50/30" : "text-gray-400 hover:text-gray-600"}`}>
              <Type size={11} className="inline mr-1" /> Content
            </button>
            <button onClick={() => setInspectorTab("style")} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${inspectorTab === "style" ? "text-[#6344d4] border-b-2 border-[#6344d4] bg-purple-50/30" : "text-gray-400 hover:text-gray-600"}`}>
              <Paintbrush size={11} className="inline mr-1" /> Style
            </button>
          </div>
          {rightPanel === "element" && selectedEl ? (
            <ElInspector el={selectedEl} onChange={(u) => updateElement(selectedEl.id, u)} tab={inspectorTab} />
          ) : rightPanel === "div-element" && selectedEl ? (
            /* Nested div — reuse ColInspector UI wired to the div element's divStyle */
            inspectorTab === "style" ? (
              <ColInspector
                col={{ id: selectedEl.id, elements: selectedEl.children ?? [], style: selectedEl.divStyle }}
                onChange={(updated) => updateElement(selectedEl.id, { ...selectedEl, divStyle: updated.style, children: updated.elements })}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[11px] text-gray-400 p-4 text-center">
                <span>Divs don't have content fields — switch to <strong className="text-gray-600">Style</strong> tab</span>
              </div>
            )
          ) : rightPanel === "col" && selectedCol ? (
            inspectorTab === "style" ? (
              <ColInspector col={selectedCol} onChange={(u) => updateCol(selectedCol.id, u)} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[11px] text-gray-400 p-4 text-center">
                <span>Divs don't have content fields — switch to <strong className="text-gray-600">Style</strong> tab</span>
              </div>
            )
          ) : inspectorTab === "content" ? (
            <>
              {initialBlockType ? (
                <ContentFieldsSection blockType={initialBlockType} content={blockContent} onChange={setBlockContent} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-[11px] text-gray-400 p-4 text-center">
                  Click an element to edit its content
                </div>
              )}
            </>
          ) : (
            <>
              <SectionInspector styles={sectionStyles} onChange={setSectionStyles} />
              <div className="px-4 pb-4 space-y-1.5 border-t border-gray-50 mt-2">
                <div className="flex items-start gap-2 text-[10px] text-gray-400 py-1">
                  <Box size={11} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>Click a <strong className="text-gray-600">div</strong> to style its bg, padding &amp; border</span>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-gray-400 py-1">
                  <Type size={11} className="text-[#6344d4] mt-0.5 flex-shrink-0" />
                  <span>Click an <strong className="text-gray-600">element</strong> for full style options</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
