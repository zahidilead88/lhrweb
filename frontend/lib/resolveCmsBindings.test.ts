import { describe, expect, it } from "vitest";
import { resolveCmsBindings } from "./resolveCmsBindings";
import type { ElementNode, CmsEntry } from "@/types/builder";

function el(overrides: Partial<ElementNode>): ElementNode {
  return { id: "el-1", tag: "p", children: [], styles: { desktop: {} }, ...overrides };
}

const entries: CmsEntry[] = [
  { _id: "entry-1", collectionId: "col-1", slug: "post-1", values: { title: "Real Title", cover: "https://x/img.jpg" }, published: true, order: 0 },
];

const listEntries: CmsEntry[] = [
  { _id: "a", collectionId: "col-1", slug: "a", values: { title: "Alpha", rank: 3 }, published: true, order: 0 },
  { _id: "b", collectionId: "col-1", slug: "b", values: { title: "Bravo", rank: 1 }, published: true, order: 1 },
  { _id: "c", collectionId: "col-1", slug: "c", values: { title: "Charlie", rank: 2 }, published: false, order: 2 },
  { _id: "d", collectionId: "col-2", slug: "d", values: { title: "Other collection" }, published: true, order: 0 },
];

describe("resolveCmsBindings", () => {
  it("returns elements unchanged when there are no entries", () => {
    const elements = [el({ content: "placeholder" })];
    expect(resolveCmsBindings(elements, [])).toBe(elements);
  });

  it("leaves unbound elements untouched", () => {
    const elements = [el({ content: "static text" })];
    const [result] = resolveCmsBindings(elements, entries);
    expect(result.content).toBe("static text");
  });

  it("substitutes text content for a bound text element", () => {
    const elements = [el({ content: "placeholder", cmsBinding: { collectionId: "col-1", entryId: "entry-1", field: "title" } })];
    const [result] = resolveCmsBindings(elements, entries);
    expect(result.content).toBe("Real Title");
  });

  it("substitutes attrs.src for a bound img element", () => {
    const elements = [el({ tag: "img", attrs: { alt: "cover" }, cmsBinding: { collectionId: "col-1", entryId: "entry-1", field: "cover" } })];
    const [result] = resolveCmsBindings(elements, entries);
    expect(result.attrs?.src).toBe("https://x/img.jpg");
    expect(result.attrs?.alt).toBe("cover");
  });

  it("falls back to the placeholder when the bound entry no longer exists", () => {
    const elements = [el({ content: "placeholder", cmsBinding: { collectionId: "col-1", entryId: "missing", field: "title" } })];
    const [result] = resolveCmsBindings(elements, entries);
    expect(result.content).toBe("placeholder");
  });

  it("resolves bindings on nested children", () => {
    const elements = [el({
      tag: "div",
      children: [el({ id: "child-1", content: "placeholder", cmsBinding: { collectionId: "col-1", entryId: "entry-1", field: "title" } })],
    })];
    const [result] = resolveCmsBindings(elements, entries);
    expect(result.children[0].content).toBe("Real Title");
  });

  it("resolves an entry-less binding against the supplied context entry", () => {
    const elements = [el({ content: "placeholder", cmsBinding: { collectionId: "col-1", field: "title" } })];
    const [result] = resolveCmsBindings(elements, entries, entries[0]);
    expect(result.content).toBe("Real Title");
  });

  describe("cmsList", () => {
    it("repeats the template once per matching, published entry", () => {
      const elements = [el({
        tag: "div",
        cmsList: { collectionId: "col-1" },
        children: [el({ id: "item", tag: "h3", cmsBinding: { collectionId: "col-1", field: "title" } })],
      })];
      const [result] = resolveCmsBindings(elements, listEntries);
      // 2 published entries in col-1 (Alpha, Bravo) — Charlie is unpublished, "Other collection" is a different collection
      expect(result.children.map((c) => c.content)).toEqual(["Alpha", "Bravo"]);
    });

    it("applies limit", () => {
      const elements = [el({ cmsList: { collectionId: "col-1", limit: 1 }, children: [el({ tag: "h3", cmsBinding: { collectionId: "col-1", field: "title" } })] })];
      const [result] = resolveCmsBindings(elements, listEntries);
      expect(result.children).toHaveLength(1);
    });

    it("applies sort", () => {
      const elements = [el({ cmsList: { collectionId: "col-1", sortField: "rank", sortDir: "asc" }, children: [el({ tag: "h3", cmsBinding: { collectionId: "col-1", field: "title" } })] })];
      const [result] = resolveCmsBindings(elements, listEntries);
      expect(result.children.map((c) => c.content)).toEqual(["Bravo", "Alpha"]);
    });

    it("applies an equality filter", () => {
      const elements = [el({ cmsList: { collectionId: "col-1", filterField: "title", filterEquals: "Alpha" }, children: [el({ tag: "h3", cmsBinding: { collectionId: "col-1", field: "title" } })] })];
      const [result] = resolveCmsBindings(elements, listEntries);
      expect(result.children.map((c) => c.content)).toEqual(["Alpha"]);
    });

    it("produces no items when nothing matches", () => {
      const elements = [el({ cmsList: { collectionId: "col-nonexistent" }, children: [el({ tag: "h3", content: "template" })] })];
      const [result] = resolveCmsBindings(elements, listEntries);
      expect(result.children).toHaveLength(0);
    });
  });
});
