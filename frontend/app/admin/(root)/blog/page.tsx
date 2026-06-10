"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  tags?: string[];
  createdAt?: string;
}

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  th:      { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:      { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

export default function ManageBlogsPage() {
  const [blogs, setBlogs]     = useState<Blog[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/blogs`)
      .then((r) => r.json())
      .then((data) => setBlogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API}/api/blogs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setBlogs((prev) => prev.filter((b) => b._id !== id));
  };

  const filtered = blogs.filter((b) =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.content?.toLowerCase().includes(search.toLowerCase()) ||
    (b.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Blog Posts</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Manage your articles, news, and journal entries.</p>
        </div>
        <Link
          href="/admin/blog/add"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}
        >
          + Add Post
        </Link>
      </div>

      {/* Search */}
      <div style={D.surface} className="p-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5f6368" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>
      </div>

      {/* Table */}
      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>{search ? "No posts match your search." : "No blog posts yet."}</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ ...D.th, width: 56 }}></th>
                  <th style={D.th}>Article</th>
                  <th style={{ ...D.th }} className="hidden lg:table-cell">Tags</th>
                  <th style={{ ...D.th }} className="hidden xl:table-cell">Published</th>
                  <th style={{ ...D.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((blog) => (
                  <tr key={blog._id}>
                    <td style={D.td}>
                      {blog.thumbnail ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={`${API}/${blog.thumbnail}`} alt={blog.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                          style={{ background: "rgba(168,199,250,0.1)", color: "#a8c7fa" }}>
                          B
                        </div>
                      )}
                    </td>
                    <td style={D.td}>
                      <p className="text-[14px] font-medium mb-0.5" style={{ color: "#a8c7fa" }}>{blog.title}</p>
                      <p className="text-[12px] truncate max-w-xs" style={{ color: "#9aa0a6" }}>{blog.content}</p>
                    </td>
                    <td style={D.td} className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {(blog.tags || []).length > 0 ? blog.tags!.map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>{t}</span>
                        )) : <span style={{ color: "#5f6368" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ ...D.td, fontSize: 12, color: "#9aa0a6" }} className="hidden xl:table-cell">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ ...D.td, textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/blog/edit/${blog._id}`}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(blog._id, blog.title)}
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
            <div className="px-4 py-3 flex items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>
                Showing {filtered.length} of {blogs.length} post{blogs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
