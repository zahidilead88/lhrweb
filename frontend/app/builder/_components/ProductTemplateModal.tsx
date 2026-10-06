"use client";

// Phase 3 §9.5 — "Product detail page": marks a page as a template rendered
// once per active product, at /<pathPrefix>/<product-slug>. Mirrors
// CmsTemplateModal.tsx — no data fetch needed here, product detail templates
// aren't scoped to one collection the way a CMS template is to one collection.

import { useState } from "react";
import { Package, Trash2 } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";
import type { ProductTemplate } from "@/types/builder";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProductTemplateModal({
  pageName,
  initial,
  onSave,
  onRemove,
  onClose,
}: {
  pageName: string;
  initial?: ProductTemplate | null;
  onSave: (template: ProductTemplate) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [pathPrefix, setPathPrefix] = useState(initial?.pathPrefix ?? "products");

  return (
    <ModalShell title="Product Detail Template" icon={<Package size={14} />} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
          &ldquo;{pageName}&rdquo; will render once per active product, at a URL built from the path below.
        </p>

        <div>
          <label className={lblCls}>Path prefix</label>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400 shrink-0">/</span>
            <input className={inputCls} value={pathPrefix} onChange={(e) => setPathPrefix(slugify(e.target.value))} placeholder="products" />
            <span className="text-[12px] text-gray-400 shrink-0">/…</span>
          </div>
        </div>

        <button
          onClick={() => pathPrefix.trim() && onSave({ pathPrefix: pathPrefix.trim() })}
          disabled={!pathPrefix.trim()}
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
    </ModalShell>
  );
}
