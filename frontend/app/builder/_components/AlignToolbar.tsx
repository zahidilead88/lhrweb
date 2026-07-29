"use client";

import type { ElementNode, FreeLayout } from "@/types/builder";

type AlignType = "left" | "centerH" | "right" | "top" | "centerV" | "bottom" | "distH" | "distV";

function getEffectiveLayout(el: ElementNode, idx: number): { x: number; y: number; w: number; h: number } {
  return {
    x: el.layout?.x ?? 20 + idx * 20,
    y: el.layout?.y ?? 20 + idx * 80,
    w: el.layout?.width ?? 300,
    h: el.layout?.height ?? 80,
  };
}

export function applyAlignment(
  elements: ElementNode[],
  ids: string[],
  alignment: AlignType
): ElementNode[] {
  if (ids.length < 2) return elements;

  const selected = elements
    .map((el, idx) => ({ el, idx, bounds: getEffectiveLayout(el, idx) }))
    .filter(({ el }) => ids.includes(el.id));

  const minX    = Math.min(...selected.map(({ bounds }) => bounds.x));
  const maxX    = Math.max(...selected.map(({ bounds }) => bounds.x + bounds.w));
  const minY    = Math.min(...selected.map(({ bounds }) => bounds.y));
  const maxY    = Math.max(...selected.map(({ bounds }) => bounds.y + bounds.h));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return elements.map((el, idx) => {
    if (!ids.includes(el.id)) return el;
    const b = getEffectiveLayout(el, idx);
    let newX = b.x, newY = b.y;

    switch (alignment) {
      case "left":    newX = minX; break;
      case "centerH": newX = centerX - b.w / 2; break;
      case "right":   newX = maxX - b.w; break;
      case "top":     newY = minY; break;
      case "centerV": newY = centerY - b.h / 2; break;
      case "bottom":  newY = maxY - b.h; break;
      case "distH": {
        const sorted = [...selected].sort((a, b) => a.bounds.x - b.bounds.x);
        const totalW = sorted.reduce((s, { bounds }) => s + bounds.w, 0);
        const gap    = (maxX - minX - totalW) / (sorted.length - 1);
        const myIdx  = sorted.findIndex(({ el: e }) => e.id === el.id);
        let acc = minX;
        for (let i = 0; i < myIdx; i++) acc += sorted[i].bounds.w + gap;
        newX = acc;
        break;
      }
      case "distV": {
        const sorted = [...selected].sort((a, b) => a.bounds.y - b.bounds.y);
        const totalH = sorted.reduce((s, { bounds }) => s + bounds.h, 0);
        const gap    = (maxY - minY - totalH) / (sorted.length - 1);
        const myIdx  = sorted.findIndex(({ el: e }) => e.id === el.id);
        let acc = minY;
        for (let i = 0; i < myIdx; i++) acc += sorted[i].bounds.h + gap;
        newY = acc;
        break;
      }
    }

    return {
      ...el,
      layout: { ...(el.layout ?? { x: b.x, y: b.y, width: b.w }), x: newX, y: newY } as FreeLayout,
    };
  });
}

interface Props {
  selectedCount: number;
  onAlign: (type: AlignType) => void;
  onDeselect: () => void;
}

const TOOLS: { type: AlignType; label: string; title: string }[] = [
  { type: "left",    label: "⬢←", title: "Align left" },
  { type: "centerH", label: "⬢↔",  title: "Center horizontal" },
  { type: "right",   label: "→⬢", title: "Align right" },
  { type: "top",     label: "⬢↑", title: "Align top" },
  { type: "centerV", label: "⬢↕",  title: "Center vertical" },
  { type: "bottom",  label: "⬢↓", title: "Align bottom" },
  { type: "distH",   label: "↔↔", title: "Distribute horizontally" },
  { type: "distV",   label: "↕↕", title: "Distribute vertically" },
];

export default function AlignToolbar({ selectedCount, onAlign, onDeselect }: Props) {
  if (selectedCount < 2) return null;

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-xl shadow-black/10 rounded-2xl px-2 py-1.5">
      <span className="text-[10px] font-bold text-gray-400 px-1">{selectedCount} selected</span>
      <div className="w-px h-4 bg-gray-100 mx-1" />
      {TOOLS.map(({ type, label, title }) => (
        <button
          key={type}
          onClick={() => onAlign(type)}
          title={title}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all font-mono"
        >
          {label}
        </button>
      ))}
      <div className="w-px h-4 bg-gray-100 mx-1" />
      <button
        onClick={onDeselect}
        title="Deselect all"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
      >
        ✕
      </button>
    </div>
  );
}
