"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ── Color math ─────────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const i = Math.floor(h / 60) % 6;
  const table: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ];
  return table[i];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0.0001) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max < 0.0001 ? 0 : d / max, max];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");
}

// ── Presets ────────────────────────────────────────────────────────────────────

const PRESETS = [
  "#7B6EF5","#EF4444","#F59E0B","#10B981","#3B82F6","#EC4899",
  "#000000","#374151","#6B7280","#D1D5DB","#F3F4F6","#ffffff",
];

// ── Recent colors (session-wide, shared across all picker instances) ──────────

const recentColors: string[] = [];
function pushRecent(hex: string) {
  const i = recentColors.indexOf(hex);
  if (i !== -1) recentColors.splice(i, 1);
  recentColors.unshift(hex);
  if (recentColors.length > 8) recentColors.pop();
}

// EyeDropper API (Chromium) — typed loosely, hidden where unsupported
interface EyeDropperAPI { open: () => Promise<{ sRGBHex: string }> }

// ── Component ──────────────────────────────────────────────────────────────────

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchor: DOMRect;
  /** project token colors shown as "Your colors" (Figma-style saved swatches) */
  tokenColors?: { name: string; value: string }[];
}

export default function ColorPicker({ value, onChange, onClose, anchor, tokenColors }: ColorPickerProps) {
  const initRgb = hexToRgb(value) ?? [123, 110, 245];
  const [hsv, setHsv] = useState<[number, number, number]>(() => rgbToHsv(...initRgb as [number, number, number]));
  const [hexStr, setHexStr] = useState(() => (value || "#7B6EF5").replace("#", "").toUpperCase());

  const sbRef        = useRef<HTMLDivElement>(null);
  const pickerRef    = useRef<HTMLDivElement>(null);
  const draggingSb   = useRef(false);

  const [h, s, v] = hsv;
  const hueRgb = hsvToRgb(h, 1, 1).map(c => Math.round(c * 255));
  const hueColor = `rgb(${hueRgb[0]},${hueRgb[1]},${hueRgb[2]})`;
  const currentHex = rgbToHex(...(hsvToRgb(h, s, v).map(c => Math.round(c * 255)) as [number, number, number]));

  // Position: below anchor, flip up if needed
  const PW = 244;
  const spaceBelow = window.innerHeight - anchor.bottom;
  const top = spaceBelow > 330 ? anchor.bottom + 6 : anchor.top - 310 - 6;
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - PW - 8));

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener("mousedown", onDown), 10);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", onDown); };
  }, [onClose]);

  const emit = useCallback((nh: number, ns: number, nv: number) => {
    const rgb = hsvToRgb(nh, ns, nv).map(c => Math.round(c * 255)) as [number, number, number];
    const hex = rgbToHex(...rgb);
    setHexStr(hex.replace("#", "").toUpperCase());
    pushRecent(hex);
    onChange(hex);
  }, [onChange]);

  const applyHex = useCallback((c: string) => {
    const rgb = hexToRgb(c);
    if (!rgb) return;
    setHsv(rgbToHsv(...rgb));
    setHexStr(c.replace("#", "").toUpperCase());
    pushRecent(c.toLowerCase());
    onChange(c.toLowerCase());
  }, [onChange]);

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  const pickFromScreen = useCallback(async () => {
    try {
      const Ctor = (window as unknown as { EyeDropper: new () => EyeDropperAPI }).EyeDropper;
      const result = await new Ctor().open();
      applyHex(result.sRGBHex);
    } catch { /* user cancelled */ }
  }, [applyHex]);

  // SB gradient drag
  const handleSbMove = useCallback((cx: number, cy: number) => {
    if (!sbRef.current) return;
    const r = sbRef.current.getBoundingClientRect();
    const ns = Math.max(0, Math.min(1, (cx - r.left) / r.width));
    const nv = Math.max(0, Math.min(1, 1 - (cy - r.top) / r.height));
    setHsv([h, ns, nv]);
    emit(h, ns, nv);
  }, [h, emit]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (draggingSb.current) handleSbMove(e.clientX, e.clientY); };
    const onUp   = () => { draggingSb.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [handleSbMove]);

  if (typeof document === "undefined") return null;

  const sbCursorX = `${s * 100}%`;
  const sbCursorY = `${(1 - v) * 100}%`;

  return createPortal(
    <div
      ref={pickerRef}
      style={{
        position: "fixed", top, left, width: PW, zIndex: 99999,
        background: "#1c1c1e",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        userSelect: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* SB gradient canvas */}
      <div
        ref={sbRef}
        style={{
          height: 160, position: "relative",
          cursor: "crosshair",
          borderRadius: "11px 11px 0 0",
          overflow: "hidden",
          background: hueColor,
        }}
        onMouseDown={e => {
          e.preventDefault();
          draggingSb.current = true;
          handleSbMove(e.clientX, e.clientY);
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #fff, transparent)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, #000)" }} />
        {/* Cursor */}
        <div style={{
          position: "absolute",
          left: sbCursorX,
          top: sbCursorY,
          transform: "translate(-50%, -50%)",
          width: 14, height: 14,
          borderRadius: "50%",
          border: "2.5px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.15)",
          pointerEvents: "none",
        }} />
      </div>

      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        {/* Swatch + Eyedropper + Hue row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Current color swatch */}
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: currentHex,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
          }} />
          {/* Eyedropper (Chromium only) */}
          {hasEyeDropper && (
            <button
              onClick={pickFromScreen}
              title="Pick color from screen"
              style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, padding: 0,
              }}
            >
              💧
            </button>
          )}
          {/* Hue slider */}
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="range" min={0} max={359} step={0.5} value={Math.round(h)}
              onChange={e => {
                const nh = Number(e.target.value);
                setHsv([nh, s, v]);
                emit(nh, s, v);
              }}
              style={{ width: "100%", height: 14, cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Hex + R G B row */}
        <div style={{ display: "flex", gap: 4 }}>
          {/* Hex */}
          <div style={{
            flex: 2, display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.07)", borderRadius: 7, padding: "5px 8px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, flexShrink: 0 }}>#</span>
            <input
              type="text" value={hexStr} maxLength={6}
              onChange={e => {
                const raw = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "");
                setHexStr(raw);
                if (raw.length === 6) {
                  const rgb = hexToRgb("#" + raw);
                  if (rgb) {
                    const newHsv = rgbToHsv(...rgb);
                    setHsv(newHsv);
                    onChange("#" + raw.toLowerCase());
                  }
                }
              }}
              style={{
                flex: 1, background: "none", border: "none", color: "#fff",
                fontSize: 11, fontWeight: 600, outline: "none",
                fontFamily: "ui-monospace, Menlo, monospace",
                letterSpacing: "0.04em", minWidth: 0,
              }}
            />
          </div>

          {/* R G B */}
          {(["R", "G", "B"] as const).map((ch, i) => {
            const rgb = hsvToRgb(h, s, v).map(c => Math.round(c * 255));
            return (
              <div key={ch} style={{
                flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 7,
                padding: "4px 6px", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", fontWeight: 700, marginBottom: 1 }}>{ch}</span>
                <input
                  type="number" min={0} max={255} value={rgb[i]}
                  onChange={e => {
                    const newRgb = rgb.slice() as [number, number, number];
                    newRgb[i] = Math.max(0, Math.min(255, Number(e.target.value)));
                    const newHsv = rgbToHsv(...newRgb);
                    setHsv(newHsv);
                    emit(...newHsv);
                  }}
                  style={{
                    width: "100%", background: "none", border: "none", color: "#fff",
                    fontSize: 10, fontWeight: 500, outline: "none",
                    fontFamily: "ui-monospace, monospace", textAlign: "center", padding: 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Your colors (project tokens) */}
        {tokenColors && tokenColors.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Your colors</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {tokenColors.slice(0, 12).map(t => (
                <button key={t.name} title={`${t.name} · ${t.value}`} onClick={() => applyHex(t.value)}
                  style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: t.value, cursor: "pointer",
                    outline: currentHex.toLowerCase() === t.value.toLowerCase() ? "2px solid #7B6EF5" : "1.5px solid rgba(255,255,255,0.15)", padding: 0 }} />
              ))}
            </div>
          </div>
        )}

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Recent</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {recentColors.map(c => (
                <button key={c} title={c} onClick={() => applyHex(c)}
                  style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: c, cursor: "pointer",
                    outline: "1.5px solid rgba(255,255,255,0.15)", padding: 0 }} />
              ))}
            </div>
          </div>
        )}

        {/* Preset swatches */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {PRESETS.map(c => {
            const isActive = currentHex.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                title={c}
                onClick={() => applyHex(c)}
                style={{
                  width: 20, height: 20, borderRadius: 5, border: "none",
                  background: c,
                  cursor: "pointer",
                  outline: isActive ? "2px solid #7B6EF5" : "1.5px solid rgba(255,255,255,0.15)",
                  outlineOffset: isActive ? 1 : 0,
                  padding: 0,
                  transition: "outline 0.1s",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Color swatch button (use this anywhere) ────────────────────────────────────

export function ColorSwatchButton({
  value, onChange, size = 20,
}: {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  const handleClick = () => {
    if (ref.current) {
      setAnchor(ref.current.getBoundingClientRect());
      setOpen(true);
    }
  };

  return (
    <>
      <div
        ref={ref}
        onClick={handleClick}
        title={value}
        style={{
          position: "relative", width: size, height: size,
          borderRadius: Math.round(size * 0.22),
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.15)",
          flexShrink: 0, cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      >
        {/* Checkerboard for transparency */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
          backgroundSize: "6px 6px",
          backgroundPosition: "0 0,0 3px,3px -3px,-3px 0",
        }} />
        {value && <div style={{ position: "absolute", inset: 0, background: value }} />}
      </div>
      {open && anchor && (
        <ColorPicker
          value={value || "#ffffff"}
          anchor={anchor}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
