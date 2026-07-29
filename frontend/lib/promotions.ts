// Canvas → Website Intelligence (Blueprint V4.3b): promote a drawn object to a
// website object. Promotions only change tag / label / style hints — never new
// node kinds (Round 2 DM-01). Each returns a NEW node; caller pushes one history entry.

import type { ElementNode, Styles } from "@/types/builder";

export type PromotionRole = "section" | "hero" | "navbar" | "footer" | "container";

const ROLE_PRESETS: Record<PromotionRole, { tag: ElementNode["tag"]; label: string; hints: Partial<Styles> }> = {
  section: {
    tag: "section", label: "Section",
    hints: { padding: "64px 40px" },
  },
  hero: {
    tag: "section", label: "Hero",
    hints: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "96px 40px", gap: "20px" },
  },
  navbar: {
    tag: "nav", label: "Navbar",
    hints: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", gap: "24px" },
  },
  footer: {
    tag: "footer", label: "Footer",
    hints: { padding: "48px 40px" },
  },
  container: {
    tag: "div", label: "Container",
    hints: { maxWidth: "1200px", margin: "0 auto" },
  },
};

export function promoteElement(el: ElementNode, role: PromotionRole): ElementNode {
  const preset = ROLE_PRESETS[role];
  return {
    ...el,
    tag: preset.tag,
    label: preset.label,
    styles: {
      ...el.styles,
      // hints first — the element's own styles always win
      desktop: { ...preset.hints, ...el.styles.desktop },
    },
  };
}

export const PROMOTION_ROLES: { role: PromotionRole; label: string }[] = [
  { role: "section", label: "Convert to Section" },
  { role: "hero",    label: "Convert to Hero" },
  { role: "navbar",  label: "Convert to Navbar" },
  { role: "footer",  label: "Convert to Footer" },
];
