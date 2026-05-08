"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const PRESET_CATEGORIES = [
  "fashion", "fitness & sport", "education", "health", "property",
  "corporate", "food & drink", "agency", "ecommerce", "b2b", "b2c",
  "shopify", "archive",
];

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle]               = useState("");
  const [shortDescription, setShortDesc]= useState("");
  const [description, setDescription]   = useState("");
  const [buttonText, setButtonText]     = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag]       = useState("");
  const [videoUrl, setVideoUrl]         = useState("");
  const [image, setImage]               = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8000/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || "");
        setButtonText(data.buttonText || "Learn More");
        setShortDesc(data.shortDescription || "");
        setDescription(data.description || "");
        setSelectedTags(Array.isArray(data.tags) ? data.tags.map((t: string) => t.trim().toLowerCase()) : []);
        setVideoUrl(data.videoUrl || "");
        setCurrentImage(data.image || "");
      })
      .catch(() => { setError("Failed to load project"); });
  }, [id]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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
    fd.append("shortDescription", shortDescription);
    fd.append("description", description);
    fd.append("buttonText", buttonText);
    fd.append("tags", selectedTags.join(","));
    fd.append("videoUrl", videoUrl);
    if (image) fd.append("image", image);

    const res = await fetch(`http://localhost:8000/api/projects/${id}`, { method: "PUT", body: fd });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/project");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to update project");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-semibold mb-1">Title <span className="text-red-500">*</span></label>
          <input
            className="border px-3 py-2 w-full rounded-lg text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Short description <span className="text-red-500">*</span></label>
          <input
            className="border px-3 py-2 w-full rounded-lg text-sm"
            value={shortDescription}
            onChange={(e) => setShortDesc(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Full description</label>
          <textarea
            className="border px-3 py-2 w-full rounded-lg text-sm"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Categories
            <span className="font-normal text-gray-400 ml-1">— used for filtering on the projects page</span>
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
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
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
            <label className="block text-sm font-semibold mb-1">Button text</label>
            <input
              className="border px-3 py-2 w-full rounded-lg text-sm"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Video URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="border px-3 py-2 w-full rounded-lg text-sm"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Project image</label>
          {currentImage && (
            <img
              src={`http://localhost:8000/${currentImage}`}
              alt="Current"
              className="h-32 rounded-lg object-cover mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="text-sm"
          />
          {currentImage && <p className="text-xs text-gray-400 mt-1">Leave blank to keep current image</p>}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/project")}
            className="px-6 py-2.5 rounded-lg text-sm border hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
