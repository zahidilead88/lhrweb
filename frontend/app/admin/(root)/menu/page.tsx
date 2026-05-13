"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { DragEndEvent } from "@dnd-kit/core";

interface Menu {
  _id: string;
  title: string;
  order: number;
}

function SortableRow({
  menu,
  onEdit,
  onDelete,
}: {
  menu: Menu;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: menu._id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-gray-50/30 transition-colors">
      <td className="px-8 py-5 w-16">
        <span {...attributes} {...listeners} className="cursor-grab p-2 inline-flex text-gray-300 hover:text-gray-600 transition-colors">
          <GripVertical className="w-5 h-5" />
        </span>
      </td>
      <td className="px-8 py-5">
        <span className="text-[14px] font-bold text-gray-900">{menu.title}</span>
      </td>
      <td className="px-8 py-5 text-center">
        <span className="text-[12px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">#{menu.order + 1}</span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-[12px] font-bold px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            Settings
          </button>
          <button
            onClick={onDelete}
            className="text-[12px] font-bold px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
          >
            Remove
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
    const res = await fetch("http://localhost:8000/api/menu");
    const data: Menu[] = await res.json();
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
      await fetch("http://localhost:8000/api/menu/reorder/all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newMenus.map(({ _id, order }) => ({ _id, order })) }),
      });
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`http://localhost:8000/api/menu/${id}`, { method: "DELETE" });
    fetchMenus();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Navigation</h1>
          <p className="admin-subtext">Organize your website's main menu by dragging items to reorder.</p>
        </div>
        <Link
          href="/admin/menu/add"
          className="admin-button-primary"
        >
          <span className="text-lg leading-none">+</span> Add Menu Item
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 admin-card">
          <p className="text-[13px] font-medium text-gray-400">No menu items yet.</p>
          <Link href="/admin/menu/add" className="text-black text-[13px] font-bold mt-4 hover:underline">Create your first link</Link>
        </div>
      ) : (
        <div className="admin-card">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="admin-table-header">
                  <th className="admin-table-th w-16"></th>
                  <th className="admin-table-th">Link Title</th>
                  <th className="admin-table-th text-center">Position</th>
                  <th className="admin-table-th text-right">Actions</th>
                </tr>
              </thead>
              <SortableContext items={menus.map((m) => m._id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {menus.map((menu) => (
                    <SortableRow
                      key={menu._id}
                      menu={menu}
                      onEdit={() => router.push(`/admin/menu/edit/${menu._id}`)}
                      onDelete={() => handleDelete(menu._id)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center">
            <p className="admin-label normal-case tracking-normal">
              {menus.length} Link{menus.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
