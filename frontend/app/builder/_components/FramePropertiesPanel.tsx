"use client";

import React, { useState, useCallback } from "react";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignJustify,
  FlipHorizontal2, FlipVertical2,
  Lock, Unlock, Eye, EyeOff, Plus, Minus,
  Square, ArrowRight, ArrowDown, Grid3X3,
  StretchHorizontal,
} from "lucide-react";
import type { Frame, FrameStroke, FrameEffect, ElementNode, FreeLayout } from "@/types/builder";
import { ColorSwatchButton } from "./ColorPicker";

// ── Colour extraction ─────────────────────────────────────────────────────────

function extractColors(els: ElementNode[]): string[] {
  const seen = new Set<string>();
  function walk(el: ElementNode) {
    const s = el.styles?.desktop ?? {};
    [s.backgroundColor, s.color, s.borderColor].forEach(c => {
      if (c && c !== "transparent" && c !== "inherit") seen.add(c);
    });
    el.children?.forEach(walk);
  }
  els.forEach(walk);
  return Array.from(seen).slice(0, 8);
}

// ── Child alignment helpers ───────────────────────────────────────────────────

type AlignMode = "left" | "center-h" | "right" | "top" | "center-v" | "bottom" | "distribute-h" | "distribute-v";

function getChildLayout(el: ElementNode, idx: number) {
  return {
    x: el.layout?.x ?? 20,
    y: el.layout?.y ?? 20 + idx * 80,
    w: el.layout?.width ?? 200,
    h: el.layout?.height ?? 60,
  };
}

function alignChildren(children: ElementNode[], mode: AlignMode, frameW: number, frameH: number): ElementNode[] {
  if (!children.length) return children;

  if (mode === "distribute-h" || mode === "distribute-v") {
    const sorted = [...children].sort((a, b) => {
      const la = getChildLayout(a, 0), lb = getChildLayout(b, 0);
      return mode === "distribute-h" ? la.x - lb.x : la.y - lb.y;
    });
    const total = sorted.reduce((sum, el, i) => {
      const l = getChildLayout(el, i);
      return sum + (mode === "distribute-h" ? l.w : l.h);
    }, 0);
    const space = (mode === "distribute-h" ? frameW : frameH) - total;
    const gap = Math.max(0, space / Math.max(sorted.length - 1, 1));
    let cursor = 0;
    const mapped = sorted.map((el, i) => {
      const l = getChildLayout(el, i);
      const patch: Partial<FreeLayout> = mode === "distribute-h"
        ? { x: Math.round(cursor) }
        : { y: Math.round(cursor) };
      cursor += (mode === "distribute-h" ? l.w : l.h) + gap;
      return { ...el, layout: { ...(el.layout ?? { x: 0, y: 0, width: l.w, height: l.h }), ...patch } };
    });
    return children.map(c => mapped.find(m => m.id === c.id) ?? c);
  }

  return children.map((el, idx) => {
    const l = getChildLayout(el, idx);
    let x = l.x, y = l.y;
    switch (mode) {
      case "left":     x = 0; break;
      case "right":    x = frameW - l.w; break;
      case "center-h": x = (frameW - l.w) / 2; break;
      case "top":      y = 0; break;
      case "bottom":   y = frameH - l.h; break;
      case "center-v": y = (frameH - l.h) / 2; break;
    }
    return { ...el, layout: { ...(el.layout ?? { x: 0, y: 0, width: l.w, height: l.h }), x: Math.round(x), y: Math.round(y) } };
  });
}

// ── Small shared UI atoms ─────────────────────────────────────────────────────

const BRAND = "#7B6EF5";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#f0f0f0" }} />;
}

function IconBtn({
  onClick, title, active, disabled, children, size = 22,
}: { onClick?: () => void; title?: string; active?: boolean; disabled?: boolean; children: React.ReactNode; size?: number }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: size, height: size,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 5, cursor: disabled ? "default" : "pointer",
        background: active ? "rgba(123,110,245,0.12)" : "transparent",
        color: active ? BRAND : disabled ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.45)",
        flexShrink: 0,
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {children}
    </button>
  );
}

function NumInput({
  label, value, onChange, unit, min, max, step = 1,
}: {
  label?: string; value: number; onChange: (n: number) => void;
  unit?: string; min?: number; max?: number; step?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
      {label && (
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.38)", fontWeight: 600, flexShrink: 0, minWidth: 10 }}>
          {label}
        </span>
      )}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        background: "#f5f5f7", borderRadius: 6,
        border: "1px solid #e8e8ec", overflow: "hidden",
      }}>
        <input
          type="number"
          value={draft ?? value}
          min={min} max={max} step={step}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(n);
            setDraft(null);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              const n = parseFloat((e.target as HTMLInputElement).value);
              if (!isNaN(n)) onChange(n);
              setDraft(null);
              (e.target as HTMLInputElement).blur();
            }
            e.stopPropagation();
          }}
          style={{
            flex: 1, border: "none", background: "none", padding: "4px 7px",
            fontSize: 11, color: "rgba(0,0,0,0.75)", outline: "none",
            fontFamily: "system-ui", minWidth: 0, textAlign: "right",
          }}
        />
        {unit && (
          <span style={{ fontSize: 9, color: "rgba(0,0,0,0.35)", paddingRight: 5, flexShrink: 0 }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

function defaultEffect(): FrameEffect {
  return { visible: true, type: "drop-shadow", x: 2, y: 4, blur: 12, spread: 0, color: "rgba(0,0,0,0.15)" };
}

function defaultStroke(): FrameStroke {
  return { color: "#000000", width: 1, style: "solid" };
}

// ── Main panel ────────────────────────────────────────────────────────────────

export interface FramePropertiesPanelProps {
  frame: Frame;
  onChange: (patch: Partial<Frame>) => void;
}

export default function FramePropertiesPanel({ frame, onChange }: FramePropertiesPanelProps) {
  const [lockAspect, setLockAspect] = useState(false);
  const aspectRatio = frame.width / frame.height;

  const set = useCallback(<K extends keyof Frame>(key: K, value: Frame[K]) => {
    onChange({ [key]: value });
  }, [onChange]);

  const opacity     = frame.opacity     ?? 100;
  const borderRadius = frame.borderRadius ?? 0;
  const rotation    = frame.rotation    ?? 0;
  const layoutMode  = frame.layoutMode  ?? "none";
  const gap         = frame.gap         ?? 0;
  const effects     = frame.effects     ?? [];
  const stroke      = frame.stroke      ?? null;

  const sectionPad: React.CSSProperties = { padding: "10px 14px" };

  const align = (mode: AlignMode) => {
    onChange({ children: alignChildren(frame.children, mode, frame.width, frame.height) });
  };

  return (
    <div style={{ flex: 1, overflow: "hidden auto", fontSize: 11, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Position ── */}
      <div style={sectionPad}>
        <div style={{ marginBottom: 9 }}>
          <SectionLabel>Position</SectionLabel>
        </div>

        {/* Alignment buttons (align children within frame — free mode only) */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 8 }}>
          <IconBtn title="Align children left" onClick={() => align("left")} disabled={layoutMode !== "none"}><AlignLeft size={13} /></IconBtn>
          <IconBtn title="Center children horizontally" onClick={() => align("center-h")} disabled={layoutMode !== "none"}><AlignCenter size={13} /></IconBtn>
          <IconBtn title="Align children right" onClick={() => align("right")} disabled={layoutMode !== "none"}><AlignRight size={13} /></IconBtn>
          <div style={{ width: 1, height: 14, background: "#e0e0e0", margin: "0 3px" }} />
          <IconBtn title="Align children top" onClick={() => align("top")} disabled={layoutMode !== "none"}><AlignStartVertical size={13} /></IconBtn>
          <IconBtn title="Center children vertically" onClick={() => align("center-v")} disabled={layoutMode !== "none"}><AlignCenterVertical size={13} /></IconBtn>
          <IconBtn title="Align children bottom" onClick={() => align("bottom")} disabled={layoutMode !== "none"}><AlignEndVertical size={13} /></IconBtn>
          <IconBtn title="Distribute evenly" onClick={() => align("distribute-h")} disabled={layoutMode !== "none"}><AlignJustify size={13} /></IconBtn>
        </div>

        {/* X / Y / Rotation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 7 }}>
          <NumInput label="X" value={Math.round(frame.canvasX)} onChange={v => onChange({ canvasX: v })} />
          <NumInput label="Y" value={Math.round(frame.canvasY)} onChange={v => onChange({ canvasY: v })} />
          <NumInput label="R" value={rotation} unit="°" min={-180} max={180} onChange={v => set("rotation", v)} />
        </div>

        {/* Flip buttons */}
        <div style={{ display: "flex", gap: 3 }}>
          <IconBtn
            title="Flip horizontal"
            active={!!frame.flipH}
            onClick={() => set("flipH", !frame.flipH)}
          >
            <FlipHorizontal2 size={13} />
          </IconBtn>
          <IconBtn
            title="Flip vertical"
            active={!!frame.flipV}
            onClick={() => set("flipV", !frame.flipV)}
          >
            <FlipVertical2 size={13} />
          </IconBtn>
        </div>
      </div>

      <Divider />

      {/* ── Layout ── */}
      <div style={sectionPad}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <SectionLabel>Layout</SectionLabel>
        </div>

        {/* Flow mode */}
        <div style={{ display: "flex", gap: 2, marginBottom: 9 }}>
          {([
            { key: "none" as const,       icon: <Square size={11} />,     title: "Free (no auto layout)" },
            { key: "horizontal" as const, icon: <ArrowRight size={11} />, title: "Horizontal auto layout" },
            { key: "vertical" as const,   icon: <ArrowDown size={11} />,  title: "Vertical auto layout" },
            { key: "grid" as const,       icon: <Grid3X3 size={11} />,    title: "Grid auto layout" },
          ] as const).map(m => (
            <button
              key={m.key}
              title={m.title}
              onClick={() => set("layoutMode", m.key)}
              style={{
                flex: 1, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${layoutMode === m.key ? BRAND : "#e8e8ec"}`,
                borderRadius: 6, cursor: "pointer",
                background: layoutMode === m.key ? "rgba(123,110,245,0.1)" : "#f5f5f7",
                color: layoutMode === m.key ? BRAND : "rgba(0,0,0,0.45)",
                transition: "all 0.1s",
              }}
            >
              {m.icon}
            </button>
          ))}
        </div>

        {/* Auto-layout sub-controls */}
        {layoutMode !== "none" && (
          <>
            {/* Grid columns */}
            {layoutMode === "grid" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Columns</div>
                <NumInput value={frame.gridColumns ?? 3} min={1} max={12} onChange={v => set("gridColumns", Math.round(v))} />
              </div>
            )}

            {/* Gap */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Gap</div>
              <NumInput value={gap} unit="px" min={0} onChange={v => set("gap", Math.round(v))} />
            </div>

            {/* Justify / Align — side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Justify</div>
                <select
                  value={frame.justifyContent ?? "flex-start"}
                  onChange={e => set("justifyContent", e.target.value as Frame["justifyContent"])}
                  style={{
                    width: "100%", padding: "4px 6px", borderRadius: 6,
                    border: "1px solid #e8e8ec", background: "#f5f5f7",
                    fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)",
                  }}
                >
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Space between</option>
                  <option value="space-around">Space around</option>
                  <option value="space-evenly">Space evenly</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Align</div>
                <select
                  value={frame.alignItems ?? "flex-start"}
                  onChange={e => set("alignItems", e.target.value as Frame["alignItems"])}
                  style={{
                    width: "100%", padding: "4px 6px", borderRadius: 6,
                    border: "1px solid #e8e8ec", background: "#f5f5f7",
                    fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)",
                  }}
                >
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="stretch">Stretch</option>
                  <option value="baseline">Baseline</option>
                </select>
              </div>
            </div>

            {/* Padding 4-input grid */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Padding</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                <NumInput label="T" value={frame.paddingTop ?? 0} min={0} onChange={v => set("paddingTop", Math.round(v))} />
                <NumInput label="R" value={frame.paddingRight ?? 0} min={0} onChange={v => set("paddingRight", Math.round(v))} />
                <NumInput label="B" value={frame.paddingBottom ?? 0} min={0} onChange={v => set("paddingBottom", Math.round(v))} />
                <NumInput label="L" value={frame.paddingLeft ?? 0} min={0} onChange={v => set("paddingLeft", Math.round(v))} />
              </div>
            </div>
          </>
        )}

        {/* Layout Grid (visible guides) */}
        <div style={{ marginBottom: 8 }}>
          <div
            onClick={() => set("layoutGrid", frame.layoutGrid ? undefined : { count: 12, type: "columns", gutter: 20, margin: 40 })}
            style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginBottom: frame.layoutGrid ? 6 : 0 }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              border: `1.5px solid ${frame.layoutGrid ? BRAND : "#c8c8ce"}`,
              background: frame.layoutGrid ? BRAND : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s",
            }}>
              {frame.layoutGrid && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.55)", fontWeight: 500, userSelect: "none" }}>Layout grid</span>
          </div>
          {frame.layoutGrid && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 20 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <select
                  value={frame.layoutGrid.type}
                  onChange={e => set("layoutGrid", { ...frame.layoutGrid!, type: e.target.value as "columns" | "rows" })}
                  style={{ flex: 1, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
                >
                  <option value="columns">Columns</option>
                  <option value="rows">Rows</option>
                </select>
                <input type="number" value={frame.layoutGrid.count} min={1} max={24}
                  onChange={e => set("layoutGrid", { ...frame.layoutGrid!, count: Math.max(1, parseInt(e.target.value) || 12) })}
                  style={{ width: 36, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, outline: "none", textAlign: "center" }}
                />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <input type="number" value={frame.layoutGrid.gutter} min={0}
                  onChange={e => set("layoutGrid", { ...frame.layoutGrid!, gutter: parseInt(e.target.value) || 0 })}
                  placeholder="Gutter"
                  style={{ flex: 1, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, outline: "none", textAlign: "center" }}
                />
                <input type="number" value={frame.layoutGrid.margin} min={0}
                  onChange={e => set("layoutGrid", { ...frame.layoutGrid!, margin: parseInt(e.target.value) || 0 })}
                  placeholder="Margin"
                  style={{ flex: 1, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, outline: "none", textAlign: "center" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* W / H with aspect-ratio lock */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <NumInput
            label="W"
            value={frame.width}
            min={1}
            onChange={v => {
              const patch: Partial<Frame> = { width: Math.round(v) };
              if (lockAspect) patch.height = Math.round(v / aspectRatio);
              onChange(patch);
            }}
          />
          <button
            onClick={() => setLockAspect(l => !l)}
            title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
            style={{
              width: 22, height: 22, border: "1px solid #e8e8ec", borderRadius: 5, cursor: "pointer",
              background: lockAspect ? "rgba(123,110,245,0.1)" : "#f5f5f7",
              color: lockAspect ? BRAND : "rgba(0,0,0,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            {lockAspect ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
          <NumInput
            label="H"
            value={frame.height}
            min={1}
            onChange={v => {
              const patch: Partial<Frame> = { height: Math.round(v) };
              if (lockAspect) patch.width = Math.round(v * aspectRatio);
              onChange(patch);
            }}
          />
        </div>

        {/* Clip content */}
        <div
          onClick={() => set("clipContent", !frame.clipContent)}
          style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            border: `1.5px solid ${frame.clipContent ? BRAND : "#c8c8ce"}`,
            background: frame.clipContent ? BRAND : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.1s",
          }}>
            {frame.clipContent && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 11, color: "rgba(0,0,0,0.55)", fontWeight: 500, userSelect: "none" }}>Clip content</span>
        </div>
      </div>

      <Divider />

      {/* ── Appearance ── */}
      <div style={sectionPad}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <SectionLabel>Appearance</SectionLabel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Opacity</div>
            <NumInput value={opacity} unit="%" min={0} max={100} onChange={v => set("opacity", Math.round(v))} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Corner radius</div>
            <NumInput value={borderRadius} min={0} onChange={v => set("borderRadius", Math.round(v))} />
          </div>
        </div>

        {/* Blend mode */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.38)", marginBottom: 3 }}>Blend mode</div>
            <select
              value={frame.blendMode ?? "normal"}
              onChange={e => set("blendMode", e.target.value as Frame["blendMode"])}
              style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
            >
              {["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"].map(m => (
                <option key={m} value={m}>{m.replace(/-/g," ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Fill ── */}
      <div style={sectionPad}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionLabel>Fill</SectionLabel>
          <IconBtn size={20} title="Add fill"><Plus size={12} /></IconBtn>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ColorSwatchButton
            value={frame.background || "#ffffff"}
            onChange={bg => set("background", bg)}
            size={22}
          />
          <input
            type="text"
            value={(frame.background || "#ffffff").replace("#", "").toUpperCase()}
            maxLength={6}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "");
              if (raw.length === 6) set("background", "#" + raw.toLowerCase());
            }}
            style={{
              flex: 1, padding: "4px 7px", borderRadius: 6,
              border: "1px solid #e8e8ec", background: "#f5f5f7",
              fontSize: 11, fontFamily: "ui-monospace,monospace",
              color: "rgba(0,0,0,0.65)", outline: "none",
            }}
          />
          <span style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", minWidth: 28, textAlign: "right" }}>100 %</span>
          <IconBtn size={18} title="Remove fill"><Minus size={10} /></IconBtn>
        </div>
      </div>

      <Divider />

      {/* ── Stroke ── */}
      <div style={sectionPad}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: stroke ? 8 : 0 }}>
          <SectionLabel>Stroke</SectionLabel>
          <IconBtn
            size={20}
            title={stroke ? "Remove stroke" : "Add stroke"}
            onClick={() => set("stroke", stroke ? undefined : defaultStroke())}
          >
            {stroke ? <Minus size={12} /> : <Plus size={12} />}
          </IconBtn>
        </div>

        {stroke && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ColorSwatchButton
                value={stroke.color}
                onChange={c => set("stroke", { ...stroke, color: c })}
                size={22}
              />
              <input
                type="text"
                value={stroke.color.replace("#", "").toUpperCase()}
                maxLength={6}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "");
                  if (raw.length === 6) set("stroke", { ...stroke, color: "#" + raw.toLowerCase() });
                }}
                style={{ flex: 1, padding: "3px 6px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, fontFamily: "ui-monospace,monospace", outline: "none" }}
              />
              <input
                type="number"
                value={stroke.width}
                min={1} max={20}
                onChange={e => set("stroke", { ...stroke, width: parseInt(e.target.value) || 1 })}
                style={{ width: 36, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, outline: "none", textAlign: "center" }}
              />
              <select
                value={stroke.style}
                onChange={e => set("stroke", { ...stroke, style: e.target.value as FrameStroke["style"] })}
                style={{ padding: "3px 4px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
              >
                <option value="solid">—</option>
                <option value="dashed">- -</option>
                <option value="dotted">···</option>
              </select>
            </div>
            {/* Stroke join + cap (Figma-like) */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <select
                value={stroke.join ?? "miter"}
                onChange={e => set("stroke", { ...stroke, join: e.target.value as FrameStroke["join"] })}
                style={{ flex: 1, padding: "3px 4px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
              >
                <option value="miter">Miter</option>
                <option value="round">Round</option>
                <option value="bevel">Bevel</option>
              </select>
              <select
                value={stroke.cap ?? "round"}
                onChange={e => set("stroke", { ...stroke, cap: e.target.value as FrameStroke["cap"] })}
                style={{ flex: 1, padding: "3px 4px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
              >
                <option value="round">Round</option>
                <option value="square">Square</option>
                <option value="arrow">Arrow</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* ── Effects ── */}
      <div style={sectionPad}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: effects.length ? 8 : 0 }}>
          <SectionLabel>Effects</SectionLabel>
          <IconBtn size={20} title="Add drop shadow" onClick={() => set("effects", [...effects, defaultEffect()])}>
            <Plus size={12} />
          </IconBtn>
        </div>

        {effects.map((eff, i) => (
          <div key={i} style={{ marginBottom: i < effects.length - 1 ? 8 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <IconBtn
                size={18}
                title={eff.visible ? "Hide" : "Show"}
                onClick={() => {
                  const next = effects.slice();
                  next[i] = { ...eff, visible: !eff.visible };
                  set("effects", next);
                }}
              >
                {eff.visible ? <Eye size={10} /> : <EyeOff size={10} />}
              </IconBtn>
              <select
                value={eff.type}
                onChange={e => {
                  const next = effects.slice();
                  next[i] = { ...eff, type: e.target.value as FrameEffect["type"] };
                  set("effects", next);
                }}
                style={{ flex: 1, padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 10, outline: "none", color: "rgba(0,0,0,0.6)" }}
              >
                <option value="drop-shadow">Drop Shadow</option>
                <option value="inner-shadow">Inner Shadow</option>
              </select>
              <ColorSwatchButton
                value={eff.color.startsWith("rgba") ? "#000000" : eff.color}
                onChange={c => { const n = effects.slice(); n[i] = { ...eff, color: c }; set("effects", n); }}
                size={20}
              />
              <IconBtn size={18} title="Remove" onClick={() => set("effects", effects.filter((_, j) => j !== i))}>
                <Minus size={10} />
              </IconBtn>
            </div>
            {/* X, Y, Blur, Spread */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
              {(["x","y","blur","spread"] as const).map(k => (
                <div key={k}>
                  <div style={{ fontSize: 8, color: "rgba(0,0,0,0.35)", marginBottom: 2, textAlign: "center" }}>
                    {k === "blur" ? "Blur" : k === "spread" ? "Spread" : k.toUpperCase()}
                  </div>
                  <input
                    type="number"
                    value={eff[k]}
                    min={k === "blur" || k === "spread" ? 0 : undefined}
                    onChange={e => {
                      const next = effects.slice();
                      next[i] = { ...eff, [k]: parseFloat(e.target.value) || 0 };
                      set("effects", next);
                    }}
                    style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: "1px solid #e8e8ec", background: "#f5f5f7", fontSize: 11, outline: "none", textAlign: "center", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── Selection colors ── */}
      {(() => {
        const colors = extractColors(frame.children);
        if (!colors.length) return null;
        return (
          <>
            <div style={sectionPad}>
              <div style={{ marginBottom: 9 }}>
                <SectionLabel>Selection colors</SectionLabel>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {colors.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, background: c,
                      border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontSize: 11, fontFamily: "ui-monospace,monospace", color: "rgba(0,0,0,0.6)", fontWeight: 500 }}>
                      {c.startsWith("#") ? c.replace("#", "").toUpperCase() : c}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.35)" }}>100 %</span>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        );
      })()}

      {/* ── Frame name + info ── */}
      <div style={{ ...sectionPad, display: "flex", flexDirection: "column", gap: 7 }}>
        <SectionLabel>Frame</SectionLabel>
        <input
          value={frame.name}
          onChange={e => onChange({ name: e.target.value })}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "6px 9px", borderRadius: 7, border: "1px solid #e8e8ec",
            background: "#f5f5f7", color: "rgba(0,0,0,0.8)", fontSize: 12, fontWeight: 600,
            outline: "none",
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = BRAND; }}
          onBlur={e  => { (e.currentTarget as HTMLElement).style.borderColor = "#e8e8ec"; }}
        />
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.38)" }}>
          {frame.children.length} element{frame.children.length !== 1 ? "s" : ""}
        </div>
      </div>

    </div>
  );
}
