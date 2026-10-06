"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 2 (docs/BLUEPRINT.md) — CMS management: create/edit/delete collections
// and their fields, and create/edit/delete/duplicate/publish entries within
// one. Self-contained (own fetches, like ExportModal/ConvertModal) since it
// doesn't touch any of page.tsx's canvas state.

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, Copy, Eye, EyeOff, Database, GripVertical } from "lucide-react";
import type { CmsCollection, CmsEntry, CmsField, CmsFieldType } from "@/types/builder";

const FIELD_TYPES: { value: CmsFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Long text" },
  { value: "image", label: "Image URL" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
];

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CmsPanel({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const loadCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cms-collections/collections?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) setCollections(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCollections(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCollection = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`${API}/api/cms-collections/collections`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ projectId, name: newName.trim(), fields: [] }),
    });
    if (res.ok) {
      const created = await res.json();
      setCollections((c) => [created, ...c]);
      setNewName("");
      setCreating(false);
      setActiveId(created._id);
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete this collection and all its entries? This can't be undone.")) return;
    const res = await fetch(`${API}/api/cms-collections/collections/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) {
      setCollections((c) => c.filter((x) => x._id !== id));
      if (activeId === id) setActiveId(null);
    }
  };

  const active = collections.find((c) => c._id === activeId) ?? null;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;
  }

  if (active) {
    return (
      <CollectionDetail
        collection={active}
        onBack={() => setActiveId(null)}
        onCollectionUpdate={(updated) => setCollections((c) => c.map((x) => (x._id === updated._id ? updated : x)))}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collections</span>
        <button onClick={() => setCreating((v) => !v)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={13} />
        </button>
      </div>

      {creating && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createCollection(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Collection name (e.g. Blog)"
            className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
          />
          <button onClick={createCollection} className="px-3 rounded-lg bg-gray-900 text-white text-[11px] font-bold">Add</button>
        </div>
      )}

      {collections.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Database size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No collections yet.</p>
        </div>
      )}

      <div className="space-y-1">
        {collections.map((c) => (
          <div
            key={c._id}
            onClick={() => setActiveId(c._id)}
            className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-800 truncate">{c.name}</p>
              <p className="text-[10.5px] text-gray-400">{c.fields.length} field{c.fields.length === 1 ? "" : "s"}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteCollection(c._id); }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Collection detail: fields + entries ──────────────────────────────────────

function CollectionDetail({
  collection, onBack, onCollectionUpdate,
}: {
  collection: CmsCollection;
  onBack: () => void;
  onCollectionUpdate: (c: CmsCollection) => void;
}) {
  const [tab, setTab] = useState<"fields" | "entries">(collection.fields.length ? "entries" : "fields");
  const [fields, setFields] = useState<CmsField[]>(collection.fields);
  const [savingFields, setSavingFields] = useState(false);

  useEffect(() => { setFields(collection.fields); }, [collection._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFields = async (next: CmsField[]) => {
    setFields(next);
    setSavingFields(true);
    try {
      const res = await fetch(`${API}/api/cms-collections/collections/${collection._id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ fields: next }),
      });
      if (res.ok) onCollectionUpdate(await res.json());
    } finally {
      setSavingFields(false);
    }
  };

  const addField = () => {
    const n = fields.length + 1;
    saveFields([...fields, { key: `field_${n}`, label: `Field ${n}`, type: "text" }]);
  };
  const updateField = (i: number, patch: Partial<CmsField>) => {
    saveFields(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };
  const removeField = (i: number) => saveFields(fields.filter((_, idx) => idx !== i));
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    saveFields(next);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
        <span className="text-[12.5px] font-bold text-gray-800 truncate flex-1">{collection.name}</span>
      </div>

      <div className="flex px-3 pt-2 gap-1 shrink-0">
        {(["fields", "entries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-colors ${tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "fields" ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg p-2">
              <GripVertical size={12} className="text-gray-300 shrink-0" />
              <input
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value, key: f.key === slugify(f.label) || !f.key ? slugify(e.target.value) : f.key })}
                placeholder="Label"
                className="flex-1 min-w-0 px-2 py-1 text-[12px] border border-gray-200 rounded-md bg-white"
              />
              <select
                value={f.type}
                onChange={(e) => updateField(i, { type: e.target.value as CmsFieldType })}
                className="px-1.5 py-1 text-[11px] border border-gray-200 rounded-md bg-white"
              >
                {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
              </select>
              <button onClick={() => moveField(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-[11px] px-0.5">↑</button>
              <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-[11px] px-0.5">↓</button>
              <button onClick={() => removeField(i)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
          <button onClick={addField} disabled={savingFields} className="w-full py-2 rounded-lg border border-dashed border-gray-300 text-[11.5px] font-semibold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5">
            <Plus size={12} /> Add field
          </button>
        </div>
      ) : (
        <EntriesTab collection={{ ...collection, fields }} />
      )}
    </div>
  );
}

// ── Entries ───────────────────────────────────────────────────────────────────

function EntriesTab({ collection }: { collection: CmsCollection }) {
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cms-collections/collections/${collection._id}/entries`, { headers: authHeaders() });
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [collection._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createEntry = async () => {
    const res = await fetch(`${API}/api/cms-collections/collections/${collection._id}/entries`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ values: {} }),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((e) => [entry, ...e]);
      setEditingId(entry._id);
    }
  };

  const duplicateEntry = async (entry: CmsEntry) => {
    const res = await fetch(`${API}/api/cms-collections/collections/${collection._id}/entries`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ slug: entry.slug, values: entry.values }),
    });
    if (res.ok) {
      const created = await res.json();
      setEntries((e) => [created, ...e]);
    }
  };

  const updateEntry = async (id: string, patch: Partial<Pick<CmsEntry, "values" | "published">>) => {
    setEntries((e) => e.map((x) => (x._id === id ? { ...x, ...patch } : x)));
    await fetch(`${API}/api/cms-collections/entries/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(patch) });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    setEntries((e) => e.filter((x) => x._id !== id));
    await fetch(`${API}/api/cms-collections/entries/${id}`, { method: "DELETE", headers: authHeaders() });
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  const firstField = collection.fields[0];
  const filtered = query
    ? entries.filter((e) => JSON.stringify(e.values).toLowerCase().includes(query.toLowerCase()))
    : entries;
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);

  if (collection.fields.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-center text-[12px] text-gray-400 px-6">Add at least one field before creating entries.</div>;
  }

  const editing = editingId ? entries.find((e) => e._id === editingId) : null;
  if (editing) {
    return (
      <EntryEditor
        collection={collection}
        entry={editing}
        onChange={(values) => updateEntry(editing._id, { values })}
        onClose={() => setEditingId(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-3 shrink-0">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search entries…"
          className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6344d4]/10"
        />
        <button onClick={createEntry} className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0"><Plus size={13} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {paged.map((entry) => (
          <div key={entry._id} className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50">
            <button onClick={() => setEditingId(entry._id)} className="flex-1 min-w-0 text-left">
              <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                {firstField ? String(entry.values[firstField.key] ?? "") || "(untitled)" : entry.slug}
              </p>
              <p className="text-[10.5px] text-gray-400 truncate">/{entry.slug}</p>
            </button>
            <button onClick={() => updateEntry(entry._id, { published: !entry.published })} title={entry.published ? "Published — click to unpublish" : "Draft — click to publish"} className={entry.published ? "text-green-500" : "text-gray-300"}>
              {entry.published ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button onClick={() => duplicateEntry(entry)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600"><Copy size={12} /></button>
            <button onClick={() => deleteEntry(entry._id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[12px] text-gray-400 py-8">No entries{query ? " match your search" : " yet"}.</p>
        )}
      </div>

      {maxPage > 0 && (
        <div className="flex items-center justify-center gap-3 py-2 border-t border-gray-100 shrink-0 text-[11px] text-gray-500">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="disabled:opacity-30">Prev</button>
          <span>{page + 1} / {maxPage + 1}</span>
          <button onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page === maxPage} className="disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

function EntryEditor({ collection, entry, onChange, onClose }: {
  collection: CmsCollection; entry: CmsEntry; onChange: (values: Record<string, unknown>) => void; onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(entry.values);
  const set = (key: string, v: unknown) => {
    const next = { ...values, [key]: v };
    setValues(next);
    onChange(next);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
        <span className="text-[12.5px] font-bold text-gray-800">Edit entry</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {collection.fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
            {f.type === "boolean" ? (
              <input type="checkbox" checked={!!values[f.key]} onChange={(e) => set(f.key, e.target.checked)} className="w-4 h-4" />
            ) : f.type === "richtext" ? (
              <textarea value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} rows={4}
                className="w-full px-2.5 py-2 text-[12px] border border-gray-200 rounded-lg resize-vertical" />
            ) : (
              <input
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                value={String(values[f.key] ?? "")}
                onChange={(e) => set(f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                placeholder={f.type === "image" ? "https://…/image.jpg" : ""}
                className="w-full px-2.5 py-2 text-[12px] border border-gray-200 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
