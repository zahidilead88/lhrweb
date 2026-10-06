"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 5 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §11.3) — global site
// navigation: multiple named menus (e.g. "Header", "Footer"), nested items
// (one level — a dropdown submenu), internal pages or external URLs,
// visibility, manual reorder. A menu literally named "Header" (any casing)
// replaces the auto-generated "list every page" nav — see PublicSiteView.tsx.

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, Eye, EyeOff, Menu as MenuIcon, ExternalLink, FileText } from "lucide-react";
import type { Menu, MenuItem } from "@/types/builder";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

interface PageOption { id: string; name: string }

export default function MenusPanel({ projectId, pages }: { projectId: string; pages: PageOption[] }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/builder/project?projectId=${projectId}`, { headers: authHeaders() });
      if (res.ok) { const p = await res.json(); setMenus(p.menus ?? []); }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (next: Menu[]) => {
    setMenus(next);
    await fetch(`${API}/api/builder/project/menus?projectId=${projectId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ menus: next }) });
  };

  const createMenu = () => {
    if (!newName.trim()) return;
    const menu: Menu = { id: `menu-${Date.now().toString(36)}`, name: newName.trim(), items: [] };
    save([...menus, menu]);
    setNewName("");
    setCreating(false);
    setActiveId(menu.id);
  };

  const deleteMenu = (id: string) => {
    if (!confirm("Delete this menu?")) return;
    save(menus.filter((m) => m.id !== id));
    if (activeId === id) setActiveId(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">Loading…</div>;

  const active = activeId ? menus.find((m) => m.id === activeId) : null;
  if (active) {
    return (
      <MenuEditor
        menu={active}
        pages={pages}
        onUpdate={(updated) => save(menus.map((m) => (m.id === updated.id ? updated : m)))}
        onBack={() => setActiveId(null)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Menus</span>
        <button onClick={() => setCreating((v) => !v)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={13} />
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-3">A menu named &ldquo;Header&rdquo; replaces the default nav (every page, in order).</p>

      {creating && (
        <div className="flex gap-2 mb-3">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createMenu(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Menu name (e.g. Header)" className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg" />
          <button onClick={createMenu} className="px-3 rounded-lg bg-gray-900 text-white text-[11px] font-bold">Add</button>
        </div>
      )}

      {menus.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <MenuIcon size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No menus yet — the default nav lists every page.</p>
        </div>
      )}

      <div className="space-y-1">
        {menus.map((m) => (
          <div key={m.id} onClick={() => setActiveId(m.id)} className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-800 truncate">{m.name}</p>
              <p className="text-[10.5px] text-gray-400">{m.items.length} item{m.items.length === 1 ? "" : "s"}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteMenu(m.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuEditor({ menu, pages, onUpdate, onBack }: {
  menu: Menu; pages: PageOption[]; onUpdate: (m: Menu) => void; onBack: () => void;
}) {
  const setItems = (items: MenuItem[]) => onUpdate({ ...menu, items });

  const addItem = (parentIndex?: number) => {
    const item: MenuItem = { id: `item-${Date.now().toString(36)}`, label: "New Link", target: { type: "url", href: "/" }, visible: true };
    if (parentIndex === undefined) {
      setItems([...menu.items, item]);
    } else {
      setItems(menu.items.map((it, i) => (i === parentIndex ? { ...it, children: [...(it.children ?? []), item] } : it)));
    }
  };

  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    setItems(menu.items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const updateChild = (parentIndex: number, childIndex: number, patch: Partial<MenuItem>) => {
    setItems(menu.items.map((it, i) => {
      if (i !== parentIndex) return it;
      return { ...it, children: (it.children ?? []).map((c, ci) => (ci === childIndex ? { ...c, ...patch } : c)) };
    }));
  };
  const removeItem = (index: number) => setItems(menu.items.filter((_, i) => i !== index));
  const removeChild = (parentIndex: number, childIndex: number) => {
    setItems(menu.items.map((it, i) => (i === parentIndex ? { ...it, children: (it.children ?? []).filter((_, ci) => ci !== childIndex) } : it)));
  };
  const moveItem = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= menu.items.length) return;
    const next = [...menu.items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
        <span className="text-[12.5px] font-bold text-gray-800 truncate flex-1">{menu.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {menu.items.map((item, i) => (
          <div key={item.id} className="border border-gray-100 rounded-lg p-2 space-y-1.5 bg-gray-50">
            <ItemRow
              item={item}
              pages={pages}
              onChange={(patch) => updateItem(i, patch)}
              onRemove={() => removeItem(i)}
              onMoveUp={i > 0 ? () => moveItem(i, -1) : undefined}
              onMoveDown={i < menu.items.length - 1 ? () => moveItem(i, 1) : undefined}
            />
            {(item.children ?? []).map((child, ci) => (
              <div key={child.id} className="ml-4 pl-2 border-l-2 border-gray-200">
                <ItemRow
                  item={child}
                  pages={pages}
                  onChange={(patch) => updateChild(i, ci, patch)}
                  onRemove={() => removeChild(i, ci)}
                />
              </div>
            ))}
            <button onClick={() => addItem(i)} className="text-[10.5px] font-semibold text-gray-400 hover:text-gray-700 pl-1">+ Add sub-item</button>
          </div>
        ))}
        <button onClick={() => addItem()} className="w-full py-2 rounded-lg border border-dashed border-gray-300 text-[11.5px] font-semibold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5">
          <Plus size={12} /> Add menu item
        </button>
      </div>
    </div>
  );
}

function ItemRow({ item, pages, onChange, onRemove, onMoveUp, onMoveDown }: {
  item: MenuItem; pages: PageOption[];
  onChange: (patch: Partial<MenuItem>) => void; onRemove: () => void;
  onMoveUp?: () => void; onMoveDown?: () => void;
}) {
  const inputCls = "px-2 py-1 text-[11.5px] border border-gray-200 rounded-md bg-white";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input className={`${inputCls} flex-1 min-w-[80px]`} value={item.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Label" />
      <select
        className={inputCls}
        value={item.target.type}
        onChange={(e) => onChange({ target: e.target.value === "page" ? { type: "page", pageId: pages[0]?.id ?? "" } : { type: "url", href: "/" } })}
      >
        <option value="page">Page</option>
        <option value="url">URL</option>
      </select>
      {item.target.type === "page" ? (
        <select className={inputCls} value={item.target.pageId} onChange={(e) => onChange({ target: { type: "page", pageId: e.target.value } })}>
          {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      ) : (
        <input className={`${inputCls} flex-1 min-w-[100px]`} value={item.target.href} onChange={(e) => onChange({ target: { type: "url", href: e.target.value } })} placeholder="https://…" />
      )}
      <button onClick={() => onChange({ visible: !item.visible })} title={item.visible ? "Visible — click to hide" : "Hidden — click to show"} className={item.visible ? "text-green-500" : "text-gray-300"}>
        {item.visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
      {item.target.type === "url" ? <ExternalLink size={11} className="text-gray-300" /> : <FileText size={11} className="text-gray-300" />}
      {onMoveUp && <button onClick={onMoveUp} className="text-gray-300 hover:text-gray-600 text-[11px] px-0.5">↑</button>}
      {onMoveDown && <button onClick={onMoveDown} className="text-gray-300 hover:text-gray-600 text-[11px] px-0.5">↓</button>}
      <button onClick={onRemove} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
    </div>
  );
}
