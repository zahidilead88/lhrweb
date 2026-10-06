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
  // Phase 6 — a structured shadow list (reuses Frame's own FrameEffect shape),
  // composed into the `boxShadow` CSS output by stylesToCSS. When present,
  // takes precedence over the plain `boxShadow` string for rendering.
  boxShadowLayers?: FrameEffect[];
  textShadow?: string;
  filter?: string;
  backdropFilter?: string;
  mixBlendMode?: string;
  // Phase 6 — multi-line text truncation ("N lines, then …"). Composed by
  // stylesToCSS into the -webkit-line-clamp property set (a single number
  // isn't enough on its own — display/overflow/box-orient must go with it).
  lineClamp?: number;

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
  variantId?: string;                   // Phase 4: which of the component's variants this instance uses (undefined = the default rootElement)
  cmsBinding?: CmsBinding;              // Phase 2: connects this element to a CMS collection field
  cmsList?: CmsListQuery;               // Phase 3: repeats this element's children once per matching entry
  productBinding?: ProductBinding;      // Phase 3: connects this element to a product field ("Convert to Product Card")
  productList?: ProductListQuery;       // Phase 3: repeats this element's children once per matching product
  addToCart?: boolean;                  // Phase 3: marks this element as a live "Add to Cart" button on the published site (always uses context — see resolveProductBindings)
}

// ── CMS (Phase 2 — docs/BLUEPRINT.md) ─────────────────────────────────────────

export type CmsFieldType = "text" | "richtext" | "image" | "number" | "date" | "boolean";

export interface CmsField {
  key: string;
  label: string;
  type: CmsFieldType;
}

export interface CmsCollection {
  _id: string;
  projectId: string;
  name: string;
  slug: string;
  fields: CmsField[];
}

export interface CmsEntry {
  _id: string;
  collectionId: string;
  slug: string;
  values: Record<string, unknown>;
  published: boolean;
  order: number;
}

// An element binds to one field of one entry. `entryId` is optional — when
// omitted, resolution takes the "current" entry from context: either the
// entry a `cmsList` repeat is currently iterating, or the entry a dynamic
// CMS page (Phase 3) is rendering. A fixed `entryId` still works standalone,
// outside any list/page context, per Phase 2.
export interface CmsBinding {
  collectionId: string;
  entryId?: string;
  field: string;
}

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.1) — "Convert to CMS
// List": this element's children repeat once per matching entry. Nested
// `cmsBinding`s with no `entryId` resolve against each repeat's entry.
export interface CmsListQuery {
  collectionId: string;
  sortField?: string;
  sortDir?: "asc" | "desc";
  limit?: number;
  filterField?: string;
  filterEquals?: string;
}

// Phase 3 §9.2 — "Dynamic CMS pages": marks a page as a template rendered
// once per entry in a collection, at `/<pathPrefix>/<entry-slug>`.
export interface CmsTemplate {
  collectionId: string;
  pathPrefix: string;
}

// ── Commerce (Phase 3 §9.3–9.6 — docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md) ──

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  sku?: string;
  inventory?: number;
  options?: Record<string, string>;
}

export interface ProductInventory {
  track: boolean;
  quantity: number;
  lowStockAt?: number;
  policy: "deny" | "continue" | "hide";
}

export interface Product {
  _id: string;
  projectId: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "draft" | "archived";
  images: ProductImage[];
  price: number;
  compareAtPrice?: number;
  options: ProductOption[];
  variants: ProductVariant[];
  inventory?: ProductInventory;
  collections: string[];
  tags: string[];
  vendor?: string;
}

export interface ProductCollection {
  _id: string;
  projectId: string;
  name: string;
  slug: string;
  description?: string;
  heroImage?: string;
  type: "manual" | "automatic";
  productIds: string[];
}

export type ProductField = "image" | "name" | "price" | "compareAtPrice" | "availability" | "url";

// Mirrors CmsBinding: `productId` is optional — omitted, it resolves from
// context (the current `productList` repeat, or a `productTemplate` page).
export interface ProductBinding {
  productId?: string;
  field: ProductField;
}

// Mirrors CmsListQuery — "Convert to Product Card" repeated as a grid.
// `collectionId` is a required key (nullable) rather than optional: Mongoose's
// default `minimize` strips genuinely empty `{}` sub-objects on save, and the
// all-fields-optional "every active product, no filters" case is exactly
// `{}` — so at least one key must always be present to survive a save.
export interface ProductListQuery {
  collectionId: string | null; // null = every active product
  limit?: number;
  sortField?: "price" | "name" | "createdAt";
  sortDir?: "asc" | "desc";
}

// Mirrors CmsTemplate — a product detail page at /<pathPrefix>/<product-slug>.
export interface ProductTemplate {
  pathPrefix: string;
}

export interface CartLine {
  productId: string;
  variantId?: string;
  quantity: number;
  priceSnapshot: number;
}

export interface Cart {
  _id: string;
  cartToken: string;
  projectId: string;
  items: CartLine[];
  couponCode?: string;
  expiresAt: string;
}

// ── Reusable component (Phase 4 — masters live at project level) ─────────────

// Phase 4 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §10) — a named alternate
// root structure for a component (e.g. Button: Primary/Secondary/Outline).
// Pushed/edited independently of other variants of the same component.
export interface ComponentVariant {
  id: string;
  name: string;
  rootElement: ElementNode;
}

export interface ProjectComponent {
  id: string;                           // "comp-{8 hex}"
  name: string;
  thumbnail?: string;
  rootElement: ElementNode;             // the master element tree (the default variant)
  // Phase 4 — comma-joined child index-paths into `rootElement` (e.g. "0,2") that
  // are slots: preserved per-instance across an "Update Master" push instead of
  // being synced, so instance-specific content (a card's image, a button's label)
  // survives master edits.
  slotPaths?: string[];
  variants?: ComponentVariant[];
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
  // Phase 1 — lock W/H ratio during any corner-handle resize
  aspectLocked?: boolean;
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

// ── Guide (Phase 1 — persistent ruler guide on the Free canvas) ──────────────

export interface CanvasGuide {
  id: string;
  axis: "v" | "h";
  pos: number;    // world-space coordinate — a Y for "h", an X for "v"
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
  flexWrap?: "wrap" | "nowrap";  // horizontal/vertical auto-layout only
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
  gridRows?: number;        // number of rows in grid mode (0/undefined = auto)
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

// ── Site structure (Phase 5 — docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11) ──

// A menu item links to an internal page (including a CMS/product template
// page — "dynamic links" per the spec, since those are pages too) or an
// external URL. One level of nesting (`children`) covers a dropdown submenu.
export type MenuLinkTarget =
  | { type: "page"; pageId: string }
  | { type: "url"; href: string };

export interface MenuItem {
  id: string;
  label: string;
  target: MenuLinkTarget;
  visible: boolean;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string; // e.g. "Header", "Footer" — free text, not a fixed enum
  items: MenuItem[];
}

export interface Redirect {
  id: string;
  source: string;      // a path, e.g. "/old-page" (leading slash, no query string)
  destination: string;  // a path or a full URL
  statusCode: 301 | 302; // mapped to Next's permanentRedirect (308) / redirect (307) at resolution time
  enabled: boolean;
}

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
