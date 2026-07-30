"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Minus, Eye, EyeOff, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  FlipHorizontal, FlipVertical, RotateCcw, StretchHorizontal,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
} from "lucide-react";
import type { ElementNode } from "@/types/builder";
import { ColorSwatchButton } from "./ColorPicker";
import FontPicker from "./FontPicker";

// ── Theme ──────────────────────────────────────────────────────────────────────
const BG  = "#f5f5f5";
const BDR = "#e8e8e8";
const T   = "rgba(0,0,0,0.8)";
const M   = "rgba(0,0,0,0.4)";
const BR  = "#7B6EF5";

const inputSx: React.CSSProperties = {
  width: "100%", height: 32, borderRadius: 6,
  border: `1px solid ${BDR}`, background: BG,
  color: T, fontSize: 12, fontWeight: 500,
  padding: "0 8px", outline: "none", boxSizing: "border-box",
};

// ── Primitives ─────────────────────────────────────────────────────────────────

function NumInput({ value, unit = "px", placeholder = "—", onChange }: {
  value: string; unit?: string; placeholder?: string; onChange: (v: string) => void;
}) {
  const num = value ? value.replace(unit, "").trim() : "";
  return (
    <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, overflow: "hidden" }}>
      <input type="number" value={num} placeholder={placeholder}
        onChange={e => onChange(e.target.value ? `${e.target.value}${unit}` : "")}
        style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 8px", outline: "none" }}
      />
      {unit && <span style={{ padding: "0 8px", color: M, fontSize: 11, fontWeight: 600, borderLeft: `1px solid ${BDR}` }}>{unit}</span>}
    </div>
  );
}

function PrefixInput({ prefix, value, placeholder = "0", onChange }: {
  prefix: React.ReactNode; value: string | number; placeholder?: string; onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(String(value));
  }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, overflow: "hidden" }}>
      <span style={{ padding: "0 4px 0 8px", color: M, fontSize: 11, fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center" }}>{prefix}</span>
      <input
        type="text"
        inputMode="numeric"
        value={local}
        placeholder={placeholder}
        onFocus={() => { focused.current = true; }}
        onBlur={() => {
          focused.current = false;
          const n = parseFloat(local);
          if (!isNaN(n)) onChange(String(Math.round(n)));
          else setLocal(String(value));
        }}
        onChange={e => {
          setLocal(e.target.value);
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(String(Math.round(n)));
        }}
        style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 6px 0 0", outline: "none", minWidth: 0 }}
      />
    </div>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ColorSwatchButton value={value} onChange={onChange} size={20} />;
}

function IconBtn({ active, onClick, title, children, size = 28 }: {
  active?: boolean; onClick: () => void; title?: string; children: React.ReactNode; size?: number;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      flex: 1, height: size, display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 5, border: "none", cursor: "pointer",
      background: active ? BR : "transparent", color: active ? "#fff" : M,
      transition: "all 0.12s",
    }}>
      {children}
    </button>
  );
}

function PillGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 1, background: BG, borderRadius: 7, padding: 3, border: `1px solid ${BDR}` }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px", borderTop: `1px solid ${BDR}` }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: T }}>{title}</span>
      {children && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, color: M, fontWeight: 500 }}>{children}</span>;
}

function TwoCol({ gap = 6, children }: { gap?: number; children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const WEB_FONTS = [
  "inherit","Inter","Roboto","Open Sans","Lato","Poppins","Montserrat","Raleway",
  "Source Sans Pro","Nunito","Playfair Display","Merriweather","Georgia","Arial",
  "Helvetica Neue","system-ui",
];

const WEIGHT_LABELS: Record<string, string> = {
  "100": "Thin", "200": "ExtraLight", "300": "Light", "400": "Regular",
  "500": "Medium", "600": "SemiBold", "700": "Bold", "800": "ExtraBold", "900": "Black",
};

const TEXT_TAGS = new Set(["heading","paragraph","h1","h2","h3","h4","h5","h6","p","span","a","label","button"]);
const CONT_TAGS = new Set(["div","section","article","main","aside","header","footer","nav","flex","grid"]);

// ── Main component ─────────────────────────────────────────────────────────────

export interface CanvasPropertiesPanelProps {
  element: ElementNode;
  breakpoint: "desktop" | "tablet" | "mobile";
  onStyleChange: (prop: string, val: string) => void;
  onContentChange?: (content: string) => void;
  layout?: { x: number; y: number; width: number; height: number; aspectLocked?: boolean };
  onLayoutChange?: (field: string, val: number | string | boolean | Record<string, unknown>) => void;
  /** Turns this container's free-positioned children into a flex flow (Figma "Add Auto Layout") */
  onAddAutoLayout?: () => void;
  /** When element is inside an auto-layout frame, hide X/Y and show sizing/order */
  layoutContext?: "free" | "auto";
}

export default function CanvasPropertiesPanel({
  element, breakpoint, onStyleChange, onContentChange, layout, onLayoutChange,
  layoutContext = "free", onAddAutoLayout,
}: CanvasPropertiesPanelProps) {
  const raw = (element.styles?.[breakpoint] ?? {}) as Record<string, string>;
  const g   = (p: string) => raw[p] ?? "";
  const set = onStyleChange;

  const isText = TEXT_TAGS.has(element.tag);
  const isCont = CONT_TAGS.has(element.tag);
  const isFlex = g("display") === "flex" || (!g("display") && isCont);
  const isGrid = g("display") === "grid";

  const aspectLocked = layout?.aspectLocked ?? false;
  const [fillVisible, setFillVisible]   = useState(true);
  const [fillOpacity, setFillOpacity]   = useState(100);

  const bgColor    = g("backgroundColor") || "";
  const opacityRaw = g("opacity");
  const opacityPct = opacityRaw
    ? Math.round(parseFloat(opacityRaw) * (opacityRaw.endsWith("%") ? 1 : 100))
    : 100;

  const rotDeg = g("transform")?.match(/rotate\(([-\d.]+)deg\)/)?.[1] ?? "";

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", fontSize: 12 }}>

      {/* ══ POSITION ══════════════════════════════════════════════════════════ */}
      <SectionHeader title="Position" />
      <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Absolute positioning toggle (for auto-layout children, like Figma) */}
        {layoutContext === "auto" && layout && onLayoutChange && (
          <div
            onClick={() => {
              const next = !element.layout?.absoluteInLayout;
              set("position", next ? "absolute" : "");
              onLayoutChange("absoluteInLayout" as any, next as any);
            }}
            style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              border: `1.5px solid ${element.layout?.absoluteInLayout ? BR : "#c8c8ce"}`,
              background: element.layout?.absoluteInLayout ? BR : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s",
            }}>
              {element.layout?.absoluteInLayout && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.55)", fontWeight: 500, userSelect: "none" }}>Absolute position</span>
          </div>
        )}

        {/* Alignment — 6 compact fixed-width buttons */}
        <div>
          <Label>Alignment</Label>
          <div style={{ display: "flex", gap: 4, marginTop: 5, background: BG, borderRadius: 7, padding: 3, border: `1px solid ${BDR}` }}>
            {([
              { icon: <AlignStartVertical size={13}/>,   active: g("justifySelf")==="start",      onClick: () => set("justifySelf","start"),      title: "Align left" },
              { icon: <AlignCenterVertical size={13}/>,  active: g("justifySelf")==="center",     onClick: () => set("justifySelf","center"),     title: "Center H" },
              { icon: <AlignEndVertical size={13}/>,     active: g("justifySelf")==="end",        onClick: () => set("justifySelf","end"),        title: "Align right" },
            ]).map((b, i) => (
              <button key={i} onClick={b.onClick} title={b.title}
                style={{ width: 32, height: 26, flexShrink: 0, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: b.active ? BR : "transparent", color: b.active ? "#fff" : M, transition: "all 0.12s" }}>
                {b.icon}
              </button>
            ))}
            <div style={{ width: 1, background: BDR, margin: "2px 0", flexShrink: 0 }} />
            {([
              { icon: <AlignStartHorizontal size={13}/>,  active: g("alignSelf")==="flex-start", onClick: () => set("alignSelf","flex-start"), title: "Align top" },
              { icon: <AlignCenterHorizontal size={13}/>, active: g("alignSelf")==="center",     onClick: () => set("alignSelf","center"),     title: "Center V" },
              { icon: <AlignEndHorizontal size={13}/>,    active: g("alignSelf")==="flex-end",   onClick: () => set("alignSelf","flex-end"),   title: "Align bottom" },
            ]).map((b, i) => (
              <button key={i} onClick={b.onClick} title={b.title}
                style={{ width: 32, height: 26, flexShrink: 0, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: b.active ? BR : "transparent", color: b.active ? "#fff" : M, transition: "all 0.12s" }}>
                {b.icon}
              </button>
            ))}
          </div>
        </div>

        {/* X / Y — hidden in auto-layout context (flex/grid handles positioning) */}
        {layout && onLayoutChange && layoutContext === "free" && (
          <div>
            <Label>Position</Label>
            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
              <PrefixInput prefix="X" value={layout.x} onChange={v => onLayoutChange("x", Number(v)||0)} />
              <PrefixInput prefix="Y" value={layout.y} onChange={v => onLayoutChange("y", Number(v)||0)} />
            </div>
          </div>
        )}

        {/* Constraints (Phase 5) — how this element pins when its frame resizes */}
        {layout && onLayoutChange && layoutContext === "free" && (() => {
          const cons = element.layout?.constraints ?? { horizontal: "left" as const, vertical: "top" as const };
          const selSx = { flex: 1, height: 28, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, color: T, fontSize: 11, padding: "0 6px", outline: "none", appearance: "none" as const };
          return (
            <div>
              <Label>Constraints</Label>
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                <select value={cons.horizontal} style={selSx}
                  onChange={e => onLayoutChange("constraints", { ...cons, horizontal: e.target.value })}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="center">Center</option>
                  <option value="scale">Scale</option>
                  <option value="both">Left + Right</option>
                </select>
                <select value={cons.vertical} style={selSx}
                  onChange={e => onLayoutChange("constraints", { ...cons, vertical: e.target.value })}>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="center">Center</option>
                  <option value="scale">Scale</option>
                  <option value="both">Top + Bottom</option>
                </select>
              </div>
            </div>
          );
        })()}

        {/* Rotation */}
        <div>
          <Label>Rotation</Label>
          <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
            <div style={{ flex: 1 }}>
              <PrefixInput prefix="°" value={rotDeg || "0"} placeholder="0" onChange={v => set("transform", v && v !== "0" ? `rotate(${v}deg)` : "")} />
            </div>
            <div style={{ display: "flex", gap: 1, background: BG, borderRadius: 7, padding: 3, border: `1px solid ${BDR}` }}>
              <button onClick={() => set("transform", (g("transform")||"") + " scaleX(-1)")} title="Flip horizontal"
                style={{ width: 28, height: 26, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: M }}>
                <FlipHorizontal size={13}/>
              </button>
              <button onClick={() => set("transform", (g("transform")||"") + " scaleY(-1)")} title="Flip vertical"
                style={{ width: 28, height: 26, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: M }}>
                <FlipVertical size={13}/>
              </button>
              <button onClick={() => set("transform", "")} title="Reset transform"
                style={{ width: 28, height: 26, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: M }}>
                <RotateCcw size={13}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ LAYOUT ════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Layout" />
      <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Resizing (text resize mode) */}
        {isText && (
          <div>
            <Label>Resizing</Label>
            <div style={{ display: "flex", gap: 2, background: BG, borderRadius: 7, padding: 3, border: `1px solid ${BDR}`, marginTop: 5 }}>
              {([
                { val: "auto",     label: "Auto",    icon: <span style={{ fontSize: 11 }}>|→</span> },
                { val: "fixed",    label: "Fixed",   icon: <span style={{ fontSize: 11 }}>|=|</span> },
                { val: "wrap",     label: "Wrap",    icon: <span style={{ fontSize: 11 }}>≡</span> },
              ] as const).map(({ val, label, icon }) => (
                <button key={val} onClick={() => set("whiteSpace", val === "wrap" ? "pre-wrap" : val === "auto" ? "nowrap" : "nowrap")}
                  title={label}
                  style={{ flex: 1, height: 28, borderRadius: 5, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    background: (g("resize") || "auto") === val ? BR : "transparent",
                    color: (g("resize") || "auto") === val ? "#fff" : M, transition: "all 0.12s" }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dimensions */}
        {layout && onLayoutChange && (
          <div>
            <Label>Dimensions</Label>
            {/* Sizing modes (Figma: Fixed / Hug / Fill) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6, marginTop: 5 }}>
              <div>
                <span style={{ fontSize: 8, color: M, display: "block", marginBottom: 2 }}>Width</span>
                <div style={{ display: "flex", gap: 2, background: BG, borderRadius: 6, padding: 2, border: `1px solid ${BDR}` }}>
                  {(["fixed","hug","fill"] as const).map(m => (
                    <button key={m} onClick={() => onLayoutChange("widthMode" as any, m)}
                      style={{ flex: 1, height: 22, borderRadius: 4, border: "none", cursor: "pointer", fontSize: 9, fontWeight: 700,
                        background: (element.layout?.widthMode ?? "fixed") === m ? BR : "transparent",
                        color: (element.layout?.widthMode ?? "fixed") === m ? "#fff" : M,
                      }}
                    >{m === "fixed" ? "Fixed" : m === "hug" ? "Hug" : "Fill"}</button>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 8, color: M, display: "block", marginBottom: 2 }}>Height</span>
                <div style={{ display: "flex", gap: 2, background: BG, borderRadius: 6, padding: 2, border: `1px solid ${BDR}` }}>
                  {(["fixed","hug","fill"] as const).map(m => (
                    <button key={m} onClick={() => onLayoutChange("heightMode" as any, m)}
                      style={{ flex: 1, height: 22, borderRadius: 4, border: "none", cursor: "pointer", fontSize: 9, fontWeight: 700,
                        background: (element.layout?.heightMode ?? "fixed") === m ? BR : "transparent",
                        color: (element.layout?.heightMode ?? "fixed") === m ? "#fff" : M,
                      }}
                    >{m === "fixed" ? "Fixed" : m === "hug" ? "Hug" : "Fill"}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-layout child controls (align-self, order) */}
            {layoutContext === "auto" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 8, color: M, display: "block", marginBottom: 2 }}>Align</span>
                  <select
                    value={g("alignSelf") || ""}
                    onChange={e => set("alignSelf", e.target.value)}
                    style={{ width: "100%", padding: "3px 4px", borderRadius: 5, border: `1px solid ${BDR}`, background: BG, fontSize: 10, outline: "none" }}
                  >
                    <option value="">Auto</option>
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: 8, color: M, display: "block", marginBottom: 2 }}>Grow</span>
                  <input type="number" min={0} max={1} step={1}
                    value={g("flexGrow") || "0"}
                    onChange={e => set("flexGrow", e.target.value)}
                    style={{ width: "100%", padding: "3px 4px", borderRadius: 5, border: `1px solid ${BDR}`, background: BG, fontSize: 10, textAlign: "center", outline: "none" }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 8, color: M, display: "block", marginBottom: 2 }}>Shrink</span>
                  <input type="number" min={0} max={1} step={1}
                    value={g("flexShrink") || "1"}
                    onChange={e => set("flexShrink", e.target.value)}
                    style={{ width: "100%", padding: "3px 4px", borderRadius: 5, border: `1px solid ${BDR}`, background: BG, fontSize: 10, textAlign: "center", outline: "none" }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <PrefixInput prefix="W" value={layout.width} onChange={v => {
                const n = Number(v)||0;
                onLayoutChange("width", n);
                if (aspectLocked && layout.height > 0) onLayoutChange("height", Math.round(n * layout.height / layout.width));
              }} />
              <button onClick={() => onLayoutChange?.("aspectLocked", !aspectLocked)} title="Lock aspect ratio" style={{ background: "none", border: "none", cursor: "pointer", color: aspectLocked ? BR : M, padding: 2, flexShrink: 0 }}>
                {aspectLocked ? <Lock size={13}/> : <Unlock size={13}/>}
              </button>
              <PrefixInput prefix="H" value={layout.height} onChange={v => {
                const n = Number(v)||0;
                onLayoutChange("height", n);
                if (aspectLocked && layout.width > 0) onLayoutChange("width", Math.round(n * layout.width / layout.height));
              }} />
            </div>
          </div>
        )}

        {/* Container options */}
        {isCont && (
          <>
            {!isFlex && element.children.length > 0 && onAddAutoLayout && (
              <button onClick={onAddAutoLayout} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                width: "100%", height: 30, borderRadius: 7, border: `1px dashed ${BR}`,
                background: "transparent", color: BR, fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>
                + Add Auto Layout
              </button>
            )}
            <div>
              <Label>Display</Label>
              <div style={{ display: "flex", gap: 2, background: BG, borderRadius: 7, padding: 3, border: `1px solid ${BDR}`, marginTop: 5 }}>
                {["block","flex","grid","inline"].map(d => (
                  <button key={d} onClick={() => set("display", d === "inline" ? "inline-block" : d)} style={{
                    flex: 1, height: 26, borderRadius: 4, border: "none", cursor: "pointer",
                    fontSize: 9, fontWeight: 700,
                    background: (g("display") || "block") === (d === "inline" ? "inline-block" : d) ? BR : "transparent",
                    color: (g("display") || "block") === (d === "inline" ? "inline-block" : d) ? "#fff" : M,
                    transition: "all 0.12s",
                  }}>{d}</button>
                ))}
              </div>
            </div>
            {isFlex && (
              <>
                <TwoCol>
                  <div><Label>Align</Label>
                    <select value={g("alignItems")||"stretch"} onChange={e => set("alignItems",e.target.value)} style={{ ...inputSx, marginTop: 4, appearance: "none" }}>
                      {["flex-start","center","flex-end","stretch","baseline"].map(v => <option key={v} value={v}>{v.replace("flex-","")}</option>)}
                    </select>
                  </div>
                  <div><Label>Justify</Label>
                    <select value={g("justifyContent")||"flex-start"} onChange={e => set("justifyContent",e.target.value)} style={{ ...inputSx, marginTop: 4, appearance: "none" }}>
                      {["flex-start","center","flex-end","space-between","space-around","space-evenly"].map(v => <option key={v} value={v}>{v.replace("flex-","").replace("space-","")}</option>)}
                    </select>
                  </div>
                </TwoCol>
                <TwoCol>
                  <div><Label>Gap</Label><div style={{ marginTop: 4 }}><NumInput value={g("gap")||""} unit="px" onChange={v => set("gap",v)}/></div></div>
                  <div><Label>Direction</Label>
                    <div style={{ marginTop: 4 }}>
                      <PillGroup>
                        <IconBtn active={(g("flexDirection")||"row")==="row"} onClick={() => set("flexDirection","row")}><StretchHorizontal size={13}/></IconBtn>
                        <IconBtn active={g("flexDirection")==="column"} onClick={() => set("flexDirection","column")}><StretchHorizontal size={13} style={{ transform: "rotate(90deg)" }}/></IconBtn>
                      </PillGroup>
                    </div>
                  </div>
                </TwoCol>
              </>
            )}
            {isGrid && (
              <div><Label>Columns</Label>
                <input value={g("gridTemplateColumns")} placeholder="1fr 1fr" onChange={e => set("gridTemplateColumns",e.target.value)} style={{ ...inputSx, marginTop: 4 }}/>
              </div>
            )}
          </>
        )}

        {/* Padding */}
        <div>
          <Label>Padding</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginTop: 5 }}>
            {(["paddingTop","paddingRight","paddingBottom","paddingLeft"] as const).map((p, i) => (
              <input key={p} type="number"
                value={(g(p)||g("padding")||"").replace("px","")}
                placeholder="0"
                onChange={e => set(p, e.target.value ? `${e.target.value}px` : "")}
                title={["Top","Right","Bottom","Left"][i]}
                style={{ ...inputSx, padding: "0 4px", textAlign: "center" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            {["T","R","B","L"].map(c => <span key={c} style={{ flex: 1, textAlign: "center", fontSize: 9, color: M }}>{c}</span>)}
          </div>
        </div>
      </div>

      {/* ══ APPEARANCE ════════════════════════════════════════════════════════ */}
      <SectionHeader title="Appearance">
        <Eye size={14} color={M} />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2C7 2 4 5 4 7.5C4 9.433 5.343 11 7 11C8.657 11 10 9.433 10 7.5C10 5 7 2 7 2Z" stroke={M} strokeWidth="1.2" fill="none"/></svg>
      </SectionHeader>
      <div style={{ padding: "0 14px 12px" }}>
        <TwoCol>
          <div>
            <Label>Opacity</Label>
            <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, marginTop: 5, overflow: "hidden" }}>
              <div style={{ width: 18, height: 18, marginLeft: 7, backgroundImage: "linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%)", backgroundSize: "5px 5px", backgroundPosition: "0 0,0 2.5px,2.5px -2.5px,-2.5px 0", borderRadius: 3, flexShrink: 0 }} />
              <input type="number" value={opacityPct} min={0} max={100}
                onChange={e => set("opacity", `${Number(e.target.value)/100}`)}
                style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 4px", outline: "none" }}
              />
              <span style={{ padding: "0 8px", color: M, fontSize: 11, fontWeight: 600, borderLeft: `1px solid ${BDR}` }}>%</span>
            </div>
          </div>
          <div>
            <Label>Blend mode</Label>
            <select value={g("mixBlendMode")||"normal"} onChange={e => set("mixBlendMode",e.target.value)} style={{ ...inputSx, marginTop: 5, appearance: "none" }}>
              {["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"].map(m => (
                <option key={m} value={m}>{m.replace(/-/g," ")}</option>
              ))}
            </select>
          </div>
        </TwoCol>
        {/* Per-corner radius */}
        <TwoCol>
          <div>
            <Label>Corner radius</Label>
            <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, marginTop: 5, overflow: "hidden" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 7, flexShrink: 0 }}>
                <path d="M3 13V6C3 4.343 4.343 3 6 3H13" stroke={M} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type="number"
                value={(g("borderRadius")||"").replace("px","")}
                placeholder="0"
                onChange={e => set("borderRadius", e.target.value ? `${e.target.value}px` : "")}
                style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 6px", outline: "none" }}
              />
            </div>
          </div>
        </TwoCol>
      </div>

      {/* ══ TYPOGRAPHY (text elements only) ════════════════════════════════ */}
      {isText && (
        <>
          <SectionHeader title="Typography">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="1.5" fill={M}/><circle cx="8" cy="4" r="1.5" fill={M}/><circle cx="12" cy="4" r="1.5" fill={M}/><circle cx="4" cy="8" r="1.5" fill={M}/><circle cx="8" cy="8" r="1.5" fill={M}/><circle cx="12" cy="8" r="1.5" fill={M}/></svg>
          </SectionHeader>
          <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Content */}
            <div>
              <Label>Content</Label>
              <textarea value={element.content ?? ""} onChange={e => onContentChange?.(e.target.value)} rows={2}
                style={{ ...inputSx, height: "auto", padding: "6px 8px", resize: "vertical", fontFamily: "inherit", marginTop: 4 }}
              />
            </div>

            {/* Font family — searchable picker with live preview (Phase 2) */}
            <div>
              <FontPicker value={g("fontFamily") || "Inter"} onChange={(fam) => set("fontFamily", fam)} />
            </div>

            {/* Weight + Size */}
            <TwoCol>
              <select value={g("fontWeight")||"400"} onChange={e => set("fontWeight", e.target.value)}
                style={{ ...inputSx, appearance: "none" }}>
                {Object.entries(WEIGHT_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              <PrefixInput prefix={<span style={{ fontSize: 11 }}>Aa</span>} value={(g("fontSize")||"").replace("px","")} placeholder="16" onChange={v => set("fontSize", v ? `${v}px` : "")} />
            </TwoCol>

            {/* Line height + Letter spacing */}
            <TwoCol>
              <div>
                <Label>Line height</Label>
                <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, marginTop: 4, overflow: "hidden" }}>
                  <span style={{ padding: "0 4px 0 8px", color: M, fontSize: 11, display: "flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h7M2 11h10" stroke={M} strokeWidth="1.2" strokeLinecap="round"/><path d="M11 5v4M11 5l1.5 1.5M11 5l-1.5 1.5M11 9l1.5-1.5M11 9l-1.5-1.5" stroke={M} strokeWidth="1" strokeLinecap="round"/></svg>
                  </span>
                  <input value={g("lineHeight")||""} placeholder="Auto"
                    onChange={e => set("lineHeight", e.target.value)}
                    style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 8px 0 0", outline: "none" }}
                  />
                </div>
              </div>
              <div>
                <Label>Letter spacing</Label>
                <div style={{ display: "flex", alignItems: "center", height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, marginTop: 4, overflow: "hidden" }}>
                  <span style={{ padding: "0 4px 0 8px", color: M, fontSize: 10, display: "flex", alignItems: "center" }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h2M11 5h2M3 1v8M11 1v8M4 5h6" stroke={M} strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </span>
                  <input value={(g("letterSpacing")||"").replace("px","")} placeholder="0"
                    onChange={e => set("letterSpacing", e.target.value ? `${e.target.value}px` : "")}
                    style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, padding: "0 2px 0 0", outline: "none" }}
                  />
                  <span style={{ padding: "0 8px", color: M, fontSize: 11, fontWeight: 600, borderLeft: `1px solid ${BDR}` }}>px</span>
                </div>
              </div>
            </TwoCol>

            {/* Text alignment — horizontal + vertical */}
            <div>
              <Label>Alignment</Label>
              <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                <PillGroup>
                  <IconBtn active={g("textAlign")==="left"}    onClick={() => set("textAlign","left")}    title="Left"><AlignLeft size={13}/></IconBtn>
                  <IconBtn active={g("textAlign")==="center"}  onClick={() => set("textAlign","center")}  title="Center"><AlignCenter size={13}/></IconBtn>
                  <IconBtn active={g("textAlign")==="right"}   onClick={() => set("textAlign","right")}   title="Right"><AlignRight size={13}/></IconBtn>
                </PillGroup>
                <PillGroup>
                  <IconBtn active={g("verticalAlign")==="top"}    onClick={() => set("verticalAlign","top")}    title="Top"><AlignVerticalJustifyStart size={13}/></IconBtn>
                  <IconBtn active={g("verticalAlign")==="middle"} onClick={() => set("verticalAlign","middle")} title="Middle"><AlignVerticalJustifyCenter size={13}/></IconBtn>
                  <IconBtn active={g("verticalAlign")==="bottom"} onClick={() => set("verticalAlign","bottom")} title="Bottom"><AlignVerticalJustifyEnd size={13}/></IconBtn>
                </PillGroup>
                <IconBtn onClick={() => set("textAlign","justify")} active={g("textAlign")==="justify"} title="Justify"><AlignJustify size={13}/></IconBtn>
              </div>
            </div>

            {/* Text style buttons */}
            <div style={{ display: "flex", gap: 2 }}>
              <PillGroup>
                <IconBtn active={g("fontStyle")==="italic"}       onClick={() => set("fontStyle",     g("fontStyle")==="italic"       ? "" : "italic")}     title="Italic"><Italic size={13}/></IconBtn>
                <IconBtn active={g("fontWeight")==="700"}         onClick={() => set("fontWeight",    g("fontWeight")==="700"         ? "400" : "700")}     title="Bold"><Bold size={13}/></IconBtn>
                <IconBtn active={g("textDecoration")==="underline"} onClick={() => set("textDecoration", g("textDecoration")==="underline" ? "" : "underline")} title="Underline"><Underline size={13}/></IconBtn>
                <IconBtn active={g("textTransform")==="uppercase"} onClick={() => set("textTransform", g("textTransform")==="uppercase" ? "" : "uppercase")} title="Uppercase">
                  <span style={{ fontSize: 9, fontWeight: 900 }}>AA</span>
                </IconBtn>
              </PillGroup>
            </div>

            {/* Text color */}
            <div>
              <Label>Color</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, padding: "0 10px", marginTop: 4 }}>
                <ColorSwatch value={g("color")||"#000000"} onChange={v => set("color",v)} />
                <input type="text" value={(g("color")||"").replace("#","")} placeholder="000000"
                  onChange={e => set("color", `#${e.target.value.replace("#","")}`)}
                  style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, outline: "none" }}
                />
              </div>
            </div>

            {/* Paragraph spacing + indent */}
            <TwoCol>
              <div>
                <Label>Paragraph spacing</Label>
                <NumInput value={g("paragraphSpacing")||""} unit="px" placeholder="0" onChange={v => set("paragraphSpacing",v)}/>
              </div>
              <div>
                <Label>Paragraph indent</Label>
                <NumInput value={g("paragraphIndent")||""} unit="px" placeholder="0" onChange={v => set("paragraphIndent",v)}/>
              </div>
            </TwoCol>

            {/* Text stroke (Figma-like) */}
            <div>
              <Label>Text stroke</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <ColorSwatch value={g("textStrokeColor")||"#000000"} onChange={v => set("textStrokeColor",v)} />
                <NumInput value={g("textStrokeWidth")||""} unit="px" placeholder="0" onChange={v => set("textStrokeWidth",v)}/>
                <button onClick={() => { set("textStrokeColor",""); set("textStrokeWidth",""); }} style={{ background: "none", border: "none", cursor: "pointer", color: M }}><Minus size={13}/></button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ══ FILL — Solid / Linear / Radial / Image / None (Figma-style) ═══════ */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T }}>Fill</span>
          <button onClick={() => !bgColor && !g("backgroundImage") && set("backgroundColor","#ffffff")} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex" }}><Plus size={14}/></button>
        </div>
        {(bgColor || g("backgroundImage")) && (() => {
          const bgImage = g("backgroundImage") || "";
          const fillType: "solid" | "linear" | "radial" | "image" =
            bgImage.startsWith("linear-gradient") ? "linear"
            : bgImage.startsWith("radial-gradient") ? "radial"
            : bgImage.startsWith("url(") ? "image"
            : "solid";

          // parse "linear-gradient(135deg, #a, #b)" / "radial-gradient(circle, #a, #b)"
          const gradMatch = bgImage.match(/(?:linear|radial)-gradient\((?:(\d+)deg|circle)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/);
          const angle = gradMatch?.[1] ? Number(gradMatch[1]) : 135;
          const c1 = (gradMatch?.[2] || bgColor || "#7B6EF5").trim();
          const c2 = (gradMatch?.[3] || "#ffffff").trim();
          const setGradient = (type: "linear" | "radial", a: number, s1: string, s2: string) =>
            set("backgroundImage", type === "linear" ? `linear-gradient(${a}deg, ${s1}, ${s2})` : `radial-gradient(circle, ${s1}, ${s2})`);

          const urlMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
          const imgUrl = urlMatch?.[1] || "";

          const tabBtn = (label: string, active: boolean, onClick: () => void) => (
            <button key={label} onClick={onClick} style={{
              flex: 1, padding: "4px 0", fontSize: 10, fontWeight: 700, borderRadius: 5,
              border: "none", cursor: "pointer",
              background: active ? "#fff" : "transparent",
              color: active ? T : M,
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}>{label}</button>
          );

          return (
            <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Fill type tabs */}
              <div style={{ display: "flex", gap: 2, background: BG, border: `1px solid ${BDR}`, borderRadius: 6, padding: 2 }}>
                {tabBtn("Solid",  fillType === "solid",  () => { set("backgroundImage",""); if (!bgColor) set("backgroundColor", c1.startsWith("#") ? c1 : "#ffffff"); })}
                {tabBtn("Linear", fillType === "linear", () => setGradient("linear", angle, c1, c2))}
                {tabBtn("Radial", fillType === "radial", () => setGradient("radial", angle, c1, c2))}
                {tabBtn("Image",  fillType === "image",  () => set("backgroundImage", "url()"))}
                {tabBtn("None",   false,                 () => { set("backgroundColor",""); set("backgroundImage",""); })}
              </div>

              {fillType === "solid" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, padding: "0 8px" }}>
                  <ColorSwatch value={bgColor} onChange={v => set("backgroundColor",v)} />
                  <input type="text" value={(bgColor||"").replace("#","")} placeholder="FFFFFF"
                    onChange={e => set("backgroundColor", `#${e.target.value.replace("#","")}`)}
                    style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, outline: "none" }}
                  />
                  <input type="number" value={fillOpacity} min={0} max={100}
                    onChange={e => setFillOpacity(Number(e.target.value))}
                    style={{ width: 34, background: "none", border: "none", color: T, fontSize: 12, fontWeight: 500, outline: "none", textAlign: "right", padding: 0 }}
                  />
                  <span style={{ color: M, fontSize: 11, fontWeight: 600, borderRight: `1px solid ${BDR}`, paddingRight: 8, marginRight: 4 }}>%</span>
                  <button onClick={() => setFillVisible(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex" }}>
                    {fillVisible ? <Eye size={13}/> : <EyeOff size={13}/>}
                  </button>
                  <button onClick={() => set("backgroundColor","")} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex" }}><Minus size={13}/></button>
                </div>
              )}

              {(fillType === "linear" || fillType === "radial") && (
                <>
                  {/* Gradient preview bar */}
                  <div style={{ height: 22, borderRadius: 6, border: `1px solid ${BDR}`, background: fillType === "linear" ? `linear-gradient(90deg, ${c1}, ${c2})` : `radial-gradient(circle, ${c1}, ${c2})` }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ColorSwatch value={c1.startsWith("#") ? c1 : "#7B6EF5"} onChange={v => setGradient(fillType, angle, v, c2)} />
                    <span style={{ fontSize: 10, color: M, flex: 1 }}>Start</span>
                    <ColorSwatch value={c2.startsWith("#") ? c2 : "#ffffff"} onChange={v => setGradient(fillType, angle, c1, v)} />
                    <span style={{ fontSize: 10, color: M, flex: 1 }}>End</span>
                    {fillType === "linear" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <input type="number" value={angle} min={0} max={360} step={15}
                          onChange={e => setGradient("linear", Number(e.target.value), c1, c2)}
                          style={{ width: 44, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, color: T, fontSize: 11, textAlign: "center", outline: "none" }} />
                        <span style={{ fontSize: 10, color: M }}>°</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {fillType === "image" && (
                <>
                  <input type="text" value={imgUrl} placeholder="https://… image URL"
                    onChange={e => set("backgroundImage", `url(${e.target.value})`)}
                    style={{ height: 30, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, color: T, fontSize: 11, padding: "0 8px", outline: "none" }} />
                  <TwoCol>
                    <select value={g("backgroundSize")||"cover"} onChange={e => set("backgroundSize",e.target.value)} style={{ ...inputSx, appearance: "none" }}>
                      {["cover","contain","auto","100% 100%"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={g("backgroundPosition")||"center"} onChange={e => set("backgroundPosition",e.target.value)} style={{ ...inputSx, appearance: "none" }}>
                      {["center","top","bottom","left","right"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </TwoCol>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* ══ STROKE ════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: g("borderColor") ? T : "rgba(0,0,0,0.35)" }}>Stroke</span>
          <button onClick={() => !g("borderColor") && set("borderColor","#000000")} style={{ background: "none", border: "none", cursor: "pointer", color: M }}><Plus size={13}/></button>
        </div>
        {g("borderColor") && (
          <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, padding: "0 8px" }}>
              <ColorSwatch value={g("borderColor")} onChange={v => set("borderColor",v)} />
              <input type="text" value={(g("borderColor")||"").replace("#","")} placeholder="000000"
                onChange={e => set("borderColor", `#${e.target.value.replace("#","")}`)}
                style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 12, outline: "none" }}
              />
              <button onClick={() => set("borderColor","")} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex" }}><Minus size={13}/></button>
            </div>
            <TwoCol>
              <NumInput value={g("borderWidth")||""} unit="px" placeholder="1" onChange={v => set("borderWidth",v)}/>
              <select value={g("borderStyle")||"solid"} onChange={e => set("borderStyle",e.target.value)} style={{ ...inputSx, appearance: "none" }}>
                {["solid","dashed","dotted","none"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </TwoCol>
          </div>
        )}
      </div>

      {/* ══ EFFECTS ═══════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: g("boxShadow") ? T : "rgba(0,0,0,0.35)" }}>Effects</span>
          <button onClick={() => !g("boxShadow") && set("boxShadow","0 2px 8px rgba(0,0,0,0.15)")} style={{ background: "none", border: "none", cursor: "pointer", color: M }}><Plus size={13}/></button>
        </div>
        {g("boxShadow") && (
          <div style={{ padding: "0 14px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, borderRadius: 6, border: `1px solid ${BDR}`, background: BG, padding: "0 8px" }}>
              <span style={{ fontSize: 10, color: M, fontWeight: 600, flexShrink: 0 }}>Shadow</span>
              <input value={g("boxShadow")} onChange={e => set("boxShadow",e.target.value)}
                style={{ flex: 1, background: "none", border: "none", color: T, fontSize: 11, outline: "none" }}/>
              <button onClick={() => set("boxShadow","")} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex" }}><Minus size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {/* ══ EXPORT ════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.35)" }}>Export</span>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: M }}><Plus size={13}/></button>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
