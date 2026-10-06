import type { Styles, FrameEffect } from "@/types/builder";

// Properties that must not have "px" appended when their value is a bare number
const UNITLESS = new Set([
  "opacity", "zIndex", "fontWeight", "lineHeight",
  "flex", "flexGrow", "flexShrink", "order",
]);

// Keys handled as a compound declaration block below, not the generic
// camelCase→kebab-case mapping (each expands to more than one CSS property,
// or needs a shape the generic mapper can't produce).
const COMPOUND_KEYS = new Set(["boxShadowLayers", "lineClamp"]);

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function addUnit(key: string, value: string | number): string {
  if (typeof value === "number" && !UNITLESS.has(key)) return `${value}px`;
  return String(value);
}

function shadowLayerToCSS(s: FrameEffect): string {
  const inset = s.type === "inner-shadow" ? "inset " : "";
  return `${inset}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`;
}

/**
 * Converts a Styles object into a CSS declaration string.
 * e.g. { paddingTop: "40px", color: "#fff" } → "padding-top: 40px; color: #fff"
 */
export function stylesToCSS(styles: Partial<Styles>): string {
  const decls = Object.entries(styles)
    .filter(([k, v]) => !COMPOUND_KEYS.has(k) && v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${camelToKebab(k)}: ${addUnit(k, v as string | number)}`);

  // A structured shadow list, when present, replaces the plain boxShadow string.
  const layers = (styles.boxShadowLayers ?? []).filter((s) => s.visible);
  if (layers.length > 0) {
    const idx = decls.findIndex((d) => d.startsWith("box-shadow:"));
    const decl = `box-shadow: ${layers.map(shadowLayerToCSS).join(", ")}`;
    if (idx >= 0) decls[idx] = decl; else decls.push(decl);
  }

  // -webkit-line-clamp needs the whole flex-box-as-clamp declaration set, not
  // just the one property, to actually truncate.
  if (typeof styles.lineClamp === "number" && styles.lineClamp > 0) {
    decls.push(
      "display: -webkit-box",
      `-webkit-line-clamp: ${styles.lineClamp}`,
      "-webkit-box-orient: vertical",
      "overflow: hidden",
    );
  }

  return decls.join("; ");
}
