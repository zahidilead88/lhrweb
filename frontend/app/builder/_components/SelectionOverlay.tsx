"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | "move";

export interface ElemBounds {
  id: string;
  x: number; y: number;
  width: number; height: number;
  cssPosition: string;
  cssTop: string; cssLeft: string;
}

const SZ = 8;

const HANDLES: { dir: Exclude<Dir, "move">; tp: 0 | 0.5 | 1; lp: 0 | 0.5 | 1; cursor: string }[] = [
  { dir: "nw", tp: 0,   lp: 0,   cursor: "nw-resize" },
  { dir: "n",  tp: 0,   lp: 0.5, cursor: "n-resize"  },
  { dir: "ne", tp: 0,   lp: 1,   cursor: "ne-resize" },
  { dir: "e",  tp: 0.5, lp: 1,   cursor: "e-resize"  },
  { dir: "se", tp: 1,   lp: 1,   cursor: "se-resize" },
  { dir: "s",  tp: 1,   lp: 0.5, cursor: "s-resize"  },
  { dir: "sw", tp: 1,   lp: 0,   cursor: "sw-resize" },
  { dir: "w",  tp: 0.5, lp: 0,   cursor: "w-resize"  },
];

export default function SelectionOverlay({
  bounds,
  iframeLeft,
  iframeTop,
  onCommitResize,
  onCommitMove,
}: {
  bounds: ElemBounds;
  iframeLeft: number;
  iframeTop: number;
  onCommitResize: (id: string, w: string, h: string) => void;
  onCommitMove: (id: string, position: string, top: string, left: string) => void;
}) {
  const absLeft = iframeLeft + bounds.x;
  const absTop  = iframeTop  + bounds.y;

  const dragRef = useRef<{
    dir: Dir;
    sx: number; sy: number;
    sl: number; st: number;
    sw: number; sh: number;
    cl: number; ct: number; cw: number; ch: number;
  } | null>(null);

  const [local, setLocal] = useState<{ l: number; t: number; w: number; h: number } | null>(null);

  // Reset local dragged position whenever the real bounds change
  useEffect(() => { setLocal(null); }, [bounds]);

  const dl = local?.l ?? absLeft;
  const dt = local?.t ?? absTop;
  const dw = local?.w ?? bounds.width;
  const dh = local?.h ?? bounds.height;

  function startDrag(dir: Dir, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const init = {
      dir, sx: e.clientX, sy: e.clientY,
      sl: absLeft, st: absTop,
      sw: bounds.width, sh: bounds.height,
      cl: absLeft, ct: absTop, cw: bounds.width, ch: bounds.height,
    };
    dragRef.current = init;
    setLocal({ l: absLeft, t: absTop, w: bounds.width, h: bounds.height });

    // Block iframe from stealing mouse events during drag
    document.querySelectorAll("iframe").forEach((f) => {
      (f as HTMLElement).style.pointerEvents = "none";
    });

    function onMov(ev: MouseEvent) {
      const d = dragRef.current!;
      const dx = ev.clientX - d.sx;
      const dy = ev.clientY - d.sy;
      const MIN_W = 20, MIN_H = 10;
      let l = d.sl, t = d.st, w = d.sw, h = d.sh;
      switch (d.dir) {
        case "move": l = d.sl + dx; t = d.st + dy; break;
        case "se":   w = Math.max(MIN_W, d.sw + dx); h = Math.max(MIN_H, d.sh + dy); break;
        case "sw":   l = d.sl + dx; w = Math.max(MIN_W, d.sw - dx); h = Math.max(MIN_H, d.sh + dy); break;
        case "ne":   t = d.st + dy; w = Math.max(MIN_W, d.sw + dx); h = Math.max(MIN_H, d.sh - dy); break;
        case "nw":   l = d.sl + dx; t = d.st + dy; w = Math.max(MIN_W, d.sw - dx); h = Math.max(MIN_H, d.sh - dy); break;
        case "e":    w = Math.max(MIN_W, d.sw + dx); break;
        case "w":    l = d.sl + dx; w = Math.max(MIN_W, d.sw - dx); break;
        case "s":    h = Math.max(MIN_H, d.sh + dy); break;
        case "n":    t = d.st + dy; h = Math.max(MIN_H, d.sh - dy); break;
      }
      d.cl = l; d.ct = t; d.cw = w; d.ch = h;
      setLocal({ l, t, w, h });
    }

    function onUp() {
      const d = dragRef.current;
      if (!d) return;
      const deltaL = Math.round(d.cl - d.sl);
      const deltaT = Math.round(d.ct - d.st);
      const newW   = Math.round(d.cw);
      const newH   = Math.round(d.ch);

      if (d.dir === "move") {
        const curT = bounds.cssTop  ? (parseInt(bounds.cssTop)  || 0) : 0;
        const curL = bounds.cssLeft ? (parseInt(bounds.cssLeft) || 0) : 0;
        const pos  = bounds.cssPosition === "static" ? "relative" : bounds.cssPosition;
        onCommitMove(bounds.id, pos, (curT + deltaT) + "px", (curL + deltaL) + "px");
      } else {
        if (newW !== Math.round(bounds.width) || newH !== Math.round(bounds.height)) {
          onCommitResize(bounds.id, newW + "px", newH + "px");
        }
        const shiftsOrigin = ["nw", "ne", "sw", "n", "w"].includes(d.dir);
        if (shiftsOrigin && (deltaL !== 0 || deltaT !== 0)) {
          const curT = bounds.cssTop  ? (parseInt(bounds.cssTop)  || 0) : 0;
          const curL = bounds.cssLeft ? (parseInt(bounds.cssLeft) || 0) : 0;
          const pos  = bounds.cssPosition === "static" ? "relative" : bounds.cssPosition;
          onCommitMove(bounds.id, pos, (curT + deltaT) + "px", (curL + deltaL) + "px");
        }
      }

      document.querySelectorAll("iframe").forEach((f) => {
        (f as HTMLElement).style.pointerEvents = "";
      });
      dragRef.current = null;
      setLocal(null);
      document.removeEventListener("mousemove", onMov);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMov);
    document.addEventListener("mouseup", onUp);
  }

  const moveZoneInset = Math.min(SZ, Math.min(dw, dh) / 4);

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: dl,
        top: dt,
        width: dw,
        height: dh,
        pointerEvents: "none",
        zIndex: 10000,
      }}
    >
      {/* Selection border */}
      <div style={{ position: "absolute", inset: 0, border: "1.5px solid #6344d4", pointerEvents: "none" }} />

      {/* Dimension badge */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          marginBottom: 4,
          background: "#6344d4",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "ui-monospace, monospace",
          padding: "2px 7px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          lineHeight: 1.6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {Math.round(dw)} × {Math.round(dh)}
      </div>

      {/* Move zone (center) */}
      <div
        style={{
          position: "absolute",
          inset: moveZoneInset,
          cursor: "move",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => startDrag("move", e)}
        title="Drag to move"
      />

      {/* 8 resize handles */}
      {HANDLES.map(({ dir, tp, lp, cursor }) => {
        const hTop  = tp  === 0 ? -SZ / 2 : tp  === 1 ? dh - SZ / 2 : dh / 2 - SZ / 2;
        const hLeft = lp  === 0 ? -SZ / 2 : lp  === 1 ? dw - SZ / 2 : dw / 2 - SZ / 2;
        return (
          <div
            key={dir}
            onMouseDown={(e) => startDrag(dir, e)}
            style={{
              position: "absolute",
              top: hTop,
              left: hLeft,
              width: SZ,
              height: SZ,
              background: "#fff",
              border: "1.5px solid #6344d4",
              borderRadius: 2,
              cursor,
              pointerEvents: "auto",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
          />
        );
      })}
    </div>,
    document.body
  );
}
