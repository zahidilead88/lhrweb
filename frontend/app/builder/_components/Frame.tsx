"use client";

import React, { useState, useRef } from "react";
import type { Frame } from "@/types/builder";

const BRAND = "#7B6EF5";

export interface FrameComponentProps {
  frame: Frame;
  isSelected: boolean;
  scale: number;           // current canvas zoom — for resize/move px math
  onSelect: () => void;
  onRename: (name: string) => void;
  onResize: (width: number, height: number) => void;
  onMove: (canvasX: number, canvasY: number) => void;
  onPublish?: (frame: Frame) => void;
  children?: React.ReactNode;
}

export default function FrameComponent({
  frame, isSelected, scale, onSelect, onRename, onResize, onMove, onPublish, children,
}: FrameComponentProps) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(frame.name);
  const [published, setPublished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; fx: number; fy: number } | null>(null);

  const commitName = () => {
    setEditingName(false);
    onRename(draftName.trim() || frame.name);
  };

  // Drag frame by label
  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (editingName) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, fx: frame.canvasX, fy: frame.canvasY };
    const onMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      onMove(
        Math.round(dragRef.current.fx + (me.clientX - dragRef.current.sx) / scale),
        Math.round(dragRef.current.fy + (me.clientY - dragRef.current.sy) / scale),
      );
    };
    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    // Positioned in world space — parent transform div handles zoom/pan
    <div style={{ position: "absolute", left: frame.canvasX, top: frame.canvasY, pointerEvents: "none" }}>

      {/* ── Name label above the frame ── */}
      <div style={{ position: "absolute", top: -28, left: 0, display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
        {editingName ? (
          <input
            ref={inputRef}
            value={draftName}
            autoFocus
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") { setEditingName(false); setDraftName(frame.name); }
              e.stopPropagation();
            }}
            style={{
              background: "rgba(123,110,245,0.1)", border: `1px solid ${BRAND}`,
              borderRadius: 4, padding: "1px 7px",
              color: "#5B3FC8", fontSize: 11, fontWeight: 700,
              fontFamily: "system-ui", outline: "none", minWidth: 60,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 11, fontWeight: 600,
              color: isSelected ? BRAND : "rgba(0,0,0,0.45)",
              whiteSpace: "nowrap", fontFamily: "system-ui",
              cursor: "move", letterSpacing: "0.02em", userSelect: "none",
            }}
            onMouseDown={handleLabelMouseDown}
            onClick={e => { e.stopPropagation(); onSelect(); }}
            onDoubleClick={e => {
              e.stopPropagation();
              setEditingName(true);
              setDraftName(frame.name);
              setTimeout(() => inputRef.current?.select(), 0);
            }}
          >
            {frame.name}
          </span>
        )}

        {/* Size badge */}
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", fontFamily: "ui-monospace,monospace" }}>
          {frame.width}×{frame.height}
        </span>

        {/* Use on page button — only shown when onPublish is wired up */}
        {onPublish && !editingName && (
          <button
            onClick={e => {
              e.stopPropagation();
              onPublish(frame);
              setPublished(true);
              setTimeout(() => setPublished(false), 1800);
            }}
            title="Copy this frame's design to the page (flow mode + published site)"
            style={{
              fontSize: 10, fontWeight: 700, fontFamily: "system-ui",
              padding: "2px 7px", borderRadius: 4, border: "none",
              cursor: "pointer", whiteSpace: "nowrap",
              background: published ? "#10B981" : "rgba(123,110,245,0.12)",
              color: published ? "#fff" : BRAND,
              transition: "all 0.2s",
            }}
          >
            {published ? "✓ Saved" : "↑ Use on page"}
          </button>
        )}
      </div>

      {/* ── Frame body ── */}
      <div
        onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          position: "relative",
          width: frame.width,
          height: frame.height,
          background: frame.background,
          overflow: frame.clipContent ? "hidden" : "visible",
          opacity: frame.opacity != null ? frame.opacity / 100 : undefined,
          borderRadius: frame.borderRadius ? `${frame.borderRadius}px` : undefined,
          transform: (() => {
            const parts: string[] = [];
            if (frame.flipH) parts.push("scaleX(-1)");
            if (frame.flipV) parts.push("scaleY(-1)");
            if (frame.rotation) parts.push(`rotate(${frame.rotation}deg)`);
            return parts.length ? parts.join(" ") : undefined;
          })(),
          border: frame.stroke ? `${frame.stroke.width}px ${frame.stroke.style} ${frame.stroke.color}` : undefined,
          boxShadow: (() => {
            const shadows: string[] = [];
            if (frame.effects?.length) {
              frame.effects.filter(e => e.visible).forEach(e => {
                const inset = e.type === "inner-shadow" ? "inset " : "";
                shadows.push(`${inset}${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${e.color}`);
              });
            }
            shadows.push(isSelected
              ? `0 0 0 2px ${BRAND}, 0 8px 32px rgba(0,0,0,0.4)`
              : "0 0 0 1px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.12)"
            );
            return shadows.join(", ");
          })(),
          pointerEvents: "auto",
          cursor: "default",
        }}
      >
        {children}
      </div>

      {/* ── Resize handle (bottom-right) ── */}
      {isSelected && (
        <ResizeHandle frame={frame} scale={scale} onResize={onResize} />
      )}
    </div>
  );
}

// ── Resize handle ─────────────────────────────────────────────────────────────

function ResizeHandle({
  frame, scale, onResize,
}: { frame: Frame; scale: number; onResize: (w: number, h: number) => void }) {
  const startRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  return (
    <div
      style={{
        position: "absolute", bottom: -5, right: -5,
        width: 10, height: 10,
        background: "#fff", border: `2px solid ${BRAND}`,
        borderRadius: 2, cursor: "se-resize", zIndex: 200, pointerEvents: "auto",
      }}
      onMouseDown={e => {
        e.stopPropagation();
        e.preventDefault();
        startRef.current = { sx: e.clientX, sy: e.clientY, sw: frame.width, sh: frame.height };
        const onMouseMove = (me: MouseEvent) => {
          if (!startRef.current) return;
          onResize(
            Math.max(100, Math.round(startRef.current.sw + (me.clientX - startRef.current.sx) / scale)),
            Math.max(100, Math.round(startRef.current.sh + (me.clientY - startRef.current.sy) / scale)),
          );
        };
        const onMouseUp = () => {
          startRef.current = null;
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }}
    />
  );
}
