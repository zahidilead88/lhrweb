"use client";
import { useEffect, useState } from "react";

interface Page {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

const PROTECTED = ["home", "services", "about", "projects", "contact", "blog"];

const emptyForm = { name: "", slug: "", description: "" };

export default function PagesAdminPage() {
  const [pages, setPages]       = useState<Page[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Page | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

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
    setShowForm(true);
  };

  const openEdit = (page: Page) => {
    setEditing(page);
    setForm({ name: page.name, slug: page.slug, description: page.description || "" });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required");
      return;
    }
    setSaving(true);
    setError(null);
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
    if (PROTECTED.includes(page.slug)) {
      alert(`"${page.name}" is a core page and cannot be deleted.`);
      return;
    }
    if (!confirm(`Delete page "${page.name}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/pages/${page._id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage site pages. Each page can have sections added via the Sections panel.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          + Add Page
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">{editing ? "Edit Page" : "New Page"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Page name <span className="text-red-500">*</span></label>
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  placeholder="e.g. Team"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Slug <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-1">— used in the URL: /slug</span>
                </label>
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm font-mono"
                  placeholder="e.g. team"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  placeholder="Internal note about this page"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Page"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 rounded-lg text-sm border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 mt-10 text-center">Loading…</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((page) => (
                <tr key={page._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {page.name}
                    {PROTECTED.includes(page.slug) && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">core</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">/{page.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{page.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(page)}
                        className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(page)}
                        disabled={PROTECTED.includes(page.slug)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
