"use client";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { NavItem } from "@/lib/builderComponents";

interface Props {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}

export default function NavItemsEditor({ items, onChange }: Props) {
  const update = (i: number, field: keyof NavItem, val: string) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange(next);
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const add = () => onChange([...items, { label: "New Page", href: "/" }]);

  return (
    <div className="space-y-1.5">
      {/* Column headers */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-4 flex-shrink-0" />
          <p className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Label</p>
          <p className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slug / URL</p>
          <div className="w-6 flex-shrink-0" />
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group/row">
          {/* Drag hint */}
          <div className="w-4 flex-shrink-0 flex items-center justify-center text-gray-200 group-hover/row:text-gray-400 transition-colors">
            <GripVertical size={12} />
          </div>

          {/* Label */}
          <input
            type="text"
            value={item.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="Menu label"
            className="flex-1 px-2.5 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
          />

          {/* Href / slug */}
          <input
            type="text"
            value={item.href}
            onChange={(e) => update(i, "href", e.target.value)}
            placeholder="/slug"
            className="flex-1 px-2.5 py-2 text-[12px] font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
          />

          {/* Delete */}
          <button
            onClick={() => remove(i)}
            className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover/row:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 border border-dashed border-gray-200 rounded-lg text-[12px] font-semibold text-gray-400 hover:text-black hover:border-gray-400 transition-all"
      >
        <Plus size={12} /> Add menu item
      </button>
    </div>
  );
}
