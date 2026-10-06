import type { ElementNode } from "@/types/builder";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — "basic Core Web
// Vitals visibility," built as static heuristics over data already on hand
// (uploaded-asset size/format from the Phase 6 asset library, cross-referenced
// against where each asset URL is actually used on a page) rather than real
// field-collected LCP/CLS/FID, which would need a beacon on the published
// site plus a collection endpoint — a materially bigger, separately-scoped
// undertaking flagged as out of this phase's bounds, not silently skipped.

export interface PerfIssue {
  severity: "warning" | "info";
  rule: "oversized-image" | "legacy-format" | "unused-asset";
  message: string;
  assetId?: string;
}

const OVERSIZED_BYTES = 500 * 1024;
const MODERN_IMAGE_MIMES = new Set(["image/webp", "image/avif", "image/svg+xml"]);

export interface AssetLike { _id: string; url: string; mimetype: string; size: number; type: string; filename: string }

function collectImageUrls(elements: ElementNode[], out: Set<string>): void {
  for (const el of elements) {
    if (el.tag === "img" && el.attrs?.src) out.add(el.attrs.src);
    const bg = el.styles?.desktop?.backgroundImage;
    const m = bg?.match(/url\(([^)]+)\)/);
    if (m) out.add(m[1].replace(/^["']|["']$/g, ""));
    collectImageUrls(el.children ?? [], out);
  }
}

export function checkPerformance(assets: AssetLike[], pages: { elements: ElementNode[] }[]): PerfIssue[] {
  const issues: PerfIssue[] = [];

  const usedUrls = new Set<string>();
  for (const page of pages) collectImageUrls(page.elements ?? [], usedUrls);

  for (const asset of assets) {
    if (asset.type !== "image" && asset.type !== "svg") continue;
    const isUsed = usedUrls.has(asset.url);

    if (asset.size > OVERSIZED_BYTES) {
      issues.push({
        severity: "warning",
        rule: "oversized-image",
        assetId: asset._id,
        message: `"${asset.filename}" is ${(asset.size / 1024 / 1024).toFixed(1)}MB${isUsed ? "" : " (not currently used on any page)"} — consider compressing it.`,
      });
    }

    if (!MODERN_IMAGE_MIMES.has(asset.mimetype) && isUsed) {
      issues.push({
        severity: "info",
        rule: "legacy-format",
        assetId: asset._id,
        message: `"${asset.filename}" is ${asset.mimetype.replace("image/", "").toUpperCase()} — WebP is typically 25–35% smaller at the same quality.`,
      });
    }

    if (!isUsed) {
      issues.push({
        severity: "info",
        rule: "unused-asset",
        assetId: asset._id,
        message: `"${asset.filename}" isn't referenced on any page — delete it to free up your library, or use it.`,
      });
    }
  }

  return issues;
}
