import { describe, expect, it } from "vitest";
import { pathFromKey, pathToKey, getNodeAtPath, mergeMasterIntoInstance, findEnclosingInstance } from "./componentInstances";
import type { ElementNode } from "@/types/builder";

function el(id: string, overrides: Partial<ElementNode> = {}): ElementNode {
  return { id, tag: "div", children: [], styles: { desktop: {} }, ...overrides };
}

describe("pathToKey / pathFromKey", () => {
  it("round-trips a path", () => {
    expect(pathToKey([0, 2, 1])).toBe("0,2,1");
    expect(pathFromKey("0,2,1")).toEqual([0, 2, 1]);
  });

  it("treats the root as an empty path", () => {
    expect(pathToKey([])).toBe("");
    expect(pathFromKey("")).toEqual([]);
  });
});

describe("getNodeAtPath", () => {
  const tree = el("root", { children: [el("a"), el("b", { children: [el("b0"), el("b1")] })] });

  it("returns the root for an empty path", () => {
    expect(getNodeAtPath(tree, [])?.id).toBe("root");
  });

  it("resolves a nested path", () => {
    expect(getNodeAtPath(tree, [1, 1])?.id).toBe("b1");
  });

  it("returns null for an out-of-range path", () => {
    expect(getNodeAtPath(tree, [5])).toBeNull();
    expect(getNodeAtPath(tree, [1, 5])).toBeNull();
  });
});

describe("mergeMasterIntoInstance", () => {
  it("uses the new master's structure everywhere by default", () => {
    const newMaster = el("m-root", { content: "new chrome", children: [el("m-image", { content: "new placeholder" })] });
    const oldInstance = el("i-root", { content: "old chrome", layout: { x: 10, y: 20, width: 100, height: 50 }, componentId: "comp-1", children: [el("i-image", { content: "custom photo" })] });

    const merged = mergeMasterIntoInstance(newMaster, oldInstance, []);
    expect(merged.content).toBe("new chrome");
    expect(merged.children[0].content).toBe("new placeholder");
  });

  it("preserves a slot path's whole subtree from the instance instead of the new master", () => {
    const newMaster = el("m-root", { content: "new chrome", children: [el("m-image", { content: "new placeholder" }), el("m-caption", { content: "new caption" })] });
    const oldInstance = el("i-root", { content: "old chrome", children: [el("i-image", { content: "custom photo", attrs: { src: "custom.jpg" } }), el("i-caption", { content: "old caption" })] });

    // slot path "0" = the image child
    const merged = mergeMasterIntoInstance(newMaster, oldInstance, ["0"]);
    expect(merged.content).toBe("new chrome"); // non-slot chrome still synced
    expect(merged.children[0].id).toBe("i-image"); // slot preserved, including its own id
    expect(merged.children[0].content).toBe("custom photo");
    expect(merged.children[0].attrs?.src).toBe("custom.jpg");
    expect(merged.children[1].content).toBe("new caption"); // non-slot caption still synced
  });

  it("preserves the instance's own layout, componentId, and variantId regardless of slots", () => {
    const newMaster = el("m-root", { children: [] });
    const oldInstance = el("i-root", { layout: { x: 1, y: 2, width: 3, height: 4 }, componentId: "comp-1", variantId: "var-primary", children: [] });
    const merged = mergeMasterIntoInstance(newMaster, oldInstance, []);
    expect(merged.layout).toEqual({ x: 1, y: 2, width: 3, height: 4 });
    expect(merged.componentId).toBe("comp-1");
    expect(merged.variantId).toBe("var-primary");
  });

  it("preserves a slot at the root itself (empty path)", () => {
    const newMaster = el("m-root", { content: "new" });
    const oldInstance = el("i-root", { content: "old", componentId: "comp-1" });
    const merged = mergeMasterIntoInstance(newMaster, oldInstance, [""]);
    // root content preserved from instance (via the slot), but componentId/layout still forced from the instance afterward too
    expect(merged.content).toBe("old");
  });

  it("silently drops a slot whose structural position no longer exists in the new master", () => {
    const newMaster = el("m-root", { children: [el("m-only-child")] }); // master now has only 1 child
    const oldInstance = el("i-root", { children: [el("i-child-0"), el("i-child-1", { content: "was slot 1" })] });
    // slot path "1" doesn't exist in newMaster's structure (only index 0 exists)
    const merged = mergeMasterIntoInstance(newMaster, oldInstance, ["1"]);
    expect(merged.children).toHaveLength(1);
    expect(merged.children[0].id).toBe("m-only-child");
  });
});

describe("findEnclosingInstance", () => {
  it("finds the instance a nested element belongs to, and its path", () => {
    const instance = el("instance-root", { componentId: "comp-1", children: [el("a"), el("b", { children: [el("target")] })] });
    const roots = [el("page-wrapper", { children: [instance] })];
    const result = findEnclosingInstance(roots, "target");
    expect(result?.instance.id).toBe("instance-root");
    expect(result?.path).toEqual([1, 0]);
  });

  it("returns null when the target has no enclosing instance", () => {
    const roots = [el("plain", { children: [el("target")] })];
    expect(findEnclosingInstance(roots, "target")).toBeNull();
  });

  it("returns null for an instance root selected directly (can't be its own slot)", () => {
    const instance = el("instance-root", { componentId: "comp-1", children: [] });
    const roots = [el("page-wrapper", { children: [instance] })];
    expect(findEnclosingInstance(roots, "instance-root")).toBeNull();
  });

  it("uses the nearest (innermost) instance when instances are nested", () => {
    const inner = el("inner-root", { componentId: "comp-inner", children: [el("target")] });
    const outer = el("outer-root", { componentId: "comp-outer", children: [inner] });
    const roots = [outer];
    const result = findEnclosingInstance(roots, "target");
    expect(result?.instance.id).toBe("inner-root");
    expect(result?.path).toEqual([0]);
  });
});
