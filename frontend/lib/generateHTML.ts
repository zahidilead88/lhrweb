import type { ElementNode } from "@/types/builder";

// Self-closing tags that must not have a closing tag
const VOID_TAGS = new Set(["img", "input", "br", "hr", "meta", "link", "area", "base", "embed", "source", "track", "wbr"]);

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderAttrs(attrs: Record<string, string> = {}): string {
  const parts = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`);
  return parts.length > 0 ? " " + parts.join(" ") : "";
}

function renderNode(el: ElementNode, isRoot = false): string {
  const { tag, id, label, className, content, attrs, children, animation } = el;

  const dataId   = ` data-id="${id}"`;
  const classStr = className ? ` class="${className}"` : "";
  const attrsStr = renderAttrs(attrs);
  const animStr  = animation
    ? ` data-animate='${JSON.stringify(animation).replace(/'/g, "&#39;")}'`
    : "";

  if (VOID_TAGS.has(tag)) {
    return `<${tag}${dataId}${classStr}${attrsStr}${animStr}>`;
  }

  const inner =
    children.length > 0
      ? children.map((c) => renderNode(c)).join("")
      : content
        ? escapeText(content)
        : "";

  const labelBadge = (isRoot && label)
    ? `<div style="position:absolute;top:0;left:0;background:#6344d4;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:0 0 6px 0;pointer-events:none;z-index:9999;letter-spacing:0.05em;text-transform:uppercase;opacity:0.85">${escapeText(label)}</div>`
    : "";

  const posStyle = (isRoot && label) ? ` style="position:relative"` : "";

  return `<${tag}${dataId}${classStr}${attrsStr}${animStr}${posStyle}>${labelBadge}${inner}</${tag}>`;
}

/**
 * Converts an ElementNode[] tree into an HTML string.
 * Every element gets a data-id attribute so the canvas can identify it via postMessage.
 */
export function generateHTML(elements: ElementNode[]): string {
  return elements.map((el) => renderNode(el, true)).join("\n");
}
