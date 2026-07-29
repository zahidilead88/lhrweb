"use client";

import { useState } from "react";
import type { Styles } from "@/types/builder";

type Breakpoint = "desktop" | "tablet" | "mobile";

interface SpacingBoxProps {
  styles: { desktop: Partial<Styles>; tablet?: Partial<Styles>; mobile?: Partial<Styles> };
  breakpoint: Breakpoint;
  onChange: (prop: keyof Styles, val: string) => void;
}

function SpacingInput({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-9 h-[18px] text-center text-[9px] font-mono bg-white border border-[#6344d4] rounded outline-none shadow-sm"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="w-9 h-[18px] text-center text-[9px] font-mono rounded hover:bg-black/5 transition-colors text-gray-600"
    >
      {value || "-"}
    </button>
  );
}

export default function SpacingBox({ styles, breakpoint, onChange }: SpacingBoxProps) {
  const get = (prop: keyof Styles): string => {
    const bpStyles = breakpoint !== "desktop" ? styles[breakpoint] : undefined;
    const val = bpStyles?.[prop] ?? styles.desktop[prop];
    return val !== undefined && val !== null ? String(val) : "";
  };

  const set = (prop: keyof Styles, val: string) => onChange(prop, val);

  return (
    <div className="select-none text-[9px]">
      {/* ── Margin (outer, blue zone) ── */}
      <div className="relative bg-blue-50 border border-blue-200/70 rounded-xl pt-5 pb-2 px-2">
        <span className="absolute top-1 left-2.5 text-[8px] font-black text-blue-400 uppercase tracking-widest">
          margin
        </span>

        {/* MT */}
        <div className="flex justify-center mb-1">
          <SpacingInput value={get("marginTop")} onChange={(v) => set("marginTop", v)} />
        </div>

        <div className="flex items-center gap-1.5">
          {/* ML */}
          <SpacingInput value={get("marginLeft")} onChange={(v) => set("marginLeft", v)} />

          {/* ── Padding (inner, green zone) ── */}
          <div className="flex-1 relative bg-green-50 border border-green-200/70 rounded-lg pt-5 pb-1.5 px-1.5">
            <span className="absolute top-1 left-2 text-[8px] font-black text-green-500 uppercase tracking-widest">
              padding
            </span>

            {/* PT */}
            <div className="flex justify-center mb-1">
              <SpacingInput value={get("paddingTop")} onChange={(v) => set("paddingTop", v)} />
            </div>

            <div className="flex items-center gap-1">
              {/* PL */}
              <SpacingInput value={get("paddingLeft")} onChange={(v) => set("paddingLeft", v)} />

              {/* Element centre */}
              <div className="flex-1 bg-white/80 border border-gray-200 rounded text-center text-[9px] font-bold text-gray-400 py-2">
                element
              </div>

              {/* PR */}
              <SpacingInput value={get("paddingRight")} onChange={(v) => set("paddingRight", v)} />
            </div>

            {/* PB */}
            <div className="flex justify-center mt-1">
              <SpacingInput value={get("paddingBottom")} onChange={(v) => set("paddingBottom", v)} />
            </div>
          </div>

          {/* MR */}
          <SpacingInput value={get("marginRight")} onChange={(v) => set("marginRight", v)} />
        </div>

        {/* MB */}
        <div className="flex justify-center mt-1">
          <SpacingInput value={get("marginBottom")} onChange={(v) => set("marginBottom", v)} />
        </div>
      </div>
    </div>
  );
}
