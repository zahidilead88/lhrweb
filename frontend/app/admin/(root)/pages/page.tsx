"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Page {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schema?: string;
  robotsNoIndex?: boolean;
}

const emptyForm = {
  name: "", slug: "", description: "",
  seoTitle: "", seoDescription: "", keywords: "",
  ogTitle: "", ogDescription: "", ogImage: "",
  schema: "", robotsNoIndex: false,
};
type FormState = typeof emptyForm;

const D = {
  surface:  { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  input:    { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" } as React.CSSProperties,
  label:    { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 },
  th:       { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:       { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

function inputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)";
}
function inputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
}

export default function PagesAdminPage() {
  const [pages, setPages]       = useState<Page[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Page | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<"general" | "seo">("general");
  const [search, setSearch]     = useState("");

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/pages`)
      .then((r) => r.json())
      .then((data) => setPages(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load pages"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(emptyForm); setError(null); setTab("general"); setShowForm(true);
  };
  const openEdit = (page: Page) => {
    setEditing(page);
    setForm({ name: page.name, slug: page.slug, description: page.description || "", seoTitle: page.seoTitle || "", seoDescription: page.seoDescription || "", keywords: page.keywords || "", ogTitle: page.ogTitle || "", ogDescription: page.ogDescription || "", ogImage: page.ogImage || "", schema: page.schema || "", robotsNoIndex: page.robotsNoIndex || false });
    setError(null); setTab("general"); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true); setError(null);
    try {
      const url    = editing ? `${API}/api/pages/${editing._id}` : `${API}/api/pages`;
      const method = editing ? "PUT" : "POST";
      const token  = localStorage.getItem("token") || "";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setShowForm(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save page");
    } finally { setSaving(false); }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete page "${page.name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token") || "";
    await fetch(`${API}/api/pages/${page._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const filtered = pages.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Pages</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Manage website pages, SEO settings, and content blocks.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ background: "#a8c7fa", color: "#111111" }}
        >
          + Add Page
        </button>
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
            placeholder="Search pages…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-start justify-center z-[100] overflow-y-auto py-16 px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div className="px-7 pt-7 pb-4">
              <h2 className="text-[17px] font-semibold" style={{ color: "#e8eaed" }}>{editing ? "Edit Page" : "New Page"}</h2>
            </div>

            {/* Tabs */}
            <div className="px-7 flex gap-6 mb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {(["general", "seo"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className="pb-3 text-[13px] font-semibold capitalize relative transition-colors"
                  style={{ color: tab === t ? "#a8c7fa" : "#9aa0a6" }}>
                  {t === "seo" ? "SEO & Schema" : "General Settings"}
                  {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#a8c7fa" }} />}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-4">
              {tab === "general" && (
                <div className="space-y-4">
                  <div>
                    <label style={D.label}>Page name</label>
                    <input style={D.input} placeholder="e.g. Services" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} required />
                  </div>
                  <div>
                    <label style={D.label}>URL Slug <span className="font-normal normal-case ml-1 opacity-60">/ {form.slug || "page-url"}</span></label>
                    <input style={{ ...D.input, fontFamily: "monospace" }} placeholder="e.g. services" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} onFocus={inputFocus} onBlur={inputBlur} required />
                  </div>
                  <div>
                    <label style={D.label}>Internal Notes</label>
                    <textarea style={{ ...D.input, resize: "vertical" }} placeholder="What is this page for?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>
              )}

              {tab === "seo" && (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <p style={D.label}>Search Engine Optimization</p>
                    <div>
                      <label style={{ ...D.label, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>SEO Title</label>
                      <input style={D.input} placeholder={form.name || "Meta title"} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label style={{ ...D.label, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>Meta Description</label>
                      <textarea style={{ ...D.input, resize: "vertical" }} rows={2} placeholder="Description for search results" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p style={D.label}>Open Graph (Social Sharing)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ ...D.label, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>OG Title</label>
                        <input style={D.input} placeholder={form.seoTitle || form.name} value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                      <div>
                        <label style={{ ...D.label, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>OG Image URL</label>
                        <input style={D.input} placeholder="https://…" value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input type="checkbox" className="w-4 h-4 rounded" checked={form.robotsNoIndex} onChange={(e) => setForm({ ...form, robotsNoIndex: e.target.checked })} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "#e8eaed" }}>Hide from Search Engines</p>
                      <p className="text-[11px]" style={{ color: "#9aa0a6" }}>Adds &apos;noindex, nofollow&apos; meta tag to this page.</p>
                    </div>
                  </label>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                  style={{ background: "#a8c7fa", color: "#111111" }}>
                  {saving ? "Saving…" : editing ? "Update Page" : "Create Page"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>{search ? "No pages match your search." : "No pages yet."}</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={D.th}>Page</th>
                  <th style={{ ...D.th, display: "none" }} className="md:table-cell">SEO</th>
                  <th style={{ ...D.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((page) => (
                  <tr key={page._id}>
                    <td style={D.td}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-medium" style={{ color: "#a8c7fa" }}>{page.name}</span>
                        {page.robotsNoIndex && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>Private</span>}
                      </div>
                      <span className="text-[12px] font-mono" style={{ color: "#9aa0a6" }}>/{page.slug}</span>
                    </td>
                    <td style={{ ...D.td }} className="hidden md:table-cell">
                      <p className="text-[13px] truncate max-w-[260px]" style={{ color: page.seoTitle ? "#e8eaed" : "#5f6368", fontStyle: page.seoTitle ? "normal" : "italic" }}>
                        {page.seoTitle || "No title set"}
                      </p>
                      <p className="text-[11px]" style={{ color: "#9aa0a6" }}>
                        {page.seoDescription ? "Meta description active" : "Missing meta description"}
                      </p>
                    </td>
                    <td style={{ ...D.td, textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/pages/${page._id}/blocks`}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          Content
                        </Link>
                        <button onClick={() => openEdit(page)}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          SEO
                        </button>
                        <button onClick={() => handleDelete(page)}
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
                {filtered.length} of {pages.length} page{pages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
