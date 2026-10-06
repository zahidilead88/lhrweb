import { describe, expect, it } from "vitest";
import { checkAccessibility } from "./a11yCheck";
import type { ElementNode } from "@/types/builder";

function el(overrides: Partial<ElementNode> & { id: string; tag: ElementNode["tag"] }): ElementNode {
  return { children: [], styles: { desktop: {} }, ...overrides };
}

function page(id: string, elements: ElementNode[]) {
  return { id, name: `Page ${id}`, elements };
}

describe("checkAccessibility", () => {
  it("flags an image with no alt text", () => {
    const issues = checkAccessibility([page("p1", [el({ id: "img1", tag: "img", attrs: { src: "x.png" } })])]);
    expect(issues.some((i) => i.rule === "missing-alt" && i.elementId === "img1")).toBe(true);
  });

  it("does not flag an image with real alt text", () => {
    const issues = checkAccessibility([page("p1", [el({ id: "img1", tag: "img", attrs: { src: "x.png", alt: "A cat" } })])]);
    expect(issues.some((i) => i.rule === "missing-alt")).toBe(false);
  });

  it("does not flag an <img> with no src at all (not yet configured, not a real issue)", () => {
    const issues = checkAccessibility([page("p1", [el({ id: "img1", tag: "img", attrs: {} })])]);
    expect(issues.some((i) => i.rule === "missing-alt")).toBe(false);
  });

  it("flags a second h1 on the same page", () => {
    const issues = checkAccessibility([page("p1", [
      el({ id: "h1a", tag: "h1", content: "Title" }),
      el({ id: "h1b", tag: "h1", content: "Another title" }),
    ])]);
    expect(issues.filter((i) => i.rule === "multiple-h1")).toHaveLength(1);
    expect(issues.find((i) => i.rule === "multiple-h1")?.elementId).toBe("h1b");
  });

  it("does not flag a single h1", () => {
    const issues = checkAccessibility([page("p1", [el({ id: "h1a", tag: "h1", content: "Title" })])]);
    expect(issues.some((i) => i.rule === "multiple-h1")).toBe(false);
  });

  it("flags a heading level skip (h2 straight to h4)", () => {
    const issues = checkAccessibility([page("p1", [
      el({ id: "h2a", tag: "h2", content: "Section" }),
      el({ id: "h4a", tag: "h4", content: "Sub-sub" }),
    ])]);
    expect(issues.some((i) => i.rule === "heading-skip" && i.elementId === "h4a")).toBe(true);
  });

  it("does not flag a normal sequential heading order", () => {
    const issues = checkAccessibility([page("p1", [
      el({ id: "h1a", tag: "h1", content: "Title" }),
      el({ id: "h2a", tag: "h2", content: "Section" }),
      el({ id: "h3a", tag: "h3", content: "Sub" }),
    ])]);
    expect(issues.some((i) => i.rule === "heading-skip")).toBe(false);
  });

  it("finds headings nested inside container elements, in document order", () => {
    const issues = checkAccessibility([page("p1", [
      el({ id: "wrap", tag: "div", children: [
        el({ id: "h1a", tag: "h1", content: "Title" }),
        el({ id: "h3a", tag: "h3", content: "Too deep" }),
      ] }),
    ])]);
    expect(issues.some((i) => i.rule === "heading-skip" && i.elementId === "h3a")).toBe(true);
  });

  describe("contrast", () => {
    it("flags low contrast (light grey on white)", () => {
      const issues = checkAccessibility([page("p1", [
        el({ id: "t1", tag: "p", content: "hi", styles: { desktop: { color: "#cccccc", backgroundColor: "#ffffff" } } }),
      ])]);
      expect(issues.some((i) => i.rule === "low-contrast" && i.elementId === "t1")).toBe(true);
    });

    it("does not flag high contrast (black on white)", () => {
      const issues = checkAccessibility([page("p1", [
        el({ id: "t1", tag: "p", content: "hi", styles: { desktop: { color: "#000000", backgroundColor: "#ffffff" } } }),
      ])]);
      expect(issues.some((i) => i.rule === "low-contrast")).toBe(false);
    });

    it("skips elements missing either color or background (nothing to compare)", () => {
      const issues = checkAccessibility([page("p1", [
        el({ id: "t1", tag: "p", content: "hi", styles: { desktop: { color: "#cccccc" } } }),
      ])]);
      expect(issues.some((i) => i.rule === "low-contrast")).toBe(false);
    });

    it("skips non-hex colors rather than guessing (e.g. a CSS variable or rgba string)", () => {
      const issues = checkAccessibility([page("p1", [
        el({ id: "t1", tag: "p", content: "hi", styles: { desktop: { color: "var(--tx)", backgroundColor: "rgba(0,0,0,0.5)" } } }),
      ])]);
      expect(issues.some((i) => i.rule === "low-contrast")).toBe(false);
    });
  });

  describe("form fields", () => {
    it("flags an input with neither placeholder nor aria-label", () => {
      const issues = checkAccessibility([page("p1", [el({ id: "in1", tag: "input", attrs: { type: "text" } })])]);
      expect(issues.some((i) => i.rule === "unlabeled-field" && i.elementId === "in1")).toBe(true);
    });

    it("does not flag an input with a placeholder", () => {
      const issues = checkAccessibility([page("p1", [el({ id: "in1", tag: "input", attrs: { type: "text", placeholder: "Your name" } })])]);
      expect(issues.some((i) => i.rule === "unlabeled-field")).toBe(false);
    });

    it("does not flag a hidden input", () => {
      const issues = checkAccessibility([page("p1", [el({ id: "in1", tag: "input", attrs: { type: "hidden" } })])]);
      expect(issues.some((i) => i.rule === "unlabeled-field")).toBe(false);
    });
  });

  describe("empty links", () => {
    it("flags a link with no content and no children", () => {
      const issues = checkAccessibility([page("p1", [el({ id: "a1", tag: "a", attrs: { href: "/about" } })])]);
      expect(issues.some((i) => i.rule === "empty-link" && i.elementId === "a1")).toBe(true);
    });

    it("does not flag a link with visible text in a nested child", () => {
      const issues = checkAccessibility([page("p1", [
        el({ id: "a1", tag: "a", attrs: { href: "/about" }, children: [el({ id: "span1", tag: "span", content: "About us" })] }),
      ])]);
      expect(issues.some((i) => i.rule === "empty-link")).toBe(false);
    });

    it("does not flag a link with only an aria-label (icon link)", () => {
      const issues = checkAccessibility([page("p1", [el({ id: "a1", tag: "a", attrs: { href: "/about", "aria-label": "About us" } })])]);
      expect(issues.some((i) => i.rule === "empty-link")).toBe(false);
    });
  });
});
