"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9.2) — "Dynamic CMS
// pages": marks a page as a template rendered once per entry, at
// /<pathPrefix>/<entry-slug>.

import { useEffect, useState } from "react";
import { Database, Trash2 } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { CmsCollection, CmsTemplate } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CmsTemplateModal({
  projectId,
  pageName,
  initial,
  onSave,
  onRemove,
  onClose,
}: {
  projectId: string;
  pageName: string;
  initial?: CmsTemplate | null;
  onSave: (template: CmsTemplate) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? "");
  const [pathPrefix, setPathPrefix] = useState(initial?.pathPrefix ?? slugify(pageName));

  useEffect(() => {
    fetch(`${API}/api/cms-collections/collections?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [projectId]);

  const canSave = !!collectionId && !!pathPrefix.trim();

  return (
    <ModalShell title="CMS Template" icon={<Database size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">No CMS collections yet — create one in the Data tab first.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
            &ldquo;{pageName}&rdquo; will render once per entry, at a URL built from the path below.
          </p>

          <div>
            <label className={lblCls}>Collection</label>
            <select className={inputCls} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              <option value="">Select a collection…</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={lblCls}>Path prefix</label>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-gray-400 shrink-0">/</span>
              <input className={inputCls} value={pathPrefix} onChange={(e) => setPathPrefix(slugify(e.target.value))} placeholder="blog" />
              <span className="text-[12px] text-gray-400 shrink-0">/…</span>
            </div>
          </div>

          <button
            onClick={() => canSave && onSave({ collectionId, pathPrefix: pathPrefix.trim() })}
            disabled={!canSave}
            className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-40 transition-all"
          >
            Save
          </button>

          {initial && (
            <button onClick={onRemove} className="w-full py-2 text-[11.5px] font-semibold text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 size={12} /> Remove template
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}
