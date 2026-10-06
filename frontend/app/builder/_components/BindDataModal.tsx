"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 2 (docs/BLUEPRINT.md) — the field-binding picker: Collection → Field →
// Entry, stored as a `CmsBinding` on the element. Self-contained (own fetch),
// like CmsPanel.

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { CmsBinding, CmsCollection, CmsEntry, CmsFieldType } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// Which collection field types make sense for the kind of element being bound.
const COMPATIBLE_TYPES: Record<"text" | "image", CmsFieldType[]> = {
  text: ["text", "richtext", "number", "date"],
  image: ["image"],
};

export function BindDataModal({
  projectId,
  target,
  onBind,
  onClose,
}: {
  projectId: string;
  /** What kind of element is being bound — controls which field types are offered. */
  target: "text" | "image";
  onBind: (binding: CmsBinding) => void;
  onClose: () => void;
}) {
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionId, setCollectionId] = useState("");
  const [field, setField] = useState("");
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryId, setEntryId] = useState("");

  useEffect(() => {
    fetch(`${API}/api/cms-collections/collections?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [projectId]);

  const collection = collections.find((c) => c._id === collectionId) ?? null;
  const compatibleFields = collection?.fields.filter((f) => COMPATIBLE_TYPES[target].includes(f.type)) ?? [];

  useEffect(() => {
    setField("");
    setEntryId("");
    setEntries([]);
    if (!collectionId) return;
    setEntriesLoading(true);
    fetch(`${API}/api/cms-collections/collections/${collectionId}/entries`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEntries)
      .finally(() => setEntriesLoading(false));
  }, [collectionId]);

  const firstField = collection?.fields[0];
  const canBind = collectionId && field && entryId;

  return (
    <ModalShell title="Bind Data" icon={<Database size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">No CMS collections yet — create one in the Data tab first.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={lblCls}>Collection</label>
            <select className={inputCls} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              <option value="">Select a collection…</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {collectionId && (
            compatibleFields.length === 0 ? (
              <p className="text-[11.5px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                This collection has no {target === "image" ? "image" : "text-compatible"} fields.
              </p>
            ) : (
              <div>
                <label className={lblCls}>Field</label>
                <select className={inputCls} value={field} onChange={(e) => setField(e.target.value)}>
                  <option value="">Select a field…</option>
                  {compatibleFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            )
          )}

          {collectionId && field && (
            <div>
              <label className={lblCls}>Entry</label>
              {entriesLoading ? (
                <p className="text-[11.5px] text-gray-400 py-2">Loading entries…</p>
              ) : entries.length === 0 ? (
                <p className="text-[11.5px] text-gray-400 py-2">This collection has no entries yet.</p>
              ) : (
                <select className={inputCls} value={entryId} onChange={(e) => setEntryId(e.target.value)}>
                  <option value="">Select an entry…</option>
                  {entries.map((e) => (
                    <option key={e._id} value={e._id}>
                      {firstField ? String(e.values[firstField.key] ?? "") || e.slug : e.slug}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={() => canBind && onBind({ collectionId, entryId, field })}
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
