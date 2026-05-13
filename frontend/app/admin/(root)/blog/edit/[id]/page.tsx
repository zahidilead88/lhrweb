"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const PRESET_CATEGORIES = [
  "design", "development", "branding", "marketing", "strategy",
  "ecommerce", "shopify", "seo", "social media", "case study",
  "news", "tutorial", "opinion",
];

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag]       = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/blogs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || "");
        setContent(data.content || "");
        setSelectedTags(Array.isArray(data.tags) ? data.tags.map((t: string) => t.trim().toLowerCase()) : []);
      })
      .catch(() => setError("Could not load blog"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) setSelectedTags((prev) => [...prev, t]);
    setCustomTag("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`http://localhost:8000/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, tags: selectedTags.join(",") }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/blog");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to update blog");
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Article</h1>
          <p className="text-[13px] text-gray-500 mt-2">Modify the details of your existing blog post.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Title</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How we redesigned Acme's brand"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Article Content</label>
                <textarea
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your story here..."
                  required
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Categories</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CATEGORIES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="New category..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                  />
                  <button type="button" onClick={addCustomTag} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold hover:bg-gray-200 transition-all">
                    Add
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Post Info</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">ID</span>
                    <span className="font-mono text-gray-400">{id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[13px] font-medium animate-in fade-in slide-in-from-top-1">
              <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-[12px]">!</span>
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-gray-50">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-black text-white px-8 py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {saving ? "Updating post..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.push("/admin/blog")} className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-bold hover:bg-gray-100 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
