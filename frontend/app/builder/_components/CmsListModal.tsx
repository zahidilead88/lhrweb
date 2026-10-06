"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.1) — "Convert to CMS
// List": picks a collection + query (sort/limit/filter) for a container
// element whose children become the repeating item template.

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { CmsCollection, CmsListQuery } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export function CmsListModal({
  projectId,
  initial,
  onSave,
  onClose,
}: {
  projectId: string;
  initial?: CmsListQuery | null;
  onSave: (query: CmsListQuery) => void;
  onClose: () => void;
}) {
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? "");
  const [sortField, setSortField] = useState(initial?.sortField ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initial?.sortDir ?? "asc");
  const [limit, setLimit] = useState(initial?.limit ? String(initial.limit) : "");
  const [filterField, setFilterField] = useState(initial?.filterField ?? "");
  const [filterEquals, setFilterEquals] = useState(initial?.filterEquals ?? "");

  useEffect(() => {
    fetch(`${API}/api/cms-collections/collections?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [projectId]);

  const collection = collections.find((c) => c._id === collectionId) ?? null;

  return (
    <ModalShell title="Convert to CMS List" icon={<List size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">No CMS collections yet — create one in the Data tab first.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
            This element&rsquo;s children become the item template — repeated once per matching entry.
          </p>

          <div>
            <label className={lblCls}>Collection</label>
            <select className={inputCls} value={collectionId} onChange={(e) => { setCollectionId(e.target.value); setSortField(""); setFilterField(""); }}>
              <option value="">Select a collection…</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {collection && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>Sort by</label>
                  <select className={inputCls} value={sortField} onChange={(e) => setSortField(e.target.value)}>
                    <option value="">(unsorted)</option>
                    {collection.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
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
                <input type="number" min={1} className={inputCls} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. 6" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>Filter field</label>
                  <select className={inputCls} value={filterField} onChange={(e) => setFilterField(e.target.value)}>
                    <option value="">(no filter)</option>
                    {collection.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lblCls}>Equals</label>
                  <input className={inputCls} value={filterEquals} onChange={(e) => setFilterEquals(e.target.value)} disabled={!filterField} placeholder="value" />
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => collectionId && onSave({
              collectionId,
              sortField: sortField || undefined,
              sortDir: sortField ? sortDir : undefined,
              limit: limit ? Number(limit) : undefined,
              filterField: filterField || undefined,
              filterEquals: filterField ? filterEquals : undefined,
            })}
            disabled={!collectionId}
            className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-40 transition-all"
          >
            Save
          </button>
        </div>
      )}
    </ModalShell>
  );
}
