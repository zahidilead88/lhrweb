import { describe, expect, it } from "vitest";
import { resolveProductBindings } from "./resolveProductBindings";
import type { ElementNode, Product } from "@/types/builder";

function el(overrides: Partial<ElementNode>): ElementNode {
  return { id: "el-1", tag: "p", children: [], styles: { desktop: {} }, ...overrides };
}

function product(overrides: Partial<Product>): Product {
  return {
    _id: "p1", projectId: "proj", name: "Widget", slug: "widget", status: "active",
    images: [{ url: "https://x/widget.jpg" }], price: 19.99, options: [], variants: [],
    collections: [], tags: [], ...overrides,
  };
}

const products: Product[] = [product({})];

describe("resolveProductBindings", () => {
  it("returns elements unchanged when there are no products", () => {
    const elements = [el({ content: "placeholder" })];
    expect(resolveProductBindings(elements, [])).toBe(elements);
  });

  it("substitutes name/price/compareAtPrice/availability as text content", () => {
    const p = product({ price: 25, compareAtPrice: 40, inventory: { track: true, quantity: 3, policy: "deny" } });
    const nameEl = el({ productBinding: { productId: "p1", field: "name" } });
    const priceEl = el({ productBinding: { productId: "p1", field: "price" } });
    const compareEl = el({ productBinding: { productId: "p1", field: "compareAtPrice" } });
    const availEl = el({ productBinding: { productId: "p1", field: "availability" } });
    const [r1, r2, r3, r4] = resolveProductBindings([nameEl, priceEl, compareEl, availEl], [p]);
    expect(r1.content).toBe("Widget");
    expect(r2.content).toBe("$25.00");
    expect(r3.content).toBe("$40.00");
    expect(r4.content).toBe("In Stock");
  });

  it("reports out of stock when inventory is tracked and zero", () => {
    const p = product({ inventory: { track: true, quantity: 0, policy: "deny" } });
    const [result] = resolveProductBindings([el({ productBinding: { productId: "p1", field: "availability" } })], [p]);
    expect(result.content).toBe("Out of Stock");
  });

  it("treats untracked inventory as always in stock", () => {
    const p = product({ inventory: { track: false, quantity: 0, policy: "deny" } });
    const [result] = resolveProductBindings([el({ productBinding: { productId: "p1", field: "availability" } })], [p]);
    expect(result.content).toBe("In Stock");
  });

  it("substitutes attrs.src for an image binding", () => {
    const [result] = resolveProductBindings([el({ tag: "img", productBinding: { productId: "p1", field: "image" } })], products);
    expect(result.attrs?.src).toBe("https://x/widget.jpg");
  });

  it("substitutes attrs.href for a url binding, using the supplied prefix", () => {
    const [result] = resolveProductBindings([el({ tag: "a", productBinding: { productId: "p1", field: "url" } })], products, null, "/products");
    expect(result.attrs?.href).toBe("/products/widget");
  });

  it("omits href for a url binding when no prefix is supplied", () => {
    const [result] = resolveProductBindings([el({ tag: "a", productBinding: { productId: "p1", field: "url" } })], products);
    expect(result.attrs?.href).toBeUndefined();
  });

  it("resolves an id-less binding against the supplied context product", () => {
    const [result] = resolveProductBindings([el({ productBinding: { field: "name" } })], products, products[0]);
    expect(result.content).toBe("Widget");
  });

  it("marks addToCart elements with data-add-to-cart using the context product, disabled when out of stock", () => {
    const inStock = product({ _id: "in", inventory: { track: true, quantity: 2, policy: "deny" } });
    const outOfStock = product({ _id: "out", inventory: { track: true, quantity: 0, policy: "deny" } });
    const [r1] = resolveProductBindings([el({ tag: "button", addToCart: true })], [inStock], inStock);
    const [r2] = resolveProductBindings([el({ tag: "button", addToCart: true })], [outOfStock], outOfStock);
    expect(r1.attrs?.["data-add-to-cart"]).toBe("in");
    expect(r1.attrs?.["data-add-to-cart-disabled"]).toBeUndefined();
    expect(r2.attrs?.["data-add-to-cart-disabled"]).toBe("true");
  });

  it("leaves addToCart unresolved (no data attribute) when there is no context product", () => {
    const [result] = resolveProductBindings([el({ tag: "button", addToCart: true })], products);
    expect(result.attrs?.["data-add-to-cart"]).toBeUndefined();
  });

  describe("productList", () => {
    const grid: Product[] = [
      product({ _id: "a", name: "Alpha", price: 30, collections: ["col-1"] }),
      product({ _id: "b", name: "Bravo", price: 10, collections: ["col-1"] }),
      product({ _id: "c", name: "Charlie", price: 20, collections: ["col-2"] }),
      product({ _id: "d", name: "Draft", status: "draft", collections: ["col-1"] }),
    ];

    it("repeats the template once per active, matching product", () => {
      const elements = [el({
        tag: "div",
        productList: { collectionId: "col-1" },
        children: [el({ id: "item", tag: "h3", productBinding: { field: "name" } })],
      })];
      const [result] = resolveProductBindings(elements, grid);
      // col-1 has Alpha + Bravo active; Draft is draft-status, excluded
      expect(result.children.map((c) => c.content).sort()).toEqual(["Alpha", "Bravo"]);
    });

    it("applies sort and limit", () => {
      const elements = [el({
        productList: { collectionId: null, sortField: "price", sortDir: "asc", limit: 2 },
        children: [el({ tag: "h3", productBinding: { field: "name" } })],
      })];
      const [result] = resolveProductBindings(elements, grid);
      expect(result.children.map((c) => c.content)).toEqual(["Bravo", "Charlie"]);
    });

    it("includes every active product when collectionId is null", () => {
      const elements = [el({ productList: { collectionId: null }, children: [el({ tag: "h3", productBinding: { field: "name" } })] })];
      const [result] = resolveProductBindings(elements, grid);
      expect(result.children).toHaveLength(3); // Alpha, Bravo, Charlie — Draft excluded
    });
  });
});
