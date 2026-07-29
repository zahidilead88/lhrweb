const { z } = require("zod");

// ── Whitelists (single source of truth for AI output validation) ──────────────

// Must match frontend/types/builder.ts HTMLTag
const ALLOWED_TAGS = [
  "div", "section", "article", "aside", "main",
  "nav", "header", "footer",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "a", "strong", "em", "blockquote",
  "img", "video",
  "button", "input", "textarea", "select", "form", "label",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "svg",
];

const ALLOWED_ATTRS = [
  "href", "src", "alt", "placeholder", "type", "target", "rel", "title",
  "name", "value", "aria-label", "role", "loading", "width", "height",
  "autoplay", "muted", "loop", "controls", "poster",
  "data-svg", "data-arrow",
];

// V1 block types (legacy block-based generation)
const BLOCK_TYPES = [
  "hero", "about", "services", "contact", "cta", "features",
  "testimonials", "faq", "team", "gallery", "pricing",
];

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// ── Style primitives ───────────────────────────────────────────────────────────

const styleValue  = z.union([z.string().max(600), z.number()]);
const styleObject = z.record(z.string().max(50), styleValue);

const stylesShape = z
  .object({
    desktop: styleObject.catch({}).default({}),
    tablet:  styleObject.optional().catch(undefined),
    mobile:  styleObject.optional().catch(undefined),
  })
  .default({ desktop: {} });

// ── V2: ElementNode (recursive) ───────────────────────────────────────────────

const aiElementNode = z.lazy(() =>
  z.object({
    id:        z.string().max(64).optional(),
    tag:       z.enum(ALLOWED_TAGS),
    label:     z.string().max(60).optional(),
    content:   z.string().max(5000).optional(),
    attrs:     z.record(z.string().max(40), z.string().max(2000)).optional(),
    className: z.string().max(60).optional(),
    styles:    stylesShape,
    animation: z.any().optional(),
    children:  z.array(aiElementNode).max(60).default([]),
    layout:    z.any().optional(),
  })
);

const styleClass = z.object({
  name:   z.string().min(1).max(60),
  styles: stylesShape,
});

// ── Animation config (strict — used with animate-element) ────────────────────

const animProps = z
  .object({
    opacity: z.number().min(0).max(1).optional(),
    x:       z.union([z.number(), z.string().max(20)]).optional(),
    y:       z.union([z.number(), z.string().max(20)]).optional(),
    scale:   z.number().min(0).max(3).optional(),
    rotate:  z.number().min(-360).max(360).optional(),
  })
  .strip();

const animationConfig = z
  .object({
    preset:      z.string().max(40).optional(),
    initial:     animProps.optional(),
    animate:     animProps.optional(),
    whileInView: animProps.optional(),
    viewport:    z.object({ once: z.boolean().optional(), amount: z.number().min(0).max(1).optional() }).strip().optional(),
    exit:        animProps.optional(),
    whileHover:  animProps.optional(),
    whileTap:    animProps.optional(),
    transition:  z.object({
      type:     z.enum(["tween", "spring"]).optional(),
      duration: z.number().min(0).max(5).optional(),
      delay:    z.number().min(0).max(3).optional(),
      ease:     z.string().max(20).optional(),
    }).strip().optional(),
    staggerChildren: z.number().min(0).max(2).optional(),
  })
  .strip();

// ── V1 blocks (legacy site/page generation) ───────────────────────────────────

const aiBlock = z.object({
  id:      z.string().max(64).optional(),
  type:    z.enum(BLOCK_TYPES),
  content: z.record(z.string(), z.any()).default({}),
  styles:  z.record(z.string(), z.any()).default({}),
});

// ── Per-operation output schemas ──────────────────────────────────────────────

const siteOutput = z.object({
  businessName: z.string().min(1).max(120),
  tagline:      z.string().max(200).default(""),
  primaryColor: z.string().regex(HEX_COLOR).catch("#6344d4"),
  pages: z
    .array(
      z.object({
        id:     z.string().max(64).optional(),
        name:   z.string().min(1).max(60),
        slug:   z.string().max(80).optional(),
        blocks: z.array(aiBlock).max(12).default([]),
      })
    )
    .min(1)
    .max(15),
});

const blocksOutput = z.object({
  blocks: z.array(aiBlock).min(1).max(8),
});

// Ch 5.1 phase 1 — the site plan (small call, blueprint for everything else)
const sitePlanOutput = z.object({
  businessName:    z.string().min(1).max(120),
  tagline:         z.string().max(200).default(""),
  primaryColor:    z.string().regex(HEX_COLOR).catch("#6344d4"),
  businessSummary: z.string().max(600).default(""),
  pages: z
    .array(
      z.object({
        name:     z.string().min(1).max(60),
        slug:     z.string().max(80).optional(),
        sections: z.array(z.enum(BLOCK_TYPES)).min(1).max(8),
      })
    )
    .min(1)
    .max(15),
});

const blockOutput = aiBlock;

const sectionOutput = z.object({
  elements: z.array(aiElementNode).min(1).max(60),
  classes:  z.array(styleClass).max(20).default([]),
});

const elementOutput = aiElementNode;

const animationOutput = animationConfig;

const rewriteOutput = z.object({
  variants: z.array(z.string().min(1).max(3000)).min(1).max(5),
});

const seoOutput = z.object({
  title:       z.string().min(5).max(80),
  description: z.string().min(20).max(220),
  keywords:    z.array(z.string().max(40)).max(12).optional(),
});

const themeOutput = z.object({
  primaryColor: z.string().regex(HEX_COLOR).optional(),
  tokens: z
    .object({
      colors: z.array(z.object({ name: z.string().max(40), value: z.string().max(40) })).max(20).default([]),
      fonts:  z.array(z.object({ name: z.string().max(40), family: z.string().max(120) })).max(6).optional(),
    })
    .optional(),
  classPatches: z.record(z.string().max(60), styleObject).optional(),
});

module.exports = {
  ALLOWED_TAGS,
  ALLOWED_ATTRS,
  BLOCK_TYPES,
  HEX_COLOR,
  aiElementNode,
  styleClass,
  animationConfig,
  outputs: {
    siteGenerate:      siteOutput,
    sitePlan:          sitePlanOutput,
    sitePage:          blocksOutput,
    pageGenerate:      blocksOutput,
    blockRegenerate:   blockOutput,
    elementsGenerate:  sectionOutput,
    elementEdit:       elementOutput,
    animateElement:    animationOutput,
    rewriteContent:    rewriteOutput,
    generateSeo:       seoOutput,
    suggestTheme:      themeOutput,
  },
};
