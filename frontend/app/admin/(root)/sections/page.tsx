"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SECTION_TYPES_BY_KEY } from "@/lib/sectionRegistry";

interface Section { _id: string; name: string; key: string; page: string; order: number; }

const FALLBACK_PAGES = [
  { slug: "home", name: "Home" }, { slug: "services", name: "Services" },
  { slug: "about", name: "About" }, { slug: "projects", name: "Projects" },
  { slug: "contact", name: "Contact" }, { slug: "blog", name: "Blog" },
];

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
};

// ── Single draggable row ────────────────────────────────────────────────────
function SortableRow({
  section, onDelete,
}: {
  section: Section;
  onDelete: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section._id });

  const type = SECTION_TYPES_BY_KEY[section.key];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform:   CSS.Transform.toString(transform),
        transition,
        opacity:     isDragging ? 0.4 : 1,
        background:  isDragging ? "rgba(168,199,250,0.05)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gridTemplateColumns: "40px 1fr 1fr auto",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          padding: "16px 0 16px 16px",
          cursor: isDragging ? "grabbing" : "grab",
          color: "#3a3a3a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
        title="Drag to reorder"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="3"  r="1.5" /><circle cx="8" cy="3"  r="1.5" />
          <circle cx="4" cy="8"  r="1.5" /><circle cx="8" cy="8"  r="1.5" />
          <circle cx="4" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Name */}
      <div style={{ padding: "14px 16px", color: "#a8c7fa", fontSize: 13, fontWeight: 500 }}>
        {section.name}
      </div>

      {/* Key + label */}
      <div style={{ padding: "14px 16px" }}>
        <span style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
          {section.key}
        </span>
        {type && <p style={{ color: "#5f6368", fontSize: 10, marginTop: 3 }}>{type.label}</p>}
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Link
          href={`/admin/sections/${section._id}/edit`}
          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 12, textDecoration: "none", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(section._id, section.name)}
          style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 12, background: "none", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function SectionsPage() {
  const [sections, setSections]     = useState<Section[]>([]);
  const [pages, setPages]           = useState(FALLBACK_PAGES);
  const [activePage, setActivePage] = useState("home");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [secsRes, pgsRes] = await Promise.all([
        fetch(`${API}/api/sections?page=${activePage}`),
        fetch(`${API}/api/pages`),
      ]);
      const secs = await secsRes.json();
      const pgs  = await pgsRes.json();
      setSections(Array.isArray(secs) ? secs : []);
      if (Array.isArray(pgs) && pgs.length > 0)
        setPages(pgs.map((p: any) => ({ slug: p.slug, name: p.name })));
    } catch { setError("Failed to load data"); }
    finally  { setLoading(false); }
  }, [activePage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s._id === active.id);
    const newIndex = sections.findIndex((s) => s._id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);

    setSections(reordered); // optimistic update

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${API}/api/sections/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: reordered.map((s) => s._id) }),
      });
    } catch {
      setError("Failed to save order");
      loadData(); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete section "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token") || "";
    await fetch(`${API}/api/sections/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    loadData();
  };

  const activeName = pages.find((p) => p.slug === activePage)?.name ?? activePage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Structure</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>
            Drag rows to reorder how sections appear on the page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-[11px] flex items-center gap-2" style={{ color: "#9aa0a6" }}>
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
              Saving order…
            </span>
          )}
          <Link
            href={`/admin/sections/add?page=${activePage}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background: "#a8c7fa", color: "#111111" }}
          >
            + Add Section
          </Link>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl self-start" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}>
        {pages.slice(0, 6).map((p) => (
          <button
            key={p.slug}
            onClick={() => setActivePage(p.slug)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ background: activePage === p.slug ? "rgba(168,199,250,0.15)" : "transparent", color: activePage === p.slug ? "#a8c7fa" : "#9aa0a6" }}
          >
            {p.name}
          </button>
        ))}
        {pages.length > 6 && (
          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-[12px] font-semibold outline-none cursor-pointer"
            style={{ background: "transparent", color: "#9aa0a6", border: "none" }}
          >
            <option disabled>More…</option>
            {pages.slice(6).map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
          {error}
        </div>
      )}

      {/* List */}
      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>No sections defined for this page yet.</p>
            <Link href={`/admin/sections/add?page=${activePage}`} className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>
              Create first section →
            </Link>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr auto", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div />
              {["Section", "Type", "Actions"].map((h, i) => (
                <div key={h} style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 16px", textAlign: i === 2 ? "right" : "left" }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Draggable rows */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s._id)} strategy={verticalListSortingStrategy}>
                {sections.map((section) => (
                  <SortableRow key={section._id} section={section} onDelete={handleDelete} />
                ))}
              </SortableContext>
            </DndContext>

            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>
                {sections.length} section{sections.length !== 1 ? "s" : ""} on{" "}
                <span style={{ color: "#9aa0a6" }}>{activeName}</span>
                {" — "}
                <span style={{ color: "#5f6368" }}>drag rows to change render order</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
