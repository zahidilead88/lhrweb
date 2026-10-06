"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.3) — Products
// management UI on top of the pre-existing commerce backend. Deliberately
// scoped: variants are a flat list editor (id/title/price/sku/inventory),
// not a full Shopify-style options-matrix generator — real, useful, but a
// simpler foundation-pass cut of what a mature product editor would offer.

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, Package, Layers } from "lucide-react";
import type { Product, ProductCollection, ProductVariant } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const STATUS_COLORS: Record<Product["status"], string> = {
  active: "#16a34a", draft: "#9ca3af", archived: "#dc2626",
};

export default function ProductsPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<"products" | "collections">("products");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex px-3 pt-2 gap-1 shrink-0">
        {(["products", "collections"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-colors ${tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "products" ? <ProductsTab projectId={projectId} /> : <CollectionsTab projectId={projectId} />}
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────

function ProductsTab({ projectId }: { projectId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/commerce/products?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createProduct = async () => {
    const res = await fetch(`${API}/api/commerce/products`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ projectId, name: "New Product", price: 0 }),
    });
    if (res.ok) {
      const created = await res.json();
      setProducts((p) => [created, ...p]);
      setEditingId(created._id);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`${API}/api/commerce/products/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setProducts((p) => p.filter((x) => x._id !== id));
  };

  const updateProduct = (updated: Product) => setProducts((p) => p.map((x) => (x._id === updated._id ? updated : x)));

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  const editing = editingId ? products.find((p) => p._id === editingId) : null;
  if (editing) {
    return <ProductEditor projectId={projectId} product={editing} onUpdate={updateProduct} onBack={() => setEditingId(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Products</span>
        <button onClick={createProduct} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={13} />
        </button>
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Package size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No products yet.</p>
        </div>
      )}

      <div className="space-y-1">
        {products.map((p) => (
          <div key={p._id} onClick={() => setEditingId(p._id)} className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            {p.images?.[0]?.url ? (
              <img src={p.images[0].url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0"><Package size={13} className="text-gray-300" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-800 truncate">{p.name}</p>
              <p className="text-[10.5px] text-gray-400">${p.price.toFixed(2)}</p>
            </div>
            <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: STATUS_COLORS[p.status], background: `${STATUS_COLORS[p.status]}15` }}>{p.status}</span>
            <button onClick={(e) => { e.stopPropagation(); deleteProduct(p._id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ projectId, product, onUpdate, onBack }: {
  projectId: string; product: Product; onUpdate: (p: Product) => void; onBack: () => void;
}) {
  const [form, setForm] = useState(product);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/commerce/collections?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections);
  }, [projectId]);

  const save = async (patch: Partial<Product>) => {
    const next = { ...form, ...patch };
    setForm(next);
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/commerce/products/${product._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(patch) });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg";
  const lblCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1";

  const setImages = (urls: string) => save({ images: urls.split(",").map((u) => u.trim()).filter(Boolean).map((url) => ({ url })) });

  const toggleCollection = (id: string) => {
    const next = form.collections.includes(id) ? form.collections.filter((c) => c !== id) : [...form.collections, id];
    save({ collections: next });
  };

  const addVariant = () => {
    const v: ProductVariant = { id: `var-${Date.now().toString(36)}`, title: "New variant", price: form.price };
    save({ variants: [...form.variants, v] });
  };
  const updateVariant = (i: number, patch: Partial<ProductVariant>) => {
    save({ variants: form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });
  };
  const removeVariant = (i: number) => save({ variants: form.variants.filter((_, idx) => idx !== i) });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
        <span className="text-[12.5px] font-bold text-gray-800 truncate flex-1">{form.name}</span>
        {saving && <span className="text-[10px] text-gray-400">Saving…</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <label className={lblCls}>Name</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={(e) => save({ name: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lblCls}>Price</label>
            <input type="number" min={0} step={0.01} className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} onBlur={(e) => save({ price: Number(e.target.value) })} />
          </div>
          <div>
            <label className={lblCls}>Compare-at price</label>
            <input type="number" min={0} step={0.01} className={inputCls} value={form.compareAtPrice ?? ""} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value ? Number(e.target.value) : undefined })} onBlur={(e) => save({ compareAtPrice: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>

        <div>
          <label className={lblCls}>Description</label>
          <textarea className={`${inputCls} resize-vertical`} rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} onBlur={(e) => save({ description: e.target.value })} />
        </div>

        <div>
          <label className={lblCls}>Image URLs (comma-separated)</label>
          <input className={inputCls} defaultValue={form.images.map((i) => i.url).join(", ")} onBlur={(e) => setImages(e.target.value)} placeholder="https://…/1.jpg, https://…/2.jpg" />
        </div>

        <div>
          <label className={lblCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => save({ status: e.target.value as Product["status"] })}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className={lblCls}>Inventory</label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11.5px] text-gray-600">
              <input type="checkbox" checked={!!form.inventory?.track} onChange={(e) => save({ inventory: { track: e.target.checked, quantity: form.inventory?.quantity ?? 0, policy: form.inventory?.policy ?? "deny" } })} />
              Track
            </label>
            {form.inventory?.track && (
              <input type="number" min={0} className={`${inputCls} w-24`} value={form.inventory?.quantity ?? 0}
                onChange={(e) => setForm({ ...form, inventory: { ...form.inventory!, quantity: Number(e.target.value) } })}
                onBlur={(e) => save({ inventory: { track: true, quantity: Number(e.target.value), policy: form.inventory?.policy ?? "deny" } })} />
            )}
          </div>
        </div>

        {collections.length > 0 && (
          <div>
            <label className={lblCls}>Collections</label>
            <div className="flex flex-wrap gap-1.5">
              {collections.map((c) => (
                <button key={c._id} onClick={() => toggleCollection(c._id)}
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${form.collections.includes(c._id) ? "bg-[#6344d4] text-white border-[#6344d4]" : "bg-white text-gray-600 border-gray-200"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={lblCls}>Variants</label>
          </div>
          <div className="space-y-1.5">
            {form.variants.map((v, i) => (
              <div key={v.id} className="flex items-center gap-1.5">
                <input className={`${inputCls} flex-1`} value={v.title} onChange={(e) => updateVariant(i, { title: e.target.value })} placeholder="Title (e.g. Small / Red)" />
                <input type="number" min={0} step={0.01} className={`${inputCls} w-20`} value={v.price} onChange={(e) => updateVariant(i, { price: Number(e.target.value) })} />
                <button onClick={() => removeVariant(i)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={12} /></button>
              </div>
            ))}
            <button onClick={addVariant} className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Plus size={11} /> Add variant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Collections ──────────────────────────────────────────────────────────────

function CollectionsTab({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API}/api/commerce/collections?projectId=${projectId}`, { headers: authHeaders() }),
        fetch(`${API}/api/commerce/products?projectId=${projectId}`, { headers: authHeaders() }),
      ]);
      if (cRes.ok) setCollections(await cRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`${API}/api/commerce/collections`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ projectId, name: newName.trim() }) });
    if (res.ok) {
      const created = await res.json();
      setCollections((c) => [created, ...c]);
      setNewName("");
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    const res = await fetch(`${API}/api/commerce/collections/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) { setCollections((c) => c.filter((x) => x._id !== id)); if (activeId === id) setActiveId(null); }
  };

  const toggleProductInCollection = async (collection: ProductCollection, productId: string) => {
    const next = collection.productIds.includes(productId) ? collection.productIds.filter((p) => p !== productId) : [...collection.productIds, productId];
    // Collections have no PATCH route for productIds today — re-POST isn't right either.
    // Reuse the product's own `collections` field as the source of truth instead (symmetric with ProductEditor).
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    const productCollections = product.collections.includes(collection._id) ? product.collections.filter((c) => c !== collection._id) : [...product.collections, collection._id];
    const res = await fetch(`${API}/api/commerce/products/${productId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ collections: productCollections }) });
    if (res.ok) {
      const updated = await res.json();
      setProducts((p) => p.map((x) => (x._id === productId ? updated : x)));
      setCollections((c) => c.map((x) => (x._id === collection._id ? { ...x, productIds: next } : x)));
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  const active = activeId ? collections.find((c) => c._id === activeId) : null;
  if (active) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => setActiveId(null)} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
          <span className="text-[12.5px] font-bold text-gray-800 truncate flex-1">{active.name}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10.5px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Products in this collection</p>
          {products.length === 0 && <p className="text-[12px] text-gray-400">No products yet — add some in the Products tab first.</p>}
          {products.map((p) => (
            <label key={p._id} className="flex items-center gap-2 px-1 py-1.5 text-[12px] text-gray-700">
              <input type="checkbox" checked={p.collections.includes(active._id)} onChange={() => toggleProductInCollection(active, p._id)} />
              {p.name}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collections</span>
        <button onClick={() => setCreating((v) => !v)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={13} />
        </button>
      </div>

      {creating && (
        <div className="flex gap-2 mb-3">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Collection name" className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg" />
          <button onClick={create} className="px-3 rounded-lg bg-gray-900 text-white text-[11px] font-bold">Add</button>
        </div>
      )}

      {collections.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Layers size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No collections yet.</p>
        </div>
      )}

      <div className="space-y-1">
        {collections.map((c) => (
          <div key={c._id} onClick={() => setActiveId(c._id)} className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-800 truncate">{c.name}</p>
              <p className="text-[10.5px] text-gray-400">{products.filter((p) => p.collections.includes(c._id)).length} product(s)</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(c._id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
