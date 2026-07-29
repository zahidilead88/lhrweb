"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronRight, ChevronDown, GripVertical, Trash2, Copy,
  ChevronUp, Plus, Type, AlignLeft, Image as ImageIcon,
  Layout, Link, Box, Square, List, Layers, Code2,
  ArrowRight, ArrowLeft,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ElementNode } from "@/types/builder";

// ── Tree mutation helpers (pure functions) ────────────────────────────────────

export function deleteFromTree(elements: ElementNode[], id: string): ElementNode[] {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => ({ ...el, children: deleteFromTree(el.children, id) }));
}

function cloneWithNewIds(el: ElementNode): ElementNode {
  const id = `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return { ...el, id, children: el.children.map(cloneWithNewIds) };
}

export function duplicateInTree(elements: ElementNode[], id: string): ElementNode[] {
  const result: ElementNode[] = [];
  for (const el of elements) {
    result.push({ ...el, children: duplicateInTree(el.children, id) });
    if (el.id === id) result.push(cloneWithNewIds(el));
  }
  return result;
}

export function moveInSiblings(elements: ElementNode[], id: string, dir: 1 | -1): ElementNode[] {
  const idx = elements.findIndex((el) => el.id === id);
  if (idx !== -1) {
    const newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < elements.length) {
      const next = [...elements];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    }
    return elements;
  }
  return elements.map((el) => ({
    ...el,
    children: moveInSiblings(el.children, id, dir),
  }));
}

function addChildToElement(elements: ElementNode[], parentId: string, child: ElementNode): ElementNode[] {
  return elements.map((el) => {
    if (el.id === parentId) return { ...el, children: [...el.children, child] };
    return { ...el, children: addChildToElement(el.children, parentId, child) };
  });
}

function findAncestry(
  elements: ElementNode[],
  targetId: string,
  path: ElementNode[] = []
): ElementNode[] | null {
  for (const el of elements) {
    if (el.id === targetId) return [...path, el];
    const found = findAncestry(el.children, targetId, [...path, el]);
    if (found) return found;
  }
  return null;
}

// Nest element into its previous sibling (indent right)
function tryIndentRight(
  els: ElementNode[],
  targetId: string
): { result: ElementNode[]; changed: boolean } {
  const idx = els.findIndex((el) => el.id === targetId);
  if (idx > 0) {
    const target = els[idx];
    const newEls = els.filter((_, i) => i !== idx).map((el) =>
      el.id === els[idx - 1].id
        ? { ...el, children: [...el.children, target] }
        : el
    );
    return { result: newEls, changed: true };
  }
  for (let i = 0; i < els.length; i++) {
    const r = tryIndentRight(els[i].children, targetId);
    if (r.changed) {
      const newEls = [...els];
      newEls[i] = { ...newEls[i], children: r.result };
      return { result: newEls, changed: true };
    }
  }
  return { result: els, changed: false };
}

export function indentRight(elements: ElementNode[], id: string): ElementNode[] {
  return tryIndentRight(elements, id).result;
}

// Move element out of its parent, insert after parent in grandparent (indent left)
function tryIndentLeft(
  els: ElementNode[],
  targetId: string
): { result: ElementNode[]; changed: boolean } {
  for (let i = 0; i < els.length; i++) {
    const childIdx = els[i].children.findIndex((c) => c.id === targetId);
    if (childIdx !== -1) {
      const extracted = els[i].children[childIdx];
      const newEls = [...els];
      newEls[i] = { ...newEls[i], children: newEls[i].children.filter((_, j) => j !== childIdx) };
      newEls.splice(i + 1, 0, extracted);
      return { result: newEls, changed: true };
    }
    const r = tryIndentLeft(els[i].children, targetId);
    if (r.changed) {
      const newEls = [...els];
      newEls[i] = { ...newEls[i], children: r.result };
      return { result: newEls, changed: true };
    }
  }
  return { result: els, changed: false };
}

export function indentLeft(elements: ElementNode[], id: string): ElementNode[] {
  return tryIndentLeft(elements, id).result;
}

// ── Tag icon ──────────────────────────────────────────────────────────────────

function TagIcon({ tag }: { tag: string }) {
  const cls = "flex-shrink-0";
  if (/^h[1-6]$/.test(tag))                               return <Type size={11} className={cls} />;
  if (tag === "p" || tag === "span" || tag === "blockquote" || tag === "strong" || tag === "em")
                                                           return <AlignLeft size={11} className={cls} />;
  if (tag === "img")                                       return <ImageIcon size={11} className={cls} />;
  if (tag === "a")                                         return <Link size={11} className={cls} />;
  if (tag === "ul" || tag === "ol" || tag === "li")        return <List size={11} className={cls} />;
  if (tag === "nav" || tag === "header" || tag === "footer") return <Layout size={11} className={cls} />;
  if (tag === "section" || tag === "article" || tag === "aside" || tag === "main")
                                                           return <Square size={11} className={cls} />;
  if (tag === "button" || tag === "input" || tag === "textarea") return <Code2 size={11} className={cls} />;
  return <Box size={11} className={cls} />;
}

// ── Context menu ──────────────────────────────────────────────────────────────

interface ContextMenuState { id: string; x: number; y: number }

function ContextMenu({
  state, elements, onUpdate, onClose,
}: {
  state: ContextMenuState;
  elements: ElementNode[];
  onUpdate: (els: ElementNode[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const act = (fn: () => ElementNode[]) => { onUpdate(fn()); onClose(); };

  const newDiv: ElementNode = {
    id: `el_${Date.now().toString(36)}`,
    tag: "div",
    styles: { desktop: { padding: "16px" } },
    children: [],
  };

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: state.y, left: state.x, zIndex: 9999 }}
      className="w-44 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 py-1.5 overflow-hidden"
    >
      {[
        { label: "Duplicate",    icon: <Copy size={12} />,      fn: () => duplicateInTree(elements, state.id) },
        { label: "Move Up",      icon: <ChevronUp size={12} />, fn: () => moveInSiblings(elements, state.id, -1) },
        { label: "Move Down",    icon: <ChevronUp size={12} className="rotate-180" />, fn: () => moveInSiblings(elements, state.id, 1) },
        { label: "Add Div Child",icon: <Plus size={12} />,      fn: () => addChildToElement(elements, state.id, newDiv) },
        { label: "Nest into prev", icon: <ArrowRight size={12} />, fn: () => indentRight(elements, state.id) },
        { label: "Un-nest",      icon: <ArrowLeft size={12} />, fn: () => indentLeft(elements, state.id) },
      ].map(({ label, icon, fn }) => (
        <button
          key={label}
          onClick={() => act(fn)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-400">{icon}</span>
          {label}
        </button>
      ))}
      <div className="border-t border-gray-50 my-1" />
      <button
        onClick={() => act(() => deleteFromTree(elements, state.id))}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({
  elements, selectedId, onSelect,
}: {
  elements: ElementNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const ancestry = findAncestry(elements, selectedId) ?? [];
  if (ancestry.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-t border-gray-50 flex-shrink-0 overflow-x-auto">
      {ancestry.map((el, i) => (
        <span key={el.id} className="flex items-center gap-0.5 flex-shrink-0">
          {i > 0 && <ChevronRight size={9} className="text-gray-300" />}
          <button
            onClick={() => onSelect(el.id)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
              el.id === selectedId
                ? "bg-[#6344d4] text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {el.tag}
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Shared row content ────────────────────────────────────────────────────────

function LayerRowContent({
  el, depth, isSelected, isOpen, hasChildren,
  dragHandle, onToggle, onSelect, onContextMenu, onIndentLeft, onIndentRight, canIndentLeft, canIndentRight,
}: {
  el: ElementNode;
  depth: number;
  isSelected: boolean;
  isOpen: boolean;
  hasChildren: boolean;
  dragHandle?: React.ReactNode;
  onToggle: () => void;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onIndentLeft: () => void;
  onIndentRight: () => void;
  canIndentLeft: boolean;
  canIndentRight: boolean;
}) {
  const content = el.content?.trim();
  const preview = content ? (content.length > 18 ? content.slice(0, 18) + "…" : content) : null;

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{ paddingLeft: depth * 14 + 6 }}
      className={`group flex items-center gap-1 py-1 pr-1 cursor-pointer rounded-lg mx-1 transition-colors ${
        isSelected
          ? "bg-[#6344d4]/10 text-[#6344d4]"
          : "hover:bg-gray-50 text-gray-600"
      }`}
    >
      {/* Drag handle (root only) or indent guide */}
      {dragHandle ?? (
        <span className="w-px h-3 bg-gray-200 flex-shrink-0 ml-1" />
      )}

      {/* Expand toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{ visibility: hasChildren ? "visible" : "hidden" }}
        className="p-0.5 flex-shrink-0 text-current opacity-60 hover:opacity-100"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>

      {/* Tag icon */}
      <span className={isSelected ? "text-[#6344d4]" : "text-gray-400"}>
        <TagIcon tag={el.tag} />
      </span>

      {/* Tag name */}
      <span className={`text-[11px] font-mono font-bold flex-shrink-0 ${isSelected ? "text-[#6344d4]" : "text-gray-700"}`}>
        {el.tag}
      </span>

      {/* Class pill */}
      {el.className && (
        <span className="text-[9px] font-mono bg-purple-50 text-[#6344d4] px-1 py-0.5 rounded flex-shrink-0 truncate max-w-[50px]">
          .{el.className}
        </span>
      )}

      {/* Content preview */}
      {preview && (
        <span className="text-[10px] text-gray-400 truncate min-w-0 flex-1 italic">{preview}</span>
      )}

      {/* Indent/un-nest buttons */}
      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {canIndentLeft && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndentLeft(); }}
            title="Un-nest (move out of parent)"
            className="p-0.5 rounded text-gray-300 hover:text-[#6344d4] hover:bg-purple-50 transition-colors"
          >
            <ArrowLeft size={10} />
          </button>
        )}
        {canIndentRight && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndentRight(); }}
            title="Nest into previous sibling"
            className="p-0.5 rounded text-gray-300 hover:text-[#6344d4] hover:bg-purple-50 transition-colors"
          >
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sortable layer row (root-level DnD) ───────────────────────────────────────

function SortableLayerRow({
  el, depth, selectedId, expandedIds, elements,
  onToggle, onSelect, onContextMenu, onUpdate, siblingIdx, totalSiblings,
}: {
  el: ElementNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  elements: ElementNode[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onUpdate: (els: ElementNode[]) => void;
  siblingIdx: number;
  totalSiblings: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: el.id });

  const isSelected = el.id === selectedId;
  const isOpen = expandedIds.has(el.id);
  const hasChildren = el.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <LayerRowContent
        el={el}
        depth={depth}
        isSelected={isSelected}
        isOpen={isOpen}
        hasChildren={hasChildren}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            tabIndex={-1}
          >
            <GripVertical size={11} />
          </button>
        }
        onToggle={() => onToggle(el.id)}
        onSelect={() => onSelect(el.id)}
        onContextMenu={(e) => onContextMenu(e, el.id)}
        onIndentLeft={() => onUpdate(indentLeft(elements, el.id))}
        onIndentRight={() => onUpdate(indentRight(elements, el.id))}
        canIndentLeft={false}
        canIndentRight={siblingIdx > 0}
      />

      {isOpen && hasChildren && (
        <div>
          {el.children.map((child, childIdx) => (
            <NestedLayerRow
              key={child.id}
              el={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              elements={elements}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onUpdate={onUpdate}
              siblingIdx={childIdx}
              totalSiblings={el.children.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Non-sortable nested row ───────────────────────────────────────────────────

function NestedLayerRow({
  el, depth, selectedId, expandedIds, elements,
  onToggle, onSelect, onContextMenu, onUpdate, siblingIdx, totalSiblings,
}: {
  el: ElementNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  elements: ElementNode[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onUpdate: (els: ElementNode[]) => void;
  siblingIdx: number;
  totalSiblings: number;
}) {
  const isSelected = el.id === selectedId;
  const isOpen = expandedIds.has(el.id);
  const hasChildren = el.children.length > 0;

  return (
    <div>
      <LayerRowContent
        el={el}
        depth={depth}
        isSelected={isSelected}
        isOpen={isOpen}
        hasChildren={hasChildren}
        onToggle={() => onToggle(el.id)}
        onSelect={() => onSelect(el.id)}
        onContextMenu={(e) => onContextMenu(e, el.id)}
        onIndentLeft={() => onUpdate(indentLeft(elements, el.id))}
        onIndentRight={() => onUpdate(indentRight(elements, el.id))}
        canIndentLeft={depth > 0}
        canIndentRight={siblingIdx > 0}
      />

      {isOpen && hasChildren && (
        <div>
          {el.children.map((child, childIdx) => (
            <NestedLayerRow
              key={child.id}
              el={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              elements={elements}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onUpdate={onUpdate}
              siblingIdx={childIdx}
              totalSiblings={el.children.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drag overlay ghost ────────────────────────────────────────────────────────

function DragGhost({ el }: { el: ElementNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#6344d4] text-white rounded-xl shadow-lg shadow-purple-500/30 text-[11px] font-mono font-bold">
      <TagIcon tag={el.tag} />
      {el.tag}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export interface LayersPanelProps {
  elements: ElementNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (elements: ElementNode[]) => void;
}

export default function LayersPanel({
  elements, selectedId, onSelect, onUpdate,
}: LayersPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const walk = (els: ElementNode[]) => {
      for (const el of els) { ids.add(el.id); walk(el.children); }
    };
    walk(elements);
    return ids;
  });

  useEffect(() => {
    if (!selectedId) return;
    const ancestry = findAncestry(elements, selectedId);
    if (!ancestry) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ancestry.forEach((el) => next.add(el.id));
      return next;
    });
  }, [selectedId, elements]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setDragId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDragId(null);
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIdx = elements.findIndex((el) => el.id === active.id);
      const newIdx = elements.findIndex((el) => el.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        onUpdate(arrayMove(elements, oldIdx, newIdx));
      }
    },
    [elements, onUpdate]
  );

  const draggedEl = dragId ? elements.find((el) => el.id === dragId) ?? null : null;

  if (elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
          <Layers size={20} className="text-gray-300" />
        </div>
        <p className="text-[13px] font-semibold text-gray-500">No elements yet</p>
        <p className="text-[11px] text-gray-400 max-w-[180px] leading-relaxed">
          Generate with AI or run the migration script to populate the element tree.
        </p>
      </div>
    );
  }

  const rootCount = elements.length;
  const totalCount = (() => {
    let n = 0;
    const walk = (els: ElementNode[]) => { for (const el of els) { n++; walk(el.children); } };
    walk(elements);
    return n;
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 flex-shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {totalCount} element{totalCount !== 1 ? "s" : ""} · {rootCount} root
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const ids = new Set<string>();
              const walk = (els: ElementNode[]) => {
                for (const el of els) { ids.add(el.id); walk(el.children); }
              };
              walk(elements);
              setExpandedIds(ids);
            }}
            className="text-[9px] font-bold text-gray-400 hover:text-[#6344d4] px-2 py-1 rounded hover:bg-purple-50 transition-colors uppercase tracking-wider"
          >
            All
          </button>
          <button
            onClick={() => setExpandedIds(new Set())}
            className="text-[9px] font-bold text-gray-400 hover:text-[#6344d4] px-2 py-1 rounded hover:bg-purple-50 transition-colors uppercase tracking-wider"
          >
            None
          </button>
        </div>
      </div>

      {/* Indent hint */}
      <div className="px-3 py-1.5 border-b border-gray-50 flex-shrink-0">
        <p className="text-[9px] text-gray-300 leading-tight">
          Hover a row → <ArrowRight size={8} className="inline" /> nest inside prev · <ArrowLeft size={8} className="inline" /> un-nest · right-click for more
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            {elements.map((el, idx) => (
              <SortableLayerRow
                key={el.id}
                el={el}
                depth={0}
                selectedId={selectedId}
                expandedIds={expandedIds}
                elements={elements}
                onToggle={toggleExpand}
                onSelect={onSelect}
                onContextMenu={handleContextMenu}
                onUpdate={onUpdate}
                siblingIdx={idx}
                totalSiblings={elements.length}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {draggedEl ? <DragGhost el={draggedEl} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Breadcrumb */}
      {selectedId && (
        <Breadcrumb
          elements={elements}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          elements={elements}
          onUpdate={onUpdate}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
