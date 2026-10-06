import { describe, expect, it } from "vitest";
import { elementsToFrame } from "./frameToElements";
import type { ElementNode } from "@/types/builder";

function el(id: string): ElementNode {
  return { id, tag: "div", content: "x", children: [], styles: { desktop: {} } };
}

describe("elementsToFrame", () => {
  it("brings the page's name along as the frame's name", () => {
    const frame = elementsToFrame("About", [el("a")]);
    expect(frame.name).toBe("About");
  });

  it("carries every element over as a frame child, in order", () => {
    const frame = elementsToFrame("Home", [el("a"), el("b"), el("c")]);
    expect(frame.children.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("gives every child a real layout so it's immediately placeable/draggable on the Free canvas", () => {
    const frame = elementsToFrame("Home", [el("a"), el("b")]);
    frame.children.forEach((c) => {
      expect(c.layout).toBeDefined();
      expect(typeof c.layout!.x).toBe("number");
      expect(typeof c.layout!.y).toBe("number");
      expect(c.layout!.width).toBeGreaterThan(0);
    });
  });

  it("stacks children top to bottom without overlapping", () => {
    const frame = elementsToFrame("Home", [el("a"), el("b"), el("c")]);
    const tops = frame.children.map((c) => c.layout!.y);
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }
  });

  it("sizes the frame tall enough to actually contain everything it stacked", () => {
    const frame = elementsToFrame("Home", [el("a"), el("b"), el("c"), el("d"), el("e")]);
    const last = frame.children[frame.children.length - 1];
    expect(frame.height).toBeGreaterThanOrEqual(last.layout!.y + last.layout!.height!);
  });

  it("produces a valid, empty-but-usable frame for a page with no elements", () => {
    const frame = elementsToFrame("Blank Page", []);
    expect(frame.children).toEqual([]);
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.height).toBeGreaterThan(0);
  });

  it("gives each generated frame a unique id", () => {
    const a = elementsToFrame("Home", [el("a")]);
    const b = elementsToFrame("Home", [el("a")]);
    expect(a.id).not.toBe(b.id);
  });
});
