"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type BlockType =
  | "hero"
  | "intro"
  | "image-full"
  | "image-2col"
  | "video"
  | "pull-quote"
  | "carousel"
  | "media-grid"
  | "text-pattern";

interface Block {
  _id?: string;
  type: BlockType;
  heading: string;
  subheading: string;
  text: string;
  images: string[];
  videoUrl: string;
  meta: Record<string, string>;
  order: number;
}

interface Project {
  _id: string;
  title: string;
  image: string;
  shortDescription: string;
  blocks?: Block[];
}

const BLOCK_TYPES: BlockType[] = [
  "hero",
  "intro",
  "image-full",
  "image-2col",
  "video",
  "pull-quote",
  "carousel",
  "media-grid",
  "text-pattern",
];

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  intro: "Intro",
  "image-full": "Image — Full Width",
  "image-2col": "Image — 2 Column",
  video: "Video",
  "pull-quote": "Pull Quote",
  carousel: "Carousel",
  "media-grid": "Media Grid",
  "text-pattern": "Text Pattern",
};

const BLOCK_COLORS: Record<BlockType, string> = {
  hero: "bg-purple-100 text-purple-800",
  intro: "bg-blue-100 text-blue-800",
  "image-full": "bg-green-100 text-green-800",
  "image-2col": "bg-teal-100 text-teal-800",
  video: "bg-orange-100 text-orange-800",
  "pull-quote": "bg-pink-100 text-pink-800",
  carousel: "bg-yellow-100 text-yellow-800",
  "media-grid": "bg-indigo-100 text-indigo-800",
  "text-pattern": "bg-gray-200 text-gray-800",
};

function makeBlock(type: BlockType, order: number): Block {
  return {
    type,
    heading: "",
    subheading: "",
    text: "",
    images: [],
    videoUrl: "",
    meta: {},
    order,
  };
}

// ── Image upload helper ────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("http://localhost:8000/api/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
}

// ── Thumbnail strip ────────────────────────────────────────────────────────

function Thumbnails({
  images,
  onRemove,
}: {
  images: string[];
  onRemove: (idx: number) => void;
}) {
  if (!images.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
      {images.map((url, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img
            src={`http://localhost:8000/${url}`}
            alt=""
            style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              width: "18px",
              height: "18px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ── UploadButton ───────────────────────────────────────────────────────────

function UploadButton({
  label,
  onUploaded,
  multiple,
}: {
  label: string;
  onUploaded: (url: string) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const url = await uploadFile(f);
        onUploaded(url);
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        style={{
          fontSize: "12px",
          padding: "6px 12px",
          background: uploading ? "#9ca3af" : "#1f2937",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading…" : label}
      </button>
    </>
  );
}

// ── Field components ───────────────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const base = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    background: "white",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          style={base}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          style={base}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ── Block editor panel ─────────────────────────────────────────────────────

function BlockPanel({
  block,
  onChange,
}: {
  block: Block;
  onChange: (b: Block) => void;
}) {
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch });
  const setMeta = (key: string, val: string) =>
    onChange({ ...block, meta: { ...block.meta, [key]: val } });
  const addImage = (url: string) => set({ images: [...block.images, url] });
  const removeImage = (i: number) =>
    set({ images: block.images.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Common fields */}
      <TextField label="Heading" value={block.heading} onChange={(v) => set({ heading: v })} />
      <TextField label="Subheading" value={block.subheading} onChange={(v) => set({ subheading: v })} />
      <TextField label="Text / Body" value={block.text} onChange={(v) => set({ text: v })} multiline />

      {/* Type-specific fields */}
      {block.type === "intro" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <TextField
              label="Client"
              value={block.meta?.client || ""}
              onChange={(v) => setMeta("client", v)}
              placeholder="Acme Corp"
            />
            <TextField
              label="Industry"
              value={block.meta?.industry || ""}
              onChange={(v) => setMeta("industry", v)}
              placeholder="Technology"
            />
            <TextField
              label="Duration"
              value={block.meta?.duration || ""}
              onChange={(v) => setMeta("duration", v)}
              placeholder="6 weeks"
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
              Team Avatars
            </label>
            <UploadButton label="Upload Avatars" onUploaded={addImage} multiple />
            <Thumbnails images={block.images} onRemove={removeImage} />
          </div>
        </>
      )}

      {block.type === "image-full" && (
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
            Image
          </label>
          <UploadButton label="Upload Image" onUploaded={addImage} />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}

      {block.type === "image-2col" && (
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
            Images (upload 2)
          </label>
          <UploadButton label="Upload Images" onUploaded={addImage} multiple />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}

      {block.type === "video" && (
        <TextField
          label="Video URL"
          value={block.videoUrl}
          onChange={(v) => set({ videoUrl: v })}
          placeholder="https://… or public/uploads/video.mp4"
        />
      )}

      {(block.type === "carousel" || block.type === "media-grid") && (
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
            Images
          </label>
          <UploadButton label="Upload Images" onUploaded={addImage} multiple />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}

      {block.type === "text-pattern" && (
        <TextField
          label="Pattern Text (repeating word)"
          value={block.meta?.patternText || ""}
          onChange={(v) => setMeta("patternText", v)}
          placeholder="RELENTLESS"
        />
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function BlockEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newType, setNewType] = useState<BlockType>("hero");

  // Load project
  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: Project) => {
        setProject(data);
        const sorted = (data.blocks || []).slice().sort((a, b) => a.order - b.order);
        setBlocks(sorted.map((b, i) => ({ ...b, order: i })));
        setLoading(false);
      })
      .catch(() => router.replace("/admin/project"));
  }, [id, router]);

  // ── Block operations ────────────────────────────────────────────────────

  const addBlock = () => {
    const nb = makeBlock(newType, blocks.length);
    const next = [...blocks, nb];
    setBlocks(next);
    setExpanded((prev) => new Set(prev).add(next.length - 1));
  };

  const updateBlock = (idx: number, b: Block) => {
    setBlocks((prev) => prev.map((x, i) => (i === idx ? b : x)));
  };

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
      prev.forEach((v) => {
        if (v === idx) next2.add(target);
        else if (v === target) next2.add(idx);
        else next2.add(v);
      });
      return next2;
    });
  };

  const toggleExpanded = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ── Save ─────────────────────────────────────�    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <button 
            type="button" 
            onClick={() => router.push("/admin/project")}
            className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors mb-4 flex items-center gap-2"
          >
            <span>←</span> Back to Projects
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Project Narrative</h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Structuring visual segments for <span className="font-bold text-black">{project?.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={save} 
            disabled={saving}
            className="bg-black text-white px-8 py-3.5 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Synchronizing..." : "Save Narrative"}
          </button>
        </div>
      </div>

      {/* Status */}
      {message && (
        <div className={`p-4 rounded-2xl text-[13px] font-medium mb-6 animate-in fade-in slide-in-from-top-2 border ${
          message.type === "ok" ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
        }`}>
          {message.type === "ok" ? "✦ " : "✕ "} {message.text}
        </div>
      )}

      {/* Add block row */}
      <div className="flex gap-4 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 mb-8 items-center">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Segment Type</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as BlockType)}
            className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="pt-5">
          <button
            onClick={addBlock}
            className="px-8 py-3 bg-black text-white rounded-2xl text-[13px] font-bold hover:bg-gray-800 transition-all shadow-md h-[48px]"
          >
            + Insert Segment
          </button>
        </div>
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="py-32 bg-white rounded-[3rem] border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-2xl">✎</div>
          <p className="text-[14px] font-bold text-gray-900 mb-2">The canvas is empty</p>
          <p className="text-[13px] text-gray-400">Add segments above to build the project showcase.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isExpanded = expanded.has(idx);
            return (
              <div 
                key={idx} 
                className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? "ring-2 ring-black border-transparent shadow-xl" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Block header */}
                <div 
                  className={`px-8 py-5 flex items-center gap-6 cursor-pointer select-none transition-colors ${
                    isExpanded ? "bg-gray-50/80" : "hover:bg-gray-50/30"
                  }`}
                  onClick={() => toggleExpanded(idx)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase shrink-0 ${BLOCK_COLORS[block.type]}`}>
                      {BLOCK_LABELS[block.type]}
                    </span>
                    <p className="text-[14px] font-bold text-gray-900 truncate">
                      {block.heading || (block.text ? block.text.substring(0, 60) + "..." : "Unnamed Segment")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button 
                        onClick={() => moveBlock(idx, -1)} 
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-white rounded-lg disabled:opacity-20 transition-all text-[12px]"
                      >↑</button>
                      <button 
                        onClick={() => moveBlock(idx, 1)} 
                        disabled={idx === blocks.length - 1}
                        className="p-1.5 hover:bg-white rounded-lg disabled:opacity-20 transition-all text-[12px]"
                      >↓</button>
                    </div>
                    <button 
                      onClick={() => removeBlock(idx)}
                      className="p-2.5 text-gray-300 hover:text-red-500 transition-colors"
                    >✕</button>
                    <div className={`ml-2 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                      <span className="text-[10px] text-gray-400 opacity-50">▼</span>
                    </div>
                  </div>
                </div>

                {/* Block content */}
                {isExpanded && (
                  <div className="p-8 border-t border-gray-50 bg-white animate-in slide-in-from-top-4 duration-300">
                    <BlockPanel block={block} onChange={(b) => updateBlock(idx, b)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom save */}
      {blocks.length > 5 && (
        <div className="mt-12 flex justify-center pb-20">
          <button 
            onClick={save} 
            disabled={saving}
            className="bg-black text-white px-12 py-5 rounded-[2rem] text-[15px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-2xl flex items-center gap-4"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Synchronizing Narrative...
              </>
            ) : (
              "Confirm Narrative Update"
            )}
          </button>
        </div>
      )}
    </div>         >
                  ✕
                </button>
                <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "4px" }}>
                  {expanded.has(idx) ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Block body */}
            {expanded.has(idx) && (
              <div style={{ padding: "16px" }}>
                <BlockPanel block={block} onChange={(b) => updateBlock(idx, b)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom save */}
      {blocks.length > 0 && (
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              padding: "10px 24px",
              background: saving ? "#9ca3af" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save Blocks"}
          </button>
        </div>
      )}
    </div>
  );
}
