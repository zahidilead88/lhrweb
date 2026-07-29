"use client";

// Phase 2 (STRUCTURE-2 §2.3) — searchable font picker with live preview.
// Each option renders in its own family; project token fonts pinned to the top.

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

const WEB_FONTS = [
  "Inter", "Roboto", "Poppins", "Open Sans", "Montserrat", "Lato",
  "Nunito", "Raleway", "Merriweather", "Playfair Display",
  "Source Code Pro", "Ubuntu", "Oswald", "PT Serif", "Libre Baskerville",
];

const SYSTEM_FONTS = ["system-ui", "Georgia", "Times New Roman", "Courier New", "Arial"];

export default function FontPicker({
  value, onChange, tokenFonts,
}: {
  value: string;
  onChange: (family: string) => void;
  tokenFonts?: { name: string; family: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = (value || "Inter").split(",")[0].trim().replace(/['"]/g, "");
  const q = query.toLowerCase();

  const groups: { label: string; fonts: string[] }[] = [
    ...(tokenFonts && tokenFonts.length
      ? [{ label: "Your fonts", fonts: tokenFonts.map((f) => f.family.split(",")[0].trim()) }]
      : []),
    { label: "Web fonts", fonts: WEB_FONTS },
    { label: "System", fonts: SYSTEM_FONTS },
  ].map((grp) => ({ ...grp, fonts: grp.fonts.filter((f) => f.toLowerCase().includes(q)) }))
   .filter((grp) => grp.fonts.length > 0);

  const top = anchor ? Math.min(anchor.bottom + 4, window.innerHeight - 330) : 0;
  const left = anchor ? Math.max(8, Math.min(anchor.left, window.innerWidth - 236)) : 0;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { setAnchor(btnRef.current?.getBoundingClientRect() ?? null); setQuery(""); setOpen((o) => !o); }}
        style={{
          width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 8px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
          cursor: "pointer", fontSize: 12, color: "#1a1a2e", fontFamily: `${current}, sans-serif`,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current}</span>
        <ChevronDown size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
      </button>

      {open && anchor && typeof document !== "undefined" && createPortal(
        <div ref={popRef} style={{
          position: "fixed", top, left, width: 228, maxHeight: 320, zIndex: 99999,
          background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <Search size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fonts…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 12, color: "#1a1a2e", background: "none" }} />
          </div>
          <div style={{ overflowY: "auto", padding: "4px 0" }}>
            {groups.length === 0 && <p style={{ padding: "10px 12px", fontSize: 11, color: "rgba(0,0,0,0.4)" }}>No fonts match</p>}
            {groups.map((grp) => (
              <div key={grp.label}>
                <p style={{ padding: "6px 12px 2px", fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{grp.label}</p>
                {grp.fonts.map((f) => (
                  <button key={`${grp.label}-${f}`}
                    onClick={() => { onChange(`${f}, sans-serif`); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "6px 12px", border: "none", background: current === f ? "rgba(123,110,245,0.08)" : "none",
                      cursor: "pointer", fontSize: 13, color: "#1a1a2e", fontFamily: `${f}, sans-serif`, textAlign: "left",
                    }}
                    onMouseEnter={(e) => { if (current !== f) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = current === f ? "rgba(123,110,245,0.08)" : "none"; }}
                  >
                    {f}
                    {current === f && <span style={{ color: "#7B6EF5", fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
