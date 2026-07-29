"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PRESET_CATEGORIES = ["design","development","branding","marketing","strategy","ecommerce","shopify","seo","social media","case study","news","tutorial","opinion"];
interface PageData { _id: string; name: string; slug: string; }

const INPUT: React.CSSProperties  = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL: React.CSSProperties  = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
const SURFACE: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
function iFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iBlur (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

export default function AddBlog() {
  const router = useRouter();
  const [title, setTitle]                     = useState("");
  const [content, setContent]                 = useState("");
  const [thumbnail, setThumbnail]             = useState<File | null>(null);
  const [fullImage, setFullImage]             = useState<File | null>(null);
  const [selectedTags, setSelectedTags]       = useState<string[]>([]);
  const [customTag, setCustomTag]             = useState("");
  const [pages, setPages]                     = useState<PageData[]>([]);
  const [featuredPages, setFeaturedPages]     = useState<string[]>([]);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/pages`).then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setPages(d.filter((p) => p.name && p.slug)); })
      .catch(() => {});
  }, []);

  const toggleTag  = (t: string) => setSelectedTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const togglePage = (s: string) => setFeaturedPages((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const addCustom  = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) setSelectedTags((p) => [...p, t]);
    setCustomTag("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    const fd = new FormData();
    fd.append("title", title); fd.append("content", content);
    fd.append("tags", selectedTags.join(",")); fd.append("featuredPages", featuredPages.join(","));
    if (thumbnail) fd.append("thumbnail", thumbnail);
    if (fullImage)  fd.append("fullImage", fullImage);
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API}/api/blogs`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    setSaving(false);
    if (res.ok) router.push("/admin/blog");
    else { const d = await res.json(); setError(d.message || "Failed to add blog"); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>New Article</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Create a new post for your journal or news section.</p>
      </div>

      <div style={SURFACE} className="overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label style={LABEL}>Title</label>
                <input style={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How we redesigned Acme's brand" required onFocus={iFocus} onBlur={iBlur} />
              </div>
              <div>
                <label style={LABEL}>Article Content</label>
                <textarea style={{ ...INPUT, resize: "vertical" }} rows={14} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing your story here..." required onFocus={iFocus} onBlur={iBlur} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Images */}
              <div>
                <label style={LABEL}>Featured Images</label>
                <div className="p-4 rounded-xl space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>Thumbnail (Card)</p>
                    <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                      className="text-[11px] w-full cursor-pointer"
                      style={{ color: "#9aa0a6" }} />
                  </div>
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>Header Image (Full)</p>
                    <input type="file" accept="image/*" onChange={(e) => setFullImage(e.target.files?.[0] || null)}
                      className="text-[11px] w-full cursor-pointer"
                      style={{ color: "#9aa0a6" }} />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={LABEL}>Categories</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESET_CATEGORIES.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ background: selectedTags.includes(tag) ? "rgba(168,199,250,0.15)" : "rgba(255,255,255,0.05)", color: selectedTags.includes(tag) ? "#a8c7fa" : "#9aa0a6", border: `1px solid ${selectedTags.includes(tag) ? "rgba(168,199,250,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input style={{ ...INPUT, flex: 1 }} placeholder="Custom category…" value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    onFocus={iFocus} onBlur={iBlur} />
                  <button type="button" onClick={addCustom}
                    className="px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Featured pages */}
              {pages.length > 0 && (
                <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={LABEL}>Featured on Pages</label>
                  <p className="text-[11px] mb-3" style={{ color: "#5f6368" }}>Select pages to feature this post.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pages.map((p) => (
                      <button key={p.slug} type="button" onClick={() => togglePage(p.slug)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                        style={{ background: featuredPages.includes(p.slug) ? "rgba(168,199,250,0.15)" : "rgba(255,255,255,0.05)", color: featuredPages.includes(p.slug) ? "#a8c7fa" : "#9aa0a6", border: `1px solid ${featuredPages.includes(p.slug) ? "rgba(168,199,250,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
              <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>{error}
            </div>
          )}

          <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: "#a8c7fa", color: "#111111" }}>
              {saving ? "Publishing…" : "Publish Article"}
            </button>
            <button type="button" onClick={() => router.push("/admin/blog")}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
              Discard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
