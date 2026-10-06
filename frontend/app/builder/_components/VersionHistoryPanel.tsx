"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — publish history,
// bounded scope: save already *is* publish, so this is an append-only audit
// trail (a snapshot taken just before each publish overwrites the live
// pages) rather than a real draft/live version system. Restoring a snapshot
// re-publishes it immediately — there's no separate "preview before
// publish" step, since that distinction doesn't exist in this app today.

import { useEffect, useState } from "react";
import { History, RotateCcw, AlertTriangle } from "lucide-react";

interface VersionSummary {
  _id: string;
  label: string;
  createdAt: string;
  pageCount: number;
  pageNames: string[];
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function VersionHistoryPanel({ projectId, onRestored }: { projectId: string; onRestored: () => void }) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/builder/project/versions?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setVersions(d.versions ?? []); }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const restore = async (id: string) => {
    setConfirmId(null);
    setRestoring(id);
    try {
      const res = await fetch(`${API}/api/builder/project/versions/${id}/restore?projectId=${projectId}`, { method: "POST", headers: authHeaders() });
      if (res.ok) onRestored();
    } finally {
      setRestoring(null);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">Restoring a snapshot publishes it immediately — there's no draft step. The last 25 snapshots are kept; older ones are pruned automatically.</p>
      </div>

      {versions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <History size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No history yet — every future Publish will add a snapshot here first.</p>
        </div>
      )}

      <div className="space-y-2">
        {versions.map((v) => (
          <div key={v._id} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-gray-800">{formatWhen(v.createdAt)}</p>
              {confirmId === v._id ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => restore(v._id)} disabled={restoring === v._id}
                    className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[10.5px] font-bold disabled:opacity-50">
                    {restoring === v._id ? "Restoring…" : "Confirm restore"}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="px-2 py-1 rounded-md text-[10.5px] font-semibold text-gray-400 hover:bg-gray-100">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(v._id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[10.5px] font-bold text-gray-600 hover:bg-gray-100">
                  <RotateCcw size={11} /> Restore
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{v.pageCount} page{v.pageCount === 1 ? "" : "s"}: {v.pageNames.join(", ")}{v.pageCount > v.pageNames.length ? "…" : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
