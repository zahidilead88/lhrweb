"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SECTION_TYPES, SECTION_TYPES_BY_KEY } from "@/lib/sectionRegistry";

// ── Types ─────────────────────────────────────────────────────────────────────

type BlockType =
  | "hero" | "intro" | "image-full" | "image-2col" | "video"
  | "pull-quote" | "carousel" | "media-grid" | "text-pattern";

interface Block {
  _id?: string;
  type: BlockType;
  heading: string;
  subheading: string;
  text: string;
  images: string[];
  videoUrl: string;
  meta: Record<string, string>;
  enabled: boolean;
  order: number;
}

interface SectionDoc {
  _id: string;
  name: string;
  key: string;
  page: string;
  title?: string;
  shortDescription?: string;
  enabled: boolean;
  order: number;
  blocks: Block[];
}

interface PageData { _id: string; name: string; slug: string }

// ── Block constants ───────────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = [
  "hero","intro","image-full","image-2col","video",
  "pull-quote","carousel","media-grid","text-pattern",
];

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero", intro: "Intro", "image-full": "Image — Full Width",
  "image-2col": "Image — 2 Column", video: "Video", "pull-quote": "Pull Quote",
  carousel: "Carousel", "media-grid": "Media Grid", "text-pattern": "Text Pattern",
};

const BLOCK_COLORS: Record<BlockType, string> = {
  hero: "bg-purple-100 text-purple-800", intro: "bg-blue-100 text-blue-800",
  "image-full": "bg-green-100 text-green-800", "image-2col": "bg-teal-100 text-teal-800",
  video: "bg-orange-100 text-orange-800", "pull-quote": "bg-pink-100 text-pink-800",
  carousel: "bg-yellow-100 text-yellow-800", "media-grid": "bg-indigo-100 text-indigo-800",
  "text-pattern": "bg-gray-200 text-gray-800",
};

function makeBlock(type: BlockType, order: number): Block {
  return { type, heading: "", subheading: "", text: "", images: [], videoUrl: "", meta: {}, enabled: true, order };
}

// ── Upload helper ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("http://localhost:8000/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).url as string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      title={on ? "Enabled — click to disable" : "Disabled — click to enable"}
      className={`w-9 h-5 rounded-full border-none cursor-pointer relative shrink-0 transition-colors duration-150 ${on ? "bg-green-500" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-150 block ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function Thumbnails({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url, i) => (
        <div key={i} className="relative">
          <img src={url.startsWith("http") ? url : `http://localhost:8000/${url}`} alt=""
            className="w-[72px] h-[72px] object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white border-none rounded-full w-[18px] h-[18px] text-[11px] cursor-pointer flex items-center justify-center">
            ×
          </button>
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
        className={`text-xs px-3 py-1.5 text-white border-none rounded-md ${uploading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-700 cursor-pointer"}`}>
        {uploading ? "Uploading…" : label}
      </button>
    </>
  );
}

function TF({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const base = "w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-[13px] bg-white outline-none box-border";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {multiline
        ? <textarea rows={3} className={base} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input type="text" className={base} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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
    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg">
      <TF label="Heading" value={block.heading} onChange={(v) => set({ heading: v })} />
      <TF label="Subheading" value={block.subheading} onChange={(v) => set({ subheading: v })} />
      <TF label="Text / Body" value={block.text} onChange={(v) => set({ text: v })} multiline />

      {block.type === "hero" && (
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Background Image</label>
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
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Team Avatars</label>
            <UploadButton label="Upload" onUploaded={addImage} multiple />
            <Thumbnails images={block.images} onRemove={removeImage} />
          </div>
        </>
      )}
      {(block.type === "image-full") && (
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Image</label>
          <UploadButton label="Upload Image" onUploaded={addImage} />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "image-2col" && (
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Images (upload 2)</label>
          <UploadButton label="Upload Images" onUploaded={addImage} multiple />
          <Thumbnails images={block.images} onRemove={removeImage} />
        </div>
      )}
      {block.type === "video" && (
        <TF label="Video URL" value={block.videoUrl} onChange={(v) => set({ videoUrl: v })} placeholder="https://… or public/uploads/video.mp4" />
      )}
      {(block.type === "carousel" || block.type === "media-grid") && (
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Images</label>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PageContentEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage] = useState<PageData | null>(null);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Expand/collapse state (keyed by section _id)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, Set<number>>>({});
  const [sectionBlockTypes, setSectionBlockTypes] = useState<Record<string, BlockType>>({});

  // Add section form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`http://localhost:8000/api/pages/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: PageData) => {
        setPage(data);
        return fetch(`http://localhost:8000/api/sections?page=${data.slug}`);
      })
      .then(r => r.json())
      .then((secs: SectionDoc[]) => {
        const sorted = (Array.isArray(secs) ? secs : []).sort((a, b) => a.order - b.order);
        setSections(sorted.map((s, i) => ({
          ...s,
          enabled: s.enabled !== false,
          order: i,
          blocks: (s.blocks || []).slice().sort((a, b) => a.order - b.order).map((b, j) => ({ ...b, order: j })),
        })));
        setLoading(false);
      })
      .catch(() => router.replace("/admin/pages"));
  }, [id, router]);

  // ── Section operations ────────────────────────────────────────────────────

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
    await fetch(`http://localhost:8000/api/sections/${sId}`, { method: "DELETE" });
    setSections(prev => prev.filter(s => s._id !== sId).map((s, i) => ({ ...s, order: i })));
  };

  const toggleSectionExpand = (sId: string) =>
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sId)) next.delete(sId); else next.add(sId);
      return next;
    });

  // ── Block operations ──────────────────────────────────────────────────────

  const addBlock = (sId: string) => {
    const type = sectionBlockTypes[sId] || "hero";
    const section = sections.find(s => s._id === sId);
    if (!section) return;
    const nb = makeBlock(type, section.blocks.length);
    const newBlocks = [...section.blocks, nb];
    updateSection(sId, { blocks: newBlocks });
    setExpandedBlocks(prev => {
      const set = new Set(prev[sId] || []);
      set.add(newBlocks.length - 1);
      return { ...prev, [sId]: set };
    });
  };

  const updateBlock = (sId: string, bi: number, block: Block) =>
    setSections(prev => prev.map(s => s._id === sId
      ? { ...s, blocks: s.blocks.map((b, j) => j === bi ? block : b) }
      : s));

  const removeBlock = (sId: string, bi: number) => {
    if (!confirm("Delete this block?")) return;
    setSections(prev => prev.map(s => s._id === sId
      ? { ...s, blocks: s.blocks.filter((_, j) => j !== bi).map((b, j) => ({ ...b, order: j })) }
      : s));
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
      (prev[sId] || new Set()).forEach(v => {
        if (v === bi) set.add(target);
        else if (v === target) set.add(bi);
        else set.add(v);
      });
      return { ...prev, [sId]: set };
    });
  };

  const toggleBlockExpand = (sId: string, bi: number) =>
    setExpandedBlocks(prev => {
      const set = new Set(prev[sId] || []);
      if (set.has(bi)) set.delete(bi); else set.add(bi);
      return { ...prev, [sId]: set };
    });

  // ── Create section ────────────────────────────────────────────────────────

  const createSection = async () => {
    if (!newName.trim() || !page) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newName.trim());
      fd.append("key", newKey);
      fd.append("page", page.slug);
      fd.append("order", String(sections.length));
      const res = await fetch("http://localhost:8000/api/sections", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const sec: SectionDoc = await res.json();
      setSections(prev => [...prev, { ...sec, enabled: true, blocks: [] }]);
      setShowAddForm(false);
      setNewName("");
      setNewKey("");
    } catch {
      alert("Failed to create section");
    } finally {
      setCreating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all(sections.map((s, i) =>
        fetch(`http://localhost:8000/api/sections/${s._id}/blocks`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, enabled: s.enabled, order: i, blocks: s.blocks }),
        })
      ));
      setMessage({ type: "ok", text: "Saved successfully!" });
    } catch {
      setMessage({ type: "err", text: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <button 
            type="button" 
            onClick={() => router.push("/admin/pages")}
            className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors mb-4 flex items-center gap-2"
          >
            <span>←</span> Back to Pages
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Content Architecture</h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Managing <span className="font-bold text-black">{page?.name}</span> structure at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">/{page?.slug}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={save} 
            disabled={saving}
            className="bg-black text-white px-8 py-3.5 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Synchronizing..." : "Save Page Structure"}
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

      {/* Add section */}
      <div className="mb-8">
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-white border border-gray-200 border-dashed rounded-2xl text-[13px] font-bold text-gray-400 hover:border-black hover:text-black transition-all group"
          >
            <span className="opacity-40 group-hover:opacity-100 mr-2">+</span> Blueprint New Section
          </button>
        ) : (
          <div className="bg-white rounded-3xl border border-black p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">New Section Blueprint</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Internal Name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createSection()}
                  placeholder="e.g. Hero Section"
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
                            <div className="px-3 py-2.5 border-t border-gray-100">
                              <BlockPanel block={block} onChange={b => updateBlock(sId, bi, b)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom save */}
      {sections.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving}
            className={`text-[13px] font-semibold px-6 py-2.5 text-white border-none rounded-lg ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 cursor-pointer"}`}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
