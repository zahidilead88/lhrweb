"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_CATEGORIES = [
  "fashion", "fitness & sport", "education", "health", "property",
  "corporate", "food & drink", "agency", "ecommerce", "b2b", "b2c",
  "shopify", "archive",
];

export default function AddProjectPage() {
  const router = useRouter();
  const [title, setTitle]                   = useState("");
  const [shortDescription, setShortDesc]    = useState("");
  const [description, setDescription]       = useState("");
  const [buttonText, setButtonText]         = useState("Learn More");
  const [selectedTags, setSelectedTags]     = useState<string[]>([]);
  const [customTag, setCustomTag]           = useState("");
  const [videoUrl, setVideoUrl]             = useState("");
  const [image, setImage]                   = useState<File | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);

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
    if (!image) { setError("Please upload a project image"); return; }
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("shortDescription", shortDescription);
    fd.append("description", description);
    fd.append("buttonText", buttonText);
    fd.append("tags", selectedTags.join(","));
    fd.append("videoUrl", videoUrl);
    fd.append("image", image);

    const res = await fetch("http://localhost:8000/api/projects", { method: "POST", body: fd });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/project");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to add project");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Project</h1>
          <p className="text-[13px] text-gray-500 mt-2">Add a new case study or piece of work to your portfolio.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Project Title</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme Branding System"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Short Summary</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={shortDescription}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="One-line summary for project cards"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Case Study</label>
                <textarea
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the work performed..."
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Project Media</label>
                
                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Main Image</p>
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="text-[11px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:bg-black file:text-white hover:file:bg-gray-800 transition-all cursor-pointer" required />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Video URL</p>
                    <input
                      className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://vimeo.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Button Action</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[13px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. View Case Study"
                />
              </div>

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
                    placeholder="New..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                  />
                  <button type="button" onClick={addCustomTag} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold hover:bg-gray-200 transition-all">
                    Add
                  </button>
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
              {saving ? "Creating project..." : "Create Project"}
            </button>
            <button type="button" onClick={() => router.push("/admin/project")} className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-bold hover:bg-gray-100 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
