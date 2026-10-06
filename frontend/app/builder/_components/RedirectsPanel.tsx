"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11.5) — redirects:
// source path -> destination, 301/302, enabled/disabled. Resolved server-side
// in the site route files via `resolveRedirect()`, mapped to Next's
// permanentRedirect (308) / redirect (307) — see docs for that nuance.

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowRight, Route } from "lucide-react";
import type { Redirect } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function normalizeSource(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export default function RedirectsPanel({ projectId }: { projectId: string }) {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/builder/project?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) { const p = await res.json(); setRedirects(p.redirects ?? []); }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (next: Redirect[]) => {
    setRedirects(next);
    await fetch(`${API}/api/builder/project/redirects?projectId=${projectId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ redirects: next }) });
  };

  const addRedirect = () => {
    const r: Redirect = { id: `redir-${Date.now().toString(36)}`, source: "", destination: "", statusCode: 301, enabled: true };
    save([...redirects, r]);
  };
  const updateRedirect = (i: number, patch: Partial<Redirect>) => save(redirects.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRedirect = (i: number) => save(redirects.filter((_, idx) => idx !== i));

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  const inputCls = "px-2 py-1.5 text-[11.5px] border border-gray-200 rounded-md bg-white";

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Redirects</span>
        <button onClick={addRedirect} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={13} />
        </button>
      </div>

      {redirects.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Route size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No redirects yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {redirects.map((r, i) => (
          <div key={r.id} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                className={`${inputCls} flex-1 min-w-0`}
                value={r.source}
                onChange={(e) => updateRedirect(i, { source: e.target.value })}
                onBlur={(e) => updateRedirect(i, { source: normalizeSource(e.target.value) })}
                placeholder="/old-page"
              />
              <ArrowRight size={12} className="text-gray-400 shrink-0" />
              <input
                className={`${inputCls} flex-1 min-w-0`}
                value={r.destination}
                onChange={(e) => updateRedirect(i, { destination: e.target.value })}
                placeholder="/new-page or https://…"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className={inputCls} value={r.statusCode} onChange={(e) => updateRedirect(i, { statusCode: Number(e.target.value) as 301 | 302 })}>
                <option value={301}>301 — Permanent</option>
                <option value={302}>302 — Temporary</option>
              </select>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <input type="checkbox" checked={r.enabled} onChange={(e) => updateRedirect(i, { enabled: e.target.checked })} />
                Enabled
              </label>
              <button onClick={() => removeRedirect(i)} className="ml-auto text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
