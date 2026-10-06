"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.4) — "Convert to
// Product Card": binds a single element to one field of one product. Mirrors
// BindDataModal.tsx (Phase 2's CMS binding picker).

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { Product, ProductField } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TEXT_FIELDS: { value: ProductField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "compareAtPrice", label: "Compare-at price" },
  { value: "availability", label: "Availability" },
  { value: "url", label: "Product URL" },
];
const IMAGE_FIELDS: { value: ProductField; label: string }[] = [{ value: "image", label: "Image" }];

export function BindProductModal({
  projectId,
  target,
  onBind,
  onClose,
}: {
  projectId: string;
  target: "text" | "image";
  onBind: (binding: { productId: string; field: ProductField }) => void;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [field, setField] = useState<ProductField | "">("");

  useEffect(() => {
    fetch(`${API}/api/commerce/products?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [projectId]);

  const fields = target === "image" ? IMAGE_FIELDS : TEXT_FIELDS;
  const canBind = productId && field;

  return (
    <ModalShell title="Bind Product Data" icon={<Package size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">No products yet — create one in the Shop tab first.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={lblCls}>Product</label>
            <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className={lblCls}>Field</label>
            <select className={inputCls} value={field} onChange={(e) => setField(e.target.value as ProductField)}>
              <option value="">Select a field…</option>
              {fields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <button
            onClick={() => canBind && onBind({ productId, field: field as ProductField })}
            disabled={!canBind}
            className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-40 transition-all"
          >
            Bind
          </button>
        </div>
      )}
    </ModalShell>
  );
}
