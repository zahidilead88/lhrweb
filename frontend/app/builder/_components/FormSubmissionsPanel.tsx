"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — the builder-side
// inbox for whatever a published site's own <form> elements have collected
// (see FormSubmitHandler.tsx on the public-site side, and backend/routes/forms.js).

import { useEffect, useState } from "react";
import { Inbox, Trash2, Mail, MailOpen } from "lucide-react";

interface Submission {
  _id: string;
  pageId: string;
  formId: string;
  data: Record<string, string>;
  read: boolean;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FormSubmissionsPanel({ projectId }: { projectId: string }) {
  const [subs, setSubs]       = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/forms?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setSubs(d.submissions ?? []); }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (s: Submission) => {
    setOpenId(openId === s._id ? null : s._id);
    if (!s.read) {
      setSubs((prev) => prev.map((x) => (x._id === s._id ? { ...x, read: true } : x)));
      await fetch(`${API}/api/forms/${s._id}/read?projectId=${projectId}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ read: true }) });
    }
  };

  const remove = async (id: string) => {
    setSubs((prev) => prev.filter((s) => s._id !== id));
    await fetch(`${API}/api/forms/${id}?projectId=${projectId}`, { method: "DELETE", headers: authHeaders() });
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {subs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Inbox size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No submissions yet — they'll show up here as visitors use your forms.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {subs.map((s) => {
          const preview = Object.values(s.data).find((v) => v?.trim()) ?? "(empty)";
          return (
            <div key={s._id} className="border border-gray-100 rounded-lg bg-gray-50 overflow-hidden">
              <button onClick={() => open(s)} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left">
                {s.read ? <MailOpen size={13} className="text-gray-300 shrink-0" /> : <Mail size={13} className="text-[#6344d4] shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] truncate ${s.read ? "text-gray-600" : "font-bold text-gray-800"}`}>{preview}</p>
                  <p className="text-[10px] text-gray-400">{formatWhen(s.createdAt)}{s.formId ? ` · ${s.formId}` : ""}</p>
                </div>
              </button>
              {openId === s._id && (
                <div className="px-2.5 pb-2.5 space-y-1">
                  {Object.entries(s.data).map(([k, v]) => (
                    <div key={k} className="text-[11px]"><span className="font-semibold text-gray-500">{k}: </span><span className="text-gray-700">{v}</span></div>
                  ))}
                  <button onClick={() => remove(s._id)} className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
