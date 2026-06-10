"use client";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;
import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_CATEGORIES = ["fashion","fitness & sport","education","health","property","corporate","food & drink","agency","ecommerce","b2b","b2c","shopify","archive"];

const INPUT:   React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL:   React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
const SURFACE: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
function iF(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iB(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

export default function AddProjectPage() {
  const router = useRouter();
  const [title, setTitle]               = useState("");
  const [shortDescription, setShortDesc] = useState("");
  const [description, setDescription]   = useState("");
  const [buttonText, setButtonText]     = useState("Learn More");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag]       = useState("");
  const [videoUrl, setVideoUrl]         = useState("");
  const [image, setImage]               = useState<File | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const toggleTag = (t: string) => setSelectedTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const addCustom = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) setSelectedTags((p) => [...p, t]);
    setCustomTag("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) { setError("Please upload a project image"); return; }
    setSaving(true); setError(null);
    const fd = new FormData();
    fd.append("title", title); fd.append("shortDescription", shortDescription);
    fd.append("description", description); fd.append("buttonText", buttonText);
    fd.append("tags", selectedTags.join(",")); fd.append("videoUrl", videoUrl);
    fd.append("image", image);
    const res = await fetch(`${API}/api/projects`, { method: "POST", body: fd });
    setSaving(false);
    if (res.ok) router.push("/admin/project");
    else { const d = await res.json(); setError(d.message || "Failed to add project"); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>New Project</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Add a new case study or piece of work to your portfolio.</p>
      </div>

      <div style={SURFACE} className="overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div><label style={LABEL}>Project Title</label><input style={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Acme Branding System" required onFocus={iF} onBlur={iB} /></div>
              <div><label style={LABEL}>Short Summary</label><input style={INPUT} value={shortDescription} onChange={(e) => setShortDesc(e.target.value)} placeholder="One-line summary for project cards" required onFocus={iF} onBlur={iB} /></div>
              <div>
                <label style={LABEL}>Full Case Study</label>
                <textarea style={{ ...INPUT, resize: "vertical" }} rows={8} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the work..." onFocus={iF} onBlur={iB} />
              </div>
            </div>

            <div className="space-y-5">
              {/* Media */}
              <div>
                <label style={LABEL}>Project Media</label>
                <div className="p-4 rounded-xl space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>Main Image</p>
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)}
                      className="text-[11px] w-full cursor-pointer" style={{ color: "#9aa0a6" }} required />
                  </div>
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>Video URL</p>
                    <input style={INPUT} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vimeo.com/…" onFocus={iF} onBlur={iB} />
                  </div>
                </div>
              </div>

              {/* Button */}
              <div>
                <label style={LABEL}>Button Text</label>
                <input style={INPUT} value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. View Case Study" onFocus={iF} onBlur={iB} />
              </div>

              {/* Tags */}
              <div>
                <label style={LABEL}>Categories</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESET_CATEGORIES.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ background: selectedTags.includes(t) ? "rgba(168,199,250,0.15)" : "rgba(255,255,255,0.05)", color: selectedTags.includes(t) ? "#a8c7fa" : "#9aa0a6", border: `1px solid ${selectedTags.includes(t) ? "rgba(168,199,250,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input style={{ ...INPUT, flex: 1 }} placeholder="Custom tag…" value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    onFocus={iF} onBlur={iB} />
                  <button type="button" onClick={addCustom}
                    className="px-3 rounded-xl text-[12px] font-semibold flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>Add</button>
                </div>
              </div>
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
              {saving ? "Creating…" : "Create Project"}
            </button>
            <button type="button" onClick={() => router.push("/admin/project")}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
