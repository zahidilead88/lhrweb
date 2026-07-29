"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { SECTION_TYPES_BY_KEY } from "@/lib/sectionRegistry";

type BlockType = "hero" | "intro" | "image-full" | "image-2col" | "video" | "pull-quote" | "carousel" | "media-grid" | "text-pattern";

interface Block {
  _id?: string; type: BlockType; heading: string; subheading: string; text: string;
  images: string[]; videoUrl: string; meta: Record<string, string>; enabled: boolean; order: number;
}

interface SectionDoc {
  _id: string; name: string; key: string; page: string;
  title?: string; shortDescription?: string; enabled: boolean; order: number; blocks: Block[];
}

interface PageData { _id: string; name: string; slug: string }

const BLOCK_TYPES: BlockType[] = ["hero","intro","image-full","image-2col","video","pull-quote","carousel","media-grid","text-pattern"];

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero", intro: "Intro", "image-full": "Image — Full Width", "image-2col": "Image — 2 Col",
  video: "Video", "pull-quote": "Pull Quote", carousel: "Carousel", "media-grid": "Media Grid", "text-pattern": "Text Pattern",
};

function makeBlock(type: BlockType, order: number): Block {
  return { type, heading: "", subheading: "", text: "", images: [], videoUrl: "", meta: {}, enabled: true, order };
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const res = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).url as string;
}

function Thumbnails({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url, i) => (
        <div key={i} className="relative">
          <img src={url.startsWith("http") ? url : `${API}/${url}`} alt=""
            className="w-16 h-16 object-cover rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
          <button type="button" onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] flex items-center justify-center rounded-full text-[11px]"
            style={{ background: "#ef4444", color: "white", border: "none" }}>×</button>
        </div>
      ))}
    </div>
  );
}

function UploadButton({ label, onUploaded, multiple }: { label: string; onUploaded: (url: string) => void; multiple?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try { for (const f of files) { onUploaded(await uploadFile(f)); } }
    catch { alert("Upload failed"); }
    finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleChange} />
      <button type="button" disabled={uploading} onClick={() => ref.current?.click()}
        className="text-[12px] px-3 py-1.5 rounded-lg"
        style={{ background: uploading ? "rgba(255,255,255,0.05)" : "rgba(168,199,250,0.15)", color: uploading ? "#5f6368" : "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)" }}>
        {uploading ? "Uploading…" : label}
      </button>
    </>
  );
}

function TF({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const style = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box" as const };
  return (
    <div className="flex flex-col gap-1">
      <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {multiline
        ? <textarea rows={3} style={style} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input type="text" style={style} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      }
    </div>
  );
}

function BlockPanel({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch });
  const setMeta = (key: string, val: string) => onChange({ ...block, meta: { ...block.meta, [key]: val } });
  const addImage = (url: string) => set({ images: [...block.images, url] });
  const removeImage = (i: number) => set({ images: block.images.filter((_, idx) => idx !== i) });
  return (
    <div className="flex flex-col gap-3">
      <TF label="Heading" value={block.heading} onChange={(v) => set({ heading: v })} />
      <TF label="Subheading" value={block.subheading} onChange={(v) => set({ subheading: v })} />
      <TF label="Text / Body" value={block.text} onChange={(v) => set({ text: v })} multiline />
      {block.type === "hero" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Background Image</label>
          <UploadButton label="Upload Image" onUploaded={addImage} />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "intro" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <TF label="Client" value={block.meta?.client || ""} onChange={(v) => setMeta("client", v)} placeholder="Acme Corp" />
            <TF label="Industry" value={block.meta?.industry || ""} onChange={(v) => setMeta("industry", v)} placeholder="Technology" />
            <TF label="Duration" value={block.meta?.duration || ""} onChange={(v) => setMeta("duration", v)} placeholder="6 weeks" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Team Avatars</label>
            <UploadButton label="Upload" onUploaded={addImage} multiple />
            <Thumbnails images={block.images} onRemove={removeImage} />
          </div>
        </>
      )}
      {block.type === "image-full" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Image</label>
          <UploadButton label="Upload Image" onUploaded={addImage} />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "image-2col" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Images (upload 2)</label>
          <UploadButton label="Upload Images" onUploaded={addImage} multiple />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "video" && (
        <TF label="Video URL" value={block.videoUrl} onChange={(v) => set({ videoUrl: v })} placeholder="https://…" />
      )}
      {(block.type === "carousel" || block.type === "media-grid") && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Images</label>
          <UploadButton label="Upload Images" onUploaded={addImage} multiple />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "text-pattern" && (
        <TF label="Pattern Text" value={block.meta?.patternText || ""} onChange={(v) => setMeta("patternText", v)} placeholder="RELENTLESS" />
      )}
    </div>
  );
}

export default function PageContentEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage]         = useState<PageData | null>(null);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedBlocks, setExpandedBlocks]     = useState<Record<string, Set<number>>>({});
  const [sectionBlockTypes, setSectionBlockTypes] = useState<Record<string, BlockType>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName]         = useState("");
  const [newKey, setNewKey]           = useState("");
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    fetch(`${API}/api/pages/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: PageData) => {
        setPage(data);
        return fetch(`${API}/api/sections?page=${data.slug}`);
      })
      .then(r => r.json())
      .then((secs: SectionDoc[]) => {
        const sorted = (Array.isArray(secs) ? secs : []).sort((a, b) => a.order - b.order);
        setSections(sorted.map((s, i) => ({
          ...s, enabled: s.enabled !== false, order: i,
          blocks: (s.blocks || []).slice().sort((a, b) => a.order - b.order).map((b, j) => ({ ...b, order: j })),
        })));
        setLoading(false);
      })
      .catch(() => router.replace("/admin/pages"));
  }, [id, router]);

  const updateSection = (sId: string, patch: Partial<SectionDoc>) =>
    setSections(prev => prev.map(s => s._id === sId ? { ...s, ...patch } : s));

  const moveSection = (sId: string, dir: -1 | 1) => {
    const idx = sections.findIndex(s => s._id === sId);
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
  };

  const deleteSection = async (sId: string) => {
    if (!confirm("Delete this section and all its blocks?")) return;
    const token = localStorage.getItem("token") || "";
    await fetch(`${API}/api/sections/${sId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setSections(prev => prev.filter(s => s._id !== sId).map((s, i) => ({ ...s, order: i })));
  };

  const toggleSectionExpand = (sId: string) =>
    setExpandedSections(prev => { const next = new Set(prev); if (next.has(sId)) next.delete(sId); else next.add(sId); return next; });

  const addBlock = (sId: string) => {
    const type = sectionBlockTypes[sId] || "hero";
    const section = sections.find(s => s._id === sId);
    if (!section) return;
    const nb = makeBlock(type, section.blocks.length);
    const newBlocks = [...section.blocks, nb];
    updateSection(sId, { blocks: newBlocks });
    setExpandedBlocks(prev => { const set = new Set(prev[sId] || []); set.add(newBlocks.length - 1); return { ...prev, [sId]: set }; });
  };

  const updateBlock = (sId: string, bi: number, block: Block) =>
    setSections(prev => prev.map(s => s._id === sId ? { ...s, blocks: s.blocks.map((b, j) => j === bi ? block : b) } : s));

  const removeBlock = (sId: string, bi: number) => {
    if (!confirm("Delete this block?")) return;
    setSections(prev => prev.map(s => s._id === sId
      ? { ...s, blocks: s.blocks.filter((_, j) => j !== bi).map((b, j) => ({ ...b, order: j })) } : s));
    setExpandedBlocks(prev => {
      const set = new Set<number>();
      (prev[sId] || new Set()).forEach(v => { if (v < bi) set.add(v); else if (v > bi) set.add(v - 1); });
      return { ...prev, [sId]: set };
    });
  };

  const moveBlock = (sId: string, bi: number, dir: -1 | 1) => {
    const section = sections.find(s => s._id === sId);
    if (!section) return;
    const target = bi + dir;
    if (target < 0 || target >= section.blocks.length) return;
    const next = [...section.blocks];
    [next[bi], next[target]] = [next[target], next[bi]];
    updateSection(sId, { blocks: next.map((b, j) => ({ ...b, order: j })) });
    setExpandedBlocks(prev => {
      const set = new Set<number>();
      (prev[sId] || new Set()).forEach(v => { if (v === bi) set.add(target); else if (v === target) set.add(bi); else set.add(v); });
      return { ...prev, [sId]: set };
    });
  };

  const toggleBlockExpand = (sId: string, bi: number) =>
    setExpandedBlocks(prev => { const set = new Set(prev[sId] || []); if (set.has(bi)) set.delete(bi); else set.add(bi); return { ...prev, [sId]: set }; });

  const createSection = async () => {
    if (!newName.trim() || !page) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newName.trim()); fd.append("key", newKey); fd.append("page", page.slug); fd.append("order", String(sections.length));
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/api/sections`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error();
      const sec: SectionDoc = await res.json();
      setSections(prev => [...prev, { ...sec, enabled: true, blocks: [] }]);
      setShowAddForm(false); setNewName(""); setNewKey("");
    } catch { alert("Failed to create section"); }
    finally { setCreating(false); }
  };

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await Promise.all(sections.map((s, i) =>
        fetch(`${API}/api/sections/${s._id}/blocks`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, enabled: s.enabled, order: i, blocks: s.blocks }),
        })
      ));
      setMessage({ type: "ok", text: "Saved successfully!" });
    } catch { setMessage({ type: "err", text: "Failed to save. Please try again." }); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
    </div>
  );

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <button type="button" onClick={() => router.push("/admin/pages")}
            className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 transition-colors"
            style={{ color: "#9aa0a6" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8eaed")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9aa0a6")}>
            ← Back to Pages
          </button>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Page Structure</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>
            Managing <span style={{ color: "#e8eaed" }}>{page?.name}</span>{" "}
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#5f6368" }}>/{page?.slug}</span>
          </p>
        </div>
        <button onClick={save} disabled={saving} className="py-2.5 px-5 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          {saving ? "Saving…" : "Save Structure"}
        </button>
      </div>

      {/* Status */}
      {message && (
        <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2"
          style={{ background: message.type === "ok" ? "rgba(52,211,153,0.1)" : "rgba(234,67,53,0.1)", border: `1px solid ${message.type === "ok" ? "rgba(52,211,153,0.2)" : "rgba(234,67,53,0.2)"}`, color: message.type === "ok" ? "#34d399" : "#f28b82" }}>
          {message.type === "ok" ? "✓" : "!"} {message.text}
        </div>
      )}

      {/* Add section */}
      <div>
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="w-full py-4 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", color: "#5f6368" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(168,199,250,0.3)"; e.currentTarget.style.color = "#a8c7fa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#5f6368"; }}>
            + Add New Section
          </button>
        ) : (
          <div className="p-5 rounded-xl space-y-4" style={{ background: "#1c1c1c", border: "1px solid rgba(168,199,250,0.2)" }}>
            <p style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>New Section</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Internal Name</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createSection()}
                  placeholder="e.g. Hero Section"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" }} />
              </div>
              <div>
                <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Component Type (optional)</label>
                <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. hero-banner"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none", fontFamily: "monospace" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createSection} disabled={creating || !newName.trim()}
                className="py-2 px-4 rounded-lg text-[13px] font-semibold disabled:opacity-40"
                style={{ background: "#a8c7fa", color: "#111111" }}>
                {creating ? "Creating…" : "Create Section"}
              </button>
              <button onClick={() => { setShowAddForm(false); setNewName(""); setNewKey(""); }}
                className="py-2 px-4 rounded-lg text-[13px] font-semibold"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section list */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section._id);
          const sType = SECTION_TYPES_BY_KEY[section.key];
          return (
            <div key={section._id} className="rounded-xl overflow-hidden"
              style={{ background: "#1c1c1c", border: `1px solid ${isExpanded ? "rgba(168,199,250,0.15)" : "rgba(255,255,255,0.08)"}` }}>
              {/* Section header */}
              <div className="px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
                style={{ background: isExpanded ? "rgba(168,199,250,0.04)" : "transparent" }}
                onClick={() => toggleSectionExpand(section._id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${section.enabled ? "" : "opacity-30"}`}
                    style={{ background: section.enabled ? "#34d399" : "#9aa0a6" }} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#e8eaed" }}>{section.name}</p>
                    {sType && <p className="text-[11px]" style={{ color: "#5f6368" }}>{sType.label}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: "#5f6368" }}>
                    {section.blocks.length} block{section.blocks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => updateSection(section._id, { enabled: !section.enabled })}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider transition-colors"
                    style={{ background: section.enabled ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", color: section.enabled ? "#34d399" : "#5f6368", border: `1px solid ${section.enabled ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                    {section.enabled ? "On" : "Off"}
                  </button>
                  <button onClick={() => moveSection(section._id, -1)} disabled={sections.indexOf(section) === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-[12px] disabled:opacity-20"
                    style={{ color: "#9aa0a6" }}>↑</button>
                  <button onClick={() => moveSection(section._id, 1)} disabled={sections.indexOf(section) === sections.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-[12px] disabled:opacity-20"
                    style={{ color: "#9aa0a6" }}>↓</button>
                  <button onClick={() => deleteSection(section._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[14px] transition-colors"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                  <span className="text-[10px] ml-1" style={{ color: "#5f6368" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Section body with blocks */}
              {isExpanded && (
                <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Add block row */}
                  <div className="flex gap-3 items-end p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex-1">
                      <label style={{ color: "#9aa0a6", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Block Type</label>
                      <select value={sectionBlockTypes[section._id] || "hero"}
                        onChange={(e) => setSectionBlockTypes(prev => ({ ...prev, [section._id]: e.target.value as BlockType }))}
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none", appearance: "none" as const }}>
                        {BLOCK_TYPES.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <button onClick={() => addBlock(section._id)}
                      className="py-2 px-4 rounded-lg text-[12px] font-semibold"
                      style={{ background: "rgba(168,199,250,0.15)", color: "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)" }}>
                      + Add Block
                    </button>
                  </div>

                  {/* Block list */}
                  {section.blocks.length === 0 ? (
                    <p className="text-center py-6 text-[12px]" style={{ color: "#5f6368" }}>No blocks in this section.</p>
                  ) : (
                    <div className="space-y-2">
                      {section.blocks.map((block, bi) => {
                        const blockExpanded = (expandedBlocks[section._id] || new Set()).has(bi);
                        return (
                          <div key={bi} className="rounded-lg overflow-hidden"
                            style={{ background: "#111111", border: `1px solid ${blockExpanded ? "rgba(168,199,250,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                            <div className="px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
                              onClick={() => toggleBlockExpand(section._id, bi)}>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                                style={{ background: "rgba(168,199,250,0.1)", color: "#a8c7fa" }}>
                                {BLOCK_LABELS[block.type]}
                              </span>
                              <p className="text-[12px] flex-1 truncate" style={{ color: "#e8eaed" }}>
                                {block.heading || block.text?.substring(0, 50) || "Untitled block"}
                              </p>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => moveBlock(section._id, bi, -1)} disabled={bi === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded text-[11px] disabled:opacity-20" style={{ color: "#9aa0a6" }}>↑</button>
                                <button onClick={() => moveBlock(section._id, bi, 1)} disabled={bi === section.blocks.length - 1}
                                  className="w-5 h-5 flex items-center justify-center rounded text-[11px] disabled:opacity-20" style={{ color: "#9aa0a6" }}>↓</button>
                                <button onClick={() => removeBlock(section._id, bi)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-[13px] transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                                <span className="text-[9px] ml-1" style={{ color: "#5f6368" }}>{blockExpanded ? "▲" : "▼"}</span>
                              </div>
                            </div>
                            {blockExpanded && (
                              <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <BlockPanel block={block} onChange={b => updateBlock(section._id, bi, b)} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sections.length > 0 && (
        <div className="flex justify-end pb-10">
          <button onClick={save} disabled={saving} className="py-2.5 px-6 rounded-xl text-[13px] font-semibold"
            style={{ background: "#a8c7fa", color: "#111111" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
