import type { ElementNode, FreeLayout, Styles } from "@/types/builder";

// ── Figma node types (subset we handle) ──────────────────────────────────────

interface FigmaColor { r: number; g: number; b: number; a?: number }

interface FigmaFill {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
  gradientHandlePositions?: { x: number; y: number }[];
  gradientStops?: Array<{ color: FigmaColor; position: number }>;
}

interface FigmaStroke {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
}

interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

interface FigmaTypeStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: string;
  textAlignHorizontal?: string;
  textDecoration?: string;
  italic?: boolean;
}

interface FigmaNode {
  id: string;
  type: string;
  name: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  opacity?: number;
  effects?: FigmaEffect[];
  // Text
  characters?: string;
  style?: FigmaTypeStyle;
  // Constraints / layout
  clipsContent?: boolean;
  backgroundColor?: FigmaColor;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function figmaRgbToHex(c: FigmaColor): string {
  const r = Math.round(clamp01(c.r) * 255);
  const g = Math.round(clamp01(c.g) * 255);
  const b = Math.round(clamp01(c.b) * 255);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function figmaRgbToCss(c: FigmaColor, alpha?: number): string {
  const a = alpha ?? c.a ?? 1;
  if (a >= 0.999) return figmaRgbToHex(c);
  const r = Math.round(clamp01(c.r) * 255);
  const g = Math.round(clamp01(c.g) * 255);
  const b = Math.round(clamp01(c.b) * 255);
  return `rgba(${r},${g},${b},${Math.round(a * 100) / 100})`;
}

// ── Fill → CSS ────────────────────────────────────────────────────────────────

function fillsToStyles(fills: FigmaFill[]): Partial<Styles> {
  const visible = fills.filter(f => f.visible !== false);
  if (!visible.length) return {};
  const f = visible[0];
  if (f.type === "SOLID" && f.color) {
    const alpha = (f.opacity ?? 1) * (f.color.a ?? 1);
    return { backgroundColor: figmaRgbToCss(f.color, alpha) };
  }
  if ((f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL") && f.gradientStops?.length) {
    const stops = f.gradientStops
      .map(s => `${figmaRgbToCss(s.color)} ${Math.round(s.position * 100)}%`)
      .join(", ");
    const grad = f.type === "GRADIENT_LINEAR"
      ? `linear-gradient(90deg, ${stops})`
      : `radial-gradient(circle, ${stops})`;
    return { background: grad } as Partial<Styles>;
  }
  return {};
}

// ── Stroke → CSS ──────────────────────────────────────────────────────────────

function strokestoStyles(strokes: FigmaStroke[], weight?: number): Partial<Styles> {
  const s = strokes.find(s => s.visible !== false && s.color);
  if (!s?.color) return {};
  const w = weight ?? 1;
  return {
    borderColor: figmaRgbToCss(s.color),
    borderWidth: `${w}px`,
    borderStyle: "solid",
  };
}

// ── Effects → CSS ─────────────────────────────────────────────────────────────

function effectsToStyles(effects: FigmaEffect[]): Partial<Styles> {
  const shadows = effects
    .filter(e => e.visible !== false && (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"))
    .map(e => {
      const inset = e.type === "INNER_SHADOW" ? "inset " : "";
      const color = e.color ? figmaRgbToCss(e.color) : "rgba(0,0,0,0.2)";
      return `${inset}${e.offset?.x ?? 0}px ${e.offset?.y ?? 0}px ${e.radius ?? 0}px ${e.spread ?? 0}px ${color}`;
    });
  if (!shadows.length) return {};
  return { boxShadow: shadows.join(", ") };
}

// ── Node → ElementNode ────────────────────────────────────────────────────────

function uid() { return `el-${Math.random().toString(36).slice(2, 9)}`; }

function nodeToElement(node: FigmaNode, parentBox?: { x: number; y: number }): ElementNode | null {
  if (node.visible === false) return null;

  const box = node.absoluteBoundingBox;
  const layout: FreeLayout | undefined = box
    ? {
        x: Math.round(box.x - (parentBox?.x ?? box.x)),
        y: Math.round(box.y - (parentBox?.y ?? box.y)),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    : undefined;

  const baseStyles: Partial<Styles> = {
    ...(node.fills?.length ? fillsToStyles(node.fills) : {}),
    ...(node.strokes?.length ? strokestoStyles(node.strokes, node.strokeWeight) : {}),
    ...(node.effects?.length ? effectsToStyles(node.effects) : {}),
    ...(node.opacity != null && node.opacity < 1 ? { opacity: node.opacity } : {}),
  };

  if (node.cornerRadius) {
    baseStyles.borderRadius = `${node.cornerRadius}px`;
  } else if (node.rectangleCornerRadii) {
    baseStyles.borderRadius = node.rectangleCornerRadii.map(r => `${r}px`).join(" ");
  }

  // ── TEXT ─────────────────────────────────────────────────────────────────
  if (node.type === "TEXT") {
    const s = node.style ?? {};
    const fs = s.fontSize ?? 16;
    const tag = fs >= 36 ? "h1" : fs >= 28 ? "h2" : fs >= 22 ? "h3" : fs >= 18 ? "h4" : "p";
    return {
      id: uid(), tag,
      content: node.characters ?? "",
      styles: {
        desktop: {
          ...baseStyles,
          fontFamily: s.fontFamily ? `"${s.fontFamily}", sans-serif` : undefined,
          fontSize: `${fs}px`,
          fontWeight: s.fontWeight ?? undefined,
          fontStyle: s.italic ? "italic" : undefined,
          letterSpacing: s.letterSpacing ? `${Math.round(s.letterSpacing * 10) / 10}px` : undefined,
          lineHeight: s.lineHeightPx ? `${Math.round(s.lineHeightPx)}px`
            : s.lineHeightPercent ? `${Math.round(s.lineHeightPercent)}%` : undefined,
          textAlign: (s.textAlignHorizontal?.toLowerCase() as Styles["textAlign"]) ?? undefined,
          textDecoration: s.textDecoration?.toLowerCase() ?? undefined,
        },
      },
      children: [],
      layout,
    };
  }

  // ── ELLIPSE ───────────────────────────────────────────────────────────────
  if (node.type === "ELLIPSE") {
    return {
      id: uid(), tag: "div",
      styles: { desktop: { ...baseStyles, borderRadius: "50%" } },
      children: [],
      layout,
    };
  }

  // ── LINE ──────────────────────────────────────────────────────────────────
  if (node.type === "LINE") {
    const fillColor = node.strokes?.[0]?.color;
    return {
      id: uid(), tag: "div",
      styles: { desktop: {
        ...baseStyles,
        backgroundColor: fillColor ? figmaRgbToCss(fillColor) : "#000",
        height: "1px",
      }},
      children: [],
      layout: layout ? { ...layout, height: Math.max(1, layout.height ?? 1) } : layout,
    };
  }

  // ── VECTOR / POLYGON / STAR → colored div ────────────────────────────────
  if (["VECTOR", "POLYGON", "STAR", "BOOLEAN_OPERATION"].includes(node.type)) {
    return {
      id: uid(), tag: "div",
      styles: { desktop: baseStyles },
      children: [],
      layout,
    };
  }

  // ── RECTANGLE / FRAME / GROUP / COMPONENT / INSTANCE ─────────────────────
  if (["RECTANGLE", "FRAME", "COMPONENT", "INSTANCE", "GROUP", "SECTION", "COMPONENT_SET"].includes(node.type)) {
    // Frame bg override
    if (node.backgroundColor && !baseStyles.backgroundColor) {
      baseStyles.backgroundColor = figmaRgbToCss(node.backgroundColor);
    }

    const children = (node.children ?? [])
      .map(child => nodeToElement(child, box ?? undefined))
      .filter((c): c is ElementNode => c !== null);

    return {
      id: uid(), tag: "div",
      styles: { desktop: { ...baseStyles, position: "relative" } },
      children,
      layout,
    };
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export type FigmaClipboardPayload =
  | { node: FigmaNode; fileKey?: string }
  | { nodes: Array<{ node: FigmaNode }>; fileKey?: string }
  | { children: FigmaNode[]; fileKey?: string };

export function parseFigmaClipboard(raw: unknown): ElementNode[] {
  try {
    const data = raw as Record<string, unknown>;

    // Collect top-level nodes from various clipboard formats
    let topNodes: FigmaNode[] = [];

    if (data.node) {
      topNodes = [data.node as FigmaNode];
    } else if (Array.isArray(data.nodes)) {
      topNodes = (data.nodes as Array<{ node: FigmaNode }>).map(n => n.node).filter(Boolean);
    } else if (Array.isArray(data.children)) {
      topNodes = data.children as FigmaNode[];
    }

    if (!topNodes.length) return [];

    // Find global bounding box to make positions relative to selection origin
    const boxes = topNodes
      .map(n => n.absoluteBoundingBox)
      .filter((b): b is NonNullable<typeof b> => b != null);

    const originX = boxes.length ? Math.min(...boxes.map(b => b.x)) : 0;
    const originY = boxes.length ? Math.min(...boxes.map(b => b.y)) : 0;
    const origin = { x: originX, y: originY };

    return topNodes
      .map(node => nodeToElement(node, origin))
      .filter((el): el is ElementNode => el !== null);
  } catch {
    return [];
  }
}

// ── SVG → ElementNode (insert as <img> with data URI) ────────────────────────

export function svgToElement(svgText: string): ElementNode | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return null;

    // Extract dimensions
    let w = parseFloat(svg.getAttribute("width") ?? "0");
    let h = parseFloat(svg.getAttribute("height") ?? "0");
    if (!w || !h) {
      const vb = svg.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
      if (vb && vb.length === 4) { w = vb[2]; h = vb[3]; }
    }
    w = w || 200; h = h || 200;

    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    return {
      id: `el-${Math.random().toString(36).slice(2, 9)}`,
      tag: "img",
      attrs: { src: dataUri, alt: "Pasted SVG" },
      styles: { desktop: { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` } },
      children: [],
      layout: { x: 20, y: 20, width: Math.round(w), height: Math.round(h) },
    };
  } catch {
    return null;
  }
}

// ── Image blob → ElementNode ──────────────────────────────────────────────────

export async function imageToElement(blob: Blob): Promise<ElementNode | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(img.naturalWidth || 400, 800);
      const h = Math.round(w * ((img.naturalHeight || 300) / (img.naturalWidth || 400)));
      resolve({
        id: `el-${Math.random().toString(36).slice(2, 9)}`,
        tag: "img",
        attrs: { src: url, alt: "Pasted image" },
        styles: { desktop: { width: `${w}px`, height: `${h}px` } },
        children: [],
        layout: { x: 20, y: 20, width: w, height: h },
      });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ── Paste event reader (NO permission required) ───────────────────────────────
// Call this inside a 'paste' ClipboardEvent handler — e.clipboardData works
// without any clipboard-read permission in all browsers.

const FIGMA_TYPES = [
  "application/vnd.figma.clipboard.v5+json",
  "application/vnd.figma.clipboard.v4+json",
  "application/vnd.figma.clipboard.v3+json",
  "application/vnd.figma.clipboard.v2+json",
  "application/vnd.figma.clipboard+json",
];

export async function parsePasteEvent(e: ClipboardEvent): Promise<ElementNode[] | null> {
  const cd = e.clipboardData;
  if (!cd) return null;

  // 1. Figma JSON (all known versions)
  for (const mimeType of FIGMA_TYPES) {
    const raw = cd.getData(mimeType);
    if (raw?.trim()) {
      try {
        const els = parseFigmaClipboard(JSON.parse(raw));
        if (els.length) return els;
      } catch { /* malformed JSON — try next */ }
    }
  }

  // 2. SVG via image/svg+xml
  const svgDirect = cd.getData("image/svg+xml");
  if (svgDirect?.trim()) {
    const el = svgToElement(svgDirect);
    if (el) return [el];
  }

  // 3. SVG via text/plain (Figma "Copy as SVG")
  const textPlain = cd.getData("text/plain")?.trim();
  if (textPlain?.startsWith("<svg")) {
    const el = svgToElement(textPlain);
    if (el) return [el];
  }

  // 4. Image files (PNG/JPEG/GIF/WEBP drag-or-paste)
  const files = Array.from(cd.files ?? []);
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const el = await imageToElement(file);
      if (el) return [el];
    }
  }

  return null; // caller should fall back to internal builder clipboard
}

// ── Legacy: navigator.clipboard.read() path (requires permission) ─────────────
// Kept for context-menu paste button which fires from a click (user gesture).
export async function readFigmaClipboard(): Promise<ElementNode[] | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const mimeType of FIGMA_TYPES) {
        if (item.types.includes(mimeType)) {
          const blob = await item.getType(mimeType);
          const els = parseFigmaClipboard(JSON.parse(await blob.text()));
          if (els.length) return els;
        }
      }
      if (item.types.includes("image/svg+xml")) {
        const el = svgToElement(await (await item.getType("image/svg+xml")).text());
        if (el) return [el];
      }
      for (const t of ["image/png","image/jpeg","image/gif","image/webp"]) {
        if (item.types.includes(t)) {
          const el = await imageToElement(await item.getType(t));
          if (el) return [el];
        }
      }
    }
  } catch (err) {
    console.warn("[FigmaPaste] navigator.clipboard.read() unavailable:", err);
  }
  return null;
}
