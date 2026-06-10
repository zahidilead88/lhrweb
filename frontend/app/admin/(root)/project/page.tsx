"use client";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;
import { useEffect, useState } from "react";
import Link from "next/link";

interface Project { _id: string; title: string; shortDescription: string; image: string; tags?: string[]; }

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  th:      { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:      { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/projects`)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`${API}/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  const filtered = projects.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.shortDescription?.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Projects</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Showcase your best work and case studies.</p>
        </div>
        <Link href="/admin/project/add"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          + Add Project
        </Link>
      </div>

      <div style={D.surface} className="p-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5f6368" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
        </div>
      </div>

      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>{search ? "No projects match your search." : "No projects yet."}</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ ...D.th, width: 56 }}></th>
                  <th style={D.th}>Project</th>
                  <th style={D.th} className="hidden lg:table-cell">Tags</th>
                  <th style={{ ...D.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project._id}>
                    <td style={D.td}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={`${API}/${project.image}`} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td style={D.td}>
                      <p className="font-medium mb-0.5" style={{ color: "#a8c7fa" }}>{project.title}</p>
                      <p className="text-[12px] truncate max-w-xs" style={{ color: "#9aa0a6" }}>{project.shortDescription}</p>
                    </td>
                    <td style={D.td} className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {(project.tags || []).length > 0 ? project.tags!.map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>{t}</span>
                        )) : <span style={{ color: "#5f6368" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ ...D.td, textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/project/edit/${project._id}`}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          Settings
                        </Link>
                        <Link href={`/admin/project/${project._id}/blocks`}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors font-medium"
                          style={{ background: "rgba(168,199,250,0.12)", color: "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(168,199,250,0.2)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(168,199,250,0.12)"; }}>
                          Content
                        </Link>
                        <button onClick={() => handleDelete(project._id, project.title)}
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
                Showing {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
