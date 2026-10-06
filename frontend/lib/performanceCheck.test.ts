import { describe, expect, it } from "vitest";
import { checkPerformance, type AssetLike } from "./performanceCheck";
import type { ElementNode } from "@/types/builder";

function asset(overrides: Partial<AssetLike> & { _id: string }): AssetLike {
  return { url: "/x.png", mimetype: "image/png", size: 100, type: "image", filename: "x.png", ...overrides };
}

function img(id: string, src: string): ElementNode {
  return { id, tag: "img", attrs: { src }, children: [], styles: { desktop: {} } };
}

describe("checkPerformance", () => {
  it("flags an oversized image", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/big.png", size: 600 * 1024, filename: "big.png" })],
      [{ elements: [img("i1", "/big.png")] }]
    );
    expect(issues.some((i) => i.rule === "oversized-image" && i.assetId === "a1")).toBe(true);
  });

  it("does not flag a small image", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/small.png", size: 50 * 1024 })],
      [{ elements: [img("i1", "/small.png")] }]
    );
    expect(issues.some((i) => i.rule === "oversized-image")).toBe(false);
  });

  it("flags a used legacy-format (non-WebP/AVIF/SVG) image", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/photo.jpg", mimetype: "image/jpeg", size: 10 * 1024 })],
      [{ elements: [img("i1", "/photo.jpg")] }]
    );
    expect(issues.some((i) => i.rule === "legacy-format" && i.assetId === "a1")).toBe(true);
  });

  it("does not flag a WebP image as legacy-format", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/photo.webp", mimetype: "image/webp", size: 10 * 1024 })],
      [{ elements: [img("i1", "/photo.webp")] }]
    );
    expect(issues.some((i) => i.rule === "legacy-format")).toBe(false);
  });

  it("does not flag legacy-format for an unused asset (nothing to optimize on a live page)", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/photo.jpg", mimetype: "image/jpeg", size: 10 * 1024 })],
      [{ elements: [] }]
    );
    expect(issues.some((i) => i.rule === "legacy-format")).toBe(false);
  });

  it("flags an asset not referenced by any page as unused", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/orphan.png" })],
      [{ elements: [img("i1", "/other.png")] }]
    );
    expect(issues.some((i) => i.rule === "unused-asset" && i.assetId === "a1")).toBe(true);
  });

  it("finds an image referenced via backgroundImage, not just <img src>", () => {
    const bgEl: ElementNode = { id: "d1", tag: "div", attrs: {}, children: [], styles: { desktop: { backgroundImage: 'url("/bg.png")' } } };
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/bg.png", size: 600 * 1024 })],
      [{ elements: [bgEl] }]
    );
    const issue = issues.find((i) => i.rule === "oversized-image");
    expect(issue).toBeDefined();
    expect(issue?.message).not.toContain("not currently used");
  });

  it("finds a used image nested inside container elements", () => {
    const nested: ElementNode = { id: "wrap", tag: "div", attrs: {}, styles: { desktop: {} }, children: [img("i1", "/deep.png")] };
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/deep.png" })],
      [{ elements: [nested] }]
    );
    expect(issues.some((i) => i.rule === "unused-asset")).toBe(false);
  });

  it("ignores non-image/svg assets entirely", () => {
    const issues = checkPerformance(
      [asset({ _id: "a1", url: "/font.woff2", mimetype: "font/woff2", type: "font", size: 900 * 1024 })],
      [{ elements: [] }]
    );
    expect(issues).toHaveLength(0);
  });
});
