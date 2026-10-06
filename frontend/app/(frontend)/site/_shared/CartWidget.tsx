"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.6) — the one piece of
// real client-side interactivity on an otherwise-static published site.
// Listens for clicks on `[data-add-to-cart]` anywhere in the page (those
// elements are injected via dangerouslySetInnerHTML elsewhere, outside
// React's own tree, so this uses plain DOM event delegation rather than
// onClick handlers) and drives a small cart drawer against the real cart API.

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import type { Cart, Product } from "@/types/builder";

function cartTokenKey(projectId: string) {
  return `lhrweb_cart_token_${projectId}`;
}

export default function CartWidget({
  projectId,
  primaryColor,
  products,
  successUrl,
  cancelUrl,
}: {
  projectId: string;
  primaryColor: string;
  products: Product[];
  successUrl: string;
  cancelUrl: string;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const productById = useRef(new Map(products.map((p) => [p._id, p])));
  productById.current = new Map(products.map((p) => [p._id, p]));

  const getOrCreateCart = async (): Promise<Cart> => {
    const key = cartTokenKey(projectId);
    const existingToken = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (existingToken) {
      const res = await fetch(`${API}/api/commerce/cart/${existingToken}`);
      if (res.ok) return res.json();
    }
    const res = await fetch(`${API}/api/commerce/cart`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }),
    });
    const created = await res.json();
    localStorage.setItem(key, created.cartToken);
    return created;
  };

  useEffect(() => {
    // Load an existing cart quietly (don't create one until the visitor actually adds something).
    const key = cartTokenKey(projectId);
    const existingToken = localStorage.getItem(key);
    if (!existingToken) return;
    fetch(`${API}/api/commerce/cart/${existingToken}`).then((r) => (r.ok ? r.json() : null)).then((c) => c && setCart(c));
  }, [projectId]);

  useEffect(() => {
    const handler = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("[data-add-to-cart]") as HTMLElement | null;
      if (!target || target.getAttribute("data-add-to-cart-disabled") === "true") return;
      e.preventDefault();
      const productId = target.getAttribute("data-add-to-cart");
      if (!productId) return;
      const current = cart ?? (await getOrCreateCart());
      const res = await fetch(`${API}/api/commerce/cart/${current.cartToken}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) { setCart(await res.json()); setOpen(true); }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [cart, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateQty = async (productId: string, variantId: string | undefined, quantity: number) => {
    if (!cart) return;
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
    const res = await fetch(`${API}/api/commerce/cart/${cart.cartToken}/items/${productId}${qs}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }),
    });
    if (res.ok) setCart(await res.json());
  };

  const removeItem = async (productId: string, variantId?: string) => {
    if (!cart) return;
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
    const res = await fetch(`${API}/api/commerce/cart/${cart.cartToken}/items/${productId}${qs}`, { method: "DELETE" });
    if (res.ok) setCart(await res.json());
  };

  const checkout = async () => {
    if (!cart) return;
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const res = await fetch(`${API}/api/commerce/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartToken: cart.cartToken, successUrl, cancelUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data?.message || "Checkout failed."); return; }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const items = cart?.items ?? [];
  const count = items.reduce((s, it) => s + it.quantity, 0);
  const subtotal = items.reduce((s, it) => s + it.priceSnapshot * it.quantity, 0);

  if (products.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 10000,
          width: 52, height: 52, borderRadius: 999, border: "none", cursor: "pointer",
          background: primaryColor || "#111", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
        aria-label="Open cart"
      >
        <ShoppingCart size={20} />
        {count > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999,
            background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setOpen(false)} />
          <div style={{ position: "relative", width: 360, maxWidth: "100%", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-8px 0 24px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #eee" }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Your Cart</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
              {items.length === 0 ? (
                <p style={{ color: "#999", fontSize: 13, textAlign: "center", marginTop: 40 }}>Your cart is empty.</p>
              ) : items.map((it, i) => {
                const product = productById.current.get(it.productId);
                return (
                  <div key={`${it.productId}-${it.variantId ?? ""}-${i}`} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid #f2f2f2" }}>
                    {product?.images?.[0]?.url && (
                      <img src={product.images[0].url} alt={product.name} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product?.name ?? "Product"}</p>
                      <p style={{ fontSize: 12, color: "#888", margin: "2px 0 8px" }}>${it.priceSnapshot.toFixed(2)}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => updateQty(it.productId, it.variantId, it.quantity - 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={11} /></button>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 16, textAlign: "center" }}>{it.quantity}</span>
                        <button onClick={() => updateQty(it.productId, it.variantId, it.quantity + 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={11} /></button>
                        <button onClick={() => removeItem(it.productId, it.variantId)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <div style={{ padding: "14px 18px", borderTop: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {checkoutError && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{checkoutError}</p>}
                <button
                  onClick={checkout}
                  disabled={checkingOut}
                  style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: primaryColor || "#111", color: "#fff", fontWeight: 700, fontSize: 13, opacity: checkingOut ? 0.6 : 1 }}
                >
                  {checkingOut ? "Redirecting…" : "Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
