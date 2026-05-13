"use client";
import { useEffect, useState, useCallback } from "react";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

const STATUS_OPTIONS = ["all", "new", "contacted", "closed"] as const;

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-blue-50 text-blue-700",
  contacted: "bg-yellow-50 text-yellow-700",
  closed:    "bg-green-50 text-green-700",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function serviceLabel(slug: string) {
  return slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
}

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLeads = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const qs  = status !== "all" ? `?status=${status}` : "";
      const res = await fetch(`http://localhost:8000/api/leads${qs}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(filter); }, [filter, fetchLeads]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`http://localhost:8000/api/leads/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l._id === id ? updated : l)));
      if (selected?._id === id) setSelected(updated);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    setDeleting(id);
    await fetch(`http://localhost:8000/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l._id !== id));
    if (selected?._id === id) setSelected(null);
    setTotal((t) => t - 1);
    setDeleting(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total submission{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === s ? "bg-black text-white" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`${selected ? "w-1/2" : "w-full"} transition-all`}>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
            ) : leads.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-sm">No leads yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Service</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => setSelected(selected?._id === lead._id ? null : lead)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selected?._id === lead._id ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{lead.name}</p>
                        <p className="text-gray-400 text-xs">{lead.email}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{serviceLabel(lead.service)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{fmt(lead.createdAt)}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead._id); }}
                          disabled={deleting === lead._id}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                          title="Delete"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-100 p-6 self-start">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-black text-2xl leading-none">×</button>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Phone</p>
                <p className="font-medium text-sm">{selected.phone || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Service</p>
                <p className="font-medium text-sm">{serviceLabel(selected.service)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Submitted</p>
                <p className="font-medium text-sm">{fmt(selected.createdAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Status</p>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected._id, e.target.value)}
                  className="text-sm font-medium bg-transparent outline-none w-full capitalize cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">Message</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4">
                {selected.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={`mailto:${selected.email}`}
                className="flex-1 text-center px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Reply by Email
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="flex-1 text-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
