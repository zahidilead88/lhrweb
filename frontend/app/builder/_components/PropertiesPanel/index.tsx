"use client";

import { useState } from "react";
import {
  X, Monitor, Tablet, Smartphone, ChevronDown, ChevronRight,
  LayoutGrid, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, ImageIcon, Square, Sparkles, Upload, Sliders,
  RotateCcw,
} from "lucide-react";
import type { ElementNode, Styles, StyleClass, AnimationConfig } from "@/types/builder";
import SpacingBox from "./SpacingBox";
import MotionSection from "./MotionSection";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface PropertiesPanelProps {
  element: ElementNode;
  breakpoint: Breakpoint;
  onBreakpointChange: (bp: Breakpoint) => void;
  onStyleChange: (prop: keyof Styles, val: string | number | undefined, bp: Breakpoint) => void;
  onContentChange?: (content: string) => void;
  onClose: () => void;
  classes?: StyleClass[];
  onClassChange?: (name: string | undefined) => void;
  onAnimationChange?: (animation: AnimationConfig | undefined) => void;
  projectId?: string;
  inline?: boolean;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function Seg({
  options, value, onChange, size = "sm",
}: {
  options: { label: React.ReactNode; value: string }[];
  value?: string;
  onChange: (v: string) => void;
  size?: "xs" | "sm";
}) {
  return (
    <div className="flex gap-0.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md flex items-center justify-center font-bold transition-all
            ${size === "xs" ? "py-1 text-[9px]" : "py-1.5 text-[10px]"}
            ${value === o.value
              ? "bg-white text-black shadow-sm border border-gray-100"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CSSInput({
  value, placeholder, onChange, type = "text",
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder ?? "—"}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-[11px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6344d4]/15 focus:border-[#6344d4]/30"
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-1 rounded-lg">
      <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-0 p-0 outline-none"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 bg-transparent text-[11px] font-mono focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-500">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-8 h-4 rounded-full transition-all ${checked ? "bg-[#6344d4]" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ── Accordion section ──────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{title}</span>
        </div>
        {open
          ? <ChevronDown size={12} className="text-gray-400" />
          : <ChevronRight size={12} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Unit-aware size input ──────────────────────────────────────────────────────

function SizeInput({
  prop, value, onChange,
}: {
  prop: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const UNITS = ["px", "%", "vw", "vh", "em", "rem", "auto"];
  const matchUnit = value ? UNITS.find((u) => value.endsWith(u)) ?? "px" : "px";
  const numPart = value ? value.replace(matchUnit, "").trim() : "";

  return (
    <div className="flex gap-1">
      <input
        type="number"
        value={numPart}
        placeholder="—"
        onChange={(e) => {
          const n = e.target.value;
          onChange(n ? `${n}${matchUnit}` : "");
        }}
        className="w-16 px-2 py-1.5 text-[11px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6344d4]/15"
      />
      <select
        value={matchUnit}
        onChange={(e) => {
          const u = e.target.value;
          if (u === "auto") { onChange("auto"); return; }
          onChange(numPart ? `${numPart}${u}` : "");
        }}
        className="flex-1 px-1.5 py-1.5 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none appearance-none cursor-pointer text-gray-600"
      >
        {UNITS.map((u) => <option key={u}>{u}</option>)}
      </select>
    </div>
  );
}

// ── Shadow builder ────────────────────────────────────────────────────────────

function ShadowBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <CSSInput
        value={value}
        placeholder="0px 4px 12px rgba(0,0,0,0.15)"
        onChange={onChange}
      />
      <div className="flex flex-wrap gap-1">
        {[
          "0 1px 3px rgba(0,0,0,0.12)",
          "0 4px 16px rgba(0,0,0,0.15)",
          "0 8px 32px rgba(0,0,0,0.18)",
          "inset 0 2px 4px rgba(0,0,0,0.1)",
        ].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="px-2 py-1 text-[9px] font-mono bg-gray-50 border border-gray-100 rounded-md hover:border-[#6344d4]/30 hover:bg-purple-50/30 transition-all text-gray-500"
          >
            {s.includes("inset") ? "inset" : s.includes("32") ? "xl" : s.includes("16") ? "lg" : "sm"}
          </button>
        ))}
        {value && (
          <button onClick={() => onChange("")} className="px-2 py-1 text-[9px] font-bold bg-red-50 border border-red-100 rounded-md text-red-400 hover:text-red-600">
            clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function PropertiesPanel({
  element, breakpoint, onBreakpointChange, onStyleChange, onContentChange, onClose,
  classes, onClassChange, onAnimationChange, projectId, inline = false,
}: PropertiesPanelProps) {
  const s = element.styles[breakpoint] ?? (breakpoint !== "desktop" ? {} : element.styles.desktop);
  const sd = element.styles.desktop;

  // Resolved value: breakpoint override → fallback to desktop → ""
  const get = (prop: keyof Styles): string => {
    const bpVal = breakpoint !== "desktop" ? element.styles[breakpoint]?.[prop as keyof Styles] : undefined;
    const val = bpVal ?? sd[prop as keyof Styles];
    return val !== undefined && val !== null ? String(val) : "";
  };

  const set = (prop: keyof Styles, val: string | number | undefined) => {
    onStyleChange(prop, val === "" ? undefined : val, breakpoint);
  };

  const isInherited = (prop: keyof Styles): boolean =>
    breakpoint !== "desktop" && (element.styles[breakpoint]?.[prop as keyof Styles] === undefined);

  const bpOpts: { v: Breakpoint; icon: React.ReactNode; label: string }[] = [
    { v: "desktop", icon: <Monitor size={11} />, label: "Desktop" },
    { v: "tablet",  icon: <Tablet size={11} />,  label: "Tablet" },
    { v: "mobile",  icon: <Smartphone size={11} />, label: "Mobile" },
  ];

  const display = get("display");
  const isFlex = display === "flex";
  const isGrid = display === "grid";

  return (
    <>
      {!inline && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />
        </div>
      )}
      <div className={inline
        ? "w-[280px] border-l border-gray-200 h-full bg-white flex flex-col flex-shrink-0 overflow-hidden"
        : "fixed right-0 top-0 bottom-0 z-40 w-[280px] h-full bg-white border-l border-gray-100 shadow-2xl shadow-black/10 flex flex-col"
      }>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6344d4] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-black">{`<>`}</span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-900">{`<${element.tag}>`}</p>
              {element.className && (
                <p className="text-[9px] text-gray-400 font-mono truncate max-w-[150px]">.{element.className}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Class selector ── */}
        {(classes && classes.length > 0 || element.className) && onClassChange && (
          <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">Class</span>
              {element.className ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="flex-1 min-w-0 px-2 py-1 text-[10px] font-mono font-bold text-[#6344d4] bg-purple-50 border border-purple-100 rounded-lg truncate">
                    .{element.className}
                  </span>
                  <button
                    onClick={() => onClassChange(undefined)}
                    title="Remove class"
                    className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) onClassChange(e.target.value); }}
                  className="flex-1 min-w-0 px-2 py-1 text-[10px] font-mono border border-gray-100 rounded-lg bg-white focus:outline-none appearance-none cursor-pointer text-gray-500"
                >
                  <option value="">— assign class —</option>
                  {(classes ?? []).map((c) => (
                    <option key={c.name} value={c.name}>.{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}


        {/* ── Content field (if element has text) ── */}
        {element.content !== undefined && onContentChange && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <Row label="Content">
              <textarea
                value={element.content ?? ""}
                onChange={(e) => onContentChange(e.target.value)}
                rows={2}
                className="w-full px-2.5 py-1.5 text-[11px] border border-gray-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6344d4]/15 resize-none"
              />
            </Row>
          </div>
        )}

        {/* ── Scrollable sections ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Layout ── */}
          <Section title="Layout" icon={LayoutGrid} defaultOpen>
            <Row label="Display">
              <Seg
                value={get("display")}
                onChange={(v) => set("display", v)}
                options={[
                  { label: "Block", value: "block" },
                  { label: "Flex", value: "flex" },
                  { label: "Grid", value: "grid" },
                  { label: "None", value: "none" },
                ]}
              />
            </Row>

            {isFlex && (
              <>
                <Row label="Direction">
                  <Seg
                    value={get("flexDirection")}
                    onChange={(v) => set("flexDirection", v)}
                    options={[
                      { label: "→", value: "row" },
                      { label: "↓", value: "column" },
                      { label: "←", value: "row-reverse" },
                      { label: "↑", value: "column-reverse" },
                    ]}
                  />
                </Row>
                <Row label="Justify">
                  <Seg
                    value={get("justifyContent")}
                    onChange={(v) => set("justifyContent", v)}
                    options={[
                      { label: "|←", value: "flex-start" },
                      { label: "↔", value: "center" },
                      { label: "→|", value: "flex-end" },
                      { label: "| |", value: "space-between" },
                    ]}
                    size="xs"
                  />
                </Row>
                <Row label="Align">
                  <Seg
                    value={get("alignItems")}
                    onChange={(v) => set("alignItems", v)}
                    options={[
                      { label: "⊤", value: "flex-start" },
                      { label: "⊕", value: "center" },
                      { label: "⊥", value: "flex-end" },
                      { label: "↔", value: "stretch" },
                    ]}
                    size="xs"
                  />
                </Row>
                <Row label="Wrap">
                  <Seg
                    value={get("flexWrap") || "nowrap"}
                    onChange={(v) => set("flexWrap", v)}
                    options={[
                      { label: "No wrap", value: "nowrap" },
                      { label: "Wrap", value: "wrap" },
                    ]}
                  />
                </Row>
                <Row label="Gap">
                  <CSSInput value={get("gap")} placeholder="16px" onChange={(v) => set("gap", v)} />
                </Row>
              </>
            )}

            {isGrid && (
              <>
                <Row label="Columns">
                  <CSSInput value={get("gridTemplateColumns")} placeholder="repeat(3, 1fr)" onChange={(v) => set("gridTemplateColumns", v)} />
                </Row>
                <Row label="Rows">
                  <CSSInput value={get("gridTemplateRows")} placeholder="auto" onChange={(v) => set("gridTemplateRows", v)} />
                </Row>
                <Row label="Gap">
                  <CSSInput value={get("gap")} placeholder="24px" onChange={(v) => set("gap", v)} />
                </Row>
              </>
            )}

            <Row label="Overflow">
              <Seg
                value={get("overflow") || "visible"}
                onChange={(v) => set("overflow", v === "visible" ? "" : v)}
                options={[
                  { label: "Visible", value: "visible" },
                  { label: "Hidden", value: "hidden" },
                  { label: "Scroll", value: "scroll" },
                  { label: "Auto", value: "auto" },
                ]}
                size="xs"
              />
            </Row>
          </Section>

          {/* ── Spacing ── */}
          <Section title="Spacing" icon={Square} defaultOpen>
            <SpacingBox
              styles={element.styles}
              breakpoint={breakpoint}
              onChange={(prop, val) => set(prop, val)}
            />
          </Section>

          {/* ── Size ── */}
          <Section title="Size" icon={Sliders}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Width</p>
                <SizeInput prop="width" value={get("width")} onChange={(v) => set("width", v)} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Height</p>
                <SizeInput prop="height" value={get("height")} onChange={(v) => set("height", v)} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Min-H</p>
                <SizeInput prop="minHeight" value={get("minHeight")} onChange={(v) => set("minHeight", v)} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Max-W</p>
                <SizeInput prop="maxWidth" value={get("maxWidth")} onChange={(v) => set("maxWidth", v)} />
              </div>
            </div>
          </Section>

          {/* ── Typography ── */}
          <Section title="Typography" icon={Type}>
            <Row label="Font Size">
              <CSSInput value={get("fontSize")} placeholder="16px" onChange={(v) => set("fontSize", v)} />
            </Row>
            <Row label="Font Weight">
              <Seg
                value={get("fontWeight")}
                onChange={(v) => set("fontWeight", v)}
                options={[
                  { label: "400", value: "400" },
                  { label: "500", value: "500" },
                  { label: "600", value: "600" },
                  { label: "700", value: "700" },
                  { label: "800", value: "800" },
                ]}
                size="xs"
              />
            </Row>
            <Row label="Text Color">
              <ColorInput value={get("color")} onChange={(v) => set("color", v)} />
            </Row>
            <Row label="Align">
              <Seg
                value={get("textAlign")}
                onChange={(v) => set("textAlign", v)}
                options={[
                  { label: <AlignLeft size={11} />, value: "left" },
                  { label: <AlignCenter size={11} />, value: "center" },
                  { label: <AlignRight size={11} />, value: "right" },
                  { label: <AlignJustify size={11} />, value: "justify" },
                ]}
              />
            </Row>
            <Row label="Line Height">
              <CSSInput value={get("lineHeight")} placeholder="1.5" onChange={(v) => set("lineHeight", v)} />
            </Row>
            <Row label="Letter Spacing">
              <CSSInput value={get("letterSpacing")} placeholder="0em" onChange={(v) => set("letterSpacing", v)} />
            </Row>
            <Row label="Transform">
              <Seg
                value={get("textTransform") || "none"}
                onChange={(v) => set("textTransform", v === "none" ? "" : v)}
                options={[
                  { label: "None", value: "none" },
                  { label: "AA", value: "uppercase" },
                  { label: "aa", value: "lowercase" },
                  { label: "Aa", value: "capitalize" },
                ]}
                size="xs"
              />
            </Row>
            <Row label="Font Family">
              <CSSInput value={get("fontFamily")} placeholder="inherit" onChange={(v) => set("fontFamily", v)} />
            </Row>
          </Section>

          {/* ── Background ── */}
          <Section title="Background" icon={ImageIcon}>
            <Row label="Color">
              <ColorInput value={get("backgroundColor")} onChange={(v) => set("backgroundColor", v)} />
            </Row>
            <Row label="Image URL">
              <CSSInput value={get("backgroundImage")} placeholder="url(...)" onChange={(v) => set("backgroundImage", v)} />
            </Row>
            {get("backgroundImage") && (
              <>
                <Row label="Size">
                  <Seg
                    value={get("backgroundSize") || "cover"}
                    onChange={(v) => set("backgroundSize", v)}
                    options={[
                      { label: "Cover", value: "cover" },
                      { label: "Contain", value: "contain" },
                      { label: "Auto", value: "auto" },
                    ]}
                    size="xs"
                  />
                </Row>
                <Row label="Position">
                  <Seg
                    value={get("backgroundPosition") || "center"}
                    onChange={(v) => set("backgroundPosition", v)}
                    options={[
                      { label: "Top", value: "top" },
                      { label: "Ctr", value: "center" },
                      { label: "Btm", value: "bottom" },
                    ]}
                    size="xs"
                  />
                </Row>
              </>
            )}
          </Section>

          {/* ── Border ── */}
          <Section title="Border" icon={Square}>
            <Row label="Width">
              <CSSInput value={get("borderWidth")} placeholder="1px" onChange={(v) => set("borderWidth", v)} />
            </Row>
            <Row label="Style">
              <Seg
                value={get("borderStyle") || "solid"}
                onChange={(v) => set("borderStyle", v)}
                options={[
                  { label: "Solid", value: "solid" },
                  { label: "Dashed", value: "dashed" },
                  { label: "Dotted", value: "dotted" },
                  { label: "None", value: "none" },
                ]}
                size="xs"
              />
            </Row>
            <Row label="Color">
              <ColorInput value={get("borderColor")} onChange={(v) => set("borderColor", v)} />
            </Row>
            <Row label="Radius">
              <CSSInput value={get("borderRadius")} placeholder="8px" onChange={(v) => set("borderRadius", v)} />
            </Row>
            <Row label="Per-corner radius">
              <div className="grid grid-cols-2 gap-1.5">
                {(["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"] as const).map((p) => {
                  const labels: Record<string, string> = {
                    borderTopLeftRadius: "↖ TL",
                    borderTopRightRadius: "↗ TR",
                    borderBottomLeftRadius: "↙ BL",
                    borderBottomRightRadius: "↘ BR",
                  };
                  return (
                    <div key={p}>
                      <p className="text-[9px] text-gray-400 font-mono mb-0.5">{labels[p]}</p>
                      <CSSInput value={get(p)} placeholder="0" onChange={(v) => set(p, v)} />
                    </div>
                  );
                })}
              </div>
            </Row>
          </Section>

          {/* ── Effects ── */}
          <Section title="Effects" icon={Sparkles}>
            <Row label="Opacity">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={get("opacity") || "1"}
                  onChange={(e) => set("opacity", parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-[#6344d4]"
                />
                <span className="text-[11px] font-mono text-gray-500 w-8 text-right">
                  {Math.round(parseFloat(get("opacity") || "1") * 100)}%
                </span>
              </div>
            </Row>
            <Row label="Box Shadow">
              <ShadowBuilder value={get("boxShadow")} onChange={(v) => set("boxShadow", v)} />
            </Row>
            <Row label="Position">
              <Seg
                value={get("position") || "static"}
                onChange={(v) => set("position", v === "static" ? "" : v)}
                options={[
                  { label: "Static", value: "static" },
                  { label: "Rel", value: "relative" },
                  { label: "Abs", value: "absolute" },
                  { label: "Fix", value: "fixed" },
                ]}
                size="xs"
              />
            </Row>
            {(get("position") === "absolute" || get("position") === "fixed" || get("position") === "relative") && (
              <div className="grid grid-cols-2 gap-1.5">
                {(["top","right","bottom","left"] as const).map((p) => (
                  <div key={p}>
                    <p className="text-[9px] text-gray-400 font-mono capitalize mb-0.5">{p}</p>
                    <CSSInput value={get(p)} placeholder="auto" onChange={(v) => set(p, v)} />
                  </div>
                ))}
                <div>
                  <p className="text-[9px] text-gray-400 font-mono mb-0.5">z-index</p>
                  <CSSInput value={get("zIndex")} placeholder="auto" onChange={(v) => set("zIndex", v)} />
                </div>
              </div>
            )}
            <Row label="Cursor">
              <Seg
                value={get("cursor") || "default"}
                onChange={(v) => set("cursor", v === "default" ? "" : v)}
                options={[
                  { label: "Default", value: "default" },
                  { label: "Pointer", value: "pointer" },
                  { label: "Text", value: "text" },
                  { label: "Move", value: "move" },
                ]}
                size="xs"
              />
            </Row>
          </Section>

          {/* ── Motion (Phase 7) ── */}
          {onAnimationChange && (
            <MotionSection
              animation={element.animation}
              projectId={projectId}
              onChange={onAnimationChange}
            />
          )}

          {/* Breakpoint inheritance hint */}
          {breakpoint !== "desktop" && (
            <div className="px-4 py-3 flex items-start gap-2 bg-amber-50/50 border-t border-amber-100/60">
              <span className="text-[9px] text-amber-600/80 leading-relaxed">
                Greyed values are inherited from Desktop. Set a value here to override for {breakpoint}.
              </span>
            </div>
          )}

          {/* Reset button */}
          <div className="px-4 py-3 border-t border-gray-50">
            <button
              onClick={() => {
                if (breakpoint === "desktop") return;
                onStyleChange("display" as keyof Styles, undefined, breakpoint);
              }}
              className="w-full py-2 text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={10} />
              Clear {breakpoint} overrides
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
