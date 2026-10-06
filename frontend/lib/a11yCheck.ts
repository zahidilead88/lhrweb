import type { ElementNode } from "@/types/builder";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — accessibility
// checks, computed client-side from data already in ElementNode[]. No new
// schema, no save-path changes — a pure scan surfaced in a new panel.

export interface A11yIssue {
  pageId: string;
  pageName: string;
  elementId: string;
  severity: "error" | "warning";
  rule: "missing-alt" | "heading-skip" | "multiple-h1" | "low-contrast" | "unlabeled-field" | "empty-link";
  message: string;
}

const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
const FIELD_TAGS = new Set(["input", "textarea", "select"]);

function walk(el: ElementNode, visit: (el: ElementNode) => void): void {
  visit(el);
  (el.children ?? []).forEach((c) => walk(c, visit));
}

function hasVisibleText(el: ElementNode): boolean {
  if (el.content && el.content.trim()) return true;
  return (el.children ?? []).some(hasVisibleText);
}

/** WCAG relative luminance + contrast ratio, from #rrggbb (or #rgb) hex only — anything else is skipped, not guessed at. */
function contrastRatio(hex1: string, hex2: string): number | null {
  const lum = (hex: string): number | null => {
    const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  if (l1 === null || l2 === null) return null;
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkAccessibility(pages: { id: string; name: string; elements: ElementNode[] }[]): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (const page of pages) {
    const headings: { id: string; level: number }[] = [];

    for (const root of page.elements ?? []) {
      walk(root, (el) => {
        // Missing alt text
        if (el.tag === "img" && el.attrs?.src && !el.attrs?.alt?.trim()) {
          issues.push({ pageId: page.id, pageName: page.name, elementId: el.id, severity: "error", rule: "missing-alt", message: "Image has no alt text." });
        }

        // Heading hierarchy — collected here, evaluated once per page below
        const level = HEADING_LEVEL[el.tag];
        if (level) headings.push({ id: el.id, level });

        // Contrast — only when both color and backgroundColor are set on the same element
        const color = el.styles?.desktop?.color;
        const bg = el.styles?.desktop?.backgroundColor;
        if (color && bg) {
          const ratio = contrastRatio(color, bg);
          if (ratio !== null && ratio < 4.5) {
            issues.push({ pageId: page.id, pageName: page.name, elementId: el.id, severity: "warning", rule: "low-contrast", message: `Text contrast is ${ratio.toFixed(2)}:1 — WCAG AA wants at least 4.5:1.` });
          }
        }

        // Unlabeled form fields — no placeholder and no aria-label
        if (FIELD_TAGS.has(el.tag) && el.attrs?.type !== "hidden" && !el.attrs?.placeholder?.trim() && !el.attrs?.["aria-label"]?.trim()) {
          issues.push({ pageId: page.id, pageName: page.name, elementId: el.id, severity: "warning", rule: "unlabeled-field", message: "Form field has no placeholder or aria-label for screen readers." });
        }

        // Links with no discernible text
        if (el.tag === "a" && !el.attrs?.["aria-label"]?.trim() && !hasVisibleText(el)) {
          issues.push({ pageId: page.id, pageName: page.name, elementId: el.id, severity: "error", rule: "empty-link", message: "Link has no text and no aria-label." });
        }
      });
    }

    const h1Count = headings.filter((h) => h.level === 1).length;
    if (h1Count > 1) {
      headings.filter((h) => h.level === 1).slice(1).forEach((h) => {
        issues.push({ pageId: page.id, pageName: page.name, elementId: h.id, severity: "warning", rule: "multiple-h1", message: `Page has ${h1Count} <h1> elements — should have exactly one.` });
      });
    }
    for (let i = 1; i < headings.length; i++) {
      const skip = headings[i].level - headings[i - 1].level;
      if (skip > 1) {
        issues.push({ pageId: page.id, pageName: page.name, elementId: headings[i].id, severity: "warning", rule: "heading-skip", message: `Heading jumps from h${headings[i - 1].level} to h${headings[i].level} — skips a level.` });
      }
    }
  }

  return issues;
}
