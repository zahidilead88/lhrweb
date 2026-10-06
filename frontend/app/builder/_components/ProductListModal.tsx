"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 §9.4/9.5 — "Convert to Product List": a container's children become
// the item template, repeated once per matching active product. Mirrors
// CmsListModal.tsx.

import { useEffect, useState } from "react";
import { Grid3x3 } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { ProductCollection, ProductListQuery } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export function ProductListModal({
  projectId,
  initial,
  onSave,
  onClose,
}: {
  projectId: string;
  initial?: ProductListQuery | null;
  onSave: (query: ProductListQuery) => void;
  onClose: () => void;
}) {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? "");
  const [sortField, setSortField] = useState(initial?.sortField ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initial?.sortDir ?? "asc");
  const [limit, setLimit] = useState(initial?.limit ? String(initial.limit) : "");

  useEffect(() => {
    fetch(`${API}/api/commerce/collections?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <ModalShell title="Convert to Product List" icon={<Grid3x3 size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Loading…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
            This element&rsquo;s children become the item template — repeated once per matching, active product.
          </p>

          <div>
            <label className={lblCls}>Collection (optional)</label>
            <select className={inputCls} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              <option value="">All active products</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lblCls}>Sort by</label>
              <select className={inputCls} value={sortField} onChange={(e) => setSortField(e.target.value as "" | "price" | "name")}>
                <option value="">(unsorted)</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className={lblCls}>Direction</label>
              <select className={inputCls} value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")} disabled={!sortField}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lblCls}>Limit (blank = no limit)</label>
            <input type="number" min={1} className={inputCls} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. 8" />
          </div>

          <button
            onClick={() => onSave({
              collectionId: collectionId || null,
              sortField: (sortField || undefined) as "price" | "name" | undefined,
              sortDir: sortField ? sortDir : undefined,
              limit: limit ? Number(limit) : undefined,
            })}
            className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition-all"
          >
            Save
          </button>
        </div>
      )}
    </ModalShell>
  );
}
