import { describe, expect, it } from "vitest";
import { stylesToCSS } from "./stylesToCSS";

describe("stylesToCSS", () => {
  it("converts plain camelCase properties to kebab-case CSS", () => {
    expect(stylesToCSS({ paddingTop: "40px", color: "#fff" })).toBe("padding-top: 40px; color: #fff");
  });

  it("appends px to a bare number, but not for unitless properties", () => {
    expect(stylesToCSS({ opacity: 0.5, zIndex: 3, gap: 16 })).toBe("opacity: 0.5; z-index: 3; gap: 16px");
  });

  it("skips undefined/empty/null values", () => {
    expect(stylesToCSS({ color: "#000", backgroundColor: undefined, border: "" })).toBe("color: #000");
  });

  // Phase 6 — multi-shadow list
  describe("boxShadowLayers", () => {
    it("composes visible layers into a single box-shadow declaration", () => {
      const css = stylesToCSS({
        boxShadowLayers: [
          { visible: true, type: "drop-shadow", x: 0, y: 2, blur: 8, spread: 0, color: "rgba(0,0,0,0.15)" },
          { visible: true, type: "inner-shadow", x: 1, y: 1, blur: 2, spread: 0, color: "#000" },
        ],
      });
      expect(css).toBe("box-shadow: 0px 2px 8px 0px rgba(0,0,0,0.15), inset 1px 1px 2px 0px #000");
    });

    it("excludes hidden layers", () => {
      const css = stylesToCSS({
        boxShadowLayers: [
          { visible: false, type: "drop-shadow", x: 0, y: 2, blur: 8, spread: 0, color: "red" },
          { visible: true, type: "drop-shadow", x: 1, y: 1, blur: 1, spread: 0, color: "blue" },
        ],
      });
      expect(css).toBe("box-shadow: 1px 1px 1px 0px blue");
    });

    it("replaces a plain boxShadow string when layers are present", () => {
      const css = stylesToCSS({
        boxShadow: "0 0 0 1px red",
        boxShadowLayers: [{ visible: true, type: "drop-shadow", x: 0, y: 1, blur: 1, spread: 0, color: "blue" }],
      });
      expect(css).toBe("box-shadow: 0px 1px 1px 0px blue");
    });

    it("falls back to the plain boxShadow string when there are no layers", () => {
      expect(stylesToCSS({ boxShadow: "0 0 0 1px red" })).toBe("box-shadow: 0 0 0 1px red");
    });

    it("contributes nothing when the layer list is empty", () => {
      expect(stylesToCSS({ boxShadowLayers: [] })).toBe("");
    });
  });

  // Phase 6 — line-clamp truncation
  describe("lineClamp", () => {
    it("expands into the full -webkit-line-clamp declaration set", () => {
      expect(stylesToCSS({ lineClamp: 3 })).toBe(
        "display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden"
      );
    });

    it("is omitted when 0", () => {
      expect(stylesToCSS({ lineClamp: 0 })).toBe("");
    });

    it("coexists with ordinary declarations", () => {
      expect(stylesToCSS({ color: "#111", lineClamp: 2 })).toBe(
        "color: #111; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden"
      );
    });
  });
});
