"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Rnd } from "react-rnd";
import type { ElementNode, FreeLayout } from "@/types/builder";
import FreeElement from "./FreeElement";
import { ContextMenu } from "./FreeCanvas";
import { promoteElement, PROMOTION_ROLES, type PromotionRole } from "@/lib/promotions";

// ── Rotation handle ────────────────────────────────────────────────────────────

function RotationHandle({
  layout, scale, elId, elements, onElementsChange,
}: {
  layout: { x: number; y: number; w: number; h: number };
  scale: number;
  elId: string;
  elements: ElementNode[];
  onElementsChange: (els: ElementNode[]) => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const ARM_PX = 28 / scale;
  const R = 5.5 / scale;
  const cx = layout.x + layout.w / 2;
  const handleY = layout.y - ARM_PX;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // walk up to the frame container
    containerRef.current = handleRef.current?.parentElement ?? null;
    const ecx = layout.x + layout.w / 2;
    const ecy = layout.y + layout.h / 2;

    const onMove = (me: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mx = (me.clientX - rect.left) / scale;
      const my = (me.clientY - rect.top) / scale;
      let deg = Math.round(Math.atan2(mx - ecx, -(my - ecy)) * (180 / Math.PI));
      if (me.shiftKey) deg = Math.round(deg / 15) * 15; // Figma: ⇧ snaps to 15°

      onElementsChange(elements.map(el => {
        if (el.id !== elId) return el;
        const existing = (el.styles?.desktop?.transform ?? "") as string;
        // Replace any existing rotate() or set new one
        const withoutRotate = existing.replace(/rotate\([^)]*\)/g, "").trim();
        const newTransform = deg === 0 ? withoutRotate : `${withoutRotate} rotate(${deg}deg)`.trim();
        return {
          ...el,
          styles: { ...el.styles, desktop: { ...el.styles.desktop, transform: newTransform || undefined } },
        };
      }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [layout, scale, elId, elements, onElementsChange]);

  return (
    <>
      {/* Stem line */}
      <div style={{
        position: "absolute",
        left: cx - 0.5 / scale,
        top: handleY,
        width: 1 / scale,
        height: ARM_PX,
        background: BRAND,
        opacity: 0.5,
        pointerEvents: "none",
        zIndex: 290,
      }} />
      {/* Circle */}
      <div
        ref={handleRef}
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          left: cx - R,
          top: handleY - R,
          width: R * 2,
          height: R * 2,
          borderRadius: "50%",
          background: "#fff",
          border: `${1.5 / scale}px solid ${BRAND}`,
          cursor: "crosshair",
          zIndex: 300,
          boxShadow: `0 ${1 / scale}px ${4 / scale}px rgba(0,0,0,0.25)`,
        }}
      />
    </>
  );
}

const BRAND = "#7B6EF5";

// Scale-invariant handle: CSS size = 8/scale so it always appears as ~8 screen px
function makeHandleStyles(scale: number) {
  const s = Math.max(6, Math.round(8 / scale));
  const b = Math.max(1, 1.5 / scale);
  const h: React.CSSProperties = {
    width: s, height: s,
    background: "#ffffff",
    border: `${b}px solid ${BRAND}`,
    borderRadius: Math.max(1, Math.round(2 / scale)),
    zIndex: 300,
    boxShadow: `0 ${1/scale}px ${4/scale}px rgba(0,0,0,0.25)`,
  };
  return { top: h, bottom: h, left: h, right: h, topLeft: h, topRight: h, bottomLeft: h, bottomRight: h };
}

export interface FrameContentProps {
  elements: ElementNode[];
  // multi-select
  selectedIds: string[];
  scale: number;
  layoutMode?: "none" | "horizontal" | "vertical" | "grid";
  gap?: number;
  // Auto-layout padding (individual sides)
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Auto-layout alignment
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  // Grid
  gridColumns?: number;
  onSelect: (id: string, multi: boolean) => void;
  onDeselect: () => void;
  onSelectAll: () => void;
  onLayoutChange: (id: string, layout: Partial<FreeLayout>) => void;
  onElementsChange: (els: ElementNode[]) => void;
  onUpdateContent?: (id: string, content: string) => void;
  onDeleteSelected: () => void;
  onNudge: (dx: number, dy: number) => void;
}

function getLayout(el: ElementNode, idx: number) {
  return {
    x: el.layout?.x ?? 20,
    y: el.layout?.y ?? 20 + idx * 80,
    w: el.layout?.width  ?? 200,
    h: el.layout?.height ?? 60,
  };
}

export default function FrameContent({
  elements, selectedIds, scale,
  layoutMode = "none", gap = 0,
  paddingTop = 0, paddingRight = 0, paddingBottom = 0, paddingLeft = 0,
  justifyContent, alignItems,
  gridColumns = 3,
  onSelect, onDeselect, onSelectAll,
  onLayoutChange, onElementsChange, onUpdateContent,
  onDeleteSelected, onNudge,
}: FrameContentProps) {
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [dragInfo,    setDragInfo]    = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null);
  const [ctxMenu,     setCtxMenu]     = useState<{ x: number; y: number; elId: string } | null>(null);
  const snapshotsRef = useRef<ElementNode[][]>([]);

  const handleStyles = makeHandleStyles(scale);
  const allSelected = new Set(selectedIds);

  // ── Rubber-band selection ──────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [rb, setRb] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const rbStartRef   = useRef<{ sx: number; sy: number } | null>(null);
  const isDraggingRb = useRef(false);

  const saveSnapshot = useCallback(() => {
    snapshotsRef.current = [...snapshotsRef.current.slice(-20), JSON.parse(JSON.stringify(elements))];
  }, [elements]);

  const commitEdit = useCallback(() => {
    if (editingId) onUpdateContent?.(editingId, editingText);
    setEditingId(null); setEditingText("");
  }, [editingId, editingText, onUpdateContent]);

  // ── Group / Ungroup (Figma ⌘G / ⌘⇧G) — parity with FreeCanvas.tsx ──────────
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
            ...el.styles.desktop,
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
    onElementsChange([...elements.filter((e) => !allSelected.has(e.id)), group]);
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
    onElementsChange(next);
    onDeselect();
    freedIds.forEach((id, i) => onSelect(id, i > 0));
  }, [elements, allSelected, saveSnapshot, onElementsChange, onDeselect, onSelect]);

  // ── Auto Layout (Figma ⇧A) — container children leave absolute positioning ──
  const autoLayoutSelected = useCallback(() => {
    const targets = elements.filter((e) => allSelected.has(e.id) && e.children.length > 0);
    if (!targets.length) return false;
    saveSnapshot();
    const targetIds = new Set(targets.map((t) => t.id));
    onElementsChange(elements.map((el) => {
      if (!targetIds.has(el.id)) return el;
      const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
      const pos = el.children.map((c) => ({ l: num(c.styles?.desktop?.left), t: num(c.styles?.desktop?.top) }));
      const spreadX = Math.max(...pos.map((p) => p.l)) - Math.min(...pos.map((p) => p.l));
      const spreadY = Math.max(...pos.map((p) => p.t)) - Math.min(...pos.map((p) => p.t));
      const dir: "row" | "column" = spreadX >= spreadY ? "row" : "column";
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
            ...el.styles.desktop,
            display: "flex",
            flexDirection: dir,
            gap: el.styles.desktop.gap ?? "16px",
            padding: el.styles.desktop.padding ?? "16px",
            alignItems: el.styles.desktop.alignItems ?? "flex-start",
          },
        },
      };
    }));
    return true;
  }, [elements, allSelected, saveSnapshot, onElementsChange]);

  // ── Convert to… (Canvas → Website Intelligence, Blueprint V4.3b) ──────────
  const promoteSelected = useCallback((role: PromotionRole) => {
    const id = selectedIds[0];
    if (!id) return;
    saveSnapshot();
    onElementsChange(elements.map((e) => (e.id === id ? promoteElement(e, role) : e)));
  }, [elements, selectedIds, saveSnapshot, onElementsChange]);

  // ── Keyboard shortcuts (frame-element scope) ───────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA"].includes(tag)) return;

      if (e.key === "Escape") { onDeselect(); return; }
      if ((e.metaKey || e.ctrlKey) && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        if (e.shiftKey) ungroupSelected(); else groupSelected();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") { e.preventDefault(); onSelectAll(); return; }
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.code === "KeyA") { e.preventDefault(); autoLayoutSelected(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onDeleteSelected(); return; }
      // Ctrl/Cmd+V handled by page.tsx paste listener — don't prevent default here

      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown"  ? step : e.key === "ArrowUp"   ? -step : 0;
        onNudge(dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, onDeselect, onSelectAll, onDeleteSelected, onNudge, groupSelected, ungroupSelected, autoLayoutSelected]);

  // ── Rubber-band on frame body empty space ──────────────────────────────────
  const handleBodyMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // only on empty frame space
    if (e.button !== 0) return;
    if (editingId) { commitEdit(); return; }
    onDeselect();
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const sx = (e.clientX - r.left) / scale;
    const sy = (e.clientY - r.top)  / scale;
    rbStartRef.current = { sx, sy };
    isDraggingRb.current = false;
    setRb({ sx, sy, ex: sx, ey: sy });

    const onMove = (me: MouseEvent) => {
      if (!rbStartRef.current) return;
      isDraggingRb.current = true;
      const ex = (me.clientX - r.left) / scale;
      const ey = (me.clientY - r.top)  / scale;
      setRb({ ...rbStartRef.current, ex, ey });
    };
    const onUp = (me: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      if (!rbStartRef.current || !isDraggingRb.current) { rbStartRef.current = null; setRb(null); return; }
      const ex = (me.clientX - r.left) / scale;
      const ey = (me.clientY - r.top)  / scale;
      const rx1 = Math.min(rbStartRef.current.sx, ex);
      const ry1 = Math.min(rbStartRef.current.sy, ey);
      const rx2 = Math.max(rbStartRef.current.sx, ex);
      const ry2 = Math.max(rbStartRef.current.sy, ey);
      if (rx2 - rx1 > 8 && ry2 - ry1 > 8) {
        elements.forEach((el, idx) => {
          if (el.hidden || el.locked) return;
          const l = getLayout(el, idx);
          if (l.x >= rx1 && l.x + l.w <= rx2 && l.y >= ry1 && l.y + l.h <= ry2) {
            onSelect(el.id, true);
          }
        });
      }
      rbStartRef.current = null; isDraggingRb.current = false; setRb(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [elements, scale, editingId, commitEdit, onDeselect, onSelect]);

  // ── Multi-select bounding box ──────────────────────────────────────────────
  const multiBox = (() => {
    if (selectedIds.length < 2) return null;
    const sel = elements.filter((el) => selectedIds.includes(el.id)).map((el) => getLayout(el, elements.indexOf(el)));
    if (!sel.length) return null;
    const minX = Math.min(...sel.map(l => l.x));
    const minY = Math.min(...sel.map(l => l.y));
    const maxX = Math.max(...sel.map(l => l.x + l.w));
    const maxY = Math.max(...sel.map(l => l.y + l.h));
    return { x: minX - 2, y: minY - 2, w: maxX - minX + 4, h: maxY - minY + 4 };
  })();

  if (elements.length === 0) return null;

  // ── Auto-layout (horizontal / vertical / grid) ────────────────────────────
  if (layoutMode === "horizontal" || layoutMode === "vertical" || layoutMode === "grid") {
    // Compute element sizing style
    const elStyle = (el: ElementNode): React.CSSProperties => {
      const wm = el.layout?.widthMode;
      const hm = el.layout?.heightMode;
      return {
        flexShrink: wm === "fill" ? 0 : undefined,
        flexGrow: wm === "fill" ? 1 : undefined,
        flexBasis: wm === "fill" ? 0 : undefined,
        width: wm === "fill" ? undefined : wm === "hug" ? "fit-content" : undefined,
        height: hm === "fill" ? "100%" : hm === "hug" ? "fit-content" : undefined,
      };
    };

    return (
      <div
        style={{
          position: "absolute", inset: 0,
          display: layoutMode === "grid" ? "grid" : "flex",
          flexDirection: layoutMode === "vertical" ? "column" : layoutMode === "horizontal" ? "row" : undefined,
          flexWrap: "wrap",
          gap: gap ?? 0,
          padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
          justifyContent: justifyContent,
          alignItems: alignItems,
          alignContent: alignItems,
          gridTemplateColumns: layoutMode === "grid" ? `repeat(${gridColumns ?? 3}, 1fr)` : undefined,
          boxSizing: "border-box",
          overflow: "hidden auto",
        }}
        onClick={e => { e.stopPropagation(); onDeselect(); }}
      >
        {elements.map(el => {
          const sel = selectedIds.includes(el.id);
          return (
            <div
              key={el.id}
              onClick={e => { e.stopPropagation(); onSelect(el.id, e.shiftKey); }}
              style={{
                outline: sel ? `2px solid ${BRAND}` : "none",
                outlineOffset: 2,
                borderRadius: 2,
                cursor: "pointer",
                ...elStyle(el),
              }}
            >
              <FreeElement element={el} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
      onMouseDown={handleBodyMouseDown}
      onClick={e => e.stopPropagation()}
      onContextMenu={(e) => {
        if (e.target !== e.currentTarget) return; // element-level handler already fired
        e.preventDefault(); e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, elId: "" });
      }}
    >
      {elements.map((el, idx) => {
        const l   = getLayout(el, idx);
        const sel = selectedIds.includes(el.id);
        const singleSel = sel && selectedIds.length === 1;

        const isDragging = dragInfo?.id === el.id;

        return (
          <Rnd
            key={el.id}
            position={{ x: l.x, y: l.y }}
            size={{ width: l.w, height: l.h }}
            scale={scale}
            style={{
              zIndex: sel ? 100 : (el.layout?.zIndex ?? idx + 1),
              cursor: sel ? "move" : "pointer",
              transform: el.layout?.rotation ? `rotate(${el.layout.rotation}deg)` : undefined,
              transformOrigin: el.layout?.rotation ? "0 50%" : undefined,
            }}
            enableResizing={singleSel}
            disableDragging={false}
            handleStyles={handleStyles}
            bounds="parent"
            onMouseDown={(e: MouseEvent) => {
              e.stopPropagation();
              onSelect(el.id, e.shiftKey);
            }}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selectedIds.includes(el.id)) onSelect(el.id, false);
              setCtxMenu({ x: e.clientX, y: e.clientY, elId: el.id });
            }}
            onDoubleClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setEditingId(el.id);
              setEditingText(el.content ?? "");
            }}
            onDragStart={() => {
              saveSnapshot();
              setDragInfo({ id: el.id, x: l.x, y: l.y, w: l.w, h: l.h });
            }}
            onDrag={(_e: unknown, d: { x: number; y: number }) => {
              setDragInfo({ id: el.id, x: Math.round(d.x), y: Math.round(d.y), w: l.w, h: l.h });
            }}
            onDragStop={(_e: unknown, d: { x: number; y: number }) => {
              setDragInfo(null);
              onLayoutChange(el.id, { x: Math.round(d.x), y: Math.round(d.y) });
            }}
            onResizeStart={() => {
              saveSnapshot();
              setDragInfo({ id: el.id, x: l.x, y: l.y, w: l.w, h: l.h });
            }}
            onResize={(_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, pos: { x: number; y: number }) => {
              setDragInfo({ id: el.id, x: Math.round(pos.x), y: Math.round(pos.y), w: Math.round(ref.offsetWidth), h: Math.round(ref.offsetHeight) });
            }}
            onResizeStop={(_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, pos: { x: number; y: number }) => {
              setDragInfo(null);
              onLayoutChange(el.id, {
                x: Math.round(pos.x), y: Math.round(pos.y),
                width: Math.round(ref.offsetWidth), height: Math.round(ref.offsetHeight),
              });
            }}
            className={sel ? "outline-none" : ""}
          >
            {/* Hover outline for unselected */}
            {!sel && (
              <div className="absolute inset-0 hover:outline hover:outline-1 hover:outline-[#7B6EF5]/50" style={{ pointerEvents: "none" }} />
            )}
            {/* Selection border — single select */}
            {singleSel && (
              <div style={{ position: "absolute", inset: 0, border: `${1.5/scale}px solid ${BRAND}`, pointerEvents: "none", zIndex: 99 }} />
            )}
            {/* Multi-select dim border */}
            {sel && !singleSel && (
              <div style={{ position: "absolute", inset: 0, border: `${1/scale}px solid rgba(123,110,245,0.5)`, pointerEvents: "none", zIndex: 99 }} />
            )}
            {/* Live dimension/position label while dragging or resizing */}
            {isDragging && dragInfo && (
              <div style={{
                position: "absolute", bottom: `${-22/scale}px`, left: 0,
                background: BRAND, color: "#fff",
                fontSize: `${11/scale}px`, fontWeight: 600, fontFamily: "ui-monospace,monospace",
                padding: `${2/scale}px ${6/scale}px`, borderRadius: `${4/scale}px`,
                pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap",
                lineHeight: 1.4,
              }}>
                {dragInfo.x}, {dragInfo.y} — {dragInfo.w} × {dragInfo.h}
              </div>
            )}

            {editingId === el.id ? (
              <textarea
                autoFocus
                value={editingText}
                onChange={e => setEditingText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => {
                  if (e.key === "Escape") { setEditingId(null); setEditingText(""); }
                  e.stopPropagation();
                }}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  padding: "6px 10px", resize: "none", border: "none",
                  background: "rgba(255,255,255,0.97)", fontSize: "inherit",
                  fontFamily: "inherit", outline: `2px solid ${BRAND}`,
                  zIndex: 10001, borderRadius: 0, boxSizing: "border-box",
                }}
              />
            ) : (
              <div style={{
                width: el.layout?.widthMode === "hug" ? "fit-content" : el.layout?.widthMode === "fill" ? "100%" : undefined,
                height: el.layout?.heightMode === "hug" ? "fit-content" : el.layout?.heightMode === "fill" ? "100%" : undefined,
                minWidth: 0, minHeight: 0,
              }}>
                <FreeElement element={el} />
                {el.attrs?.["data-arrow"] === "true" && (
                  <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 10, height: 10 }} viewBox="0 0 10 10">
                    <polygon points="0,0 10,5 0,10" fill={el.styles?.desktop?.backgroundColor || "#000000"} />
                  </svg>
                )}
              </div>
            )}
          </Rnd>
        );
      })}

      {/* ── Rotation handle (single selection only) ── */}
      {(() => {
        if (selectedIds.length !== 1) return null;
        const selEl = elements.find(e => e.id === selectedIds[0]);
        if (!selEl) return null;
        const idx = elements.indexOf(selEl);
        const l = getLayout(selEl, idx);
        return (
          <RotationHandle
            layout={l}
            scale={scale}
            elId={selEl.id}
            elements={elements}
            onElementsChange={onElementsChange}
          />
        );
      })()}

      {/* ── Multi-select bounding box ── */}
      {multiBox && (
        <div style={{
          position: "absolute",
          left: multiBox.x, top: multiBox.y,
          width: multiBox.w, height: multiBox.h,
          border: `1.5px solid ${BRAND}`,
          boxShadow: `0 0 0 1px rgba(123,110,245,0.15)`,
          pointerEvents: "none", zIndex: 201,
        }} />
      )}

      {/* ── Rubber-band overlay ── */}
      {rb && isDraggingRb.current && (
        <div style={{
          position: "absolute",
          left: Math.min(rb.sx, rb.ex), top: Math.min(rb.sy, rb.ey),
          width: Math.abs(rb.ex - rb.sx), height: Math.abs(rb.ey - rb.sy),
          border: `1.5px solid ${BRAND}`, background: "rgba(123,110,245,0.06)",
          pointerEvents: "none", zIndex: 9999,
        }} />
      )}

      {/* ── Context menu — Group/Ungroup/Auto Layout/Convert to… (parity with FreeCanvas) ── */}
      {ctxMenu && (() => {
        const el = elements.find((e) => e.id === ctxMenu.elId);
        const hasGroupTarget = elements.some((e) => allSelected.has(e.id) && e.children.length > 0 && !e.content);
        const hasAutoLayoutTarget = elements.some((e) => allSelected.has(e.id) && e.children.length > 0);
        return (
          <ContextMenu
            pos={{ x: ctxMenu.x, y: ctxMenu.y }}
            onClose={() => setCtxMenu(null)}
            items={[
              { label: "Group Selection", shortcut: "⌘G",  disabled: allSelected.size < 2, action: groupSelected },
              { label: "Ungroup",         shortcut: "⌘⇧G", disabled: !hasGroupTarget, action: ungroupSelected },
              { label: "Add Auto Layout", shortcut: "⇧A",  disabled: !hasAutoLayoutTarget, action: () => autoLayoutSelected() },
              { separator: true, label: "", action: () => {} },
              ...PROMOTION_ROLES.map(({ role, label }) => ({
                label, disabled: !el || selectedIds.length !== 1, action: () => promoteSelected(role),
              })),
              { separator: true, label: "", action: () => {} },
              { label: "Delete", danger: true, action: onDeleteSelected },
            ]}
          />
        );
      })()}
    </div>
  );
}
