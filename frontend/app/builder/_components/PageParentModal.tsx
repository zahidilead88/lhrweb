"use client";

// Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11.1) — page hierarchy:
// pick a parent page, giving this page a real nested URL
// (/<parent-path>/<slug>) instead of the flat ?slug= convention.

import { useMemo } from "react";
import { GitBranch, Trash2 } from "lucide-react";
import { ModalShell, inputCls, lblCls } from "./AiModals";

interface PageLike { id: string; name: string; parentId?: string }

// Excludes the page itself and any of its own descendants — picking either
// would create a cycle (the backend re-validates this regardless).
function eligibleParents(pages: PageLike[], pageId: string): PageLike[] {
  const descendants = new Set<string>([pageId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of pages) {
      if (p.parentId && descendants.has(p.parentId) && !descendants.has(p.id)) {
        descendants.add(p.id);
        grew = true;
      }
    }
  }
  return pages.filter((p) => !descendants.has(p.id));
}

export function PageParentModal({
  page,
  pages,
  onSave,
  onClose,
}: {
  page: PageLike;
  pages: PageLike[];
  onSave: (parentId: string | null) => void;
  onClose: () => void;
}) {
  const options = useMemo(() => eligibleParents(pages, page.id), [pages, page.id]);

  return (
    <ModalShell title="Page Hierarchy" icon={<GitBranch size={14} />} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
          Nest &ldquo;{page.name}&rdquo; under another page to give it a real URL like /parent-slug/{page.name.toLowerCase().replace(/\s+/g, "-")}.
        </p>
        <div>
          <label className={lblCls}>Parent page</label>
          <select
            className={inputCls}
            value={page.parentId ?? ""}
            onChange={(e) => onSave(e.target.value || null)}
          >
            <option value="">No parent (top-level)</option>
            {options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {page.parentId && (
          <button onClick={() => onSave(null)} className="w-full py-2 text-[11.5px] font-semibold text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 rounded-lg transition-all">
            <Trash2 size={12} /> Remove parent
          </button>
        )}
      </div>
    </ModalShell>
  );
}
