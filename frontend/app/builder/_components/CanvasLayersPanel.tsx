"use client";

import React, { useState, useCallback } from "react";
import {
  ChevronDown, ChevronRight, Maximize2, Trash2,
  Type, Box, Image as Img,
  Link, List, Layout, AlignLeft, ArrowUp, ArrowDown,
} from "lucide-react";
import type { Frame, ElementNode } from "@/types/builder";

// ── Theme ─────────────────────────────────────────────────────────────────────

const M  = "rgba(0,0,0,0.4)";
const T  = "rgba(0,0,0,0.75)";
const B  = "rgba(0,0,0,0.07)";
const BR = "#7B6EF5";
const SEL_BG = "rgba(123,110,245,0.1)";

// ── Tag icon (mirrors LayersPanel) ────────────────────────────────────────────

function TagIcon({ tag }: { tag: string }) {
  if (/^h[1-6]$/.test(tag) || tag === "heading")            return <Type    size={10} />;
  if (["p","paragraph","span","blockquote","strong","em"].includes(tag)) return <AlignLeft size={10} />;
  if (tag === "img"  || tag === "image")                     return <Img     size={10} />;
  if (tag === "a")                                           return <Link    size={10} />;
  if (["ul","ol","li"].includes(tag))                        return <List    size={10} />;
  if (["nav","header","footer","section","main","article","aside"].includes(tag)) return <Layout size={10} />;
  return <Box size={10} />;
}

// ── Single element row (inside a frame) ───────────────────────────────────────

function ElementRow({
  el, selected, onSelect,
}: { el: ElementNode; selected: boolean; onSelect: (multi: boolean) => void }) {
  const preview = el.content ? el.content.slice(0, 24) : el.className ? `.${el.className}` : "";

  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(e.shiftKey); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 8px 3px 28px",
        borderRadius: 4, cursor: "pointer",
        background: selected ? SEL_BG : "transparent",
        color: selected ? "#5B3FC8" : M,
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <TagIcon tag={el.tag} />
      <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>
        {el.tag}
      </span>
      {preview && (
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontStyle: "italic" }}>
          {preview}
        </span>
      )}
    </div>
  );
}

// ── Frame row (collapsible) ───────────────────────────────────────────────────

function FrameRow({
  frame, isSelected, isExpanded, selectedChildIds,
  onSelect, onToggle, onDelete, onRename,
  onSelectChild, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}: {
  frame: Frame;
  isSelected: boolean;
  isExpanded: boolean;
  selectedChildIds: string[];
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onSelectChild: (id: string, multi: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(frame.name);

  const commitRename = () => {
    setEditing(false);
    onRename(draft.trim() || frame.name);
  };

  return (
    <div style={{ marginBottom: 1 }}>
      {/* Frame header row */}
      <div
        onClick={onSelect}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 6px", borderRadius: 5, cursor: "pointer",
          background: isSelected ? SEL_BG : "transparent",
          border: isSelected ? `1px solid rgba(123,110,245,0.3)` : "1px solid transparent",
          transition: "background 0.1s",
        }}
        className="clp-frame-row"
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex", alignItems: "center", justifyContent: "center", width: 14, flexShrink: 0, padding: 0 }}
        >
          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>

        <Maximize2 size={11} color={isSelected ? BR : M} style={{ flexShrink: 0 }} />

        {/* Frame name (inline rename) */}
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditing(false); setDraft(frame.name); }
              e.stopPropagation();
            }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, background: "rgba(123,110,245,0.08)", border: `1px solid ${BR}`, borderRadius: 3, padding: "1px 5px", fontSize: 11, fontWeight: 600, color: "#5B3FC8", outline: "none" }}
          />
        ) : (
          <span
            onDoubleClick={e => { e.stopPropagation(); setEditing(true); setDraft(frame.name); }}
            style={{ flex: 1, fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? T : "rgba(0,0,0,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "none" }}
          >
            {frame.name}
          </span>
        )}

        {/* Size badge */}
        <span style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>
          {frame.width}×{frame.height}
        </span>

        {/* Hover actions */}
        <div style={{ display: "flex", gap: 1, flexShrink: 0, opacity: 0, transition: "opacity 0.1s" }}
          className="clp-frame-actions"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onMoveUp}   disabled={!canMoveUp}   title="Move up"   style={{ width: 16, height: 16, background: "none", border: "none", cursor: canMoveUp   ? "pointer" : "default", color: canMoveUp   ? M : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowUp   size={9}/></button>
          <button onClick={onMoveDown} disabled={!canMoveDown} title="Move down" style={{ width: 16, height: 16, background: "none", border: "none", cursor: canMoveDown ? "pointer" : "default", color: canMoveDown ? M : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowDown size={9}/></button>
          <button onClick={onDelete}   title="Delete frame"   style={{ width: 16, height: 16, background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2    size={9}/></button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && (
        <div style={{ paddingBottom: 2 }}>
          {frame.children.length === 0 ? (
            <div style={{ padding: "2px 8px 2px 28px", fontSize: 10, color: "rgba(0,0,0,0.25)", fontStyle: "italic" }}>Empty frame</div>
          ) : (
            frame.children.map(child => (
              <ElementRow
                key={child.id}
                el={child}
                selected={selectedChildIds.includes(child.id)}
                onSelect={multi => onSelectChild(child.id, multi)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Free element row (flat list for floating elements) ────────────────────────

function FreeElementRow({
  el, selected, onSelect,
}: { el: ElementNode; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 6px 3px 20px", borderRadius: 4, cursor: "pointer",
        background: selected ? SEL_BG : "transparent",
        color: selected ? "#5B3FC8" : M,
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <TagIcon tag={el.tag} />
      <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "ui-monospace,monospace" }}>{el.tag}</span>
      {el.content && (
        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontStyle: "italic" }}>
          {el.content.slice(0, 24)}
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface CanvasLayersPanelProps {
  frames: Frame[];
  freeElements: ElementNode[];
  selectedFrameId: string | null;
  selectedFrameElementIds: string[];
  selectedElementId: string | null;
  onSelectFrame: (id: string) => void;
  onSelectFrameElement: (frameId: string, elementId: string, multi: boolean) => void;
  onSelectElement: (id: string) => void;
  onReorderFrames: (frames: Frame[]) => void;
  onDeleteFrame: (id: string) => void;
  onRenameFrame: (id: string, name: string) => void;
}

// Inject hover CSS once per mount for frame-row action visibility
const HOVER_STYLE = `
  .clp-frame-row:hover .clp-frame-actions { opacity: 1 !important; }
`;

export default function CanvasLayersPanel({
  frames, freeElements,
  selectedFrameId, selectedFrameElementIds, selectedElementId,
  onSelectFrame, onSelectFrameElement, onSelectElement,
  onReorderFrames, onDeleteFrame, onRenameFrame,
}: CanvasLayersPanelProps) {
  const [expandedFrames, setExpandedFrames] = useState<Set<string>>(() => new Set(frames.map(f => f.id)));

  const toggleFrame = useCallback((id: string) => {
    setExpandedFrames(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const moveFrame = useCallback((id: string, dir: 1 | -1) => {
    const idx = frames.findIndex(f => f.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= frames.length) return;
    const next = [...frames];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onReorderFrames(next);
  }, [frames, onReorderFrames]);

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 4px" }}>
      <style>{HOVER_STYLE}</style>

      {/* ── Frames section ── */}
      {frames.length > 0 && (
        <>
          <div style={{ padding: "2px 6px 4px", fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Frames
          </div>
          {frames.map((frame, i) => (
            <FrameRow
              key={frame.id}
              frame={frame}
              isSelected={selectedFrameId === frame.id}
              isExpanded={expandedFrames.has(frame.id)}
              selectedChildIds={selectedFrameId === frame.id ? selectedFrameElementIds : []}
              onSelect={() => onSelectFrame(frame.id)}
              onToggle={() => toggleFrame(frame.id)}
              onDelete={() => onDeleteFrame(frame.id)}
              onRename={name => onRenameFrame(frame.id, name)}
              onSelectChild={(childId, multi) => onSelectFrameElement(frame.id, childId, multi)}
              onMoveUp={() => moveFrame(frame.id, -1)}
              onMoveDown={() => moveFrame(frame.id, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < frames.length - 1}
            />
          ))}
        </>
      )}

      {/* ── Free elements section ── */}
      {freeElements.length > 0 && (
        <>
          <div style={{ padding: "8px 6px 4px", fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", borderTop: frames.length ? `1px solid ${B}` : "none", marginTop: frames.length ? 4 : 0 }}>
            Free Elements
          </div>
          {freeElements.map(el => (
            <FreeElementRow
              key={el.id}
              el={el}
              selected={selectedElementId === el.id}
              onSelect={() => onSelectElement(el.id)}
            />
          ))}
        </>
      )}

      {/* Empty state */}
      {frames.length === 0 && freeElements.length === 0 && (
        <div style={{ padding: "24px 12px", textAlign: "center" }}>
          <Maximize2 size={20} color="rgba(0,0,0,0.15)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", lineHeight: 1.5 }}>
            Press <kbd style={{ background: "rgba(0,0,0,0.06)", borderRadius: 3, padding: "1px 4px", fontFamily: "ui-monospace,monospace", fontSize: 10 }}>F</kbd> and drag to create a frame
          </p>
        </div>
      )}

    </div>
  );
}
