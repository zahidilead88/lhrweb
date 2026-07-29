import type { ElementNode, StyleClass, SiteTokens } from "@/types/builder";
import { stylesToCSS } from "./stylesToCSS";

function hasKeys(obj: object | undefined): obj is object {
  return !!obj && Object.keys(obj).length > 0;
}

function walkElement(el: ElementNode, rules: string[]): void {
  // Desktop (always)
  const desktop = stylesToCSS(el.styles.desktop);
  if (desktop) rules.push(`[data-id="${el.id}"] { ${desktop} }`);

  // Tablet override
  if (hasKeys(el.styles.tablet)) {
    const tablet = stylesToCSS(el.styles.tablet!);
    if (tablet) rules.push(`@media (max-width: 991px) { [data-id="${el.id}"] { ${tablet} } }`);
  }

  // Mobile override
  if (hasKeys(el.styles.mobile)) {
    const mobile = stylesToCSS(el.styles.mobile!);
    if (mobile) rules.push(`@media (max-width: 479px) { [data-id="${el.id}"] { ${mobile} } }`);
  }

  el.children.forEach((child) => walkElement(child, rules));
}

/**
 * Generates a full CSS string from:
 *  - SiteTokens  → :root { --color-*, --font-*, --space-* }
 *  - StyleClass[] → .className { … } with media query overrides
 *  - ElementNode[] → [data-id="…"] { … } with media query overrides
 *
 * CSS specificity order: tokens < classes < element overrides
 */
export function generateCSS(
  elements: ElementNode[],
  classes: StyleClass[] = [],
  tokens?: SiteTokens
): string {
  const rules: string[] = [];

  // 1. CSS custom properties from design tokens
  if (tokens) {
    const vars: string[] = [];
    tokens.colors.forEach((c) => vars.push(`  --color-${c.name}: ${c.value};`));
    tokens.fonts.forEach((f)  => vars.push(`  --font-${f.name}: ${f.family};`));
    Object.entries(tokens.spacing).forEach(([k, v]) => vars.push(`  --space-${k}: ${v};`));
    if (vars.length > 0) rules.push(`:root {\n${vars.join("\n")}\n}`);
  }

  // 2. Named classes
  classes.forEach((cls) => {
    const desktop = stylesToCSS(cls.styles.desktop);
    if (desktop) rules.push(`.${cls.name} { ${desktop} }`);

    if (hasKeys(cls.styles.tablet)) {
      const tablet = stylesToCSS(cls.styles.tablet!);
      if (tablet) rules.push(`@media (max-width: 991px) { .${cls.name} { ${tablet} } }`);
    }

    if (hasKeys(cls.styles.mobile)) {
      const mobile = stylesToCSS(cls.styles.mobile!);
      if (mobile) rules.push(`@media (max-width: 479px) { .${cls.name} { ${mobile} } }`);
    }
  });

  // 3. Element-level styles (highest specificity)
  elements.forEach((el) => walkElement(el, rules));

  return rules.join("\n");
}
