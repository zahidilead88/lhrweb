"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Service { _id: string; slug: string; label: string; headline: string; packages: { name: string }[]; }

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  th:      { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:      { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/services`)
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token") || "";
    await fetch(`${API}/api/services/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Offerings</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Manage your core services, pricing plans, and marketing headlines.</p>
        </div>
        <Link href="/admin/services/add"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          + Add Service
        </Link>
      </div>

      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>No services cataloged yet.</p>
            <Link href="/admin/services/add" className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>Create first service →</Link>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={D.th}>Service</th>
                  <th style={D.th}>URL</th>
                  <th style={{ ...D.th }} className="hidden md:table-cell">Headline</th>
                  <th style={{ ...D.th }} className="hidden lg:table-cell">Plans</th>
                  <th style={{ ...D.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id}>
                    <td style={D.td}>
                      <p className="font-medium" style={{ color: "#a8c7fa" }}>{s.label}</p>
                    </td>
                    <td style={D.td}>
                      <span className="text-[12px] font-mono" style={{ color: "#9aa0a6" }}>/services/{s.slug}</span>
                    </td>
                    <td style={{ ...D.td, color: "#9aa0a6" }} className="hidden md:table-cell">
                      <p className="text-[13px] truncate max-w-xs">{s.headline}</p>
                    </td>
                    <td style={{ ...D.td, color: "#9aa0a6" }} className="hidden lg:table-cell">
                      <span className="text-[12px]">{s.packages?.length ?? 0} tiers</span>
                    </td>
                    <td style={{ ...D.td, textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/services/edit/${s._id}`}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(s._id, s.label)}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.3)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>
                {services.length} service{services.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
