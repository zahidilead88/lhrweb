"use client";

import React from "react";
import type { BlockStyles, NavItem, CanvasEl, CanvasRow, CanvasColStyle } from "@/lib/builderComponents";

const ReadOnlyCtx = React.createContext(false);

function toNavItems(v: unknown, fallbackKey?: unknown): NavItem[] {
  if (Array.isArray(v)) return v as NavItem[];
  const str = typeof v === "string" ? v : (typeof fallbackKey === "string" ? fallbackKey : "");
  return str ? str.split(",").map((l) => ({ label: l.trim(), href: "#" })).filter((i) => i.label) : [];
}

interface Block { 
  id: string; 
  type: string; 
  content: Record<string, unknown>; 
  styles?: BlockStyles; 
}

interface Props {
  blocks: Block[];
  primaryColor?: string;
  businessName?: string;
  onSelectBlock?: (blockId: string, sect?: "layout" | "typography" | "accents" | "cards") => void;
  selectedBlockId?: string;
  onUpdateBlockContent?: (blockId: string, content: Record<string, unknown>) => void;
}

const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const a = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const o = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

// ── Style helpers ─────────────────────────────────────────────────────────────

const PADDING_Y: Record<string, string> = {
  xs: "py-8", sm: "py-12", md: "py-16", lg: "py-20", xl: "py-28",
};
const MAX_W: Record<string, string> = {
  sm: "max-w-sm", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl", full: "max-w-full",
};
const HEADING_SIZE: Record<string, string> = {
  sm: "text-2xl", md: "text-3xl", lg: "text-4xl", xl: "text-5xl",
};
const BTN_RADIUS: Record<string, string> = {
  md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full",
};
const CARD_RADIUS: Record<string, string> = {
  md: "rounded-xl", lg: "rounded-2xl", xl: "rounded-3xl",
};
const CARD_SHADOW: Record<string, string> = {
  none: "shadow-none", sm: "shadow-sm", md: "shadow-md",
};
const GRID_COLS: Record<string, string> = {
  "2": "grid-cols-2", "3": "grid-cols-3", "4": "grid-cols-4",
};
const FONT_FAMILY: Record<string, string> = {
  sans: "font-sans", serif: "font-serif", mono: "font-mono",
};

function pyClass(st?: BlockStyles) { return st?.paddingY ? PADDING_Y[st.paddingY] : "py-20"; }
function mwClass(st?: BlockStyles, def = "max-w-5xl") { return st?.maxWidth ? MAX_W[st.maxWidth] : def; }
function hColor(st?: BlockStyles, def = "text-gray-900") { return st?.headingColor ? undefined : def; }
function hStyle(st?: BlockStyles): React.CSSProperties { return st?.headingColor ? { color: st.headingColor } : {}; }
function hSizeClass(st?: BlockStyles, def = "text-3xl") { return st?.headingSize ? HEADING_SIZE[st.headingSize] : def; }
function bStyle(st?: BlockStyles): React.CSSProperties { return st?.bodyColor ? { color: st.bodyColor } : {}; }
function taClass(st?: BlockStyles, def = "") { return st?.textAlign ? `text-${st.textAlign}` : def; }
function accentColor(st?: BlockStyles, fallback = "#000000") { return st?.accentColor ?? fallback; }
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}
const BG_DIR: Record<string, string> = {
  "to-r": "to right", "to-br": "to bottom right", "to-b": "to bottom",
  "to-bl": "to bottom left", "to-l": "to left", "to-tr": "to top right",
};
// Returns Tailwind classes for section-level shadow + border (static values)
function sectionTailwindClasses(st?: BlockStyles): string {
  const parts: string[] = [];
  if (st?.sectionShadow === "sm") parts.push("shadow-sm");
  else if (st?.sectionShadow === "md") parts.push("shadow-md");
  else if (st?.sectionShadow === "lg") parts.push("shadow-lg");
  if (st?.borderTop)    parts.push("border-t-2");
  if (st?.borderBottom) parts.push("border-b-2");
  return parts.join(" ");
}
// Returns inline styles only for dynamic user values (colors, bg images, gradients)
function sectionStyle(st?: BlockStyles): React.CSSProperties {
  const cs: React.CSSProperties = {};
  if (st?.bgType === "gradient") {
    const dir = BG_DIR[st.bgGradientDir ?? "to-r"] ?? "to right";
    cs.background = `linear-gradient(${dir}, ${st.bgGradientFrom ?? "#6344d4"}, ${st.bgGradientTo ?? "#000000"})`;
  } else if (st?.bgType === "image" && st.bgImage) {
    const size = st.bgImageSize ?? "cover";
    const pos  = st.bgImagePos  ?? "center";
    // base color behind image (shows while image loads or when no overlay)
    if (st.sectionBg) cs.backgroundColor = st.sectionBg;
    if (st.bgOverlay) {
      const oc = hexToRgba(st.bgOverlayColor ?? "#000000", (parseInt(st.bgOverlayOpacity ?? "40")) / 100);
      cs.backgroundImage = `linear-gradient(${oc}, ${oc}), url(${st.bgImage})`;
    } else {
      cs.backgroundImage = `url(${st.bgImage})`;
    }
    cs.backgroundSize     = size === "repeat" ? "auto" : size;
    cs.backgroundRepeat   = size === "repeat" ? "repeat" : "no-repeat";
    cs.backgroundPosition = pos;
    if (st.bgImageFixed) cs.backgroundAttachment = "fixed";
  } else {
    // color mode or no type — sectionBg is the background
    if (st?.sectionBg) cs.background = st.sectionBg;
  }
  // dynamic border color (border-width comes from Tailwind above)
  if ((st?.borderTop || st?.borderBottom) && st.sectionBorderColor) {
    cs.borderColor = st.sectionBorderColor;
  }
  return cs;
}
function cardRadiusClass(st?: BlockStyles, def = "rounded-2xl") { return st?.cardRadius ? CARD_RADIUS[st.cardRadius] : def; }
function cardShadowClass(st?: BlockStyles, def = "shadow-sm") { return st?.cardShadow ? CARD_SHADOW[st.cardShadow] : def; }
function cardBgStyle(st?: BlockStyles): React.CSSProperties { return st?.cardBg ? { background: st.cardBg } : {}; }
function gridClass(st?: BlockStyles, def = "grid-cols-3") { return st?.gridCols ? (GRID_COLS[st.gridCols] ?? def) : def; }
function fontClass(st?: BlockStyles) { return st?.fontFamily ? (FONT_FAMILY[st.fontFamily] ?? "") : ""; }
function btnRadiusClass(st?: BlockStyles, def = "rounded-xl") { return st?.buttonRadius ? BTN_RADIUS[st.buttonRadius] : def; }
function btnStyle(st?: BlockStyles, color = "#000000"): React.CSSProperties {
  const bg = st?.buttonColor ?? color;
  const tc = st?.buttonTextColor;
  if (!st?.buttonVariant || st.buttonVariant === "filled") return { background: bg, color: tc ?? "#fff" };
  if (st.buttonVariant === "outline") return { border: `2px solid ${bg}`, color: tc ?? bg, background: "transparent" };
  return { color: tc ?? bg };
}
const BTN_SZ: Record<string, string> = {
  sm: "px-5 py-2 text-[12px]", md: "px-7 py-3.5 text-[14px]", lg: "px-9 py-4 text-[16px]",
};
function btnSzClass(st?: BlockStyles, def = "px-7 py-3.5 text-[14px]"): string {
  return st?.buttonSize ? (BTN_SZ[st.buttonSize] ?? def) : def;
}
function btnJustify(st?: BlockStyles, def = ""): string {
  if (!st?.buttonAlign) return def;
  return st.buttonAlign === "left" ? "justify-start" : st.buttonAlign === "right" ? "justify-end" : "justify-center";
}
function contentAlignCls(st?: BlockStyles): string {
  const l = st?.contentLayout;
  if (l === "left") return "text-left items-start";
  if (l === "right") return "text-right items-end";
  if (l === "split-left" || l === "split-right") return "text-left items-start";
  // default: fall back to textAlign
  const a = st?.textAlign ?? "center";
  return a === "left" ? "text-left items-start" : a === "right" ? "text-right items-end" : "text-center items-center";
}

// ── Inline Editable Text component ─────────────────────────────────────────────

function EditableText({
  text,
  placeholder = "Edit text...",
  onSave,
}: {
  text: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const readOnly = React.useContext(ReadOnlyCtx);
  if (readOnly) return <span>{text || placeholder}</span>;
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className="focus:outline-none focus:ring-2 focus:ring-indigo-500/30 rounded px-1 transition-all inline-block min-w-[20px] cursor-text hover:bg-gray-50/70"
      onBlur={(e) => {
        const val = e.currentTarget.textContent ?? "";
        onSave(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {text || placeholder}
    </span>
  );
}

// ── Block renderers ────────────────────────────────────────────────────────────

function HeaderBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const navItems = toNavItems(c.navItems, c.navLinks);
  const isDark = st?.sectionBg && st.sectionBg !== "#ffffff" && st.sectionBg !== "#f9fafb";
  const textColor = isDark ? "#ffffff" : "#111111";
  const subColor  = isDark ? "rgba(255,255,255,0.55)" : "#6b7280";
  return (
    <header
      className={`px-8 py-5 flex items-center justify-between sticky top-0 z-10 ${fontClass(st)}`}
      style={{ background: st?.sectionBg ?? "#ffffff", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#f0f0f0"}`, backdropFilter: "blur(12px)", ...sectionStyle(st) }}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className="flex items-center gap-2.5" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
        <span className="text-[16px] font-black tracking-tight" style={{ color: textColor }}>
          <EditableText text={s(c.siteName, "Your Brand")} onSave={(v) => onUpdate?.({ ...c, siteName: v })} />
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-8" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
        {navItems.map((item, idx) => (
          <a key={idx} href={item.href} className="text-[13px] font-semibold transition-colors" style={{ color: subColor }} onClick={(e) => e.preventDefault()}>
            <EditableText text={item.label} onSave={(v) => { const arr = [...navItems]; arr[idx] = { ...item, label: v }; onUpdate?.({ ...c, navItems: arr }); }} />
          </a>
        ))}
      </nav>
      {s(c.ctaText) && (
        <a href={s(c.ctaLink, "#")} className={`px-5 py-2.5 ${btnRadiusClass(st, "rounded-full")} text-[13px] font-bold transition-all`} style={btnStyle(st, color)} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
          <EditableText text={s(c.ctaText)} onSave={(v) => onUpdate?.({ ...c, ctaText: v })} />
        </a>
      )}
    </header>
  );
}

function HeroBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const defaultBg  = "linear-gradient(135deg,#0a0a0a 0%,#111827 60%,#0a0a0a 100%)";
  const sty: React.CSSProperties = st && (st.sectionBg || st.bgType) ? sectionStyle(st) : { background: defaultBg };
  const headClr = st?.headingColor ?? "#ffffff";
  const bodyClr = st?.bodyColor    ?? "rgba(255,255,255,0.6)";
  const layout  = st?.contentLayout ?? "centered";
  const isSplit = layout === "split-left" || layout === "split-right";
  const alignCls = contentAlignCls(st);

  const heroContent = (
    <div className={`flex flex-col ${alignCls}`}>
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 w-fit" style={{ borderColor: `${effectiveColor}40`, background: `${effectiveColor}12` }}
        onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: effectiveColor }} />
        <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: effectiveColor }}>
          {s(c.badge, "Welcome")}
        </span>
      </div>
      <h1
        className={`${hSizeClass(st, "text-5xl")} font-black leading-[1.02] tracking-tight mb-6`}
        style={{ color: headClr, letterSpacing: "-0.03em" }}
        onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}
      >
        <EditableText text={s(c.headline, "We build websites that actually work")} onSave={(v) => onUpdate?.({ ...c, headline: v })} />
      </h1>
      <p
        className="text-[17px] leading-relaxed mb-10 max-w-lg"
        style={{ color: bodyClr }}
        onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}
      >
        <EditableText text={s(c.subheadline, "Premium design and development for ambitious businesses.")} onSave={(v) => onUpdate?.({ ...c, subheadline: v })} />
      </p>
      <div className={`flex flex-wrap gap-3 ${btnJustify(st)}`}
        onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
        {s(c.ctaText) && (
          <a href={s(c.ctaLink, "#")} className={`inline-flex items-center gap-2 ${btnSzClass(st, "px-7 py-3.5 text-[14px]")} font-bold ${btnRadiusClass(st, "rounded-full")}`} style={btnStyle(st, effectiveColor)} onClick={(e) => e.preventDefault()}>
            <EditableText text={s(c.ctaText)} onSave={(v) => onUpdate?.({ ...c, ctaText: v })} />
            <span style={{ opacity: 0.7 }}>→</span>
          </a>
        )}
        {s(c.secondaryCta) && (
          <a href="#" className={`inline-flex items-center gap-2 ${btnSzClass(st, "px-7 py-3.5 text-[14px]")} font-bold rounded-full border`} style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }} onClick={(e) => e.preventDefault()}>
            <EditableText text={s(c.secondaryCta)} onSave={(v) => onUpdate?.({ ...c, secondaryCta: v })} />
          </a>
        )}
      </div>
    </div>
  );

  const decoPanel = (
    <div className="rounded-3xl aspect-video flex items-center justify-center"
      style={{ background: `${effectiveColor}10`, border: `1px solid ${effectiveColor}20` }}>
      <div className="w-20 h-20 rounded-full opacity-40" style={{ background: effectiveColor }} />
    </div>
  );

  return (
    <section
      className={`relative overflow-hidden ${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sty}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${effectiveColor}30, transparent 70%)` }} />
      {isSplit ? (
        <div className={`relative z-10 ${mwClass(st, "max-w-6xl")} mx-auto grid grid-cols-2 gap-12 items-center`}>
          {layout === "split-right" && decoPanel}
          {heroContent}
          {layout === "split-left" && decoPanel}
        </div>
      ) : (
        <div className={`relative z-10 ${mwClass(st, "max-w-4xl")} mx-auto flex flex-col ${alignCls}`}>
          {heroContent}
        </div>
      )}
    </section>
  );
}

function AboutBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const highlights = a(c.highlights);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#4b5563";
  const layout  = st?.contentLayout ?? "split-left";
  const isSingleCol = layout === "centered" || layout === "left" || layout === "right";
  const reverseGrid = layout === "split-right";
  const taClass = isSingleCol ? contentAlignCls(st) : "text-left";

  const textCol = (
    <div className={taClass} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
      <div className="w-10 h-0.5 mb-8" style={{ background: effectiveColor }} />
      <h2 className={`${hSizeClass(st, "text-4xl")} font-black leading-tight tracking-tight mb-6`} style={{ color: headClr, letterSpacing: "-0.025em" }}>
        <EditableText text={s(c.title, "We care deeply about the work we do")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
      </h2>
      <p className="text-[16px] leading-relaxed" style={{ color: bodyClr }}>
        <EditableText text={s(c.body, "About your business...")} onSave={(v) => onUpdate?.({ ...c, body: v })} />
      </p>
      {s(c.ctaText) && (
        <div className={`mt-8 flex flex-wrap gap-3 ${btnJustify(st)}`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
          <a href={s(c.ctaLink, "#")} className={`inline-flex items-center gap-2 ${btnSzClass(st, "px-6 py-3 text-[14px]")} font-bold ${btnRadiusClass(st)}`} style={btnStyle(st, effectiveColor)} onClick={(e) => e.preventDefault()}>
            <EditableText text={s(c.ctaText)} onSave={(v) => onUpdate?.({ ...c, ctaText: v })} />
          </a>
        </div>
      )}
    </div>
  );

  const highlightsCol = highlights.length > 0 ? (
    <ul className="space-y-4" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
      {highlights.map((h, i) => (
        <li key={i} className="flex items-start gap-4 py-4 border-b" style={{ borderColor: st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0" }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5" style={{ background: effectiveColor }}>✓</span>
          <span className="text-[15px] font-medium" style={{ color: headClr }}>
            <EditableText text={s(h)} onSave={(v) => { const arr = [...highlights]; arr[i] = v; onUpdate?.({ ...c, highlights: arr }); }} />
          </span>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <section
      className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sectionStyle(st)}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className={`${mwClass(st, "max-w-5xl")} mx-auto ${isSingleCol ? "flex flex-col" : "grid md:grid-cols-2 gap-16 items-center"}`}>
        {reverseGrid && highlightsCol}
        {textCol}
        {!reverseGrid && !isSingleCol && highlightsCol}
        {isSingleCol && highlightsCol && <div className="mt-10">{highlightsCol}</div>}
      </div>
    </section>
  );
}

function StatementBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const bg       = st?.sectionBg ?? "#0a0a0a";
  const isDark   = bg !== "#ffffff" && bg !== "#f9fafb" && bg !== "#f3f4f6";
  const headClr  = st?.headingColor ?? (isDark ? "#ffffff" : "#0a0a0a");
  const bodyClr  = st?.bodyColor    ?? (isDark ? "rgba(255,255,255,0.5)" : "#6b7280");
  const divider  = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
  const logos    = s(c.logosText).split(",").map((l) => l.trim()).filter(Boolean);

  return (
    <section
      className={`${pyClass(st)} ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sectionStyle(st) || { background: bg }}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className="max-w-6xl mx-auto px-10">
        {/* Main grid: narrow label col + wide statement col */}
        <div className="grid grid-cols-12 gap-8 mb-14">
          {/* Label col */}
          <div className="col-span-2 pt-3" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: effectiveColor }} />
              <span className="text-[13px] font-semibold" style={{ color: bodyClr }}>
                <EditableText text={s(c.label, "Who are we?")} onSave={(v) => onUpdate?.({ ...c, label: v })} />
              </span>
            </div>
          </div>

          {/* Statement col */}
          <div className="col-span-10">
            <h2
              className="font-black leading-[1.04] tracking-tight mb-10"
              style={{ color: headClr, fontSize: "clamp(2rem, 4vw, 4.5rem)", letterSpacing: "-0.03em" }}
              onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}
            >
              <EditableText
                text={s(c.headline, "An independent web design and branding agency who care, build relationships, have industry experience, and win awards.")}
                onSave={(v) => onUpdate?.({ ...c, headline: v })}
              />
            </h2>

            {/* CTAs */}
            <div className={`flex flex-wrap items-center gap-5 ${btnJustify(st)}`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
              {s(c.ctaText) && (
                <a
                  href={s(c.ctaLink, "#")}
                  className={`inline-flex items-center gap-2.5 ${btnSzClass(st, "px-6 py-3 text-[15px]")} ${btnRadiusClass(st, "rounded-full")} font-bold`}
                  style={btnStyle(st, effectiveColor)}
                  onClick={(e) => e.preventDefault()}
                >
                  <EditableText text={s(c.ctaText)} onSave={(v) => onUpdate?.({ ...c, ctaText: v })} />
                  <span className="text-[18px] leading-none">↗</span>
                </a>
              )}
              {s(c.secondaryCta) && (
                <a
                  href={s(c.secondaryCtaLink, "#")}
                  className="inline-flex items-center gap-1.5 font-semibold text-[15px]"
                  style={{ color: headClr }}
                  onClick={(e) => e.preventDefault()}
                >
                  <EditableText text={s(c.secondaryCta)} onSave={(v) => onUpdate?.({ ...c, secondaryCta: v })} />
                  <span style={{ opacity: 0.5 }}>↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Client logos strip */}
        {logos.length > 0 && (
          <>
            <div className="border-t mb-10" style={{ borderColor: divider }} />
            <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
              {logos.map((logo, i) => (
                <span
                  key={i}
                  className="text-[15px] font-black tracking-tight uppercase"
                  style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)" }}
                >
                  {logo}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function WhyUsBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const cardBg  = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.05)" : "#ffffff");
  const border  = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  return (
    <section
      className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sectionStyle(st)}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className={`${mwClass(st, "max-w-5xl")} mx-auto`}>
        <div className="grid md:grid-cols-2 gap-16 mb-20 items-end" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div>
            <div className="w-8 h-0.5 mb-6" style={{ background: effectiveColor }} />
            <h2 className="text-4xl font-black tracking-tight leading-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.title, "Why companies choose us")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
            </h2>
          </div>
          {s(c.subtitle) && (
            <p className="text-[15px] leading-relaxed" style={{ color: bodyClr }}>
              <EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
            </p>
          )}
        </div>
        <div className={`grid ${gridClass(st, "grid-cols-3")} gap-px`} style={{ background: border, borderRadius: "20px", overflow: "hidden" }}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div
                key={i}
                className="p-8 flex flex-col gap-5"
                style={{ background: cardBg }}
                onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: effectiveColor }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-2xl font-black" style={{ color: `${effectiveColor}30` }}>→</span>
                </div>
                <div>
                  <h3 className="text-[17px] font-black mb-2 tracking-tight" style={{ color: headClr, letterSpacing: "-0.015em" }}>
                    <EditableText text={s(it.title, "Advantage")} onSave={(v) => {
                      const arr = [...items]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, items: arr });
                    }} />
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: bodyClr }}>
                    <EditableText text={s(it.description, "Why this matters to your business.")} onSave={(v) => {
                      const arr = [...items]; arr[i] = { ...it, description: v }; onUpdate?.({ ...c, items: arr });
                    }} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesBlock({
  c, color = "#6344d4", st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color?: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const cardBg  = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.06)" : "#f9fafb");
  const border  = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#efefef";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className={`flex flex-col ${contentAlignCls(st) || "text-center items-center"} mb-16`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <h2 className={`${hSizeClass(st, "text-4xl")} font-black tracking-tight mb-4`} style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "Everything you need")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          <p className="text-[16px] max-w-xl" style={{ color: bodyClr }}>
            <EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
          </p>
        </div>
        <div className={`grid ${gridClass(st, "grid-cols-3")} gap-px`} style={{ background: border, borderRadius: "16px", overflow: "hidden" }}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="p-8 flex flex-col gap-4" style={{ background: cardBg }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px]" style={{ background: `${effectiveColor}18`, color: effectiveColor }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-[16px] font-bold" style={{ color: headClr }}>
                  <EditableText text={s(it.title, "Feature")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, items: arr }); }} />
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: bodyClr }}>
                  <EditableText text={s(it.description, "Description")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, description: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr  = st?.headingColor ?? "#111111";
  const bodyClr  = st?.bodyColor    ?? "#6b7280";
  const cardBg   = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.05)" : "#ffffff");
  const divider  = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div>
            <div className="w-8 h-0.5 mb-5" style={{ background: effectiveColor }} />
            <h2 className="text-4xl font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.title, "What we do")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
            </h2>
          </div>
          {s(c.subtitle) && (
            <p className="text-[15px] max-w-sm" style={{ color: bodyClr }}>
              <EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
            </p>
          )}
        </div>
        <div className="divide-y" style={{ borderColor: divider }}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="group flex items-start gap-8 py-8 cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <span className="text-[12px] font-black tabular-nums pt-1 w-8 flex-shrink-0" style={{ color: effectiveColor }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 grid md:grid-cols-2 gap-4 items-start">
                  <h3 className="text-[20px] font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.02em" }}>
                    <EditableText text={s(it.title, "Service Title")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: bodyClr }}>
                    <EditableText text={s(it.description, "Description")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, description: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </p>
                </div>
                <span className="text-[20px] opacity-30 group-hover:opacity-100 transition-opacity pt-0.5" style={{ color: effectiveColor }}>→</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#374151";
  const cardBg  = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.06)" : "#ffffff");
  const border  = st?.sectionBg ? "rgba(255,255,255,0.1)" : "#efefef";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className="flex items-end justify-between mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "What our clients say")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
        </div>
        <div className={`grid ${gridClass(st)} gap-6`}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="flex flex-col justify-between p-8 rounded-2xl border" style={{ background: cardBg, borderColor: border }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <div>
                  <div className="text-6xl font-black leading-none mb-4" style={{ color: effectiveColor, opacity: 0.4 }}>"</div>
                  <p className="text-[16px] leading-relaxed font-medium mb-8" style={{ color: headClr }}>
                    <EditableText text={s(it.quote, "This is the testimonial quote that makes a real impact.")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, quote: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t" style={{ borderColor: border }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-black flex-shrink-0" style={{ background: effectiveColor }}>
                    {s(it.name, "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: headClr }}>
                      <EditableText text={s(it.name, "Client Name")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, name: v }; onUpdate?.({ ...c, items: arr }); }} />
                    </p>
                    <p className="text-[12px]" style={{ color: bodyClr }}>
                      <EditableText text={s(it.role, "Role, Company")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, role: v }; onUpdate?.({ ...c, items: arr }); }} />
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TeamBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className="mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div className="w-8 h-0.5 mb-5" style={{ background: effectiveColor }} />
          <h2 className="text-4xl font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "The people behind the work")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          {s(c.subtitle) && <p className="text-[15px] mt-3 max-w-lg" style={{ color: bodyClr }}><EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} /></p>}
        </div>
        <div className={`grid ${gridClass(st, "grid-cols-4")} gap-6`}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="group" onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <div className="aspect-square rounded-2xl mb-4 flex items-center justify-center text-white text-3xl font-black overflow-hidden" style={{ background: `linear-gradient(135deg,${effectiveColor},${effectiveColor}88)` }}>
                  {s(it.name, "?").charAt(0).toUpperCase()}
                </div>
                <h3 className="text-[15px] font-bold" style={{ color: headClr }}>
                  <EditableText text={s(it.name, "Name")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, name: v }; onUpdate?.({ ...c, items: arr }); }} />
                </h3>
                <p className="text-[13px] font-semibold mb-2" style={{ color: effectiveColor }}>
                  <EditableText text={s(it.role, "Role")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, role: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: bodyClr }}>
                  <EditableText text={s(it.bio, "Bio")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, bio: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GalleryBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const isDark  = !!st?.sectionBg && st.sectionBg !== "#ffffff" && st.sectionBg !== "#f9fafb";
  const projects = [
    { label: "Brand Identity", cat: "Branding" },
    { label: "E-Commerce", cat: "Web Design" },
    { label: "Mobile App", cat: "Product" },
    { label: "Campaign Site", cat: "Marketing" },
    { label: "Dashboard UI", cat: "SaaS" },
    { label: "Editorial", cat: "Publishing" },
  ];
  const swatches = ["0.55", "0.4", "0.65", "0.35", "0.5", "0.45"];
  return (
    <section
      className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sectionStyle(st)}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className={`${mwClass(st, "max-w-5xl")} mx-auto`}>
        <div className="flex items-end justify-between mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div>
            <div className="w-8 h-0.5 mb-5" style={{ background: effectiveColor }} />
            <h2 className="text-4xl font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.title, "Selected work")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
            </h2>
          </div>
          {s(c.subtitle) && (
            <p className="text-[14px] max-w-xs text-right" style={{ color: bodyClr }}>
              <EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {projects.map((proj, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden ${i === 0 ? "col-span-2 row-span-1" : ""} ${cardRadiusClass(st, "rounded-2xl")} cursor-pointer`}
              style={{ aspectRatio: i === 0 ? "16/9" : "4/3", background: `rgba(${parseInt(effectiveColor.slice(1,3),16)},${parseInt(effectiveColor.slice(3,5),16)},${parseInt(effectiveColor.slice(5,7),16)},${swatches[i]})` }}
            >
              <div className="absolute inset-0 flex flex-col justify-end p-5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{proj.cat}</span>
                <span className="text-[15px] font-black text-white tracking-tight">{proj.label}</span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[18px] text-white/80">↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const tiers = a(c.tiers);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const cardBg  = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.06)" : "#ffffff");
  const border  = st?.sectionBg ? "rgba(255,255,255,0.1)" : "#efefef";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className={`flex flex-col ${contentAlignCls(st) || "text-center items-center"} mb-16`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <h2 className={`${hSizeClass(st, "text-4xl")} font-black tracking-tight mb-4`} style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "Simple, transparent pricing")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          <p className="text-[16px] max-w-xl" style={{ color: bodyClr }}>
            <EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
          </p>
        </div>
        <div className={`grid ${gridClass(st)} gap-6 items-stretch`}>
          {tiers.map((tier, i) => {
            const t = o(tier);
            const pop = t.popular === true;
            const features = a(t.features);
            return (
              <div key={i} className="relative flex flex-col rounded-2xl p-8 border" style={{ background: pop ? effectiveColor : cardBg, borderColor: pop ? effectiveColor : border }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                {pop && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black bg-white" style={{ color: effectiveColor }}>Most Popular</div>}
                <div className="mb-8">
                  <p className="text-[13px] font-bold mb-2 uppercase tracking-widest" style={{ color: pop ? "rgba(255,255,255,0.65)" : bodyClr }}>
                    <EditableText text={s(t.name, "Plan")} onSave={(v) => { const arr = [...tiers]; arr[i] = { ...t, name: v }; onUpdate?.({ ...c, tiers: arr }); }} />
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black" style={{ color: pop ? "#ffffff" : headClr, letterSpacing: "-0.04em" }}>
                      <EditableText text={s(t.price, "$0")} onSave={(v) => { const arr = [...tiers]; arr[i] = { ...t, price: v }; onUpdate?.({ ...c, tiers: arr }); }} />
                    </span>
                    <span className="text-[13px] pb-2" style={{ color: pop ? "rgba(255,255,255,0.55)" : bodyClr }}>
                      <EditableText text={s(t.period, "/mo")} onSave={(v) => { const arr = [...tiers]; arr[i] = { ...t, period: v }; onUpdate?.({ ...c, tiers: arr }); }} />
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-[13px]" style={{ color: pop ? "rgba(255,255,255,0.85)" : bodyClr }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5" style={{ background: pop ? "rgba(255,255,255,0.25)" : `${effectiveColor}20`, color: pop ? "#fff" : effectiveColor }}>✓</span>
                      <EditableText text={s(f)} onSave={(v) => { const arr = [...tiers]; const feats = [...features]; feats[fi] = v; arr[i] = { ...t, features: feats }; onUpdate?.({ ...c, tiers: arr }); }} />
                    </li>
                  ))}
                </ul>
                <button className={`w-full ${btnSzClass(st, "py-3.5 text-[14px]")} ${btnRadiusClass(st)} font-bold`} style={pop ? { background: st?.buttonColor ?? "#fff", color: st?.buttonTextColor ?? effectiveColor } : { border: `2px solid ${border}`, color: st?.buttonTextColor ?? headClr, background: st?.buttonColor ?? "transparent" }}>
                  Get started
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqBlock({
  c, color = "#6344d4", st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color?: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography") => void;
}) {
  const items = a(c.items);
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const divider = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st, "max-w-3xl")} mx-auto`}>
        <div className="grid md:grid-cols-2 gap-16 mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "Frequently asked questions")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          <p className="text-[15px] leading-relaxed pt-2" style={{ color: bodyClr }}>
            <EditableText text={s(c.subtitle, "Everything you need to know.")} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: divider }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="py-6 grid md:grid-cols-2 gap-6">
                <h3 className="text-[15px] font-bold" style={{ color: headClr }}>
                  <EditableText text={s(it.question, "Question?")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, question: v }; onUpdate?.({ ...c, items: arr }); }} />
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: bodyClr }}>
                  <EditableText text={s(it.answer, "Answer...")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, answer: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const bg = st?.bgType === "gradient"
    ? `linear-gradient(135deg,${st.bgGradientFrom ?? effectiveColor},${st.bgGradientTo ?? "#000000"})`
    : st?.sectionBg ?? `linear-gradient(135deg,${effectiveColor},${effectiveColor}cc)`;
  const headClr = st?.headingColor ?? "#ffffff";
  const bodyClr = st?.bodyColor    ?? "rgba(255,255,255,0.75)";
  const alignCls = contentAlignCls(st) || "text-center items-center";
  const btnBg = st?.buttonColor ?? "#ffffff";
  const btnTc = st?.buttonTextColor ?? effectiveColor;
  return (
    <section className={`${pyClass(st)} px-8 relative overflow-hidden ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={{ background: bg }} onClick={() => onSelectElement?.("layout")}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(255,255,255,0.08), transparent)" }} />
      <div className={`relative z-10 ${mwClass(st, "max-w-3xl")} mx-auto flex flex-col ${alignCls}`}>
        <h2 className={`${hSizeClass(st, "text-4xl")} font-black tracking-tight mb-5`} style={{ color: headClr, letterSpacing: "-0.03em" }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <EditableText text={s(c.headline, "Ready to start your project?")} onSave={(v) => onUpdate?.({ ...c, headline: v })} />
        </h2>
        <p className="text-[17px] mb-10 leading-relaxed" style={{ color: bodyClr }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <EditableText text={s(c.subtext, "Let's build something great together.")} onSave={(v) => onUpdate?.({ ...c, subtext: v })} />
        </p>
        {s(c.buttonText) && (
          <div className={`flex flex-wrap gap-3 ${btnJustify(st, "justify-center")}`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
            <a href={s(c.buttonLink, "#")} className={`inline-flex items-center gap-2 ${btnSzClass(st, "px-8 py-4 text-[15px]")} font-bold ${btnRadiusClass(st, "rounded-full")} shadow-xl`} style={{ background: btnBg, color: btnTc }} onClick={(e) => e.preventDefault()}>
              <EditableText text={s(c.buttonText)} onSave={(v) => onUpdate?.({ ...c, buttonText: v })} />
              <span style={{ opacity: 0.6 }}>→</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const headClr  = st?.headingColor ?? "#111111";
  const bodyClr  = st?.bodyColor    ?? "#6b7280";
  const inputBg  = st?.sectionBg ? "rgba(255,255,255,0.07)" : "#f9fafb";
  const inputBdr = st?.sectionBg ? "rgba(255,255,255,0.1)" : "#e5e7eb";
  const inputClr = st?.sectionBg ? "#ffffff" : "#111111";
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formMsg, setFormMsg] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);
  const [formDone, setFormDone] = React.useState(false);
  const isReadOnly = React.useContext(ReadOnlyCtx);

  const handleSubmit = async () => {
    if (!formName.trim() || !formEmail.trim() || !formMsg.trim()) return;
    setFormLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, message: formMsg, service: "Builder Website" }),
      });
      setFormDone(true);
      setFormName(""); setFormEmail(""); setFormMsg("");
      setTimeout(() => setFormDone(false), 3000);
    } catch { /* silent */ }
    finally { setFormLoading(false); }
  };

  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st, "max-w-5xl")} mx-auto grid md:grid-cols-2 gap-20`}>
        <div onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div className="w-8 h-0.5 mb-8" style={{ background: effectiveColor }} />
          <h2 className="text-4xl font-black tracking-tight mb-4" style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "Start a project")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          <p className="text-[16px] leading-relaxed mb-10" style={{ color: bodyClr }}>
            <EditableText text={s(c.subtitle, "Tell us about your project and we'll be in touch.")} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} />
          </p>
          <div className="space-y-5">
            {s(c.email) && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${effectiveColor}18` }}>
                  <span style={{ color: effectiveColor, fontSize: 16 }}>✉</span>
                </div>
                <span className="text-[14px] font-medium" style={{ color: headClr }}>
                  <EditableText text={s(c.email)} onSave={(v) => onUpdate?.({ ...c, email: v })} />
                </span>
              </div>
            )}
            {s(c.phone) && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${effectiveColor}18` }}>
                  <span style={{ color: effectiveColor, fontSize: 16 }}>✆</span>
                </div>
                <span className="text-[14px] font-medium" style={{ color: headClr }}>
                  <EditableText text={s(c.phone)} onSave={(v) => onUpdate?.({ ...c, phone: v })} />
                </span>
              </div>
            )}
            {s(c.address) && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${effectiveColor}18` }}>
                  <span style={{ color: effectiveColor, fontSize: 16 }}>⌖</span>
                </div>
                <span className="text-[14px] font-medium" style={{ color: headClr }}>
                  <EditableText text={s(c.address)} onSave={(v) => onUpdate?.({ ...c, address: v })} />
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Your name" value={formName}
            onChange={(e) => setFormName(e.target.value)}
            readOnly={!isReadOnly && false}
            className="w-full px-5 py-3.5 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#6344d4]/20"
            style={{ background: inputBg, border: `1.5px solid ${inputBdr}`, color: inputClr }} />
          <input type="email" placeholder="Your email" value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            readOnly={!isReadOnly && false}
            className="w-full px-5 py-3.5 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#6344d4]/20"
            style={{ background: inputBg, border: `1.5px solid ${inputBdr}`, color: inputClr }} />
          <textarea placeholder="Tell us about your project..." rows={5} value={formMsg}
            onChange={(e) => setFormMsg(e.target.value)}
            readOnly={!isReadOnly && false}
            className="w-full px-5 py-3.5 rounded-xl text-[14px] outline-none resize-none transition-all focus:ring-2 focus:ring-[#6344d4]/20"
            style={{ background: inputBg, border: `1.5px solid ${inputBdr}`, color: inputClr }} />
          <button onClick={handleSubmit} disabled={formLoading || !formName.trim() || !formEmail.trim() || !formMsg.trim()}
            className={`w-full py-4 ${btnRadiusClass(st, "rounded-xl")} text-[14px] font-bold transition-all disabled:opacity-50`}
            style={btnStyle(st, effectiveColor)}>
            {formLoading ? "Sending..." : formDone ? "✓ Message sent" : "Send message →"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FooterBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography") => void;
}) {
  const footerLinks = toNavItems(c.links);
  const effectiveColor = accentColor(st, color);
  const bg = st?.sectionBg ?? "#0a0a0a";
  const half = Math.ceil(footerLinks.length / 2);
  return (
    <footer
      className={`px-8 pt-20 pb-10 text-white ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={{ background: bg }}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className={`${mwClass(st, "max-w-5xl")} mx-auto`}>
        {/* Top row: brand + links */}
        <div className="grid grid-cols-12 gap-8 mb-16">
          <div className="col-span-5" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <div className="mb-6">
              <span className="text-[22px] font-black tracking-tight" style={{ color: "#ffffff" }}>
                <EditableText text={s(c.companyName, "Your Brand")} onSave={(v) => onUpdate?.({ ...c, companyName: v })} />
              </span>
            </div>
            {s(c.tagline) && (
              <p className="text-[14px] leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                <EditableText text={s(c.tagline)} onSave={(v) => onUpdate?.({ ...c, tagline: v })} />
              </p>
            )}
            <div className="mt-8 space-y-2.5">
              {s(c.email) && (
                <p className="text-[13px] flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <span style={{ color: effectiveColor }}>✉</span>
                  <EditableText text={s(c.email)} onSave={(v) => onUpdate?.({ ...c, email: v })} />
                </p>
              )}
              {s(c.phone) && (
                <p className="text-[13px] flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <span style={{ color: effectiveColor }}>✆</span>
                  <EditableText text={s(c.phone)} onSave={(v) => onUpdate?.({ ...c, phone: v })} />
                </p>
              )}
            </div>
          </div>
          <div className="col-span-3 col-start-7">
            <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>Navigation</p>
            <ul className="space-y-3">
              {footerLinks.slice(0, half).map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="text-[14px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.55)" }} onClick={(e) => e.preventDefault()}>
                    <EditableText text={item.label} onSave={(v) => {
                      const arr = [...footerLinks]; arr[idx] = { ...item, label: v }; onUpdate?.({ ...c, links: arr });
                    }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-3">
            <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>More</p>
            <ul className="space-y-3">
              {footerLinks.slice(half).map((item, idx) => {
                const orig = half + idx;
                return (
                  <li key={idx}>
                    <a href={item.href} className="text-[14px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.55)" }} onClick={(e) => e.preventDefault()}>
                      <EditableText text={item.label} onSave={(v) => {
                        const arr = [...footerLinks]; arr[orig] = { ...item, label: v }; onUpdate?.({ ...c, links: arr });
                      }} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {/* Divider */}
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
        {/* Bottom row */}
        <div className="pt-8 flex items-center justify-between" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <EditableText text={s(c.copyright, `© ${new Date().getFullYear()} ${s(c.companyName, "Your Brand")}. All rights reserved.`)} onSave={(v) => onUpdate?.({ ...c, copyright: v })} />
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: effectiveColor }} />
            <span className="text-[11px] font-bold" style={{ color: effectiveColor }}>Available for new projects</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CustomBlock({
  c, color, st, onUpdate, onSelectElement,
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "accents" | "cards") => void;
}) {
  const layout         = s(c.layout, "hero-centered");
  const effectiveColor = accentColor(st, color);
  const items          = a(c.items);
  const headClr        = st?.headingColor ?? "#111111";
  const bodyClr        = st?.bodyColor    ?? "#6b7280";
  const cardBg         = st?.cardBg       ?? (st?.sectionBg ? "rgba(255,255,255,0.05)" : "#ffffff");
  const border         = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0";

  if (layout === "hero-split") {
    return (
      <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
        <div className={`${mwClass(st, "max-w-5xl")} mx-auto grid md:grid-cols-2 gap-16 items-center`}>
          <div onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <div className="w-8 h-0.5 mb-6" style={{ background: effectiveColor }} />
            <h2 className="text-4xl font-black tracking-tight mb-5 leading-tight" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.heading, "Your Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: bodyClr }}>
              <EditableText text={s(c.subheading, "Describe your offering here.")} onSave={(v) => onUpdate?.({ ...c, subheading: v })} />
            </p>
            {s(c.cta) && (
              <a href={s(c.ctaLink, "#")} className={`inline-flex items-center gap-2 px-7 py-3.5 font-bold ${btnRadiusClass(st, "rounded-full")} text-[14px]`} style={btnStyle(st, effectiveColor)} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
                <EditableText text={s(c.cta)} onSave={(v) => onUpdate?.({ ...c, cta: v })} />
                <span style={{ opacity: 0.7 }}>→</span>
              </a>
            )}
          </div>
          <div className="aspect-[4/3] rounded-2xl flex items-center justify-center text-[13px] font-semibold" style={{ background: `${effectiveColor}18`, color: effectiveColor }}>
            Image / Visual
          </div>
        </div>
      </section>
    );
  }

  if (layout === "3-grid") {
    const defaultItems = items.length === 0
      ? [{ title: "Card One", text: "Click to edit." }, { title: "Card Two", text: "Click to edit." }, { title: "Card Three", text: "Click to edit." }]
      : items;
    return (
      <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
        <div className={`${mwClass(st)} mx-auto`}>
          <div className="mb-16 text-center" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <h2 className="text-4xl font-black tracking-tight mb-3" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.heading, "Section Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
            </h2>
          </div>
          <div className={`grid ${gridClass(st)} gap-px`} style={{ background: border, borderRadius: "20px", overflow: "hidden" }}>
            {defaultItems.map((item, i) => {
              const it = o(item);
              return (
                <div key={i} className="p-8 flex flex-col gap-4" style={{ background: cardBg }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[12px]" style={{ background: `${effectiveColor}18`, color: effectiveColor }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-[16px] font-black tracking-tight" style={{ color: headClr }}>
                    <EditableText text={s(it.title, `Card ${i + 1}`)} onSave={(v) => { const arr = [...defaultItems]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: bodyClr }}>
                    <EditableText text={s(it.text, "Description here.")} onSave={(v) => { const arr = [...defaultItems]; arr[i] = { ...it, text: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "2-col-text") {
    return (
      <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
        <div className={`${mwClass(st, "max-w-5xl")} mx-auto`}>
          <div className="grid md:grid-cols-2 gap-16 items-start" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <div>
              <div className="w-8 h-0.5 mb-6" style={{ background: effectiveColor }} />
              <h2 className="text-4xl font-black tracking-tight mb-6" style={{ color: headClr, letterSpacing: "-0.025em" }}>
                <EditableText text={s(c.heading, "Section Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
              </h2>
            </div>
            <div className="pt-2 md:pt-16 space-y-5">
              <p className="text-[15px] leading-relaxed" style={{ color: bodyClr }}>
                <EditableText text={s(c.col1, "First column text. Click to edit.")} onSave={(v) => onUpdate?.({ ...c, col1: v })} />
              </p>
              <div className="h-px" style={{ background: border }} />
              <p className="text-[15px] leading-relaxed" style={{ color: bodyClr }}>
                <EditableText text={s(c.col2, "Second column text. Click to edit.")} onSave={(v) => onUpdate?.({ ...c, col2: v })} />
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "full-banner") {
    const bg = st?.bgType === "gradient"
      ? `linear-gradient(135deg,${st.bgGradientFrom ?? effectiveColor},${st.bgGradientTo ?? "#000000"})`
      : st?.sectionBg ?? `linear-gradient(135deg,${effectiveColor},${effectiveColor}cc)`;
    return (
      <section className={`${pyClass(st)} px-8 relative overflow-hidden text-center ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={{ background: bg }} onClick={() => onSelectElement?.("layout")}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(255,255,255,0.08), transparent)" }} />
        <div className={`relative z-10 ${mwClass(st, "max-w-3xl")} mx-auto`} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <h2 className="text-5xl font-black tracking-tight mb-5" style={{ color: st?.headingColor ?? "#ffffff", letterSpacing: "-0.03em" }}>
            <EditableText text={s(c.heading, "Full-Width Banner Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
          </h2>
          <p className="text-[16px] leading-relaxed" style={{ color: st?.bodyColor ?? "rgba(255,255,255,0.75)" }}>
            <EditableText text={s(c.subheading, "Supporting text for your banner section.")} onSave={(v) => onUpdate?.({ ...c, subheading: v })} />
          </p>
        </div>
      </section>
    );
  }

  if (layout === "bullets") {
    return (
      <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
        <div className={`${mwClass(st, "max-w-3xl")} mx-auto`}>
          <div className="w-8 h-0.5 mb-6" style={{ background: effectiveColor }} />
          <h2 className="text-4xl font-black tracking-tight mb-12" style={{ color: headClr, letterSpacing: "-0.025em" }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            <EditableText text={s(c.heading, "Section Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
          </h2>
          <div className="divide-y" style={{ borderColor: border }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            {items.map((item, i) => {
              const it = o(item);
              return (
                <div key={i} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-black tabular-nums pt-1 flex-shrink-0" style={{ color: effectiveColor }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] font-medium" style={{ color: headClr }}>
                    <EditableText text={s(it.title ?? it.text, `Point ${i + 1}`)} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, items: arr }); }} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Default: hero-centered
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st, "max-w-3xl")} mx-auto`}>
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border w-fit" style={{ borderColor: `${effectiveColor}40`, background: `${effectiveColor}12` }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: effectiveColor }} />
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: effectiveColor }}>Custom Section</span>
        </div>
        <h2 className="text-5xl font-black tracking-tight mb-5 leading-[1.02]" style={{ color: headClr, letterSpacing: "-0.03em" }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <EditableText text={s(c.heading, "Your Custom Heading")} onSave={(v) => onUpdate?.({ ...c, heading: v })} />
        </h2>
        <p className="text-[17px] mb-10 leading-relaxed max-w-xl" style={{ color: bodyClr }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <EditableText text={s(c.subheading, "Add your subheading or description text here.")} onSave={(v) => onUpdate?.({ ...c, subheading: v })} />
        </p>
        {s(c.cta) && (
          <a href={s(c.ctaLink, "#")} className={`inline-flex items-center gap-2 px-8 py-4 font-bold ${btnRadiusClass(st, "rounded-full")} text-[15px]`} style={btnStyle(st, effectiveColor)} onClick={(e) => { e.stopPropagation(); onSelectElement?.("accents"); }}>
            <EditableText text={s(c.cta)} onSave={(v) => onUpdate?.({ ...c, cta: v })} />
            <span style={{ opacity: 0.7 }}>→</span>
          </a>
        )}
      </div>
    </section>
  );
}

// ── Canvas block renderer ─────────────────────────────────────────────────────

const COL_PAD_R: Record<string, string>    = { none: "", sm: "p-3", md: "p-5", lg: "p-8" };
const COL_RADIUS_R: Record<string, string> = { none: "", sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl" };
const COL_SHADOW_R: Record<string, string> = { none: "", sm: "shadow-sm", md: "shadow-md" };

function canvasColClasses(style?: CanvasColStyle): string {
  if (!style) return "";
  return [
    style.padding ? COL_PAD_R[style.padding] : "",
    style.radius  ? COL_RADIUS_R[style.radius] : "",
    style.shadow  ? COL_SHADOW_R[style.shadow] : "",
    style.border  ? "border" : "",
  ].filter(Boolean).join(" ");
}
function canvasColCssStyle(style?: CanvasColStyle): React.CSSProperties {
  if (!style) return {};
  const cs: React.CSSProperties = {};
  if (style.bg)                          cs.background  = style.bg;
  if (style.border && style.borderColor) cs.borderColor = style.borderColor;
  return cs;
}

function renderCanvasEl(el: CanvasEl, fallbackColor?: string): React.ReactNode {
  const p = el.props ?? {};
  const align = p.align ?? "left";
  const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const wrapperAlignCls = align === "center" ? "flex justify-center" : align === "right" ? "flex justify-end" : "";

  const MB: Record<string, string> = { none: "mb-0", sm: "mb-2", md: "mb-4", lg: "mb-6", xl: "mb-8" };
  const mb = MB[p.marginBottom ?? "md"] ?? "mb-4";

  switch (el.type) {
    case "heading": {
      const sizeMap: Record<string, string> = { sm: "text-lg", md: "text-xl", lg: "text-2xl", xl: "text-3xl", "2xl": "text-4xl" };
      const weightMap: Record<string, string> = { normal: "400", medium: "500", semibold: "600", bold: "700", black: "900" };
      const lsMap: Record<string, string> = { normal: "normal", wide: "0.025em", wider: "0.05em", widest: "0.1em" };
      return (
        <p key={el.id} className={`${sizeMap[p.size ?? "lg"] ?? "text-2xl"} leading-tight ${mb} ${alignCls}`} style={{
          color: p.textColor ?? "#111111",
          fontWeight: weightMap[p.fontWeight ?? "bold"] ?? "700",
          letterSpacing: lsMap[p.letterSpacing ?? "normal"] ?? "normal",
        }}>
          {el.content || "Heading"}
        </p>
      );
    }
    case "text": {
      const tsMap: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" };
      const lhMap: Record<string, string> = { tight: "1.25", normal: "1.5", relaxed: "1.75", loose: "2" };
      const wMap: Record<string, string> = { normal: "400", medium: "500", semibold: "600", bold: "700", black: "900" };
      return (
        <p key={el.id} className={`${tsMap[p.textSize ?? "base"] ?? "text-base"} ${mb} ${alignCls}`} style={{
          color: p.textColor ?? "#6b7280",
          lineHeight: lhMap[p.lineHeight ?? "relaxed"] ?? "1.75",
          fontWeight: wMap[p.fontWeight ?? "normal"] ?? "400",
        }}>
          {el.content || "Text content"}
        </p>
      );
    }
    case "button": {
      const sizeStyle: Record<string, React.CSSProperties> = {
        sm: { padding: "6px 16px", fontSize: "13px" },
        md: { padding: "10px 24px", fontSize: "14px" },
        lg: { padding: "14px 32px", fontSize: "16px" },
      };
      const radiusMap: Record<string, string> = { none: "0px", md: "8px", lg: "12px", full: "9999px" };
      const baseColor = p.color ?? fallbackColor ?? "#000000";
      const btnSty: React.CSSProperties = {
        borderRadius: radiusMap[p.btnRadius ?? "lg"] ?? "12px",
        fontWeight: 700,
        display: "inline-block",
        textDecoration: "none",
        ...(sizeStyle[p.btnSize ?? "md"] ?? sizeStyle.md),
        ...(p.variant === "outline"
          ? { border: `2px solid ${baseColor}`, color: baseColor, background: "transparent" }
          : p.variant === "ghost"
          ? { color: baseColor, background: "transparent" }
          : { background: baseColor, color: "#fff" }),
        ...(p.fullWidth ? { width: "100%", textAlign: "center" } : {}),
      };
      return (
        <div key={el.id} className={`${mb} ${p.fullWidth ? "" : wrapperAlignCls}`}>
          <a href={p.href ?? "#"} style={btnSty} onClick={(e) => e.preventDefault()}
            target={p.newTab ? "_blank" : undefined} rel={p.newTab ? "noopener noreferrer" : undefined}>
            {el.content || "Button"}
          </a>
        </div>
      );
    }
    case "image": {
      const widthMap: Record<string, string> = { auto: "auto", "1/2": "50%", "3/4": "75%", full: "100%" };
      const radiusMap: Record<string, string> = { none: "0px", sm: "6px", md: "12px", lg: "20px", full: "9999px" };
      const shadowMap: Record<string, string> = {
        none: "none", sm: "0 1px 3px rgba(0,0,0,0.1)", md: "0 4px 12px rgba(0,0,0,0.15)", lg: "0 10px 30px rgba(0,0,0,0.2)",
      };
      const imgSty: React.CSSProperties = {
        width: widthMap[p.imgWidth ?? "full"] ?? "100%",
        borderRadius: radiusMap[p.imgRadius ?? "md"] ?? "12px",
        boxShadow: shadowMap[p.imgShadow ?? "none"] ?? "none",
        objectFit: (p.imgFit as React.CSSProperties["objectFit"]) ?? "cover",
        display: "block",
      };
      return (
        <div key={el.id} className={`${mb} ${wrapperAlignCls}`}>
          {p.src
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.src} alt={p.alt ?? ""} style={imgSty} />
            : <div style={{ borderRadius: radiusMap[p.imgRadius ?? "md"] }}
                className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300 text-[13px] border border-dashed border-gray-200">
                Image
              </div>
          }
        </div>
      );
    }
    case "list": {
      const tsMap: Record<string, string> = { sm: "13px", md: "14px", lg: "16px" };
      const spaceMap: Record<string, string> = { tight: "space-y-1", normal: "space-y-2", loose: "space-y-4" };
      const itemColor = p.itemColor ?? "#374151";
      const bulletMap: Record<string, string> = { check: "✓", dot: "•", arrow: "→", number: "", none: "" };
      const items = p.items ?? [];
      return (
        <ul key={el.id} className={`${spaceMap[p.itemSpacing ?? "normal"]} ${mb}`}>
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2" style={{ color: itemColor, fontSize: tsMap[p.itemSize ?? "md"] ?? "14px" }}>
              {p.bulletStyle === "number"
                ? <span className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-white text-[9px] flex-shrink-0 mt-0.5">{i + 1}</span>
                : p.bulletStyle === "none"
                ? null
                : <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 mt-0.5"
                    style={{ background: itemColor }}>{bulletMap[p.bulletStyle ?? "check"]}</span>
              }
              {item}
            </li>
          ))}
        </ul>
      );
    }
    case "divider": {
      const thickMap: Record<string, string> = { "1": "1px", "2": "2px", "4": "4px" };
      const widthMap: Record<string, string> = { full: "100%", "3/4": "75%", "1/2": "50%", "1/4": "25%" };
      return (
        <div key={el.id} className={`${mb} ${wrapperAlignCls || "flex"}`}>
          <hr style={{
            borderStyle: p.divStyle ?? "solid",
            borderTopWidth: thickMap[p.divThickness ?? "1"] ?? "1px",
            borderColor: p.divColor ?? "#e5e7eb",
            width: widthMap[p.divWidth ?? "full"] ?? "100%",
            margin: 0,
          }} />
        </div>
      );
    }
    case "spacer": {
      const hMap: Record<string, string> = { xs: "8px", sm: "16px", md: "32px", lg: "48px", xl: "64px", "2xl": "96px" };
      return <div key={el.id} style={{ height: hMap[p.spacerHeight ?? "md"] ?? "32px" }} />;
    }
    case "div": {
      const ds = el.divStyle;
      const dPad: Record<string, string> = { none: "", sm: "p-3", md: "p-5", lg: "p-8" };
      const dRad: Record<string, string> = { none: "", sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl" };
      const dShd: Record<string, string> = { none: "", sm: "shadow-sm", md: "shadow-md" };
      const divCls = [
        dPad[ds?.padding ?? "none"],
        dRad[ds?.radius ?? "none"],
        dShd[ds?.shadow ?? "none"],
        ds?.border ? "border" : "",
        mb,
      ].filter(Boolean).join(" ");
      const divSty: React.CSSProperties = {};
      if (ds?.bg) divSty.background = ds.bg;
      if (ds?.border && ds.borderColor) divSty.borderColor = ds.borderColor;
      return (
        <div key={el.id} className={divCls} style={divSty}>
          {(el.children ?? []).map((child) => renderCanvasEl(child, fallbackColor))}
        </div>
      );
    }
    default: return null;
  }
}

function CanvasBlock({
  c, color, st, onSelectElement,
}: {
  c: Record<string, unknown>; color?: string; st?: BlockStyles;
  onSelectElement?: (sect: "layout" | "typography") => void;
}) {
  const rows = Array.isArray(c.rows) ? (c.rows as CanvasRow[]) : [];
  const layoutCols: Record<string, number[]> = {
    "1": [12], "1-1": [6, 6], "1-2": [4, 8], "2-1": [8, 4],
    "1-1-1": [4, 4, 4], "1-1-1-1": [3, 3, 3, 3],
  };
  const effectiveColor = color || "#000000";

  return (
    <section
      className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`}
      style={sectionStyle(st)}
      onClick={() => onSelectElement?.("layout")}
    >
      <div className={`${mwClass(st)} mx-auto space-y-6`}>
        {rows.map((row) => {
          const colSpans = layoutCols[row.layout] ?? [12];
          return (
            <div key={row.id} className="grid grid-cols-12 gap-6">
              {row.cols.map((col, ci) => {
                const span = colSpans[ci] ?? 12;
                return (
                  <div
                    key={col.id}
                    className={canvasColClasses(col.style)}
                    style={{ gridColumn: `span ${span} / span ${span}`, ...canvasColCssStyle(col.style) }}
                  >
                    {col.elements.map((el) => renderCanvasEl(el, effectiveColor))}
                  </div>
                );
              })}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="py-12 text-center text-gray-300 text-[13px] border-2 border-dashed border-gray-100 rounded-2xl">
            Empty canvas section
          </div>
        )}
      </div>
    </section>
  );
}

// ── Process block ─────────────────────────────────────────────────────────────

function ProcessBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const steps = a(c.steps);
  const cardBg = st?.cardBg ?? "#ffffff";
  const border = st?.sectionBg ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        <div className="text-center mb-16" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
          <div className="w-8 h-0.5 mb-5 mx-auto" style={{ background: effectiveColor }} />
          <h2 className="text-4xl font-black tracking-tight mb-4" style={{ color: headClr, letterSpacing: "-0.025em" }}>
            <EditableText text={s(c.title, "How We Work")} onSave={(v) => onUpdate?.({ ...c, title: v })} />
          </h2>
          {s(c.subtitle) && <p className="text-[16px] max-w-xl mx-auto" style={{ color: bodyClr }}><EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} /></p>}
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const it = o(step);
            return (
              <div key={i} className="relative p-8 rounded-2xl border flex flex-col gap-4" style={{ background: cardBg, borderColor: border }} onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px] font-black" style={{ background: `${effectiveColor}18`, color: effectiveColor }}>
                  {s(it.step, String(i + 1).padStart(2, "0"))}
                </div>
                <h3 className="text-[16px] font-bold" style={{ color: headClr }}>
                  <EditableText text={s(it.title, `Step ${i + 1}`)} onSave={(v) => { const arr = [...steps]; arr[i] = { ...it, title: v }; onUpdate?.({ ...c, steps: arr }); }} />
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: bodyClr }}>
                  <EditableText text={s(it.description, "Description.")} onSave={(v) => { const arr = [...steps]; arr[i] = { ...it, description: v }; onUpdate?.({ ...c, steps: arr }); }} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Stats block ───────────────────────────────────────────────────────────────

function StatsBlock({
  c, color, st, onUpdate, onSelectElement
}: {
  c: Record<string, unknown>; color: string; st?: BlockStyles;
  onUpdate?: (patch: Record<string, unknown>) => void;
  onSelectElement?: (sect: "layout" | "typography" | "cards") => void;
}) {
  const effectiveColor = accentColor(st, color);
  const headClr = st?.headingColor ?? "#111111";
  const bodyClr = st?.bodyColor    ?? "#6b7280";
  const items = a(c.items);
  return (
    <section className={`${pyClass(st)} px-8 ${sectionTailwindClasses(st)} ${fontClass(st)}`} style={sectionStyle(st)} onClick={() => onSelectElement?.("layout")}>
      <div className={`${mwClass(st)} mx-auto`}>
        {(s(c.title) || s(c.subtitle)) && (
          <div className="text-center mb-12" onClick={(e) => { e.stopPropagation(); onSelectElement?.("typography"); }}>
            {s(c.title) && <h2 className="text-4xl font-black tracking-tight mb-3" style={{ color: headClr, letterSpacing: "-0.025em" }}>
              <EditableText text={s(c.title)} onSave={(v) => onUpdate?.({ ...c, title: v })} />
            </h2>}
            {s(c.subtitle) && <p className="text-[16px]" style={{ color: bodyClr }}><EditableText text={s(c.subtitle)} onSave={(v) => onUpdate?.({ ...c, subtitle: v })} /></p>}
          </div>
        )}
        <div className="grid grid-cols-4 gap-8">
          {items.map((item, i) => {
            const it = o(item);
            return (
              <div key={i} className="text-center" onClick={(e) => { e.stopPropagation(); onSelectElement?.("cards"); }}>
                <p className="text-5xl font-black tracking-tight mb-2" style={{ color: effectiveColor, letterSpacing: "-0.03em" }}>
                  <EditableText text={s(it.value, "99")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, value: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
                <p className="text-[14px] font-semibold" style={{ color: bodyClr }}>
                  <EditableText text={s(it.label, "Metric")} onSave={(v) => { const arr = [...items]; arr[i] = { ...it, label: v }; onUpdate?.({ ...c, items: arr }); }} />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Selectable wrapper ────────────────────────────────────────────────────────

function SelectableBlock({
  blockId, type, isSelected, onSelect, children,
}: {
  blockId: string; type: string; isSelected: boolean;
  onSelect?: (id: string, sect?: "layout" | "typography" | "accents" | "cards") => void; 
  children: React.ReactNode;
}) {
  if (!onSelect) return <>{children}</>;
  return (
    <div
      className={`relative group/sel cursor-pointer outline-none transition-all ${
        isSelected ? "ring-2 ring-inset ring-indigo-500" : "hover:ring-2 hover:ring-inset hover:ring-black/25"
      }`}
      onClick={(e) => { e.stopPropagation(); onSelect(blockId, "layout"); }}
    >
      {children}
      {/* Type badge */}
      <div className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider pointer-events-none transition-all ${
        isSelected
          ? "bg-indigo-500 text-white opacity-100"
          : "bg-black/70 text-white opacity-0 group-hover/sel:opacity-100"
      }`}>
        {type}
      </div>
      {/* Style indicator */}
      <div className={`absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold pointer-events-none transition-all ${
        isSelected
          ? "bg-indigo-500 text-white opacity-100"
          : "bg-black/70 text-white opacity-0 group-hover/sel:opacity-100"
      }`}>
        {isSelected ? "✓ Styling" : "Click to style"}
      </div>
      {/* Selection tint */}
      {isSelected && (
        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none z-10" />
      )}
    </div>
  );
}

// ── Renderer map ───────────────────────────────────────────────────────────────

function SectionCtaRenderer({ sectionCtaText, sectionCtaLink, st, effectiveColor }: {
  sectionCtaText: unknown;
  sectionCtaLink: unknown;
  st?: BlockStyles;
  effectiveColor: string;
}) {
  const text = typeof sectionCtaText === "string" ? sectionCtaText : "";
  const link = typeof sectionCtaLink === "string" ? sectionCtaLink : "#";
  if (!text) return null;
  return (
    <div className="mt-10 px-8 max-w-5xl mx-auto" style={{ textAlign: st?.textAlign ?? "center" }}>
      <a href={link} className={`inline-flex items-center gap-2 px-7 py-3.5 font-bold ${btnRadiusClass(st, "rounded-full")} text-[14px] transition-all hover:scale-105`} style={btnStyle(st, effectiveColor)}>
        {text}
      </a>
    </div>
  );
}

function ExtraElementsRenderer({ extraElements, st, effectiveColor }: {
  extraElements: unknown;
  st?: BlockStyles;
  effectiveColor: string;
}) {
  const els = (Array.isArray(extraElements) ? extraElements : []) as { id: string; type: string; content: string; link?: string }[];
  if (els.length === 0) return null;
  const bodyClr = st?.bodyColor ?? "#6b7280";
  const mtCls = st?.paddingY ? (PADDING_Y[st.paddingY] === "py-12" ? "mt-12" : PADDING_Y[st.paddingY] === "py-20" ? "mt-12" : PADDING_Y[st.paddingY] === "py-8" ? "mt-8" : "mt-10") : "mt-10";
  return (
    <div className={`px-8 max-w-5xl mx-auto ${mtCls}`} style={{ textAlign: st?.textAlign ?? "center" }}>
      {els.map((el) => (
        el.type === "button" ? (
          <a key={el.id} href={el.link || "#"} className={`inline-flex items-center gap-2 px-7 py-3.5 font-bold ${btnRadiusClass(st, "rounded-full")} text-[14px] mr-3 mb-3`} style={btnStyle(st, effectiveColor)}>
            {el.content || "Button"}
          </a>
        ) : (
          <p key={el.id} className="text-[15px] leading-relaxed mb-3 last:mb-0" style={{ color: bodyClr }}>{el.content || "Text"}</p>
        )
      ))}
    </div>
  );
}

function renderBlock(
  block: Block,
  color: string,
  onSelect?: (id: string, sect?: "layout" | "typography" | "accents" | "cards") => void,
  selectedBlockId?: string,
  onUpdateBlockContent?: (blockId: string, content: Record<string, unknown>) => void,
) {
  const c = block.content;
  const st = block.styles;
  const isSelected = selectedBlockId === block.id;
  const effectiveColor = accentColor(st, color);

  const handleUpdate = (patch: Record<string, unknown>) => {
    onUpdateBlockContent?.(block.id, patch);
  };

  const handleSelectElement = (sect: "layout" | "typography" | "accents" | "cards") => {
    onSelect?.(block.id, sect);
  };

  let inner: React.ReactNode;
  switch (block.type) {
    case "header":       inner = <HeaderBlock       c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "hero":         inner = <HeroBlock         c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "about":        inner = <AboutBlock        c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "statement":    inner = <StatementBlock    c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "whyus":        inner = <WhyUsBlock        c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "features":     inner = <FeaturesBlock     c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "services":     inner = <ServicesBlock     c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "testimonials": inner = <TestimonialsBlock c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "team":         inner = <TeamBlock         c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "gallery":      inner = <GalleryBlock      c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "pricing":      inner = <PricingBlock      c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "faq":          inner = <FaqBlock          c={c} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "cta":          inner = <CtaBlock          c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "contact":      inner = <ContactBlock      c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "footer":       inner = <FooterBlock       c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "process":      inner = <ProcessBlock      c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "stats":        inner = <StatsBlock        c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "custom":       inner = <CustomBlock       c={c} color={color} st={st} onUpdate={handleUpdate} onSelectElement={handleSelectElement} />; break;
    case "canvas":       inner = <CanvasBlock       c={c} color={color} st={st} onSelectElement={handleSelectElement} />; break;
    case "html": {
      const html = (c.html as string) ?? "";
      const css  = (c.css  as string) ?? "";
      const doc  = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{overflow:hidden}${css}</style></head><body>${html}</body></html>`;
      inner = (
        <div style={{ width: "100%", minHeight: 200, position: "relative", overflow: "hidden" }}>
          <iframe
            srcDoc={doc}
            style={{ width: "100%", height: "100%", minHeight: 200, border: "none", display: "block" }}
            scrolling="no"
            onLoad={e => {
              const iframe = e.currentTarget;
              const body = iframe.contentDocument?.body;
              if (body) {
                const h = body.scrollHeight;
                if (h > 0) iframe.style.height = `${h}px`;
              }
            }}
          />
        </div>
      );
      break;
    }
    default:
      inner = (
        <div className="py-12 px-8 text-center text-gray-400 bg-gray-50 text-[13px]">
          [{block.type}] block
        </div>
      );
  }

  return (
    <SelectableBlock
      key={block.id}
      blockId={block.id}
      type={block.type}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      {inner}
      <SectionCtaRenderer sectionCtaText={c.sectionCtaText} sectionCtaLink={c.sectionCtaLink} st={st} effectiveColor={effectiveColor} />
      <ExtraElementsRenderer extraElements={c.extraElements} st={st} effectiveColor={effectiveColor} />
    </SelectableBlock>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function BlockPreview({
  blocks, primaryColor = "#000000", onSelectBlock, selectedBlockId, onUpdateBlockContent
}: Props) {
  const isReadOnly = !onUpdateBlockContent && !onSelectBlock;

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4 text-gray-400">
        <div className="text-5xl">🖼️</div>
        <p className="text-[14px] font-semibold text-gray-500">No blocks added yet</p>
        <p className="text-[12px]">Add components from the editor to see your preview</p>
      </div>
    );
  }

  return (
    <ReadOnlyCtx.Provider value={isReadOnly}>
      <div className="bg-white min-h-full">
        {blocks.map((block) => renderBlock(block, primaryColor, onSelectBlock, selectedBlockId, onUpdateBlockContent))}
      </div>
    </ReadOnlyCtx.Provider>
  );
}
