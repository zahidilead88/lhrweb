"use client";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type BlockType = "hero" | "intro" | "image-full" | "image-2col" | "video" | "pull-quote" | "carousel" | "media-grid" | "text-pattern";

interface Block {
  _id?: string; type: BlockType; heading: string; subheading: string; text: string;
  images: string[]; videoUrl: string; meta: Record<string, string>; order: number;
}

interface Project { _id: string; title: string; image: string; shortDescription: string; blocks?: Block[] }

const BLOCK_TYPES: BlockType[] = ["hero","intro","image-full","image-2col","video","pull-quote","carousel","media-grid","text-pattern"];

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero", intro: "Intro", "image-full": "Image — Full Width", "image-2col": "Image — 2 Column",
  video: "Video", "pull-quote": "Pull Quote", carousel: "Carousel", "media-grid": "Media Grid", "text-pattern": "Text Pattern",
};

function makeBlock(type: BlockType, order: number): Block {
  return { type, heading: "", subheading: "", text: "", images: [], videoUrl: "", meta: {}, order };
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
        <TF label="Video URL" value={block.videoUrl} onChange={(v) => set({ videoUrl: v })} placeholder="https://… or public/uploads/video.mp4" />
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

export default function BlockEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks]   = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newType, setNewType] = useState<BlockType>("hero");

  useEffect(() => {
    fetch(`${API}/api/projects/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data: Project) => {
        setProject(data);
        const sorted = (data.blocks || []).slice().sort((a, b) => a.order - b.order);
        setBlocks(sorted.map((b, i) => ({ ...b, order: i })));
        setLoading(false);
      })
      .catch(() => router.replace("/admin/project"));
  }, [id, router]);

  const addBlock = () => {
    const nb = makeBlock(newType, blocks.length);
    const next = [...blocks, nb];
    setBlocks(next);
    setExpanded((prev) => new Set(prev).add(next.length - 1));
  };

  const updateBlock = (idx: number, b: Block) => setBlocks((prev) => prev.map((x, i) => (i === idx ? b : x)));

  const removeBlock = (idx: number) => {
    if (!confirm("Delete this block?")) return;
    setBlocks((prev) => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i })));
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => { if (v < idx) next.add(v); else if (v > idx) next.add(v - 1); });
      return next;
    });
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocks(next.map((b, i) => ({ ...b, order: i })));
    setExpanded((prev) => {
      const next2 = new Set<number>();
      prev.forEach((v) => { if (v === idx) next2.add(target); else if (v === target) next2.add(idx); else next2.add(v); });
      return next2;
    });
  };

  const toggleExpanded = (idx: number) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch(`${API}/api/projects/${id}/blocks`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) throw new Error();
      setMessage({ type: "ok", text: "Blocks saved successfully!" });
    } catch {
      setMessage({ type: "err", text: "Failed to save. Please try again." });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <button type="button" onClick={() => router.push("/admin/project")}
            className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 transition-colors"
            style={{ color: "#9aa0a6" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8eaed")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9aa0a6")}>
            ← Back to Projects
          </button>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Project Blocks</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>
            Building narrative for <span style={{ color: "#e8eaed" }}>{project?.title}</span>
          </p>
        </div>
        <button onClick={save} disabled={saving}
          className="py-2.5 px-5 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          {saving ? "Saving…" : "Save Blocks"}
        </button>
      </div>

      {/* Status */}
      {message && (
        <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2"
          style={{ background: message.type === "ok" ? "rgba(52,211,153,0.1)" : "rgba(234,67,53,0.1)", border: `1px solid ${message.type === "ok" ? "rgba(52,211,153,0.2)" : "rgba(234,67,53,0.2)"}`, color: message.type === "ok" ? "#34d399" : "#f28b82" }}>
          {message.type === "ok" ? "✓" : "!"} {message.text}
        </div>
      )}

      {/* Add block */}
      <div className="flex gap-3 items-end p-5 rounded-xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex-1">
          <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Segment Type</label>
          <select value={newType} onChange={(e) => setNewType(e.target.value as BlockType)}
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none", appearance: "none" as const }}>
            {BLOCK_TYPES.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
          </select>
        </div>
        <button onClick={addBlock} className="py-2.5 px-5 rounded-xl text-[13px] font-semibold"
          style={{ background: "rgba(168,199,250,0.15)", color: "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)" }}>
          + Add Block
        </button>
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="py-16 text-center rounded-xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-semibold mb-2" style={{ color: "#e8eaed" }}>No blocks yet</p>
          <p className="text-[13px]" style={{ color: "#5f6368" }}>Add segments above to build the project narrative.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => {
            const isExpanded = expanded.has(idx);
            return (
              <div key={idx} className="rounded-xl overflow-hidden transition-all"
                style={{ background: "#1c1c1c", border: `1px solid ${isExpanded ? "rgba(168,199,250,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
                  style={{ background: isExpanded ? "rgba(168,199,250,0.04)" : "transparent" }}
                  onClick={() => toggleExpanded(idx)}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                    style={{ background: "rgba(168,199,250,0.12)", color: "#a8c7fa" }}>
                    {BLOCK_LABELS[block.type]}
                  </span>
                  <p className="text-[13px] flex-1 truncate" style={{ color: "#e8eaed" }}>
                    {block.heading || block.text?.substring(0, 60) || "Untitled block"}
                  </p>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded text-[12px] disabled:opacity-20 transition-colors"
                      style={{ color: "#9aa0a6" }}>↑</button>
                    <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded text-[12px] disabled:opacity-20 transition-colors"
                      style={{ color: "#9aa0a6" }}>↓</button>
                    <button onClick={() => removeBlock(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[14px] transition-colors"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                    <span className="text-[10px] ml-1" style={{ color: "#5f6368" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <BlockPanel block={block} onChange={(b) => updateBlock(idx, b)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {blocks.length > 0 && (
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
