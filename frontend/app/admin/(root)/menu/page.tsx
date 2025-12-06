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

interface SortableItemProps {
  id: string;
  title: string;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableItem = ({ id, title, onEdit, onDelete }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-white shadow p-4 flex justify-between items-center rounded mb-2"
    >
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab p-1"
          title="Drag"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </span>
        {title}
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          className="text-blue-600 cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          className="text-red-600 cursor-pointer"
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default function NavigationListPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const router = useRouter();

  const fetchMenus = async () => {
    const res = await fetch("http://localhost:8000/api/menu");
    const data: Menu[] = await res.json();
    setMenus(data);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = menus.findIndex((m) => m._id === active.id);
      const newIndex = menus.findIndex((m) => m._id === over.id);
      const newMenus = arrayMove(menus, oldIndex, newIndex).map((m, i) => ({
        ...m,
        order: i,
      }));

      setMenus(newMenus);

      await fetch("http://localhost:8000/api/menu/reorder/all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newMenus.map(({ _id, order }) => ({ _id, order })),
        }),
      });
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`http://localhost:8000/api/menu/${id}`, {
      method: "DELETE",
    });
    fetchMenus();
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/menu/edit/${id}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Navigation Menus</h1>
        <Link
          href="/admin/menu/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Menu
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={menus.map((m) => m._id)}
          strategy={verticalListSortingStrategy}
        >
          <ul>
            {menus.map((menu) => (
              <SortableItem
                key={menu._id}
                id={menu._id}
                title={menu.title}
                onEdit={() => handleEdit(menu._id)}
                onDelete={() => handleDelete(menu._id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
