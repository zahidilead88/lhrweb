// ── CSS property type ─────────────────────────────────────────────────────────

export interface Styles {
  // Layout
  display?: "flex" | "grid" | "block" | "inline-block" | "inline" | "none";
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?:
    | "flex-start" | "center" | "flex-end"
    | "space-between" | "space-around" | "space-evenly";
  flex?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;

  // Size
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  // Spacing (individual sides)
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic" | "oblique";
  lineHeight?: string | number;
  letterSpacing?: string;
  wordSpacing?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
  whiteSpace?: string;
  wordBreak?: string;
  // Figma text properties
  paragraphSpacing?: string;    // paragraph-spacing
  paragraphIndent?: string;     // text-indent
  listSpacing?: string;         // gap between list items
  textStroke?: string;          // -webkit-text-stroke (Figma text stroke)
  textStrokeWidth?: string;
  textStrokeColor?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: "fixed" | "scroll" | "local";

  // Border
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;

  // Effects
  opacity?: number;
  boxShadow?: string;
  textShadow?: string;
  filter?: string;
  backdropFilter?: string;
  mixBlendMode?: string;

  // Position
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;

  // Overflow
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflowY?: "visible" | "hidden" | "scroll" | "auto";

  // Transform & Animation
  transform?: string;
  transition?: string;
  animation?: string;

  // Shapes
  clipPath?: string;

  // Other
  cursor?: string;
  pointerEvents?: "auto" | "none";
  userSelect?: "auto" | "none" | "text" | "all";
  visibility?: "visible" | "hidden" | "collapse";
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  objectPosition?: string;
  listStyle?: string;
  outline?: string;
  resize?: "none" | "both" | "horizontal" | "vertical";
  aspectRatio?: string;
  appearance?: string;
}

// ── Element node (recursive tree) ────────────────────────────────────────────

export type HTMLTag =
  | "div" | "section" | "article" | "aside" | "main"
  | "nav" | "header" | "footer"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "p" | "span" | "a" | "strong" | "em" | "blockquote"
  | "img" | "video"
  | "button" | "input" | "textarea" | "select" | "form" | "label"
  | "ul" | "ol" | "li"
  | "table" | "thead" | "tbody" | "tr" | "th" | "td"
  | "svg";

export interface ElementNode {
  id: string;
  tag: HTMLTag;
  label?: string;                        // display name for sections/named groups
  className?: string;                   // named class from classes[] (Phase 5)
  content?: string;                     // text content for leaf nodes
  attrs?: Record<string, string>;       // href, src, alt, placeholder, type, …
  styles: {
    desktop: Styles;
    tablet?: Partial<Styles>;           // overrides only — merged on top of desktop
    mobile?: Partial<Styles>;
  };
  children: ElementNode[];
  animation?: AnimationConfig;          // Phase 7: motion & interactions
  layout?: FreeLayout;                  // Phase 8: free canvas position
  locked?: boolean;                     // canvas: not selectable / draggable
  hidden?: boolean;                     // canvas: not rendered, not hit-tested
  componentId?: string;                 // Phase 4: links this element to a project component master
}

// ── Reusable component (Phase 4 — masters live at project level) ─────────────

export interface ProjectComponent {
  id: string;                           // "comp-{8 hex}"
  name: string;
  thumbnail?: string;
  rootElement: ElementNode;             // the master element tree
  createdAt: string;
  updatedAt?: string;
}

// ── Free canvas layout (Phase 8) ─────────────────────────────────────────────

export interface FreeLayout {
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  // Figma-style sizing: fixed (px), hug (fit-content), fill (100%/flex:1)
  widthMode?: "fixed" | "hug" | "fill";
  heightMode?: "fixed" | "hug" | "fill";
  // Auto-layout child: absolute position override (like Figma's absolute toggle)
  absoluteInLayout?: boolean;
  // Resize constraints: how this element behaves when its parent resizes
  constraints?: {
    horizontal: "left" | "right" | "center" | "scale" | "both";
    vertical: "top" | "bottom" | "center" | "scale" | "both";
  };
}

// ── Frame stroke ─────────────────────────────────────────────────────────────

export interface FrameStroke {
  color: string;
  width: number;
  style: "solid" | "dashed" | "dotted";
  join?: "miter" | "round" | "bevel";
  cap?: "round" | "square" | "arrow";
}

// ── Frame effect ──────────────────────────────────────────────────────────────

export interface FrameEffect {
  visible: boolean;
  type: "drop-shadow" | "inner-shadow";
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

// ── Frame (Figma artboard on the infinite canvas) ────────────────────────────

export interface Frame {
  id: string;
  name: string;
  canvasX: number;          // position on the infinite canvas
  canvasY: number;
  width: number;            // e.g. 1440, 390, 768
  height: number;
  background: string;       // CSS color, default "#ffffff"
  clipContent: boolean;     // clip overflowing children
  children: ElementNode[];
  // Extended design properties
  opacity?: number;         // 0–100, default 100
  borderRadius?: number;    // corner radius in px
  rotation?: number;        // degrees
  flipH?: boolean;
  flipV?: boolean;
  layoutMode?: "none" | "horizontal" | "vertical" | "grid";
  gap?: number;             // flex/grid gap in px when layoutMode !== "none"
  stroke?: FrameStroke;
  effects?: FrameEffect[];
  // Auto-layout padding (individual sides)
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Auto-layout alignment
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  // Grid auto-layout
  gridColumns?: number;     // number of columns in grid mode
  // Layout grids (visible guides on canvas, like Figma)
  layoutGrid?: { count: number; type: "columns" | "rows"; gutter: number; margin: number; color?: string };
  // Blend mode (mix-blend-mode CSS)
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
}

// ── Frame preset sizes ────────────────────────────────────────────────────────

export const FRAME_PRESETS = [
  { label: "Desktop",  width: 1440, height: 900  },
  { label: "Laptop",   width: 1280, height: 800  },
  { label: "Tablet",   width: 768,  height: 1024 },
  { label: "Mobile",   width: 390,  height: 844  },
] as const;

// ── Active tool on the canvas ─────────────────────────────────────────────────

export type CanvasTool = "move" | "scale" | "hand" | "frame" | "rect" | "ellipse" | "text" | "line" | "arrow" | "pen" | "polygon" | "star" | "image";

// ── Canvas state (viewport + selection + active tool) ─────────────────────────

export interface CanvasState {
  frames: Frame[];
  zoom: number;                     // 0.1 → 4.0  (1.0 = 100%)
  panX: number;
  panY: number;
  selectedFrameId: string | null;
  selectedElementIds: string[];
  activeTool: CanvasTool;
}

// ── Saved section (output of the Convert button) ──────────────────────────────

export interface SavedSection {
  id: string;
  name: string;
  html: string;                     // from generateHTML()
  css: string;                      // from generateCSS()
  thumbnail?: string;               // base64 screenshot (html2canvas)
  createdAt: string;
  sourceFrameId?: string;           // which Frame produced this section
  frameWidth?: number;              // original frame dimensions (for re-placing)
  frameHeight?: number;
}

// ── Named class (Phase 5) ─────────────────────────────────────────────────────

export interface StyleClass {
  name: string;                         // "hero-heading", "card", "btn-primary"
  styles: {
    desktop: Styles;
    tablet?: Partial<Styles>;
    mobile?: Partial<Styles>;
  };
}

// ── Design tokens (Phase 5) ──────────────────────────────────────────────────

export interface ColorToken { name: string; value: string; }
export interface FontToken  { name: string; family: string; }

export interface SiteTokens {
  colors:  ColorToken[];
  fonts:   FontToken[];
  spacing: Record<string, string>;     // { "sm":"8px", "md":"16px", "lg":"32px" }
}

// ── Animation types (Phase 7) ─────────────────────────────────────────────────

export interface AnimationProps {
  opacity?: number;
  x?: number | string;
  y?: number | string;
  scale?: number;
  rotate?: number;
}

export interface TransitionConfig {
  type?: "tween" | "spring";
  duration?: number;
  delay?: number;
  ease?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
}

export interface AnimationConfig {
  preset?: string;
  initial?: AnimationProps;
  animate?: AnimationProps;
  whileInView?: AnimationProps;
  viewport?: { once?: boolean; amount?: number };
  exit?: AnimationProps;
  whileHover?: AnimationProps;
  whileTap?: AnimationProps;
  transition?: TransitionConfig;
  staggerChildren?: number;
}

// ── Page & project shapes ────────────────────────────────────────────────────

export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  elements: ElementNode[];
}

export interface BuilderProjectV2 {
  _id: string;
  businessName: string;
  tagline: string;
  primaryColor: string;
  package: "starter" | "pro";
  status: "empty" | "generating" | "ready";
  pages: BuilderPage[];
  classes: StyleClass[];
  tokens: SiteTokens;
  prompt?: string;
}
