"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 6 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §12) — asset library:
// upload/browse/search/delete/reuse, scoped to one project. Works two ways:
// a standalone "Assets" tab (browse/upload/delete, no onSelect), and a
// picker modal opened from an image/background-image field (onSelect fires,
// then the modal closes itself).

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, Search, X, Image as ImageIcon, Film, FileText, Type as FontIcon, File as FileIcon } from "lucide-react";

interface Asset {
  _id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  type: "image" | "video" | "svg" | "font" | "file";
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

/** Cloudinary URLs are already absolute; the local-disk fallback returns a backend-root-relative path. */
function resolveUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${API}${url}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_ICON: Record<Asset["type"], React.ReactNode> = {
  image: <ImageIcon size={22} />, svg: <ImageIcon size={22} />,
  video: <Film size={22} />, font: <FontIcon size={22} />, file: <FileIcon size={22} />,
};

function useAssets(projectId: string) {
  const [assets, setAssets]   = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/assets?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setAssets(d.assets ?? []); }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const upload = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${API}/api/assets?projectId=${projectId}`, { method: "POST", headers: authHeaders(), body: form });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          setError(d?.message || "Upload failed.");
          continue;
        }
        const created: Asset = await res.json();
        setAssets((prev) => [created, ...prev]);
      }
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const remove = useCallback(async (id: string) => {
    setAssets((prev) => prev.filter((a) => a._id !== id));
    await fetch(`${API}/api/assets/${id}?projectId=${projectId}`, { method: "DELETE", headers: authHeaders() });
  }, [projectId]);

  return { assets, loading, uploading, error, upload, remove };
}

function AssetGrid({ projectId, onSelect }: { projectId: string; onSelect?: (asset: Asset) => void }) {
  const { assets, loading, uploading, error, upload, remove } = useAssets(projectId);
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = assets.filter((a) => a.filename.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets…"
            className="flex-1 bg-transparent text-[12px] outline-none text-gray-700" />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 px-3 rounded-lg bg-gray-900 text-white text-[11.5px] font-bold flex items-center gap-1.5 disabled:opacity-50"
        >
          <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileInputRef} type="file" multiple hidden
          onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }} />
      </div>

      {error && <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-600">{error}</div>}

      <div
        className={`flex-1 overflow-y-auto px-4 pb-4 ${dragOver ? "bg-[#6344d4]/5" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) upload(e.dataTransfer.files); }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[12px] text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <Upload size={22} className="text-gray-300" />
            <p className="text-[12px] text-gray-400">{assets.length === 0 ? "No assets yet — drag files here or click Upload." : "No assets match your search."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((a) => (
              <div key={a._id} className="group relative border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                <button
                  onClick={() => onSelect?.(a)}
                  className="w-full aspect-square flex items-center justify-center bg-white"
                  title={onSelect ? "Use this asset" : a.filename}
                >
                  {a.type === "image" || a.type === "svg" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveUrl(a.url)} alt={a.filename} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-300">{TYPE_ICON[a.type]}</span>
                  )}
                </button>
                <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-700 truncate">{a.filename}</p>
                  <p className="text-[9.5px] text-gray-400">{formatSize(a.size)}</p>
                </div>
                <button
                  onClick={() => remove(a._id)}
                  title="Delete"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-white/95 border border-gray-100 opacity-0 group-hover:opacity-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Standalone "Assets" tab — browse/upload/delete only. */
export default function AssetLibraryPanel({ projectId }: { projectId: string }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AssetGrid projectId={projectId} />
    </div>
  );
}

/** Picker modal — opened from an image/background-image field; selecting an asset resolves its URL and closes. */
export function AssetPickerModal({ projectId, onPick, onClose }: {
  projectId: string; onPick: (url: string) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-bold text-gray-900">Choose an asset</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900">
            <X size={16} />
          </button>
        </div>
        <AssetGrid projectId={projectId} onSelect={(a) => { onPick(resolveUrl(a.url)); onClose(); }} />
      </div>
    </div>
  );
}
