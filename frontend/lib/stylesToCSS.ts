import type { Styles } from "@/types/builder";

// Properties that must not have "px" appended when their value is a bare number
const UNITLESS = new Set([
  "opacity", "zIndex", "fontWeight", "lineHeight",
  "flex", "flexGrow", "flexShrink", "order",
]);

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function addUnit(key: string, value: string | number): string {
  if (typeof value === "number" && !UNITLESS.has(key)) return `${value}px`;
  return String(value);
}

/**
 * Converts a Styles object into a CSS declaration string.
 * e.g. { paddingTop: "40px", color: "#fff" } → "padding-top: 40px; color: #fff"
 */
export function stylesToCSS(styles: Partial<Styles>): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${camelToKebab(k)}: ${addUnit(k, v as string | number)}`)
    .join("; ");
}
