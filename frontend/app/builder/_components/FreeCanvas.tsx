"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import {
  MousePointer2, Hand, Maximize2, Square, Type, Circle,
  AlignLeft, AlignCenterHorizontal, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  BringToFront, SendToBack, Copy, Clipboard, Trash2,
  Grid3x3, ZoomIn, ZoomOut, Minimize2, Plus, Save, Minus, ArrowRight, Scan, PenLine,
  Hexagon, Star, Image as ImageIcon, ChevronDown,
} from "lucide-react";
import type { ElementNode, FreeLayout, Frame, CanvasTool, CanvasGuide } from "@/types/builder";
import { FRAME_PRESETS } from "@/types/builder";
import FreeElement from "./FreeElement";
import { applyAlignment } from "./AlignToolbar";
import { readFigmaClipboard } from "@/lib/parseFigmaClipboard";
import { promoteElement, PROMOTION_ROLES, type PromotionRole } from "@/lib/promotions";

// ── Constants ──────────────────────────────────────────────────────────────────

const MIN_SCALE  = 0.05;
const MAX_SCALE  = 8;
const RULER_SZ   = 20;
const SNAP_PX    = 5;
const HANDLE_SZ  = 8;
const BRAND      = "#7B6EF5";
const CANVAS_BG  = "#EAEAEA";   // Figma-style light canvas workspace
const GRID_SIZE  = 40;          // dot grid spacing in world px

// ── Exported coordinate helpers (used by Frame.tsx in Phase 3) ────────────────

export function screenToWorld(
  sx: number, sy: number,
  offsetX: number, offsetY: number,
  scale: number
): { x: number; y: number } {
  return { x: (sx - offsetX) / scale, y: (sy - offsetY) / scale };
}

export function worldToScreen(
  wx: number, wy: number,
  offsetX: number, offsetY: number,
  scale: number
): { x: number; y: number } {
  return { x: wx * scale + offsetX, y: wy * scale + offsetY };
}

// ── Types ──────────────────────────────────────────────────────────────────────

type AlignType = "left" | "centerH" | "right" | "top" | "centerV" | "bottom" | "distH" | "distV";
interface SnapGuide { axis: "v" | "h"; pos: number; }
interface CtxMenu   { x: number; y: number; }

export interface FreeCanvasProps {
  elements: ElementNode[];
  selectedId?: string | null;
  selectedIds?: string[];
  onSelect: (id: string, multi: boolean) => void;
  onDeselect: () => void;
  onLayoutChange: (id: string, layout: Partial<FreeLayout>) => void;
  onElementsChange?: (elements: ElementNode[]) => void;
  onAddElement?: (type: string, x: number, y: number, w?: number, h?: number, rotation?: number) => void;
  onAddPen?: (svg: string, x: number, y: number, w: number, h: number) => void;
  onUpdateContent?: (id: string, content: string) => void;
  // Phase 2 — viewport
  onViewportChange?: (zoom: number, panX: number, panY: number) => void;
  // Phase 3 — frames rendered on the canvas
  frames?: Frame[];
  frameChildren?: React.ReactNode;
  onAddFrame?: (x: number, y: number, w: number, h: number) => void;
  // Phase 4 — controlled tool (lifted to builder/page.tsx)
  tool: CanvasTool;
  onToolChange: (t: CanvasTool) => void;
  // Toolbar extras (replaces CanvasToolbar)
  saved?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onNewFrame?: (preset: { label: string; width: number; height: number }) => void;
  // Lets page.tsx wire internal paste as the fallback when no external clipboard data
  onRegisterPaste?: (fn: () => void) => void;
  // Phase 4 — create a reusable component from the selected element
  onCreateComponent?: (el: ElementNode) => void;
  // Round 1 R-12b — open the swap-component picker for an instance
  onSwapComponent?: (el: ElementNode) => void;
  // Round 1 §6.3 — update the master from this instance, push to every sibling instance
  onUpdateMaster?: (el: ElementNode) => void;
  // Phase 1 (docs/BLUEPRINT.md) — persistent ruler guides, dragged off the rulers
  guides?: CanvasGuide[];
  onGuidesChange?: (guides: CanvasGuide[]) => void;
  // Phase 6 (bounded "Responsive Frames") — which breakpoint's style overrides
  // to preview live on the canvas; defaults to "desktop" for backward compat.
  breakpoint?: "desktop" | "tablet" | "mobile";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLayout(el: ElementNode, idx: number) {
  return {
    x: el.layout?.x ?? 20,
    y: el.layout?.y ?? 20 + idx * 120,
    w: el.layout?.width  ?? 400,
    h: el.layout?.height ?? 80,
  };
}

function findInTree(els: ElementNode[], id: string): ElementNode | null {
  for (const el of els) {
    if (el.id === id) return el;
    const f = findInTree(el.children, id);
    if (f) return f;
  }
  return null;
}

function cloneDeep(el: ElementNode, shift = true): ElementNode {
  const id = `el-${crypto.randomUUID().slice(0, 8)}`;
  return {
    ...el, id,
    layout: el.layout && shift
      ? { ...el.layout, x: (el.layout.x ?? 0) + 10, y: (el.layout.y ?? 0) + 10 }
      : el.layout,
    children: el.children.map(c => cloneDeep(c, false)),
  };
}

function computeGuides(dragId: string, dx: number, dy: number, dw: number, dh: number, els: ElementNode[], exclude?: Set<string>): SnapGuide[] {
  const guides: SnapGuide[] = [];
  const d = { l: dx, cx: dx + dw / 2, r: dx + dw, t: dy, cy: dy + dh / 2, b: dy + dh };
  els.filter(e => e.id !== dragId && !e.hidden && !exclude?.has(e.id)).forEach((e, i) => {
    const l = getLayout(e, i);
    const o = { l: l.x, cx: l.x + l.w / 2, r: l.x + l.w, t: l.y, cy: l.y + l.h / 2, b: l.y + l.h };
    (["l","cx","r"] as const).forEach(ok => (["l","cx","r"] as const).forEach(dk => {
      if (Math.abs(d[dk] - o[ok]) < SNAP_PX) guides.push({ axis: "v", pos: o[ok] });
    }));
    (["t","cy","b"] as const).forEach(ok => (["t","cy","b"] as const).forEach(dk => {
      if (Math.abs(d[dk] - o[ok]) < SNAP_PX) guides.push({ axis: "h", pos: o[ok] });
    }));
  });
  return guides;
}

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  const a = [...arr];
  const [item] = a.splice(from, 1);
  a.splice(to, 0, item);
  return a;
}

// ── Ruler ──────────────────────────────────────────────────────────────────────

function Ruler({ orientation, size, scale, offset }: { orientation: "h" | "v"; size: number; scale: number; offset: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#F5F5F5";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "9px monospace";
    const step = scale > 2 ? 10 : scale > 1 ? 25 : scale > 0.5 ? 50 : scale > 0.2 ? 100 : 200;
    const len = orientation === "h" ? W : H;
    const start = Math.floor(-offset / scale / step) * step;
    const end   = start + len / scale + step;
    for (let v = start; v <= end; v += step) {
      const p = Math.round(offset + v * scale);
      if (p < 0 || p > len) continue;
      const isMajor = v % (step * 5) === 0 || step >= 100;
      const tickLen = isMajor ? 10 : 5;
      ctx.beginPath();
      if (orientation === "h") {
        ctx.moveTo(p, H - tickLen); ctx.lineTo(p, H);
        if (isMajor) ctx.fillText(String(v), p + 2, H - tickLen - 2);
      } else {
        ctx.moveTo(W - tickLen, p); ctx.lineTo(W, p);
        if (isMajor) {
          ctx.save();
          ctx.translate(W - tickLen - 1, p - 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(v), 0, 0);
          ctx.restore();
        }
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.beginPath();
    if (orientation === "h") { ctx.moveTo(0, H - 0.5); ctx.lineTo(W, H - 0.5); }
    else                     { ctx.moveTo(W - 0.5, 0); ctx.lineTo(W - 0.5, H); }
    ctx.stroke();
  }, [orientation, size, scale, offset]);

  if (orientation === "h") return <canvas ref={canvasRef} width={2000} height={RULER_SZ} style={{ width: "100%", height: RULER_SZ, display: "block" }} />;
  return <canvas ref={canvasRef} width={RULER_SZ} height={2000} style={{ width: RULER_SZ, height: "100%", display: "block" }} />;
}

// ── Figma-style handle styles ──────────────────────────────────────────────────

// HANDLE_SZ kept for reference; actual sizes computed scale-aware inside component
function makeElementHandles(scale: number) {
  const s = Math.max(6, Math.round(HANDLE_SZ / scale));
  const b = Math.max(1, 1.5 / scale);
  const h: React.CSSProperties = {
    width: s, height: s,
    background: "#ffffff", border: `${b}px solid ${BRAND}`,
    borderRadius: Math.max(1, Math.round(2 / scale)), zIndex: 100,
    boxShadow: `0 ${1/scale}px ${4/scale}px rgba(0,0,0,0.25)`,
  };
  return { top: h, bottom: h, left: h, right: h, topLeft: h, topRight: h, bottomLeft: h, bottomRight: h };
}

// ── Context Menu ───────────────────────────────────────────────────────────────

export function ContextMenu({
  pos, items, onClose,
}: {
  pos: { x: number; y: number };
  items: { label: string; icon?: React.ReactNode; shortcut?: string; danger?: boolean; separator?: boolean; disabled?: boolean; action: () => void }[];
  onClose: () => void;
}) {
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as Element)?.closest("[data-ctx-menu]")) onClose(); };
    setTimeout(() => window.addEventListener("mousedown", close), 0);
    return () => window.removeEventListener("mousedown", close);
  }, [onClose]);

  return createPortal(
    <div data-ctx-menu=""
      style={{
        position: "fixed", top: pos.y, left: pos.x, zIndex: 99999,
        background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8, padding: "4px 0", minWidth: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        userSelect: "none",
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "3px 0" }} />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => { item.action(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "6px 12px",
              background: "none", border: "none", cursor: item.disabled ? "default" : "pointer",
              color: item.danger ? "#f87171" : item.disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)",
              fontSize: 12, fontWeight: 500, textAlign: "left",
            }}
            onMouseEnter={e => { if (!item.disabled) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            {item.icon && <span style={{ opacity: 0.6, display: "flex" }}>{item.icon}</span>}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.shortcut && <span style={{ fontSize: 10, opacity: 0.4, fontFamily: "monospace" }}>{item.shortcut}</span>}
          </button>
        )
      )}
    </div>,
    document.body
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function Sep() {
  return <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 3px", flexShrink: 0 }} />;
}

function TBtn({
  active, onClick, title, children, danger,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? "rgba(123,110,245,0.85)" : "transparent",
      color: danger ? "#f87171" : active ? "#fff" : "rgba(255,255,255,0.5)",
      transition: "all 0.12s",
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FreeCanvas({
  elements, frames = [], selectedId, selectedIds = [], onSelect, onDeselect,
  onLayoutChange, onElementsChange, onAddElement, onAddPen, onUpdateContent,
  onViewportChange, frameChildren, onAddFrame,
  tool, onToolChange,
  saved, saving, onSave, onNewFrame,
  onRegisterPaste, onCreateComponent, onSwapComponent, onUpdateMaster,
  guides: persistedGuides = [], onGuidesChange,
  breakpoint = "desktop",
}: FreeCanvasProps) {

  // ── View state
  const [scale,    setScale]    = useState(0.5);
  const [offset,   setOffset]   = useState({ x: RULER_SZ + 60, y: RULER_SZ + 60 });
  const [showGrid, setShowGrid] = useState(false);
  const [guideDrag, setGuideDrag] = useState<{ axis: "v" | "h"; screenPos: number } | null>(null);
  const [frameMenuOpen, setFrameMenuOpen] = useState(false);
  const frameMenuRef = useRef<HTMLDivElement>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const [lastShape, setLastShape] = useState<CanvasTool>("rect");

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

  useEffect(() => {
    if (!shapeMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShapeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [shapeMenuOpen]);

  // Notify parent of viewport changes so it can persist zoom/pan
  const updateViewport = useCallback((newScale: number, newOffset: { x: number; y: number }) => {
    onViewportChange?.(newScale, newOffset.x, newOffset.y);
  }, [onViewportChange]);

  // ── Interaction
  const [guides,    setGuides]    = useState<SnapGuide[]>([]);
  const [rb,        setRb]        = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [drawShape, setDrawShape] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [elDragInfo, setElDragInfo] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null);

  // ── Pen tool
  const [penPoints,  setPenPoints]  = useState<{x:number;y:number}[]>([]);
  const [penPreview, setPenPreview] = useState<{x:number;y:number}|null>(null);
  const penPointsRef = useRef<{x:number;y:number}[]>([]);
  penPointsRef.current = penPoints;

  // Reset pen state when switching away from pen tool
  useEffect(() => {
    if (tool !== "pen") { setPenPoints([]); setPenPreview(null); }
  }, [tool]);

  // ── Inline text edit
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // ── Context menu
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  // ── Refs
  const containerRef  = useRef<HTMLDivElement>(null);
  const isPanning     = useRef(false);
  const spaceDown     = useRef(false);
  const panStart      = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const rbStartRef    = useRef<{ sx: number; sy: number } | null>(null);
  const drawStartRef  = useRef<{ cx: number; cy: number } | null>(null);
  const snapshotsRef  = useRef<ElementNode[][]>([]);
  const clipboardRef  = useRef<ElementNode[]>([]);
  const altDragRef    = useRef<{ id: string; x: number; y: number } | null>(null);
  // Figma: Alt+click cycles through overlapping elements at the same point, top→bottom
  const altCycleRef   = useRef<{ x: number; y: number; index: number } | null>(null);

  // Figma-style multi-drag: dragging one selected element moves the whole selection
  const multiDragRef  = useRef<{ leadId: string; startX: number; startY: number; bases: Map<string, { x: number; y: number }> } | null>(null);
  const [multiDragDelta, setMultiDragDelta] = useState<{ dx: number; dy: number } | null>(null);
  // Figma-style group resize: one bounding box with handles scales the whole selection
  const groupResizeRef = useRef<{
    anchorX: number; anchorY: number; startW: number; startH: number;
    bases: Map<string, { x: number; y: number; w: number; h: number }>;
  } | null>(null);
  const [groupScale, setGroupScale] = useState<{ sx: number; sy: number } | null>(null);
  // Shift modifier (aspect-locked resize, like Figma)
  const [shiftHeld, setShiftHeld] = useState(false);

  const allSelected = new Set(selectedIds);
  if (selectedId) allSelected.add(selectedId);

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const screenToCanvas = useCallback((cx: number, cy: number) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (cx - r.left - offset.x) / scale, y: (cy - r.top - offset.y) / scale };
  }, [offset, scale]);

  // ── Persistent ruler guides — drag off a ruler to create one ──────────────────
  const startGuideDrag = useCallback((axis: "v" | "h") => (e: React.MouseEvent) => {
    e.preventDefault();
    setGuideDrag({ axis, screenPos: axis === "h" ? e.clientY : e.clientX });
  }, []);

  useEffect(() => {
    if (!guideDrag) return;
    const onMove = (e: MouseEvent) => {
      setGuideDrag((g) => g ? { ...g, screenPos: g.axis === "h" ? e.clientY : e.clientX } : g);
    };
    const onUp = (e: MouseEvent) => {
      const r = containerRef.current?.getBoundingClientRect();
      // Dropping back onto the ruler gutter cancels — didn't actually enter the canvas.
      const droppedInCanvas = r
        ? (guideDrag.axis === "h" ? e.clientY > r.top : e.clientX > r.left)
        : false;
      if (droppedInCanvas) {
        const world = screenToCanvas(e.clientX, e.clientY);
        const pos = guideDrag.axis === "h" ? world.y : world.x;
        const next = [...persistedGuides, { id: `guide-${crypto.randomUUID().slice(0, 8)}`, axis: guideDrag.axis, pos }];
        onGuidesChange?.(next);
      }
      setGuideDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [guideDrag, persistedGuides, onGuidesChange, screenToCanvas]);

  const removeGuide = useCallback((id: string) => {
    onGuidesChange?.(persistedGuides.filter((g) => g.id !== id));
  }, [persistedGuides, onGuidesChange]);

  const fitToScreen = useCallback((frames?: Frame[]) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    if (frames && frames.length > 0) {
      // Fit to bounding box of all frames
      const minX = Math.min(...frames.map(f => f.canvasX));
      const minY = Math.min(...frames.map(f => f.canvasY));
      const maxX = Math.max(...frames.map(f => f.canvasX + f.width));
      const maxY = Math.max(...frames.map(f => f.canvasY + f.height));
      const totalW = maxX - minX;
      const totalH = maxY - minY;
      const ns = Math.min((r.width - 120) / totalW, (r.height - 120) / totalH, 1);
      setScale(ns);
      setOffset({
        x: (r.width  - totalW * ns) / 2 - minX * ns,
        y: (r.height - totalH * ns) / 2 - minY * ns,
      });
    } else {
      // No frames yet — reset to 100% centered
      setScale(0.75);
      setOffset({ x: r.width / 2, y: r.height / 2 });
    }
  }, []);

  // Union bounds of the current selection (world coords)
  const selectionBounds = useCallback(() => {
    const sel = elements.filter((e, i) => allSelected.has(e.id));
    if (!sel.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sel.forEach((el) => {
      const i = elements.indexOf(el);
      const l = getLayout(el, i);
      minX = Math.min(minX, l.x); minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.w); maxY = Math.max(maxY, l.y + l.h);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, [elements, allSelected]);

  // Figma: Shift+2 — zoom to selection
  const zoomToSelection = useCallback(() => {
    const b = selectionBounds();
    if (!b || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const ns = Math.max(MIN_SCALE, Math.min((r.width - 160) / b.w, (r.height - 160) / b.h, 2));
    setScale(ns);
    setOffset({
      x: (r.width  - b.w * ns) / 2 - b.x * ns,
      y: (r.height - b.h * ns) / 2 - b.y * ns,
    });
  }, [selectionBounds]);

  // ── History ───────────────────────────────────────────────────────────────
  const futureRef = useRef<ElementNode[][]>([]);

  const saveSnapshot = useCallback(() => {
    snapshotsRef.current = [...snapshotsRef.current.slice(-49), JSON.parse(JSON.stringify(elements))];
    futureRef.current = []; // a new action invalidates the redo stack
  }, [elements]);

  const undo = useCallback(() => {
    if (!snapshotsRef.current.length) return;
    const prev = snapshotsRef.current.pop()!;
    futureRef.current = [...futureRef.current.slice(-49), JSON.parse(JSON.stringify(elements))];
    onElementsChange?.(prev);
  }, [elements, onElementsChange]);

  const redo = useCallback(() => {
    if (!futureRef.current.length) return;
    const next = futureRef.current.pop()!;
    snapshotsRef.current = [...snapshotsRef.current, JSON.parse(JSON.stringify(elements))];
    onElementsChange?.(next);
  }, [elements, onElementsChange]);

  // ── Clipboard ─────────────────────────────────────────────────────────────
  const copy = useCallback(() => {
    clipboardRef.current = elements.filter(e => allSelected.has(e.id)).map(e => JSON.parse(JSON.stringify(e)));
  }, [elements, allSelected]);

  const paste = useCallback(() => {
    if (!clipboardRef.current.length) return;
    saveSnapshot();
    const dupes = clipboardRef.current.map(e => cloneDeep(e, true));
    onElementsChange?.([...elements, ...dupes]);
    onDeselect();
    if (dupes[0]) onSelect(dupes[0].id, false);
    clipboardRef.current = dupes.map(e => JSON.parse(JSON.stringify(e)));
  }, [elements, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  const pasteInPlace = useCallback(() => {
    if (!clipboardRef.current.length) return;
    saveSnapshot();
    const dupes = clipboardRef.current.map(e => cloneDeep(e, false));
    onElementsChange?.([...elements, ...dupes]);
    onDeselect();
    if (dupes[0]) onSelect(dupes[0].id, false);
  }, [elements, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  // Register internal paste with page.tsx so it can be called as fallback
  const pasteRef = useRef(paste);
  pasteRef.current = paste;
  useEffect(() => {
    onRegisterPaste?.(() => pasteRef.current());
  }, [onRegisterPaste]);

  // ── External paste for context menu (uses navigator.clipboard.read) ────────
  const pasteFromFigma = useCallback(async () => {
    const externalEls = await readFigmaClipboard();
    if (!externalEls?.length) { paste(); return; }
    saveSnapshot();
    const vpCx = containerRef.current?.clientWidth  ?? 800;
    const vpCy = containerRef.current?.clientHeight ?? 600;
    const cx = Math.round((vpCx / 2 - offset.x) / scale);
    const cy = Math.round((vpCy / 2 - offset.y) / scale);
    const offsetEls = externalEls.map((el, i) => ({
      ...el,
      layout: el.layout
        ? { ...el.layout, x: cx + (el.layout.x ?? 0), y: cy + (el.layout.y ?? 0) }
        : { x: cx + i * 16, y: cy + i * 16, width: 200, height: 100 },
    }));
    onElementsChange?.([...elements, ...offsetEls]);
    onDeselect();
    if (offsetEls[0]) onSelect(offsetEls[0].id, false);
  }, [paste, saveSnapshot, elements, onElementsChange, onDeselect, onSelect, offset, scale]);

  const duplicate = useCallback(() => {
    const targets = elements.filter(e => allSelected.has(e.id));
    if (!targets.length) return;
    saveSnapshot();
    const dupes = targets.map(e => cloneDeep(e, true));
    onElementsChange?.([...elements, ...dupes]);
    onDeselect();
    if (dupes[0]) onSelect(dupes[0].id, false);
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  const deleteSelected = useCallback(() => {
    if (!allSelected.size) return;
    saveSnapshot();
    onElementsChange?.(elements.filter(e => !allSelected.has(e.id)));
    onDeselect();
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect]);

  const toggleLock = useCallback(() => {
    if (!allSelected.size) return;
    saveSnapshot();
    const anyUnlocked = Array.from(allSelected).some(id => !elements.find(e => e.id === id)?.locked);
    onElementsChange?.(elements.map(el => allSelected.has(el.id) ? { ...el, locked: anyUnlocked } : el));
  }, [elements, allSelected, saveSnapshot, onElementsChange]);

  const toggleHide = useCallback(() => {
    if (!allSelected.size) return;
    saveSnapshot();
    const anyVisible = Array.from(allSelected).some(id => !elements.find(e => e.id === id)?.hidden);
    onElementsChange?.(elements.map(el => allSelected.has(el.id) ? { ...el, hidden: anyVisible } : el));
    onDeselect();
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect]);

  // ── Group / Ungroup (Figma ⌘G / ⌘⇧G) ─────────────────────────────────────
  const groupSelected = useCallback(() => {
    const targets = elements.filter((e) => allSelected.has(e.id));
    if (targets.length < 2) return;
    saveSnapshot();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targets.forEach((el) => {
      const l = getLayout(el, elements.indexOf(el));
      minX = Math.min(minX, l.x); minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.w); maxY = Math.max(maxY, l.y + l.h);
    });
    const children = targets.map((el) => {
      const l = getLayout(el, elements.indexOf(el));
      const { layout: _drop, ...rest } = el;
      return {
        ...rest,
        styles: {
          ...el.styles,
          desktop: {
            ...el.styles?.desktop,
            position: "absolute" as const,
            left:  `${Math.round(l.x - minX)}px`,
            top:   `${Math.round(l.y - minY)}px`,
            width: `${Math.round(l.w)}px`,
            height:`${Math.round(l.h)}px`,
          },
        },
      } as ElementNode;
    });
    const group: ElementNode = {
      id: `el-${crypto.randomUUID().slice(0, 8)}`,
      tag: "div",
      label: "Group",
      styles: { desktop: {} },
      children,
      layout: {
        x: Math.round(minX), y: Math.round(minY),
        width: Math.round(maxX - minX), height: Math.round(maxY - minY),
        zIndex: Math.max(0, ...targets.map((t) => t.layout?.zIndex ?? 0)),
      },
    };
    onElementsChange?.([...elements.filter((e) => !allSelected.has(e.id)), group]);
    onDeselect();
    onSelect(group.id, false);
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  const ungroupSelected = useCallback(() => {
    const groups = elements.filter((e) => allSelected.has(e.id) && e.children.length > 0 && !e.content);
    if (!groups.length) return;
    saveSnapshot();
    const groupIds = new Set(groups.map((g) => g.id));
    const next: ElementNode[] = [];
    const freedIds: string[] = [];
    elements.forEach((el) => {
      if (!groupIds.has(el.id)) { next.push(el); return; }
      const gl = getLayout(el, elements.indexOf(el));
      el.children.forEach((c) => {
        const d = { ...(c.styles?.desktop ?? {}) } as Record<string, string | number | undefined>;
        const left = parseFloat(String(d.left ?? 0)) || 0;
        const top  = parseFloat(String(d.top  ?? 0)) || 0;
        const w    = parseFloat(String(d.width  ?? "")) || 200;
        const h    = parseFloat(String(d.height ?? "")) || 100;
        delete d.position; delete d.left; delete d.top; delete d.width; delete d.height;
        next.push({
          ...c,
          styles: { ...c.styles, desktop: d as ElementNode["styles"]["desktop"] },
          layout: { x: Math.round(gl.x + left), y: Math.round(gl.y + top), width: Math.round(w), height: Math.round(h) },
        });
        freedIds.push(c.id);
      });
    });
    onElementsChange?.(next);
    onDeselect();
    freedIds.forEach((id, i) => onSelect(id, i > 0));
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  // ── Detach component instance (Round 1 §6.4 — severs the master link) ──────
  const detachSelected = useCallback(() => {
    const id = selectedId ?? Array.from(allSelected)[0];
    const el = id ? elements.find((e) => e.id === id) : null;
    if (!el?.componentId) return;
    if (!confirm(`Detach from "${el.label ?? "component"}"? This element will no longer be linked to the component.`)) return;
    saveSnapshot();
    onElementsChange?.(elements.map((e) => {
      if (e.id !== id) return e;
      const { componentId: _drop, ...rest } = e;
      return rest as ElementNode;
    }));
  }, [elements, allSelected, selectedId, saveSnapshot, onElementsChange]);

  // ── Convert to… (Canvas → Website Intelligence, Blueprint V4.3b) ──────────
  const promoteSelected = useCallback((role: PromotionRole) => {
    const id = selectedId ?? Array.from(allSelected)[0];
    if (!id) return;
    saveSnapshot();
    onElementsChange?.(elements.map((e) => (e.id === id ? promoteElement(e, role) : e)));
  }, [elements, allSelected, selectedId, saveSnapshot, onElementsChange]);

  // ── Auto Layout (Figma ⇧A) — container children leave absolute positioning ──
  const autoLayoutSelected = useCallback(() => {
    const targets = elements.filter((e) => allSelected.has(e.id) && e.children.length > 0);
    if (!targets.length) return false;
    saveSnapshot();
    const targetIds = new Set(targets.map((t) => t.id));
    onElementsChange?.(elements.map((el) => {
      if (!targetIds.has(el.id)) return el;
      const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
      const pos = el.children.map((c) => ({ l: num(c.styles?.desktop?.left), t: num(c.styles?.desktop?.top) }));
      const spreadX = Math.max(...pos.map((p) => p.l)) - Math.min(...pos.map((p) => p.l));
      const spreadY = Math.max(...pos.map((p) => p.t)) - Math.min(...pos.map((p) => p.t));
      const dir: "row" | "column" = spreadX >= spreadY ? "row" : "column";
      // flex order = visual order along the main axis
      const sorted = [...el.children].sort((a, b) =>
        dir === "row"
          ? num(a.styles?.desktop?.left) - num(b.styles?.desktop?.left)
          : num(a.styles?.desktop?.top) - num(b.styles?.desktop?.top)
      );
      const children = sorted.map((c) => {
        const d = { ...(c.styles?.desktop ?? {}) } as Record<string, string | number | undefined>;
        delete d.position; delete d.left; delete d.top;
        return { ...c, styles: { ...c.styles, desktop: d as ElementNode["styles"]["desktop"] } };
      });
      return {
        ...el,
        label: el.label === "Group" ? "Auto layout" : el.label,
        children,
        styles: {
          ...el.styles,
          desktop: {
            ...el.styles?.desktop,
            display: "flex",
            flexDirection: dir,
            gap: el.styles?.desktop.gap ?? "16px",
            padding: el.styles?.desktop.padding ?? "16px",
            alignItems: el.styles?.desktop.alignItems ?? "flex-start",
          },
        },
      };
    }));
    return true;
  }, [elements, allSelected, saveSnapshot, onElementsChange]);

  // ── Z-order ───────────────────────────────────────────────────────────────
  const reorder = useCallback((id: string, op: "front" | "back" | "forward" | "backward") => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx < 0) return;
    saveSnapshot();
    let next = elements;
    if      (op === "front")    next = moveInArray(elements, idx, elements.length - 1);
    else if (op === "back")     next = moveInArray(elements, idx, 0);
    else if (op === "forward")  next = moveInArray(elements, idx, Math.min(idx + 1, elements.length - 1));
    else if (op === "backward") next = moveInArray(elements, idx, Math.max(idx - 1, 0));
    onElementsChange?.(next);
  }, [elements, saveSnapshot, onElementsChange]);

  // ── Align ─────────────────────────────────────────────────────────────────
  const align = useCallback((type: AlignType) => {
    if (allSelected.size < 2) return;
    saveSnapshot();
    onElementsChange?.(applyAlignment(elements, Array.from(allSelected), type));
  }, [elements, allSelected, saveSnapshot, onElementsChange]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inp = ["INPUT", "TEXTAREA"].includes(tag);

      if (e.code === "Space" && !inp) {
        e.preventDefault();
        spaceDown.current = true;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
        return;
      }

      if (e.key === "Shift") setShiftHeld(true);

      if (!inp) {
        // Figma zoom keys: ⇧1 fit · ⇧2 zoom to selection · ⇧0 100%
        if (e.shiftKey && !e.metaKey && !e.ctrlKey) {
          if (e.code === "Digit1") { e.preventDefault(); fitToScreen(frames); return; }
          if (e.code === "Digit2") { e.preventDefault(); zoomToSelection(); return; }
          if (e.code === "Digit0") { e.preventDefault(); setScale(1); return; }
          // Figma ⇧A: add Auto Layout to the selected container (falls through to arrow tool otherwise)
          if (e.code === "KeyA" && !editingId) {
            if (autoLayoutSelected()) { e.preventDefault(); return; }
          }
        }

        // Create Component (⌘⌥K — Figma)
        if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === "KeyK") {
          e.preventDefault();
          const id = selectedId ?? Array.from(allSelected)[0];
          const target = id ? elements.find((el) => el.id === id) : null;
          if (target && onCreateComponent) onCreateComponent(target);
          return;
        }

        // Group / Ungroup (⌘G / ⌘⇧G)
        if ((e.metaKey || e.ctrlKey) && (e.key === "g" || e.key === "G")) {
          e.preventDefault();
          if (e.shiftKey) ungroupSelected(); else groupSelected();
          return;
        }

        // Tool shortcuts
        if (!e.metaKey && !e.ctrlKey) {
          if (e.key === "v" || e.key === "V") { onToolChange("move");    return; }
          if (e.key === "k" || e.key === "K") { onToolChange("scale");   return; }
          if (e.key === "h" || e.key === "H") { onToolChange("hand");    return; }
          if (e.key === "f" || e.key === "F") { onToolChange("frame");   return; }
          if (e.key === "p" || e.key === "P") { onToolChange("pen");     return; }
          if (e.key === "t" || e.key === "T") { onToolChange("text");    return; }
          if (e.key === "r" || e.key === "R") { setLastShape("rect");    onToolChange("rect");    return; }
          if (e.key === "o" || e.key === "O") { setLastShape("ellipse"); onToolChange("ellipse"); return; }
          if (e.key === "l" || e.key === "L") { setLastShape("line");    onToolChange("line");    return; }
          if (e.key === "a" || e.key === "A") { setLastShape("arrow");   onToolChange("arrow");   return; }
          if (e.key === "g" || e.key === "G") { e.preventDefault(); setShowGrid(v => !v); return; }
          if (e.key === "Tab") {
            e.preventDefault();
            const visible = elements.filter(el => !el.hidden && !el.locked);
            if (!visible.length) return;
            const curIdx = visible.findIndex(el => el.id === selectedId);
            const nextIdx = e.shiftKey
              ? (curIdx - 1 + visible.length) % visible.length
              : (curIdx + 1) % visible.length;
            onDeselect();
            onSelect(visible[nextIdx].id, false);
            return;
          }
          if (e.key === "Escape") {
            if (penPointsRef.current.length > 0) { setPenPoints([]); setPenPreview(null); }
            onToolChange("move"); setEditingId(null); onDeselect(); return;
          }
        }

        // Zoom shortcuts
        if (e.metaKey || e.ctrlKey) {
          if (e.key === "0") { e.preventDefault(); fitToScreen(); return; }
          if (e.key === "1") { e.preventDefault(); setScale(1); return; }
          if (e.key === "=" || e.key === "+") {
            e.preventDefault();
            setScale(s => Math.min(MAX_SCALE, parseFloat((s * 1.25).toFixed(3))));
            return;
          }
          if (e.key === "-") {
            e.preventDefault();
            setScale(s => Math.max(MIN_SCALE, parseFloat((s * 0.8).toFixed(3))));
            return;
          }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === "a") {
          e.preventDefault();
          elements.forEach((el, i) => onSelect(el.id, i > 0));
          return;
        }
      }

      if (editingId) return; // let textarea handle its keys

      if (!inp) {
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return; }

        if ((e.metaKey || e.ctrlKey) && e.key === "d")         { e.preventDefault(); duplicate(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === "c")         { e.preventDefault(); copy(); return; }
        // Ctrl/Cmd+V is handled by the document paste event in page.tsx (no preventDefault here)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "v") { e.preventDefault(); e.stopPropagation(); pasteInPlace(); return; }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); toggleLock(); return; }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "h" || e.key === "H")) { e.preventDefault(); toggleHide(); return; }
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
        if ((e.metaKey || e.ctrlKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) { e.preventDefault(); redo(); return; }

        if (e.key === "]" && !e.shiftKey && selectedId) reorder(selectedId, "forward");
        if (e.key === "[" && !e.shiftKey && selectedId) reorder(selectedId, "backward");
        if (e.key === "]" && e.shiftKey  && selectedId) reorder(selectedId, "front");
        if (e.key === "[" && e.shiftKey  && selectedId) reorder(selectedId, "back");

        if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key) && allSelected.size > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
          const dy = e.key === "ArrowDown"  ? step : e.key === "ArrowUp"   ? -step : 0;
          elements.filter(el => allSelected.has(el.id)).forEach(el => {
            const l = el.layout ?? { x: 0, y: 0, width: 400 };
            onLayoutChange(el.id, { x: (l.x ?? 0) + dx, y: (l.y ?? 0) + dy });
          });
        }
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
      if (e.code === "Space") {
        spaceDown.current = false; isPanning.current = false;
        if (containerRef.current)
          containerRef.current.style.cursor = tool === "hand" ? "grab" : tool !== "move" ? "crosshair" : "default";
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [elements, frames, allSelected, selectedId, tool, editingId,
      onDeselect, onSelect, onLayoutChange, onElementsChange,
      deleteSelected, duplicate, copy, paste, pasteInPlace, undo, redo, reorder, fitToScreen,
      toggleLock, toggleHide, groupSelected, ungroupSelected, zoomToSelection, autoLayoutSelected, onCreateComponent]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const f = e.deltaY < 0 ? 1.1 : 0.9;
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        setScale(s => {
          const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * f));
          setOffset(o => {
            const no = { x: mx - (mx - o.x) * (ns / s), y: my - (my - o.y) * (ns / s) };
            updateViewport(ns, no);
            return no;
          });
          return ns;
        });
      } else {
        setOffset(o => {
          const no = { x: o.x - e.deltaX, y: o.y - e.deltaY };
          updateViewport(scale, no);
          return no;
        });
      }
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [scale, updateViewport]);

  // ── Pen path finisher ────────────────────────────────────────────────────
  const finishPenPath = useCallback(() => {
    const pts = penPointsRef.current;
    if (pts.length < 2) { setPenPoints([]); setPenPreview(null); return; }

    const minX = Math.min(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxX = Math.max(...pts.map(p => p.x));
    const maxY = Math.max(...pts.map(p => p.y));
    const pad  = 4;
    const bx   = minX - pad, by = minY - pad;
    const bw   = Math.max(maxX - minX + pad * 2, 4);
    const bh   = Math.max(maxY - minY + pad * 2, 4);

    const pointsStr = pts.map(p => `${p.x - bx},${p.y - by}`).join(" ");
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${bw} ${bh}" preserveAspectRatio="none"><polyline points="${pointsStr}" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    saveSnapshot();
    onAddPen?.(svgStr, Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));

    setPenPoints([]);
    setPenPreview(null);
    onToolChange("move");
  }, [saveSnapshot, onAddPen, onToolChange]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (spaceDown.current || e.button === 1 || tool === "hand") {
      e.preventDefault();
      isPanning.current = true;
      panStart.current  = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
      if (containerRef.current) containerRef.current.style.cursor = "grabbing";
    }
  }, [offset, tool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      setOffset({ x: panStart.current.ox + (e.clientX - panStart.current.mx), y: panStart.current.oy + (e.clientY - panStart.current.my) });
      return;
    }
    if (rbStartRef.current) {
      const r = containerRef.current?.getBoundingClientRect();
      if (r) setRb({ ...rbStartRef.current, ex: e.clientX - r.left, ey: e.clientY - r.top });
      return;
    }
    if (drawStartRef.current) {
      const { x: ex, y: ey } = screenToCanvas(e.clientX, e.clientY);
      const { cx: sx, cy: sy } = drawStartRef.current;
      let dx = ex - sx, dy = ey - sy;
      if (e.shiftKey) {
        // Figma: constrain to a square/circle using the larger delta
        const s = Math.max(Math.abs(dx), Math.abs(dy));
        dx = (dx < 0 ? -1 : 1) * s;
        dy = (dy < 0 ? -1 : 1) * s;
      }
      if (e.altKey) {
        // Figma: draw outward from the center instead of from the corner
        setDrawShape({ x: sx - Math.abs(dx), y: sy - Math.abs(dy), w: Math.abs(dx) * 2, h: Math.abs(dy) * 2 });
      } else {
        setDrawShape({ x: Math.min(sx, sx + dx), y: Math.min(sy, sy + dy), w: Math.abs(dx), h: Math.abs(dy) });
      }
    }
  }, [screenToCanvas]);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      if (containerRef.current)
        containerRef.current.style.cursor = tool === "hand" ? "grab" : tool !== "move" ? "crosshair" : "default";
    }
    if (rbStartRef.current && rb) {
      const x1 = (Math.min(rb.sx, rb.ex) - offset.x) / scale;
      const y1 = (Math.min(rb.sy, rb.ey) - offset.y) / scale;
      const x2 = (Math.max(rb.sx, rb.ex) - offset.x) / scale;
      const y2 = (Math.max(rb.sy, rb.ey) - offset.y) / scale;
      if (x2 - x1 > 8 && y2 - y1 > 8) {
        elements.forEach((el, i) => {
          if (el.hidden || el.locked) return;
          const l = getLayout(el, i);
          if (l.x >= x1 && l.x + l.w <= x2 && l.y >= y1 && l.y + l.h <= y2) onSelect(el.id, true);
        });
      }
      rbStartRef.current = null; setRb(null);
    }
    if (drawStartRef.current && drawShape && tool === "text") {
      // Text: small drag or click → default size; large drag → use drag width
      const isClick = drawShape.w < 10 && drawShape.h < 10;
      saveSnapshot();
      if (isClick) {
        onAddElement?.("heading", Math.round(drawStartRef.current.cx), Math.round(drawStartRef.current.cy));
      } else {
        onAddElement?.("heading", Math.round(drawShape.x), Math.round(drawShape.y), Math.round(drawShape.w), 80);
      }
      onToolChange("move");
      drawStartRef.current = null; setDrawShape(null);
      return;
    }
    if (drawStartRef.current && drawShape && drawShape.w > 5 && drawShape.h > 5) {
      if (tool === "frame") {
        // Frames are handled by the parent — not stored in elements[]
        onAddFrame?.(Math.round(drawShape.x), Math.round(drawShape.y), Math.round(drawShape.w), Math.round(drawShape.h));
      } else if (tool === "line" || tool === "arrow") {
        // For line/arrow, compute start/end points for angle + distance
        const sx = drawStartRef.current.cx;
        const sy = drawStartRef.current.cy;
        const ex = sx === drawShape.x ? sx + drawShape.w : sx - drawShape.w;
        const ey = sy === drawShape.y ? sy + drawShape.h : sy - drawShape.h;
        const dist = Math.round(Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2));
        const angle = Math.round(Math.atan2(ey - sy, ex - sx) * 180 / Math.PI);
        saveSnapshot();
        onAddElement?.(tool === "line" ? "line" : "arrow",
          Math.round(sx), Math.round(sy), dist, 2, angle);
      } else {
        const typeMap: Record<string, string> = {
          rect: "rect", ellipse: "ellipse",
          line: "line", arrow: "arrow",
          polygon: "polygon", star: "star", image: "image",
          frame: "div", move: "div", hand: "div", scale: "div", pen: "div",
        };
        saveSnapshot();
        onAddElement?.(typeMap[tool] ?? "div",
          Math.round(drawShape.x), Math.round(drawShape.y),
          Math.round(drawShape.w), Math.round(drawShape.h));
      }
      onToolChange("move");
    }
    drawStartRef.current = null; setDrawShape(null);
  }, [rb, drawShape, tool, elements, offset, scale, onSelect, onAddElement, saveSnapshot]);

  const handleArtboardMouseDown = useCallback((e: React.MouseEvent) => {
    if (spaceDown.current || e.button !== 0) return;
    if (tool === "move") {
      // Only deselect / start rubber-band when clicking the bare artboard (not a child element)
      if (e.target !== e.currentTarget) return;
      onDeselect();
      const r = containerRef.current?.getBoundingClientRect();
      if (r) { const sx = e.clientX - r.left, sy = e.clientY - r.top; rbStartRef.current = { sx, sy }; setRb({ sx, sy, ex: sx, ey: sy }); }
    } else if (tool === "text") {
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      // Start draw — if user releases without dragging, we create default-sized text
      drawStartRef.current = { cx: x, cy: y };
      setDrawShape({ x, y, w: 0, h: 0 });
    } else if (tool === "pen") {
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setPenPoints(prev => [...prev, { x: Math.round(x), y: Math.round(y) }]);
    } else if (tool !== "hand" && tool !== "scale") {
      // rect / ellipse / frame / polygon / star / image — drag-to-draw
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      drawStartRef.current = { cx: x, cy: y };
      setDrawShape({ x, y, w: 0, h: 0 });
    }
  }, [tool, onDeselect, screenToCanvas, onAddElement, saveSnapshot, onToolChange]);

  // ── Text editing ──────────────────────────────────────────────────────────
  const commitEdit = useCallback(() => {
    if (editingId) onUpdateContent?.(editingId, editingText);
    setEditingId(null); setEditingText("");
  }, [editingId, editingText, onUpdateContent]);

  // ── Drag-drop from panel ──────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const type = e.dataTransfer.getData("text/plain");
    if (!type || !onAddElement) return;
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    saveSnapshot();
    onAddElement(type, Math.max(0, Math.round((e.clientX - r.left - offset.x) / scale)), Math.max(0, Math.round((e.clientY - r.top - offset.y) / scale)));
  }, [onAddElement, offset, scale, saveSnapshot]);

  // ── Context menu items ────────────────────────────────────────────────────
  const ctxItems = (() => {
    const hasSelection = allSelected.size > 0;
    const hasClipboard = clipboardRef.current.length > 0;
    const firstId = selectedId ?? Array.from(allSelected)[0];
    const anyLocked = Array.from(allSelected).some(id => elements.find(e => e.id === id)?.locked);
    const anyHidden = Array.from(allSelected).some(id => elements.find(e => e.id === id)?.hidden);
    return [
      { label: "Copy",            icon: <Copy size={12}/>,      shortcut: "⌘C",      disabled: !hasSelection,  action: copy },
      { label: "Paste",           icon: <Clipboard size={12}/>, shortcut: "⌘V",                                action: pasteFromFigma },
      { label: "Paste in Place",                                 shortcut: "⌘⇧V",    disabled: !hasClipboard,  action: pasteInPlace },
      { label: "Duplicate",       icon: <Copy size={12}/>,      shortcut: "⌘D",      disabled: !hasSelection,  action: duplicate },
      { separator: true, label: "", action: () => {} },
      { label: "Group Selection", shortcut: "⌘G",  disabled: allSelected.size < 2, action: groupSelected },
      { label: "Ungroup",         shortcut: "⌘⇧G", disabled: !elements.some((e) => allSelected.has(e.id) && e.children.length > 0 && !e.content), action: ungroupSelected },
      { label: "Add Auto Layout", shortcut: "⇧A",  disabled: !elements.some((e) => allSelected.has(e.id) && e.children.length > 0), action: () => autoLayoutSelected() },
      { separator: true, label: "", action: () => {} },
      // Canvas → Website Intelligence: promote drawn objects to website objects
      ...PROMOTION_ROLES.map(({ role, label }) => ({
        label, disabled: allSelected.size !== 1, action: () => promoteSelected(role),
      })),
      { label: "Create Component", shortcut: "⌘⌥K", disabled: allSelected.size !== 1 || !onCreateComponent, action: () => {
        const id = selectedId ?? Array.from(allSelected)[0];
        const target = id ? elements.find((el) => el.id === id) : null;
        if (target) onCreateComponent?.(target);
      } },
      // Instance actions (Round 1 §6 — order: Edit master · Swap · Reset overrides · Detach)
      ...(() => {
        const id = selectedId ?? Array.from(allSelected)[0];
        const el = id ? elements.find((e) => e.id === id) : null;
        if (!el?.componentId || allSelected.size !== 1) return [];
        return [
          { label: "Update Master + Push to Instances", disabled: !onUpdateMaster, action: () => onUpdateMaster?.(el) },
          { label: "Swap Component…", disabled: !onSwapComponent, action: () => onSwapComponent?.(el) },
          { label: "Detach Component", action: detachSelected },
        ];
      })(),
      { label: anyLocked ? "Unlock" : "Lock",   shortcut: "⌘⇧L", disabled: !hasSelection, action: toggleLock },
      { label: anyHidden ? "Show"  : "Hide",    shortcut: "⌘⇧H", disabled: !hasSelection, action: toggleHide },
      { separator: true, label: "", action: () => {} },
      { label: "Bring to Front",  icon: <BringToFront size={12}/>, shortcut: "⇧]", disabled: !hasSelection, action: () => firstId && reorder(firstId, "front") },
      { label: "Bring Forward",                                     shortcut: "]",  disabled: !hasSelection, action: () => firstId && reorder(firstId, "forward") },
      { label: "Send Backward",                                     shortcut: "[",  disabled: !hasSelection, action: () => firstId && reorder(firstId, "backward") },
      { label: "Send to Back",    icon: <SendToBack size={12}/>,   shortcut: "⇧[", disabled: !hasSelection, action: () => firstId && reorder(firstId, "back") },
      { separator: true, label: "", action: () => {} },
      { label: "Delete", icon: <Trash2 size={12}/>, shortcut: "⌫", disabled: !hasSelection, danger: true, action: deleteSelected },
    ];
  })();

  const cursorStyle = tool === "hand" ? "grab" : tool === "pen" ? "crosshair" : tool !== "move" && tool !== "scale" ? "crosshair" : "default";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: CANVAS_BG }}>

      {/* ══ Canvas + Rulers ══ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Top ruler row */}
        <div style={{ display: "flex", flexShrink: 0 }}>
          <div style={{ width: RULER_SZ, height: RULER_SZ, background: "#F5F5F5", flexShrink: 0, borderRight: "1px solid rgba(0,0,0,0.08)", borderBottom: "1px solid rgba(0,0,0,0.08)" }} />
          <div
            style={{ flex: 1, overflow: "hidden", borderBottom: "1px solid rgba(0,0,0,0.08)", cursor: "ns-resize" }}
            onMouseDown={startGuideDrag("h")}
            title="Drag down to add a horizontal guide"
          >
            <Ruler orientation="h" size={RULER_SZ} scale={scale} offset={offset.x - RULER_SZ} />
          </div>
        </div>

        {/* Left ruler + Canvas */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div
            style={{ width: RULER_SZ, flexShrink: 0, overflow: "hidden", borderRight: "1px solid rgba(0,0,0,0.08)", cursor: "ew-resize" }}
            onMouseDown={startGuideDrag("v")}
            title="Drag right to add a vertical guide"
          >
            <Ruler orientation="v" size={RULER_SZ} scale={scale} offset={offset.y - RULER_SZ} />
          </div>

          {/* Main canvas area */}
          <div
            ref={containerRef}
            tabIndex={-1}
            style={{ flex: 1, position: "relative", overflow: "hidden", cursor: cursorStyle, userSelect: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
          >
            {/* Infinite dot grid — CSS bg so it pans/zooms with no DOM cost */}
            {showGrid && (
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px)",
                backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
                backgroundPosition: `${offset.x % (GRID_SIZE * scale)}px ${offset.y % (GRID_SIZE * scale)}px`,
              }} />
            )}

            {/* Transform — infinite canvas world space */}
            <div
              style={{ position: "absolute", transformOrigin: "0 0", transform: `translate(${offset.x}px,${offset.y}px) scale(${scale})` }}
              onClickCapture={e => {
                // Figma: Alt+click cycles through overlapping elements top→bottom.
                // Runs after the topmost element's own onMouseDown already selected it
                // normally — this only overrides that pick when cycling applies. Uses
                // "click" (not mousedown) so a genuine Alt+drag-duplicate is unaffected.
                if (!e.altKey || tool !== "move") return;
                const { x, y } = screenToCanvas(e.clientX, e.clientY);
                const hits = elements
                  .map((el, i) => ({ el, l: getLayout(el, i), i }))
                  .filter(({ el, l }) => !el.hidden && !el.locked && x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h)
                  .sort((a, b) => (b.el.layout?.zIndex ?? b.i) - (a.el.layout?.zIndex ?? a.i)); // topmost first
                if (!hits.length) return;
                e.preventDefault(); e.stopPropagation();
                const prev = altCycleRef.current;
                const samePoint = prev && Math.abs(prev.x - x) < 4 / scale && Math.abs(prev.y - y) < 4 / scale;
                const index = samePoint ? (prev!.index + 1) % hits.length : 0;
                altCycleRef.current = { x, y, index };
                onSelect(hits[index].el.id, (e as unknown as MouseEvent).shiftKey);
              }}
              onMouseDown={handleArtboardMouseDown}
              onMouseMove={e => {
                if (tool === "pen") {
                  const { x, y } = screenToCanvas(e.clientX, e.clientY);
                  setPenPreview({ x: Math.round(x), y: Math.round(y) });
                }
              }}
              onDoubleClick={e => {
                if (tool === "pen" && penPointsRef.current.length >= 2) {
                  e.stopPropagation();
                  finishPenPath();
                }
              }}
            >
              {/* Phase 3 — frames rendered here via frameChildren prop */}
              {frameChildren}

              {/* Free elements (not inside a frame) */}
              {elements.map((el, idx) => {
                  if (el.hidden) return null;
                  const base = getLayout(el, idx);
                  const sel  = allSelected.has(el.id);
                  // Figma multi-drag: non-lead selected elements follow the lead's delta live
                  const isLead = multiDragRef.current?.leadId === el.id;
                  let l = base;
                  if (sel && multiDragDelta && !isLead) {
                    l = { ...base, x: base.x + multiDragDelta.dx, y: base.y + multiDragDelta.dy };
                  }
                  // Figma group resize: selection scales around the anchor while a handle is dragged
                  if (sel && groupScale && groupResizeRef.current) {
                    const g = groupResizeRef.current;
                    l = {
                      x: g.anchorX + (base.x - g.anchorX) * groupScale.sx,
                      y: g.anchorY + (base.y - g.anchorY) * groupScale.sy,
                      w: Math.max(4, base.w * groupScale.sx),
                      h: Math.max(4, base.h * groupScale.sy),
                    };
                  }
                  const elHandleStyles = makeElementHandles(scale);
                  const isElDragging = elDragInfo?.id === el.id;
                  return (
                    <Rnd
                      key={el.id}
                      position={{ x: l.x, y: l.y }}
                      size={{ width: l.w, height: l.h }}
                      scale={scale}
                      style={{ zIndex: sel ? 1000 : (el.layout?.zIndex ?? idx + 1), cursor: el.locked ? "not-allowed" : sel ? "move" : "pointer", opacity: el.locked ? 0.6 : 1 }}
                      enableResizing={sel && !el.locked && allSelected.size === 1 && (tool === "move" || tool === "scale")}
                      lockAspectRatio={tool === "scale" || shiftHeld || !!el.layout?.aspectLocked}
                      disableDragging={el.locked || (tool !== "move" && tool !== "scale")}
                      handleStyles={elHandleStyles}
                      onMouseDown={e => {
                        if (tool !== "move" || el.locked) return;
                        e.stopPropagation();
                        onSelect(el.id, (e as unknown as MouseEvent).shiftKey);
                      }}
                      onDoubleClick={(e: React.MouseEvent) => {
                        if (el.locked || el.children.length > 0) return; // containers/groups have no inline text edit
                        e.stopPropagation();
                        const t = findInTree(elements, el.id);
                        if (t) { setEditingId(el.id); setEditingText(t.content ?? ""); }
                      }}
                      onDragStart={(e) => {
                        saveSnapshot();
                        setElDragInfo({ id: el.id, x: base.x, y: base.y, w: base.w, h: base.h });
                        if (sel && allSelected.size > 1) {
                          // Figma: dragging one selected element moves the whole selection
                          const bases = new Map<string, { x: number; y: number }>();
                          elements.forEach((o, i2) => {
                            if (allSelected.has(o.id) && !o.locked) {
                              const ol = getLayout(o, i2);
                              bases.set(o.id, { x: ol.x, y: ol.y });
                            }
                          });
                          multiDragRef.current = { leadId: el.id, startX: base.x, startY: base.y, bases };
                        } else if ((e as unknown as MouseEvent).altKey) {
                          altDragRef.current = { id: el.id, x: base.x, y: base.y };
                        }
                      }}
                      onDrag={(_e, d) => {
                        if (multiDragRef.current?.leadId === el.id) {
                          setMultiDragDelta({ dx: d.x - multiDragRef.current.startX, dy: d.y - multiDragRef.current.startY });
                          setGuides(computeGuides(el.id, d.x, d.y, base.w, base.h, elements, allSelected));
                        } else {
                          setGuides(computeGuides(el.id, d.x, d.y, base.w, base.h, elements));
                        }
                        setElDragInfo({ id: el.id, x: Math.round(d.x), y: Math.round(d.y), w: base.w, h: base.h });
                      }}
                      onDragStop={(_e, d) => {
                        setGuides([]); setElDragInfo(null);
                        const m = multiDragRef.current;
                        if (m && m.leadId === el.id) {
                          const dx = Math.round(d.x - m.startX);
                          const dy = Math.round(d.y - m.startY);
                          multiDragRef.current = null;
                          setMultiDragDelta(null);
                          m.bases.forEach((b, id) => onLayoutChange(id, { x: b.x + dx, y: b.y + dy }));
                          return;
                        }
                        const newX = Math.round(d.x);
                        const newY = Math.round(d.y);
                        if (altDragRef.current && altDragRef.current.id === el.id) {
                          const orig = altDragRef.current;
                          altDragRef.current = null;
                          const clone = cloneDeep(el, false);
                          clone.layout = { ...(clone.layout ?? { width: base.w, height: base.h }), x: orig.x, y: orig.y };
                          onElementsChange?.([...elements, clone]);
                        }
                        onLayoutChange(el.id, { x: newX, y: newY });
                      }}
                      onResizeStart={() => {
                        saveSnapshot();
                        setElDragInfo({ id: el.id, x: l.x, y: l.y, w: l.w, h: l.h });
                      }}
                      onResize={(_e, _dir, ref, _delta, pos) => {
                        setElDragInfo({ id: el.id, x: Math.round(pos.x), y: Math.round(pos.y), w: Math.round(ref.offsetWidth), h: Math.round(ref.offsetHeight) });
                      }}
                      onResizeStop={(_e, _dir, ref, _delta, pos) => {
                        setElDragInfo(null);
                        onLayoutChange(el.id, { x: Math.round(pos.x), y: Math.round(pos.y), width: Math.round(ref.offsetWidth), height: Math.round(ref.offsetHeight) });
                      }}
                      className={sel ? "outline-none" : ""}
                    >
                      {/* Hover outline for unselected */}
                      {!sel && <div className="absolute inset-0 hover:outline hover:outline-1 hover:outline-[#5B45D4]/40" style={{ pointerEvents: "none" }} />}
                      {/* Lock indicator */}
                      {el.locked && <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(123,110,245,0.06) 4px, rgba(123,110,245,0.06) 8px)", pointerEvents: "none", zIndex: 98 }} />}
                      {/* Selection border — scale-invariant */}
                      {sel && <div style={{ position: "absolute", inset: 0, border: `${1.5/scale}px solid ${BRAND}`, pointerEvents: "none", zIndex: 99 }} />}
                      {/* Selection label chip */}
                      {sel && allSelected.size === 1 && !isElDragging && (
                        <div style={{
                          position: "absolute", top: `${-20/scale}px`, left: 0,
                          background: BRAND, color: "#fff",
                          fontSize: `${10/scale}px`, fontWeight: 600, fontFamily: "ui-sans-serif,system-ui,sans-serif",
                          padding: `${2/scale}px ${6/scale}px`, borderRadius: `${4/scale}px`,
                          pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap", lineHeight: 1.4,
                          maxWidth: `${180/scale}px`, overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {el.componentId ? "◆ " : ""}{el.tag}{el.label ? ` · ${el.label}` : ""}
                          {el.locked ? " 🔒" : ""}
                        </div>
                      )}
                      {/* Live drag/resize label */}
                      {isElDragging && elDragInfo && (
                        <div style={{
                          position: "absolute", bottom: `${-22/scale}px`, left: 0,
                          background: BRAND, color: "#fff",
                          fontSize: `${11/scale}px`, fontWeight: 600, fontFamily: "ui-monospace,monospace",
                          padding: `${2/scale}px ${6/scale}px`, borderRadius: `${4/scale}px`,
                          pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap", lineHeight: 1.4,
                        }}>
                          {elDragInfo.x}, {elDragInfo.y} — {elDragInfo.w} × {elDragInfo.h}
                        </div>
                      )}

                      {editingId === el.id ? (
                        <textarea
                          autoFocus
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => { if (e.key === "Escape") { setEditingId(null); setEditingText(""); } e.stopPropagation(); }}
                          style={{
                            position: "absolute", inset: 0, width: "100%", height: "100%",
                            padding: "8px 12px", resize: "none", border: "none",
                            background: "rgba(255,255,255,0.97)", fontSize: "inherit",
                            fontFamily: "inherit", outline: `2px solid ${BRAND}`,
                            zIndex: 10001, borderRadius: 0, boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <>
                          <FreeElement element={el} breakpoint={breakpoint} />
                          {el.attrs?.["data-arrow"] === "true" && (
                            <svg
                              style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 10, height: 10, overflow: "visible" }}
                              viewBox="0 0 10 10"
                            >
                              <polygon points="0,0 10,5 0,10" fill={(el.styles?.desktop?.backgroundColor as string) || "#000000"} />
                            </svg>
                          )}
                        </>
                      )}
                    </Rnd>
                  );
                })}

                {/* ── Rotation handle for free element (single selection) ── */}
                {(() => {
                  if (allSelected.size !== 1 || tool !== "move") return null;
                  const selId = selectedId ?? Array.from(allSelected)[0];
                  const selEl = elements.find(e => e.id === selId);
                  if (!selEl) return null;
                  const idx = elements.indexOf(selEl);
                  const l = getLayout(selEl, idx);
                  const ARM = 28 / scale;
                  const R = 5.5 / scale;
                  const cx = l.x + l.w / 2;
                  const handleY = l.y - ARM;
                  return (
                    <React.Fragment key={`rot-${selId}`}>
                      {/* Stem */}
                      <div style={{
                        position: "absolute",
                        left: cx - 0.5 / scale, top: handleY,
                        width: 1 / scale, height: ARM,
                        background: BRAND, opacity: 0.5,
                        pointerEvents: "none", zIndex: 290,
                      }} />
                      {/* Handle */}
                      <div
                        style={{
                          position: "absolute",
                          left: cx - R, top: handleY - R,
                          width: R * 2, height: R * 2,
                          borderRadius: "50%",
                          background: "#fff",
                          border: `${1.5 / scale}px solid ${BRAND}`,
                          cursor: "crosshair", zIndex: 300,
                          boxShadow: `0 ${1/scale}px ${4/scale}px rgba(0,0,0,0.25)`,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const ecx = l.x + l.w / 2;
                          const ecy = l.y + l.h / 2;
                          const onMove = (me: MouseEvent) => {
                            const r = containerRef.current?.getBoundingClientRect();
                            if (!r) return;
                            const mx = (me.clientX - r.left - offset.x) / scale;
                            const my = (me.clientY - r.top - offset.y) / scale;
                            let deg = Math.round(Math.atan2(mx - ecx, -(my - ecy)) * (180 / Math.PI));
                            if (me.shiftKey) deg = Math.round(deg / 15) * 15; // Figma: ⇧ snaps to 15°
                            const existing = (selEl.styles?.desktop?.transform ?? "") as string;
                            const withoutRotate = existing.replace(/rotate\([^)]*\)/g, "").trim();
                            const newTransform = deg === 0 ? withoutRotate : `${withoutRotate} rotate(${deg}deg)`.trim();
                            onElementsChange?.(elements.map(el =>
                              el.id !== selId ? el : {
                                ...el,
                                styles: { ...el.styles, desktop: { ...el.styles?.desktop, transform: newTransform || undefined } },
                              }
                            ));
                          };
                          const onUp = () => {
                            document.removeEventListener("mousemove", onMove);
                            document.removeEventListener("mouseup", onUp);
                          };
                          document.addEventListener("mousemove", onMove);
                          document.addEventListener("mouseup", onUp);
                        }}
                      />
                    </React.Fragment>
                  );
                })()}

                {/* ── Figma: unified multi-select bounding box + group resize handles ── */}
                {allSelected.size > 1 && tool === "move" && (() => {
                  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                  elements.forEach((o, i) => {
                    if (!allSelected.has(o.id) || o.hidden) return;
                    const bl = getLayout(o, i);
                    let x = bl.x, y = bl.y, w = bl.w, h = bl.h;
                    if (multiDragDelta && multiDragRef.current && multiDragRef.current.leadId !== o.id) {
                      x += multiDragDelta.dx; y += multiDragDelta.dy;
                    }
                    if (groupScale && groupResizeRef.current) {
                      const g = groupResizeRef.current;
                      x = g.anchorX + (x - g.anchorX) * groupScale.sx;
                      y = g.anchorY + (y - g.anchorY) * groupScale.sy;
                      w *= groupScale.sx; h *= groupScale.sy;
                    }
                    minX = Math.min(minX, x); minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
                  });
                  if (minX === Infinity) return null;
                  const b = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
                  const HS = 9 / scale;

                  const startGroupResize = (corner: "nw" | "ne" | "sw" | "se") => (e: React.MouseEvent) => {
                    e.preventDefault(); e.stopPropagation();
                    saveSnapshot();
                    const anchorX = corner.includes("w") ? b.x + b.w : b.x;
                    const anchorY = corner.includes("n") ? b.y + b.h : b.y;
                    const bases = new Map<string, { x: number; y: number; w: number; h: number }>();
                    elements.forEach((o, i) => {
                      if (allSelected.has(o.id) && !o.locked) {
                        const bl = getLayout(o, i);
                        bases.set(o.id, { x: bl.x, y: bl.y, w: bl.w, h: bl.h });
                      }
                    });
                    groupResizeRef.current = { anchorX, anchorY, startW: b.w, startH: b.h, bases };

                    const scaleFromEvent = (me: MouseEvent) => {
                      const r = containerRef.current?.getBoundingClientRect();
                      if (!r) return { sx: 1, sy: 1 };
                      const wx = (me.clientX - r.left - offset.x) / scale;
                      const wy = (me.clientY - r.top - offset.y) / scale;
                      let sx = Math.max(0.05, Math.abs(wx - anchorX) / b.w);
                      let sy = Math.max(0.05, Math.abs(wy - anchorY) / b.h);
                      if (me.shiftKey) { const s = Math.max(sx, sy); sx = s; sy = s; }
                      return { sx, sy };
                    };
                    const onMove = (me: MouseEvent) => setGroupScale(scaleFromEvent(me));
                    const onUp = (me: MouseEvent) => {
                      document.removeEventListener("mousemove", onMove);
                      document.removeEventListener("mouseup", onUp);
                      const g = groupResizeRef.current;
                      const { sx, sy } = scaleFromEvent(me);
                      groupResizeRef.current = null;
                      setGroupScale(null);
                      if (!g) return;
                      onElementsChange?.(elements.map((o) => {
                        const bl = g.bases.get(o.id);
                        if (!bl) return o;
                        return {
                          ...o,
                          layout: {
                            ...(o.layout ?? {}),
                            x: Math.round(anchorX + (bl.x - anchorX) * sx),
                            y: Math.round(anchorY + (bl.y - anchorY) * sy),
                            width:  Math.max(4, Math.round(bl.w * sx)),
                            height: Math.max(4, Math.round(bl.h * sy)),
                          },
                        };
                      }));
                    };
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                  };

                  return (
                    <React.Fragment key="group-bbox">
                      <div style={{
                        position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h,
                        border: `${1.5 / scale}px dashed ${BRAND}`,
                        pointerEvents: "none", zIndex: 2000,
                      }} />
                      {(["nw", "ne", "sw", "se"] as const).map((c) => (
                        <div key={c} onMouseDown={startGroupResize(c)} style={{
                          position: "absolute",
                          left: c.includes("w") ? b.x - HS / 2 : b.x + b.w - HS / 2,
                          top:  c.includes("n") ? b.y - HS / 2 : b.y + b.h - HS / 2,
                          width: HS, height: HS,
                          background: "#fff", border: `${1.5 / scale}px solid ${BRAND}`,
                          borderRadius: 2 / scale,
                          cursor: c === "nw" || c === "se" ? "nwse-resize" : "nesw-resize",
                          zIndex: 2001,
                          boxShadow: `0 ${1 / scale}px ${4 / scale}px rgba(0,0,0,0.25)`,
                        }} />
                      ))}
                    </React.Fragment>
                  );
                })()}

                {/* Draw preview */}
                {drawShape && drawShape.w > 2 && drawShape.h > 2 && (
                  tool === "text" ? (
                    <div style={{
                      position: "absolute", left: drawShape.x, top: drawShape.y,
                      width: drawShape.w, height: Math.max(drawShape.h, 40),
                      border: `${1.5 / scale}px dashed ${BRAND}`,
                      background: "rgba(91,69,212,0.04)",
                      pointerEvents: "none", zIndex: 9999,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: `${12/scale}px`, color: BRAND, fontWeight: 700, opacity: 0.6 }}>T</span>
                    </div>
                  ) : tool === "line" || tool === "arrow" ? (
                    <div style={{
                      position: "absolute",
                      left: drawShape.x + drawShape.w / 2,
                      top: drawShape.y + drawShape.h / 2,
                      pointerEvents: "none", zIndex: 9999,
                    }}>
                      <svg width={drawShape.w} height={drawShape.h} style={{ display: "block" }}>
                        <line x1={0} y1={drawShape.h} x2={drawShape.w} y2={0}
                          stroke={BRAND} strokeWidth={2 / scale} strokeDasharray={`${4 / scale} ${2 / scale}`}
                        />
                        {tool === "arrow" && (
                          <polygon points={`${drawShape.w},${0} ${drawShape.w - 8 / scale},${-4 / scale} ${drawShape.w - 8 / scale},${4 / scale}`}
                            fill={BRAND} stroke="none"
                          />
                        )}
                      </svg>
                    </div>
                  ) : (
                    <div style={{
                      position: "absolute", left: drawShape.x, top: drawShape.y,
                      width: drawShape.w, height: drawShape.h,
                      border: `${1.5 / scale}px dashed ${BRAND}`,
                      background: "rgba(91,69,212,0.06)",
                      borderRadius: tool === "ellipse" ? "50%" : 0,
                      clipPath: tool === "polygon"
                        ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                        : tool === "star"
                        ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                        : undefined,
                      pointerEvents: "none", zIndex: 9999,
                    }}>
                      <div style={{
                        position: "absolute", top: `${4 / scale}px`, left: `${4 / scale}px`,
                        background: BRAND, color: "#fff",
                        fontSize: `${10 / scale}px`, fontWeight: 700,
                        fontFamily: "ui-monospace,monospace",
                        padding: `${1 / scale}px ${6 / scale}px`,
                        borderRadius: `${3 / scale}px`, pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}>
                        {Math.round(drawShape.w)} × {Math.round(drawShape.h)}
                      </div>
                    </div>
                  )
                )}

                {/* ── Pen tool preview ── */}
                {tool === "pen" && penPoints.length > 0 && (() => {
                  const allPts = penPreview ? [...penPoints, penPreview] : penPoints;
                  const xs = allPts.map(p => p.x);
                  const ys = allPts.map(p => p.y);
                  const bx = Math.min(...xs) - 4;
                  const by = Math.min(...ys) - 4;
                  const bw = Math.max(...xs) - bx + 4;
                  const bh = Math.max(...ys) - by + 4;
                  const pts = allPts.map(p => `${p.x - bx},${p.y - by}`).join(" ");
                  return (
                    <svg
                      key="pen-preview"
                      style={{ position: "absolute", left: bx, top: by, width: bw, height: bh, overflow: "visible", pointerEvents: "none", zIndex: 9999 }}
                      viewBox={`0 0 ${bw} ${bh}`}
                    >
                      <polyline points={pts} stroke={BRAND} strokeWidth={2 / scale} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={penPreview ? `${4/scale} ${2/scale}` : undefined} />
                      {penPoints.map((p, i) => (
                        <circle key={i} cx={p.x - bx} cy={p.y - by} r={3 / scale} fill={BRAND} />
                      ))}
                    </svg>
                  );
                })()}

                {/* Snap guides */}
                {guides.map((g, i) =>
                  g.axis === "v"
                    ? <div key={i} style={{ position: "absolute", left: g.pos, top: 0, bottom: 0, width: 1, background: BRAND, pointerEvents: "none", zIndex: 9999 }} />
                    : <div key={i} style={{ position: "absolute", top: g.pos, left: 0, right: 0, height: 1, background: BRAND, pointerEvents: "none", zIndex: 9999 }} />
                )}

                {/* Persistent ruler guides (Phase 1) — double-click to remove */}
                {persistedGuides.map((g) =>
                  g.axis === "v"
                    ? <div key={g.id} onDoubleClick={() => removeGuide(g.id)} title="Double-click to remove guide"
                        style={{ position: "absolute", left: g.pos, top: 0, bottom: 0, width: 1, borderLeft: "1px dashed #06b6d4", pointerEvents: "auto", cursor: "ew-resize", zIndex: 9998 }} />
                    : <div key={g.id} onDoubleClick={() => removeGuide(g.id)} title="Double-click to remove guide"
                        style={{ position: "absolute", top: g.pos, left: 0, right: 0, height: 1, borderTop: "1px dashed #06b6d4", pointerEvents: "auto", cursor: "ns-resize", zIndex: 9998 }} />
                )}
            </div>

            {/* Live preview while dragging a new guide off a ruler */}
            {guideDrag && (() => {
              const r = containerRef.current?.getBoundingClientRect();
              if (!r) return null;
              return guideDrag.axis === "h"
                ? <div style={{ position: "absolute", left: 0, right: 0, top: guideDrag.screenPos - r.top, height: 0, borderTop: "1px dashed #06b6d4", pointerEvents: "none", zIndex: 9999 }} />
                : <div style={{ position: "absolute", top: 0, bottom: 0, left: guideDrag.screenPos - r.left, width: 0, borderLeft: "1px dashed #06b6d4", pointerEvents: "none", zIndex: 9999 }} />;
            })()}

            {/* Rubber-band */}
            {rb && (
              <div style={{
                position: "absolute",
                left: Math.min(rb.sx, rb.ex), top: Math.min(rb.sy, rb.ey),
                width: Math.abs(rb.ex - rb.sx), height: Math.abs(rb.ey - rb.sy),
                border: `1.5px solid ${BRAND}`, background: "rgba(91,69,212,0.08)",
                pointerEvents: "none", zIndex: 9999,
              }} />
            )}

            {/* Drop overlay */}
            {isDragOver && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 9997, pointerEvents: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(91,69,212,0.08)", border: `2px dashed ${BRAND}`,
              }}>
                <p style={{ color: "rgba(0,0,0,0.5)", fontSize: 14, fontWeight: 600 }}>Drop to place</p>
              </div>
            )}

            {/* Empty state — only when no frames and no free elements */}
            {elements.length === 0 && frames.length === 0 && !isDragOver && (
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "rgba(0,0,0,0.22)", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Design your page</p>
                  <p style={{ color: "rgba(0,0,0,0.14)", fontSize: 12 }}>Press F and drag to create a frame · Use tools below</p>
                </div>
                <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
                  {([
                    { t: "frame"   as CanvasTool, label: "F", name: "Frame",     hint: "Sections & containers" },
                    { t: "pen"     as CanvasTool, label: "P", name: "Pen",       hint: "Draw free paths"       },
                    { t: "rect"    as CanvasTool, label: "R", name: "Rectangle", hint: "Box, card or shape"    },
                    { t: "ellipse" as CanvasTool, label: "O", name: "Ellipse",   hint: "Circle or oval shape"  },
                    { t: "text"    as CanvasTool, label: "T", name: "Text",      hint: "Click or drag to add"  },
                  ]).map(({ t, label, name, hint }) => (
                    <button key={t} onClick={() => onToolChange(t)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "14px 18px", borderRadius: 10,
                      border: `1.5px solid ${tool === t ? BRAND : "rgba(0,0,0,0.1)"}`,
                      background: tool === t ? "rgba(91,69,212,0.1)" : "rgba(0,0,0,0.02)",
                      color: tool === t ? BRAND : "rgba(0,0,0,0.4)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{name}</span>
                      <span style={{ fontSize: 9, opacity: 0.55 }}>{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Floating bottom toolbar (Figma-style) ── */}
            <div style={{
              position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
              background: "#1e1e1e",
              borderRadius: 12, padding: "4px 8px",
              display: "flex", alignItems: "center", gap: 2,
              boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.07)",
              zIndex: 1000, userSelect: "none", pointerEvents: "auto", whiteSpace: "nowrap",
            }}>


              {/* ── Tools — Figma-style layout ── */}
              {/* Group 1: Move / Scale */}
              <TBtn active={tool === "move"}  onClick={() => onToolChange("move")}  title="Move  V"><MousePointer2 size={15}/></TBtn>
              <TBtn active={tool === "scale"} onClick={() => onToolChange("scale")} title="Scale  K"><Scan size={15}/></TBtn>
              <Sep />
              {/* Group 2: Frame */}
              <TBtn active={tool === "frame"} onClick={() => onToolChange("frame")} title="Frame  F"><Maximize2 size={15}/></TBtn>
              <Sep />
              {/* Group 3: Pen */}
              <TBtn active={tool === "pen"} onClick={() => onToolChange("pen")} title="Pen  P"><PenLine size={15}/></TBtn>
              <Sep />
              {/* Group 4: Text */}
              <TBtn active={tool === "text"} onClick={() => onToolChange("text")} title="Text  T"><Type size={15}/></TBtn>
              <Sep />
              {/* Group 5: Shape picker dropdown (Figma-style) */}
              {(() => {
                const SHAPES: { t: CanvasTool; icon: React.ReactNode; label: string; key: string }[] = [
                  { t: "rect",    icon: <Square size={14}/>,      label: "Rectangle", key: "R" },
                  { t: "ellipse", icon: <Circle size={14}/>,      label: "Ellipse",   key: "O" },
                  { t: "line",    icon: <Minus size={14}/>,       label: "Line",      key: "L" },
                  { t: "arrow",   icon: <ArrowRight size={14}/>,  label: "Arrow",     key: "A" },
                  { t: "polygon", icon: <Hexagon size={14}/>,     label: "Polygon",   key: "" },
                  { t: "star",    icon: <Star size={14}/>,        label: "Star",      key: "" },
                  { t: "image",   icon: <ImageIcon size={14}/>,   label: "Image",     key: "" },
                ];
                const activeShape = SHAPES.find(s => s.t === tool);
                const displayShape = activeShape ?? SHAPES.find(s => s.t === lastShape) ?? SHAPES[0];
                const isShapeActive = !!activeShape;
                return (
                  <div ref={shapeMenuRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        if (isShapeActive) {
                          setShapeMenuOpen(o => !o);
                        } else {
                          onToolChange(lastShape);
                        }
                      }}
                      title={`${displayShape.label}${displayShape.key ? `  ${displayShape.key}` : ""}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 1,
                        height: 30, padding: "0 6px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: isShapeActive ? "rgba(123,110,245,0.85)" : "transparent",
                        color: isShapeActive ? "#fff" : "rgba(255,255,255,0.5)",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { if (!isShapeActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={e => { if (!isShapeActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {displayShape.icon}
                      <ChevronDown size={10} style={{ marginLeft: 1, opacity: 0.6 }} />
                    </button>
                    {shapeMenuOpen && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                        background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10, padding: "4px 0", minWidth: 160,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.6)", zIndex: 300,
                      }}>
                        {SHAPES.map(s => (
                          <button
                            key={s.t}
                            onClick={() => {
                              setLastShape(s.t);
                              onToolChange(s.t);
                              setShapeMenuOpen(false);
                            }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", padding: "7px 12px", border: "none",
                              background: tool === s.t ? "rgba(123,110,245,0.2)" : "transparent",
                              cursor: "pointer",
                              color: tool === s.t ? "#C4BEFF" : "rgba(255,255,255,0.75)",
                              fontSize: 12, fontWeight: 500,
                            }}
                            onMouseEnter={e => { if (tool !== s.t) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                            onMouseLeave={e => { if (tool !== s.t) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{s.icon}{s.label}</span>
                            {s.key && <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", opacity: 0.4 }}>{s.key}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <Sep />
              {/* Group 6: Hand */}
              <TBtn active={tool === "hand"} onClick={() => onToolChange("hand")} title="Hand  H"><Hand size={15}/></TBtn>
              <Sep />
              <TBtn active={showGrid} onClick={() => setShowGrid(v => !v)} title="Toggle grid  G"><Grid3x3 size={13}/></TBtn>
              <Sep />

              {/* ── Zoom ── */}
              <TBtn onClick={() => setScale(s => Math.max(MIN_SCALE, parseFloat((s * 0.8).toFixed(3))))} title="Zoom out  ⌘−"><ZoomOut size={13}/></TBtn>
              <button onClick={() => setScale(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "ui-monospace,monospace", width: 38, textAlign: "center", padding: 0 }}>{Math.round(scale * 100)}%</button>
              <TBtn onClick={() => setScale(s => Math.min(MAX_SCALE, parseFloat((s * 1.25).toFixed(3))))} title="Zoom in  ⌘+"><ZoomIn size={13}/></TBtn>
              <TBtn onClick={fitToScreen} title="Fit to screen  ⌘0"><Minimize2 size={13}/></TBtn>

              {/* ── Align (multi-select) ── */}
              {allSelected.size >= 2 && (
                <>
                  <Sep />
                  <TBtn onClick={() => align("left")}    title="Align left"><AlignLeft size={12}/></TBtn>
                  <TBtn onClick={() => align("centerH")} title="Center H"><AlignCenterHorizontal size={12}/></TBtn>
                  <TBtn onClick={() => align("right")}   title="Align right"><AlignRight size={12}/></TBtn>
                  <TBtn onClick={() => align("top")}     title="Align top"><AlignStartVertical size={12}/></TBtn>
                  <TBtn onClick={() => align("centerV")} title="Center V"><AlignCenterVertical size={12}/></TBtn>
                  <TBtn onClick={() => align("bottom")}  title="Align bottom"><AlignEndVertical size={12}/></TBtn>
                </>
              )}

              {/* ── Tool hint ── */}
              {tool !== "move" && tool !== "hand" && (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 4, fontFamily: "system-ui" }}>
                  {tool === "text" ? "Click or drag · double-click to edit"
                    : tool === "pen" ? `Click to add points · double-click to finish${penPoints.length > 0 ? ` (${penPoints.length} pts)` : ""}`
                    : tool === "scale" ? "Drag handles to scale proportionally"
                    : "Drag to draw · Esc to cancel"}
                </span>
              )}

              {/* ── New Frame preset dropdown ── */}
              {onNewFrame && (
                <>
                  <Sep />
                  <div ref={frameMenuRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setFrameMenuOpen(o => !o)}
                      title="New Frame"
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(123,110,245,0.4)", background: frameMenuOpen ? "rgba(123,110,245,0.25)" : "rgba(123,110,245,0.12)", color: "#C4BEFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(123,110,245,0.25)"; }}
                      onMouseLeave={e => { if (!frameMenuOpen) (e.currentTarget as HTMLElement).style.background = "rgba(123,110,245,0.12)"; }}
                    >
                      <Plus size={12} /> Frame
                    </button>
                    {frameMenuOpen && (
                      <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 4, minWidth: 170, boxShadow: "0 12px 32px rgba(0,0,0,0.5)", zIndex: 200 }}>
                        <div style={{ padding: "4px 10px 6px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Frame Presets</div>
                        {FRAME_PRESETS.map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => { onNewFrame(preset); setFrameMenuOpen(false); }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <span>{preset.label}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "ui-monospace,monospace" }}>{preset.width}×{preset.height}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Save ── */}
              {onSave && (
                <>
                  <Sep />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: saving ? "#F59E0B" : saved ? "#10B981" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  <button
                    onClick={onSave}
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                  >
                    <Save size={12} /> Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          pos={ctxMenu}
          items={ctxItems}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
