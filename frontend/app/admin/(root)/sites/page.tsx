"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Site {
  _id: string;
  businessName: string;
  slug: string;
  package: string;
  status: string;
  createdAt: string;
  userId?: { name: string; email: string };
}

const S = {
  card:  { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  th:    { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px" },
  td:    { color: "#e8eaed", fontSize: 13, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" } as React.CSSProperties,
  muted: { color: "#9aa0a6" } as React.CSSProperties,
};

export default function AdminSitesPage() {
  const [sites, setSites]     = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/builder/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSites(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === "ready"      ? { background: "rgba(52,211,153,0.1)", color: "#34d399" } :
    s === "generating" ? { background: "rgba(168,199,250,0.1)", color: "#a8c7fa" } :
                         { background: "rgba(255,255,255,0.06)", color: "#9aa0a6" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: "#e8eaed" }}>Builder Sites</h1>
        <p className="text-[13px] mt-1" style={{ color: "#9aa0a6" }}>All customer websites created with the builder.</p>
      </div>

      <div style={S.card}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : sites.length === 0 ? (
          <p className="text-center py-16 text-[13px]" style={S.muted}>No builder sites yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {["Business", "Slug", "Owner", "Package", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={S.th} className="text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site._id}>
                  <td style={S.td}>{site.businessName || "—"}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "#9aa0a6" }}>{site.slug || "—"}</td>
                  <td style={S.td}>
                    <div style={{ color: "#e8eaed" }}>{site.userId?.name || "—"}</div>
                    <div style={{ color: "#9aa0a6", fontSize: 11 }}>{site.userId?.email}</div>
                  </td>
                  <td style={S.td}>
                    <span className="uppercase text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>
                      {site.package || "—"}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-md uppercase" style={statusColor(site.status)}>
                      {site.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: "#9aa0a6", fontSize: 12 }}>
                    {new Date(site.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={S.td}>
                    <Link
                      href={`/site/${site._id}`}
                      className="text-[12px] px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(168,199,250,0.1)", color: "#a8c7fa" }}
                    >
                      Preview
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
