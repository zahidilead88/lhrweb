"use client";
import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;

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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new:       { bg: "rgba(168,199,250,0.12)", color: "#a8c7fa" },
  contacted: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
  closed:    { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
};

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  th:      { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:      { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

  function authHeader(extra?: Record<string, string>) {
    return { Authorization: `Bearer ${localStorage.getItem("token") || ""}`, ...extra };
  }

  const fetchLeads = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const qs   = status !== "all" ? `?status=${status}` : "";
      const res  = await fetch(`${API}/api/leads${qs}`, { headers: authHeader() });
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(filter); }, [filter, fetchLeads]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`${API}/api/leads/${id}`, {
      method: "PUT",
      headers: authHeader({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
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
    await fetch(`${API}/api/leads/${id}`, { method: "DELETE", headers: authHeader() });
    setLeads((prev) => prev.filter((l) => l._id !== id));
    if (selected?._id === id) setSelected(null);
    setTotal((t) => t - 1);
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Leads</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>{total} total submission{total !== 1 ? "s" : ""}</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors"
              style={{
                background: filter === s ? "rgba(168,199,250,0.15)" : "transparent",
                color:      filter === s ? "#a8c7fa" : "#9aa0a6",
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className={`${selected ? "w-1/2" : "w-full"} transition-all`} style={{ minWidth: 0 }}>
          <div style={D.surface} className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-[13px]" style={{ color: "#9aa0a6" }}>No leads yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={D.th}>Name</th>
                    <th style={D.th} className="hidden md:table-cell">Service</th>
                    <th style={D.th}>Status</th>
                    <th style={D.th} className="hidden lg:table-cell">Date</th>
                    <th style={{ ...D.th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => setSelected(selected?._id === lead._id ? null : lead)}
                      className="cursor-pointer transition-colors"
                      style={{ background: selected?._id === lead._id ? "rgba(168,199,250,0.06)" : "transparent" }}
                      onMouseEnter={(e) => { if (selected?._id !== lead._id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { if (selected?._id !== lead._id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={D.td}>
                        <p className="font-medium mb-0.5" style={{ color: "#a8c7fa" }}>{lead.name}</p>
                        <p className="text-[12px]" style={{ color: "#9aa0a6" }}>{lead.email}</p>
                      </td>
                      <td style={{ ...D.td, color: "#9aa0a6" }} className="hidden md:table-cell">{serviceLabel(lead.service)}</td>
                      <td style={D.td}>
                        <span style={{ ...(STATUS_STYLES[lead.status] ?? STATUS_STYLES.new), borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ ...D.td, fontSize: 12, color: "#9aa0a6" }} className="hidden lg:table-cell whitespace-nowrap">{fmt(lead.createdAt)}</td>
                      <td style={D.td}>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead._id); }}
                          disabled={deleting === lead._id}
                          className="text-[18px] leading-none transition-colors"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
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
          <div className="w-1/2 self-start" style={D.surface}>
            <div className="flex items-start justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <h2 className="text-[15px] font-semibold mb-0.5" style={{ color: "#e8eaed" }}>{selected.name}</h2>
                <p className="text-[12px]" style={{ color: "#9aa0a6" }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-[20px] leading-none w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "#9aa0a6" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e8eaed")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9aa0a6")}>
                ×
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Phone",     value: selected.phone || "—" },
                  { label: "Service",   value: serviceLabel(selected.service) },
                  { label: "Submitted", value: fmt(selected.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9aa0a6" }}>{label}</p>
                    <p className="text-[13px] font-medium" style={{ color: "#e8eaed" }}>{value}</p>
                  </div>
                ))}
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9aa0a6" }}>Status</p>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected._id, e.target.value)}
                    className="text-[13px] font-medium w-full outline-none capitalize cursor-pointer"
                    style={{ background: "transparent", color: STATUS_STYLES[selected.status]?.color ?? "#e8eaed", border: "none" }}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>Message</p>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap p-4 rounded-xl" style={{ color: "#e8eaed", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {selected.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a href={`mailto:${selected.email}`}
                  className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                  style={{ background: "#a8c7fa", color: "#111111" }}>
                  Reply by Email
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`}
                    className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
