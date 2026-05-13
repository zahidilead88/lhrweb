"use client";
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

export default function PagesAdminPage() {
  const [pages, setPages]       = useState<Page[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Page | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<"general" | "seo">("general");

  const load = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/pages")
      .then((r) => r.json())
      .then((data) => setPages(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load pages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setTab("general");
    setShowForm(true);
  };

  const openEdit = (page: Page) => {
    setEditing(page);
    setForm({
      name: page.name, slug: page.slug, description: page.description || "",
      seoTitle: page.seoTitle || "", seoDescription: page.seoDescription || "",
      keywords: page.keywords || "", ogTitle: page.ogTitle || "",
      ogDescription: page.ogDescription || "", ogImage: page.ogImage || "",
      schema: page.schema || "", robotsNoIndex: page.robotsNoIndex || false,
    });
    setError(null);
    setTab("general");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true); setError(null);
    try {
      const url    = editing ? `http://localhost:8000/api/pages/${editing._id}` : "http://localhost:8000/api/pages";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete page "${page.name}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/pages/${page._id}`, { method: "DELETE" });
    load();
  };

  const inputCls = "border px-3 py-2 w-full rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Pages</h1>
          <p className="admin-subtext">Manage your website pages, SEO settings, and content blocks.</p>
        </div>
        <button onClick={openAdd} className="admin-button-primary">
          <span className="text-lg leading-none">+</span> Add Page
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[100] overflow-y-auto py-20 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">{editing ? "Edit Page" : "New Page"}</h2>
            </div>

            {/* Tabs */}
            <div className="px-8 flex gap-6 mb-6 border-b border-gray-50">
              {(["general", "seo"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`pb-3 text-[13px] font-semibold capitalize transition-all relative ${tab === t ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                  {t === "seo" ? "SEO & Schema" : "General Settings"}
                  {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {tab === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="admin-label">Page name</label>
                    <input className="admin-input" 
                      placeholder="e.g. Services" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="admin-label">
                      URL Slug
                      <span className="font-normal lowercase ml-2 text-gray-300">/ {form.slug || "page-url"}</span>
                    </label>
                    <input className="admin-input font-mono" 
                      placeholder="e.g. services" value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} required />
                  </div>
                  <div>
                    <label className="admin-label">Internal Notes</label>
                    <textarea className="admin-input" 
                      placeholder="What is this page for?" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              )}

              {tab === "seo" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="admin-label">Search Engine Optimization</p>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1">SEO Title</label>
                      <input className="admin-input" 
                        placeholder={form.name || "Meta title"} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1">Meta Description</label>
                      <textarea className="admin-input" 
                        rows={2} placeholder="Description for search results" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <p className="admin-label">Open Graph (Social Sharing)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1">OG Title</label>
                        <input className="admin-input" 
                          placeholder={form.seoTitle || form.name} value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1">OG Image URL</label>
                        <input className="admin-input" 
                          placeholder="https://..." value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      checked={form.robotsNoIndex} onChange={(e) => setForm({ ...form, robotsNoIndex: e.target.checked })} />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">Hide from Search Engines</p>
                      <p className="text-[11px] text-gray-500">Adds 'noindex, nofollow' meta tag to this page.</p>
                    </div>
                  </label>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[12px] font-medium">
                  <span className="w-4 h-4 flex items-center justify-center bg-red-100 rounded-full text-[10px]">!</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="flex-1 admin-button-primary">
                  {saving ? "Processing..." : editing ? "Update Page" : "Create Page"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="admin-button-secondary border-0">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Fetching pages...</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th">Page Info</th>
                <th className="admin-table-th hidden md:table-cell">Search Visibility</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map((page) => (
                <tr key={page._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-bold text-gray-900">{page.name}</span>
                        {page.robotsNoIndex && (
                          <span className="admin-badge admin-badge-light text-[9px] lowercase">Private</span>
                        )}
                      </div>
                      <span className="text-[12px] font-mono text-gray-400">/{page.slug}</span>
                    </div>
                  </td>
                  <td className="admin-table-td hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-gray-600 line-clamp-1 max-w-[250px]">
                        {page.seoTitle || <span className="text-gray-300 italic font-normal">No title set</span>}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {page.seoDescription ? "Meta description active" : "Missing meta description"}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/pages/${page._id}/blocks`} className="admin-button-secondary py-2 px-4 border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100">
                        Content
                      </Link>
                      <button onClick={() => openEdit(page)} className="admin-button-secondary py-2 px-4">
                        SEO
                      </button>
                      <button onClick={() => handleDelete(page)} className="admin-button-danger py-2 px-4">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center">
            <p className="admin-label normal-case tracking-normal">
              {pages.length} Total Page{pages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
