"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MousePointer2, Hand, Maximize2, Square, Type, Circle,
  ChevronLeft, Save, Eye, Plus, Minus, ArrowRight, Scan, PenLine,
} from "lucide-react";
import type { CanvasTool } from "@/types/builder";
import { FRAME_PRESETS } from "@/types/builder";

const BRAND   = "#7B6EF5";
const BG      = "#1A1A2E";
const SURFACE = "#242440";

interface CanvasToolbarProps {
  projectName: string;
  activeTool: CanvasTool;
  onToolChange: (t: CanvasTool) => void;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  onNewFrame: (preset: { label: string; width: number; height: number }) => void;
}

const TOOL_GROUPS: { tool: CanvasTool; icon: React.ReactNode; label: string; shortcut: string }[][] = [
  // Group 1: Move / Scale
  [
    { tool: "move",  icon: <MousePointer2 size={15} />, label: "Move",  shortcut: "V" },
    { tool: "scale", icon: <Scan size={15} />,          label: "Scale", shortcut: "K" },
  ],
  // Group 2: Frame
  [
    { tool: "frame", icon: <Maximize2 size={15} />,     label: "Frame", shortcut: "F" },
  ],
  // Group 3: Pen
  [
    { tool: "pen",   icon: <PenLine size={15} />,       label: "Pen",   shortcut: "P" },
  ],
  // Group 4: Text
  [
    { tool: "text",  icon: <Type size={15} />,          label: "Text",  shortcut: "T" },
  ],
  // Group 5: Shape tools (Rect, Ellipse, Line, Arrow)
  [
    { tool: "rect",    icon: <Square size={15} />,      label: "Rectangle", shortcut: "R" },
    { tool: "ellipse", icon: <Circle size={15} />,      label: "Ellipse",   shortcut: "O" },
    { tool: "line",    icon: <Minus size={15} />,       label: "Line",      shortcut: "L" },
    { tool: "arrow",   icon: <ArrowRight size={15} />,  label: "Arrow",     shortcut: "A" },
  ],
  // Group 6: Hand
  [
    { tool: "hand",   icon: <Hand size={15} />,         label: "Hand",  shortcut: "H" },
  ],
];

export default function CanvasToolbar({
  projectName, activeTool, onToolChange, saved, saving, onSave, onBack, onNewFrame,
}: CanvasToolbarProps) {
  const [frameMenuOpen, setFrameMenuOpen] = useState(false);
  const frameMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!frameMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (frameMenuRef.current && !frameMenuRef.current.contains(e.target as Node)) {
        setFrameMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [frameMenuOpen]);

  return (
    <div style={{
      display: "flex", alignItems: "center",
      height: 48, paddingInline: 12, gap: 8, flexShrink: 0,
      background: BG,
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      userSelect: "none",
    }}>

      {/* ── Left: back + project name ── */}
      <button
        onClick={onBack}
        title="Back to Builder"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.45)", padding: "4px 8px",
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
      >
        <ChevronLeft size={14} />
        Builder
      </button>

      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      <span style={{
        fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)",
        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}>
        {projectName || "Untitled Project"}
      </span>

      {/* ── Center: tools (Figma-style groups) ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 0 }}>
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 6px" }} />}
            <div style={{ display: "flex", gap: 2 }}>
              {group.map(({ tool, icon, label, shortcut }) => {
                const active = activeTool === tool;
                return (
                  <button
                    key={tool}
                    onClick={() => onToolChange(tool)}
                    title={`${label}  ${shortcut}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
                      background: active ? BRAND : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.45)",
                      transition: "all 0.12s",
                      position: "relative",
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = SURFACE;
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                    }}
                  >
                    {icon}
                    <span style={{
                      position: "absolute", bottom: 3, right: 3,
                      fontSize: 8, fontWeight: 800, lineHeight: 1,
                      color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                      fontFamily: "ui-monospace,monospace",
                    }}>
                      {shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── Right: new frame + save + preview ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* + New Frame dropdown */}
        <div ref={frameMenuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setFrameMenuOpen(o => !o)}
            title="New Frame"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              border: `1px solid rgba(123,110,245,0.35)`,
              background: frameMenuOpen ? "rgba(123,110,245,0.2)" : "rgba(123,110,245,0.1)",
              color: "#C4BEFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(123,110,245,0.2)"; }}
            onMouseLeave={e => { if (!frameMenuOpen) (e.currentTarget as HTMLElement).style.background = "rgba(123,110,245,0.1)"; }}
          >
            <Plus size={13} />
            Frame
          </button>

          {frameMenuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "#1e2040", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: 4, minWidth: 160,
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              zIndex: 200,
            }}>
              <div style={{ padding: "4px 10px 6px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Frame Presets
              </div>
              {FRAME_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => { onNewFrame(preset); setFrameMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "7px 10px", borderRadius: 7,
                    border: "none", background: "transparent", cursor: "pointer",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span>{preset.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "ui-monospace,monospace" }}>
                    {preset.width}×{preset.height}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

        {/* Save status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: saving ? "#F59E0B" : saved ? "#10B981" : "rgba(255,255,255,0.2)",
            transition: "background 0.3s",
          }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {saving ? "Saving…" : saved ? "Saved" : "Unsaved"}
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 8, border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            background: SURFACE, color: "rgba(255,255,255,0.7)",
            fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = "#2e2e50"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = SURFACE; }}
        >
          <Save size={13} />
          Save
        </button>

        {/* Preview button */}
        <button
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: BRAND, color: "#fff",
            fontSize: 12, fontWeight: 600,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <Eye size={13} />
          Preview
        </button>
      </div>
    </div>
  );
}
