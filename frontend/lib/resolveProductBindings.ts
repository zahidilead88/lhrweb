import type { ElementNode, Product, ProductField, ProductListQuery } from "@/types/builder";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.3–9.4) — projects an
// element tree's `productBinding`s, `productList` repeats, and `addToCart`
// markers into real content at render time. Runs as its own pass, separate
// from resolveCmsBindings — same tree-walk shape, disjoint fields, so the two
// can compose safely in either order. Pure and non-mutating.

function formatPrice(cents: number): string {
  return `$${cents.toFixed(2)}`;
}

function fieldValue(product: Product, field: ProductField, productUrlPrefix?: string): string | undefined {
  switch (field) {
    case "image": return product.images?.[0]?.url;
    case "name": return product.name;
    case "price": return formatPrice(product.price);
    case "compareAtPrice": return product.compareAtPrice != null ? formatPrice(product.compareAtPrice) : undefined;
    case "availability": {
      const inStock = product.inventory?.track ? (product.inventory.quantity ?? 0) > 0 : true;
      return inStock ? "In Stock" : "Out of Stock";
    }
    case "url": return productUrlPrefix ? `${productUrlPrefix}/${product.slug}` : undefined;
  }
}

function isInStock(product: Product): boolean {
  return product.inventory?.track ? (product.inventory.quantity ?? 0) > 0 : true;
}

function queryProducts(products: Product[], q: ProductListQuery): Product[] {
  let list = products.filter((p) => p.status === "active" && (!q.collectionId || p.collections.includes(q.collectionId)));
  if (q.sortField) {
    const field = q.sortField;
    list = [...list].sort((a, b) => {
      const av = field === "price" ? a.price : field === "name" ? a.name : 0;
      const bv = field === "price" ? b.price : field === "name" ? b.name : 0;
      const cmp = av === bv ? 0 : av < bv ? -1 : 1;
      return q.sortDir === "desc" ? -cmp : cmp;
    });
  }
  if (q.limit) list = list.slice(0, q.limit);
  return list;
}

function applyBinding(el: ElementNode, productById: Map<string, Product>, contextProduct: Product | null, productUrlPrefix?: string): ElementNode {
  let next = el;

  if (el.productBinding) {
    const { productId, field } = el.productBinding;
    const product = productId ? productById.get(productId) : contextProduct ?? undefined;
    const value = product ? fieldValue(product, field, productUrlPrefix) : undefined;
    if (value !== undefined) {
      next = field === "image"
        ? { ...next, attrs: { ...next.attrs, src: value } }
        : field === "url"
          ? { ...next, attrs: { ...next.attrs, href: value } }
          : { ...next, content: value };
    }
  }

  if (el.addToCart) {
    const product = contextProduct ?? undefined;
    if (product) {
      next = {
        ...next,
        attrs: {
          ...next.attrs,
          "data-add-to-cart": product._id,
          ...(isInStock(product) ? {} : { "data-add-to-cart-disabled": "true" }),
        },
      };
    }
  }

  return next;
}

export function resolveProductBindings(
  elements: ElementNode[],
  products: Product[],
  contextProduct: Product | null = null,
  productUrlPrefix?: string
): ElementNode[] {
  if (products.length === 0 && !contextProduct) return elements;
  const productById = new Map(products.map((p) => [p._id, p]));

  function resolveNode(el: ElementNode, ctx: Product | null): ElementNode {
    if (el.productList) {
      const matches = queryProducts(products, el.productList);
      const template = el.children ?? [];
      const repeated = matches.flatMap((product) =>
        template.map((child) => resolveNode(applyBinding(child, productById, product, productUrlPrefix), product))
      );
      return { ...applyBinding(el, productById, ctx, productUrlPrefix), children: repeated };
    }
    const withBinding = applyBinding(el, productById, ctx, productUrlPrefix);
    const kids = withBinding.children;
    const children = kids?.length ? kids.map((c) => resolveNode(c, ctx)) : kids;
    return children === kids ? withBinding : { ...withBinding, children };
  }

  return elements.map((el) => resolveNode(el, contextProduct));
}
