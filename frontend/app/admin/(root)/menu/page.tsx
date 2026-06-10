"use client";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { DragEndEvent } from "@dnd-kit/core";

interface Menu { _id: string; title: string; order: number; }

const TD: React.CSSProperties = { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" };

function SortableRow({ menu, onEdit, onDelete }: { menu: Menu; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: menu._id });
  return (
    <tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <td style={{ ...TD, width: 48, paddingLeft: 12, paddingRight: 0 }}>
        <span {...attributes} {...listeners} className="cursor-grab inline-flex p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#9aa0a6")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
          <GripVertical className="w-4 h-4" />
        </span>
      </td>
      <td style={TD}>
        <span className="font-medium" style={{ color: "#a8c7fa" }}>{menu.title}</span>
      </td>
      <td style={{ ...TD, textAlign: "center" }}>
        <span className="text-[12px] font-mono px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>#{menu.order + 1}</span>
      </td>
      <td style={{ ...TD, textAlign: "right" }}>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
            Edit
          </button>
          <button onClick={onDelete}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function NavigationListPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const router = useRouter();

  const fetchMenus = async () => {
    const res  = await fetch(`${API}/api/menu`);
    const data = await res.json();
    setMenus(data);
  };
  useEffect(() => { fetchMenus(); }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = menus.findIndex((m) => m._id === active.id);
      const newIndex = menus.findIndex((m) => m._id === over.id);
      const newMenus = arrayMove(menus, oldIndex, newIndex).map((m, i) => ({ ...m, order: i }));
      setMenus(newMenus);
      await fetch(`${API}/api/menu/reorder/all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newMenus.map(({ _id, order }) => ({ _id, order })) }),
      });
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/menu/${id}`, { method: "DELETE" });
    fetchMenus();
  };

  const surface: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
  const thStyle: React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Navigation</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Organize your website&apos;s main menu. Drag to reorder.</p>
        </div>
        <Link href="/admin/menu/add"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          + Add Menu Item
        </Link>
      </div>

      <div style={surface} className="overflow-hidden">
        {menus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>No menu items yet.</p>
            <Link href="/admin/menu/add" className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}>Create your first link →</Link>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ ...thStyle, width: 48 }}></th>
                    <th style={thStyle}>Link Title</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Position</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <SortableContext items={menus.map((m) => m._id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {menus.map((menu) => (
                      <SortableRow key={menu._id} menu={menu}
                        onEdit={() => router.push(`/admin/menu/edit/${menu._id}`)}
                        onDelete={() => handleDelete(menu._id)} />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>
                {menus.length} link{menus.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
