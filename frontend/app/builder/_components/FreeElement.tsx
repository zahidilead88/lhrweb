"use client";

import React from "react";
import type { ElementNode, Styles } from "@/types/builder";

const VOID_TAGS = new Set(["img","input","br","hr","meta","link","area","base","embed","source","track","wbr"]);

interface Props {
  element: ElementNode;
  depth?: number;
  // Phase 6 (bounded "Responsive Frames") — preview the same tablet/mobile
  // style overrides on the Free canvas that generateCSS.ts already applies
  // at publish time, so editing a breakpoint's styles is visible while
  // editing it, not just write-only until the page is published.
  breakpoint?: "desktop" | "tablet" | "mobile";
}

// `boxShadowLayers` and `lineClamp` each expand to more than one real CSS
// property — spreading Styles straight into a React style object (as below)
// can't do that on its own, so they're composed here the same way Frame.tsx
// already composes frame.effects into a live boxShadow preview.
const COMPOUND_KEYS = new Set<keyof Styles>(["boxShadowLayers", "lineClamp"]);

function compoundStyle(merged: Partial<Styles>): React.CSSProperties {
  const extra: React.CSSProperties = {};
  const layers = (merged.boxShadowLayers ?? []).filter((s) => s.visible);
  if (layers.length > 0) {
    extra.boxShadow = layers
      .map((s) => `${s.type === "inner-shadow" ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
      .join(", ");
  }
  if (typeof merged.lineClamp === "number" && merged.lineClamp > 0) {
    extra.display = "-webkit-box";
    extra.WebkitLineClamp = merged.lineClamp;
    extra.WebkitBoxOrient = "vertical";
    extra.overflow = "hidden";
  }
  return extra;
}

export default function FreeElement({ element, depth = 0, breakpoint = "desktop" }: Props) {
  const { tag, id, className, content, attrs, children, styles } = element;

  // Defensive: `styles` is required by the type, but a handful of legacy/
  // malformed records on record have shipped without it (caught 2026-09-07 —
  // it crashed the whole Free canvas rather than just that one element).
  // Never let one bad element take down the rest of the page.
  const safeStyles = styles ?? { desktop: {} };

  const merged: Partial<Styles> = {
    ...safeStyles.desktop,
    ...(breakpoint !== "desktop" ? safeStyles.tablet : {}),
    ...(breakpoint === "mobile" ? safeStyles.mobile : {}),
  };

  const plain = Object.fromEntries(
    Object.entries(merged).filter(([k]) => !COMPOUND_KEYS.has(k as keyof Styles))
  );

  const style: React.CSSProperties = {
    ...(plain as React.CSSProperties),
    ...compoundStyle(merged),
    ...(depth === 0 ? { position: "relative", width: "100%", height: "100%" } : {}),
  };

  // Pen tool paths — stored as inline SVG string in data-svg attr
  if (attrs?.["data-svg"]) {
    return (
      <div
        data-id={id}
        className={className ?? undefined}
        style={style}
        dangerouslySetInnerHTML={{ __html: attrs["data-svg"] as string }}
      />
    );
  }

  const commonProps: Record<string, unknown> = {
    "data-id": id,
    className: className ?? undefined,
    style,
    ...attrs,
  };

  if (VOID_TAGS.has(tag)) {
    return React.createElement(tag, commonProps);
  }

  const innerContent =
    children.length > 0
      ? children.map((child) => <FreeElement key={child.id} element={child} depth={depth + 1} breakpoint={breakpoint} />)
      : content ?? null;

  return React.createElement(tag, commonProps, innerContent);
}
