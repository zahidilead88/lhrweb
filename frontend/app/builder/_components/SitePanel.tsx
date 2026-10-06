"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11) — site structure:
// global navigation, redirects, and the custom-404 page, grouped under one
// "Site" tab (mirrors the Products/Collections sub-tab pattern).

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import MenusPanel from "./MenusPanel";
import RedirectsPanel from "./RedirectsPanel";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

interface PageOption { id: string; name: string }

export default function SitePanel({ projectId, pages }: { projectId: string; pages: PageOption[] }) {
  const [tab, setTab] = useState<"menus" | "redirects" | "404">("menus");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex px-3 pt-2 gap-1 shrink-0">
        {(["menus", "redirects", "404"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-colors ${tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "menus" && <MenusPanel projectId={projectId} pages={pages} />}
      {tab === "redirects" && <RedirectsPanel projectId={projectId} />}
      {tab === "404" && <NotFoundPagePicker projectId={projectId} pages={pages} />}
    </div>
  );
}

function NotFoundPagePicker({ projectId, pages }: { projectId: string; pages: PageOption[] }) {
  const [notFoundPageId, setNotFoundPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/builder/project?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setNotFoundPageId(p?.notFoundPageId ?? null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const save = async (id: string | null) => {
    setNotFoundPageId(id);
    setSaving(true);
    try {
      await fetch(`${API}/api/builder/project/settings?projectId=${projectId}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ notFoundPageId: id }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">A missing page — custom 404 or the default one — renders at a 200 status, not a real 404. This site sits behind a streaming loading state that flushes the response before the not-found status can be set; a known limitation, not specific to picking a custom page here.</p>
      </div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom 404 page</label>
      <select
        className="w-full px-2.5 py-2 text-[12px] border border-gray-200 rounded-lg"
        value={notFoundPageId ?? ""}
        onChange={(e) => save(e.target.value || null)}
        disabled={saving}
      >
        <option value="">Default (not-found page)</option>
        {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}
