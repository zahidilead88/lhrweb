"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_CATEGORIES = [
  "design", "development", "branding", "marketing", "strategy",
  "ecommerce", "shopify", "seo", "social media", "case study",
  "news", "tutorial", "opinion",
];

export default function AddBlog() {
  const router = useRouter();
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [thumbnail, setThumbnail]       = useState<File | null>(null);
  const [fullImage, setFullImage]       = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

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

    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    fd.append("tags", selectedTags.join(","));
    if (thumbnail) fd.append("thumbnail", thumbnail);
    if (fullImage)  fd.append("fullImage", fullImage);

    const res = await fetch("http://localhost:8000/api/blogs", { method: "POST", body: fd });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/blog");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to add blog");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Blog Post</h1>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-semibold mb-1">Title <span className="text-red-500">*</span></label>
          <input
            className="border px-3 py-2 w-full rounded-lg text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How we redesigned Acme's brand"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Content <span className="text-red-500">*</span></label>
          <textarea
            className="border px-3 py-2 w-full rounded-lg text-sm"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the blog content here…"
            required
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Categories
            <span className="font-normal text-gray-400 ml-1">— used for filtering on the blog page</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_CATEGORIES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="border px-3 py-2 rounded-lg text-sm flex-1"
              placeholder="Add custom category…"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
            />
            <button type="button" onClick={addCustomTag} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              Add
            </button>
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedTags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => toggleTag(t)} className="hover:opacity-70 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Thumbnail <span className="text-gray-400 font-normal">(card image)</span></label>
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Full image <span className="text-gray-400 font-normal">(detail page)</span></label>
            <input type="file" accept="image/*" onChange={(e) => setFullImage(e.target.files?.[0] || null)} className="text-sm" />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Blog Post"}
          </button>
          <button type="button" onClick={() => router.push("/admin/blog")} className="px-6 py-2.5 rounded-lg text-sm border hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
